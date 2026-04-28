import prisma from '../conf/db.js';
import jwt from 'jsonwebtoken';
import { createNotification } from './notification.controller.js';


// Helper to extract current user id from cookie or Authorization header
const getAuthUserId = (req) => {
  try {
    let token;
    if (req.cookies?.auth) token = req.cookies.auth;
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      if (token && token.startsWith('auth=')) token = token.slice(5);
    }
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return decoded.id;
  } catch (_) {
    return null;
  }
};  


// GET /api/v1/friends -> list accepted friends for current user
export const getFriends = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, name: true, email: true, avatar: true } },
        addressee: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((f) => {
      const friendUser = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        friendSince: f.createdAt,
        user: friendUser,
      };
    });

    return reply.code(200).send({ data: friends });
  } catch (error) {
    request.log.error(error, 'Error fetching friends');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// GET /api/v1/friends/requests -> pending requests (incoming/outgoing)
export const getPendingRequests = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: { addresseeId: userId, status: 'pending' },
        include: { requester: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { requesterId: userId, status: 'pending' },
        include: { addressee: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return reply.code(200).send({
      data: {
        incoming: incoming.map((r) => ({
          requestId: r.id,
          from: r.requester,
          createdAt: r.createdAt,
        })),
        outgoing: outgoing.map((r) => ({
          requestId: r.id,
          to: r.addressee,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    request.log.error(error, 'Error fetching pending friend requests');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};




// GET /api/v1/friends/block -> pending requests (incoming/outgoing)
export const getBlockRequests = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: { addresseeId: userId, status: 'blocked' },
        include: { requester: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { requesterId: userId, status: 'blocked' },
        include: { addressee: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return reply.code(200).send({
      data: {
        incoming: incoming.map((r) => ({
          requestId: r.id,
          from: r.requester,
          createdAt: r.createdAt,
        })),
        outgoing: outgoing.map((r) => ({
          requestId: r.id,
          to: r.addressee,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    request.log.error(error, 'Error fetching pending friend requests');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// POST /api/v1/friends/request { userId }
export const sendFriendRequest = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

  const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body ?? {});
  const { userId: toUserId } = body;

  if (!toUserId) return reply.code(400).send({ error: 'userId is required' });
  if (toUserId === userId) return reply.code(400).send({ error: "You can't send a request to yourself" });

  try {
    const target = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!target) return reply.code(404).send({ error: 'Target user not found' });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: toUserId },
          { requesterId: toUserId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'blocked') return reply.code(403).send({ error: 'You are blocked or have blocked this user' });
      if (existing.status === 'accepted') return reply.code(409).send({ error: 'Already friends' });
      if (existing.status === 'pending') return reply.code(409).send({ error: 'Friend request already pending' });
    }

    const created = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: toUserId,
        status: 'pending',
      },
    });

    // Notify target user
    await createNotification({
      userId: toUserId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: 'You received a friend request',
      actionable: true,
      metadata: { fromUserId: userId, requestId: created.id },
    });

    return reply.code(201).send({ message: 'Friend request sent', data: { requestId: created.id } });
  } catch (error) {
    request.log.error(error, 'Error sending friend request');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// PUT /api/v1/friends/:requestId/accept
export const acceptFriendRequest = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { requestId } = request.params;

  try {
    const fr = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!fr || fr.addresseeId !== userId || fr.status !== 'pending') {
      return reply.code(404).send({ error: 'Friend request not found' });
    }

    const updated = await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    // Notify requester
    await createNotification({
      userId: fr.requesterId,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      message: 'Your friend request was accepted',
      metadata: { requestId },
    });

    return reply.code(200).send({ message: 'Friend request accepted', data: { id: updated.id } });
  } catch (error) {
    request.log.error(error, 'Error accepting friend request');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// PUT /api/v1/friends/:requestId/decline
export const declineFriendRequest = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { requestId } = request.params;

  try {
    const fr = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!fr || fr.addresseeId !== userId || fr.status !== 'pending') {
      return reply.code(404).send({ error: 'Friend request not found' });
    }

    await prisma.friendship.delete({ where: { id: requestId } });

    // Notify requester
    await createNotification({
      userId: fr.requesterId,
      type: 'friend_request',
      title: 'Friend Request Declined',
      message: 'Your friend request was declined',
      metadata: { requestId },
    });

    return reply.code(200).send({ message: 'Friend request declined' });
  } catch (error) {
    request.log.error(error, 'Error declining friend request');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// DELETE /api/v1/friends/:friendId -> remove accepted friendship
export const removeFriend = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { friendId } = request.params;

  try {
    const fr = await prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (!fr) return reply.code(404).send({ error: 'Friendship not found' });

    await prisma.friendship.delete({ where: { id: fr.id } });
    return reply.code(200).send({ message: 'Friend removed' });
  } catch (error) {
    request.log.error(error, 'Error removing friend');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// POST /api/v1/friends/block { userId }
export const blockUser = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body ?? {});
  const { userId: targetId } = body;
  if (!targetId) return reply.code(400).send({ error: 'userId is required' });
  if (targetId === userId) return reply.code(400).send({ error: "You can't block yourself" });

  try {
    // Remove any existing relationship in either direction, then create a canonical blocked record
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: userId },
        ],
      },
    });

    const blocked = await prisma.friendship.create({
      data: { requesterId: userId, addresseeId: targetId, status: 'blocked' },
    });

    await createNotification({
      userId: targetId,
      type: 'system',
      title: 'User Blocked',
      message: 'A user has blocked you',
    });

    return reply.code(201).send({ message: 'User blocked', data: { id: blocked.id } });
  } catch (error) {
    request.log.error(error, 'Error blocking user');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// DELETE /api/v1/friends/block/:userId -> unblock (only if current user initiated the block)
export const unblockUser = async (request, reply) => {
  const userId = getAuthUserId(request);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { userId: targetId } = request.params;

  try {
    const res = await prisma.friendship.deleteMany({
      where: { requesterId: userId, addresseeId: targetId, status: 'blocked' },
    });

    if (res.count === 0) return reply.code(404).send({ error: 'Blocked relation not found' });
    return reply.code(200).send({ message: 'User unblocked' });
  } catch (error) {
    request.log.error(error, 'Error unblocking user');
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};
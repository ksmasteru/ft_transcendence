import prisma from '../conf/db.js';
import { createNotification } from './notification.controller.js';

const getAuthUserId = (req) => {
  // Get user ID from header set by gateway authentication
  const userId = req.headers['x-user-id'];
  return userId || null;
};

// GET /api/v1/chats
export const getChats = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true, onlineStatus: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const data = chats.map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      isGroup: c.isGroup,
      lastMessageAt: c.lastMessageAt,
      participants: c.participants.map((p) => ({
        ...p.user,
        isSelf: p.user.id === userId
      })),
      lastMessage: c.messages[0] || null,
    }));

    return reply.send({ data });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// POST /api/v1/chats
// Body: { userId } for 1:1 OR { isGroup: true, name, participantIds: [] }
export const createChat = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});

  try {
    if (!body.isGroup && body.userId) {
      const otherId = body.userId;
      if (otherId === userId) return reply.code(400).send({ error: 'Cannot chat with yourself' });

      // Try to find existing direct chat
      const existing = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: { some: { userId } },
          AND: { participants: { some: { userId: otherId } } },
        },
      });
      if (existing) return reply.code(200).send({ data: existing });

      const created = await prisma.chat.create({
        data: {
          isGroup: false,
          participants: {
            createMany: { data: [{ userId }, { userId: otherId }] },
          },
        },
      });
      return reply.code(201).send({ data: created });
    }

    // Group chat creation
    const { name, participantIds = [] } = body;
    if (!name || !Array.isArray(participantIds) || participantIds.length === 0)
      return reply.code(400).send({ error: 'name and participantIds are required for group chat' });

    const uniqueIds = Array.from(new Set([userId, ...participantIds]));

    const created = await prisma.chat.create({
      data: {
        name,
        isGroup: true,
        participants: {
          createMany: { data: uniqueIds.map((id) => ({ userId: id })) },
        },
      },
    });
    return reply.code(201).send({ data: created });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// PUT /api/v1/chats/:chatId
export const updateChat = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId } = req.params;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { name, avatar } = body;
  try {
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    const updated = await prisma.chat.update({ where: { id: chatId }, data: { ...(name && { name }), ...(avatar && { avatar }) } });
    return reply.send({ data: updated });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// DELETE /api/v1/chats/:chatId
export const deleteChat = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId } = req.params;
  try {
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    await prisma.chat.delete({ where: { id: chatId } });
    return reply.send({ message: 'Deleted' });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// POST /api/v1/chats/:chatId/participants { userIds: [] }
export const addParticipants = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId } = req.params;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { userIds = [] } = body;
  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroup) return reply.code(400).send({ error: 'Not a group chat' });
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    await prisma.chatParticipant.createMany({ data: userIds.map((id) => ({ userId: id, chatId })) });
    return reply.send({ message: 'OK' });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// DELETE /api/v1/chats/:chatId/participants/:userId
export const removeParticipant = async (req, reply) => {
  const requesterId = getAuthUserId(req);
  if (!requesterId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId, userId } = req.params;
  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroup) return reply.code(400).send({ error: 'Not a group chat' });
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId: requesterId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    await prisma.chatParticipant.delete({ where: { userId_chatId: { userId, chatId } } });
    return reply.send({ message: 'OK' });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// GET /api/v1/chats/:chatId/messages
export const getMessages = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query || {};
  const skip = (Number(page) - 1) * Number(limit);
  try {
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: Number(limit),
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    return reply.send({ data: messages });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// POST /api/v1/chats/:chatId/messages { content, type }
export const sendMessage = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  const { chatId } = req.params;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { content, type = 'text' } = body;
  if (!content) return reply.code(400).send({ error: 'content is required' });
  try {
    const membership = await prisma.chatParticipant.findUnique({ where: { userId_chatId: { userId, chatId } } });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    const msg = await prisma.message.create({ data: { chatId, senderId: userId, content, type } });
    await prisma.chat.update({ where: { id: chatId }, data: { lastMessageAt: new Date() } });

    // Notify other participants
    const participants = await prisma.chatParticipant.findMany({ where: { chatId, NOT: { userId } } });
    await Promise.all(
      participants.map((p) =>
        createNotification({
          userId: p.userId,
          type: 'message',
          title: 'New Message',
          message: content.slice(0, 120),
          metadata: { chatId, senderId: userId, messageId: msg.id },
        })
      )
    );

    return reply.code(201).send({ data: msg });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

import prisma from "../conf/db.js";

const getAuthUserId = (req) => {
  // Get user ID from header set by gateway authentication
  const userId = req.headers["x-user-id"];
  return userId || null;
};

export const getNotifications = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  try {
    // If Notification model exists, fetch, else return empty array
    let items = [];
    try {
      items = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (_) {
      items = [];
    }
    return reply.send({ data: items });
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const markRead = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const body =
    typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  const { id } = body;
  if (!id) return reply.code(400).send({ error: "id is required" });
  try {
    try {
      await prisma.notification.update({ where: { id }, data: { read: true } });
      return reply.send({ message: "OK" });
    } catch (_) {
      return reply.send({ message: "OK" });
    }
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const markAllRead = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  try {
    try {
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true },
      });
      return reply.send({ message: "OK" });
    } catch (_) {
      return reply.send({ message: "OK" });
    }
  } catch (e) {
    req.log.error(e);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  avatar,
  actionable = false,
  metadata = null,
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        avatar: avatar || null,
        actionable,
        metadata,
      },
    });
  } catch (e) {
    // If model not migrated yet, silently ignore
    return null;
  }
};

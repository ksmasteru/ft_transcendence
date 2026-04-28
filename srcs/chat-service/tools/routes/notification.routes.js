import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller.js';

export default async function notificationRouter(fastify, opts) {
  fastify.get('/', getNotifications);
  fastify.post('/mark-read', markRead);
  fastify.post('/mark-all-read', markAllRead);
}

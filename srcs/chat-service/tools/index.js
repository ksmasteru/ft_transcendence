import Fastify from 'fastify';
import prisma from './conf/db.js';
import dotenv from 'dotenv';
import cors from "@fastify/cors";
import cookie from '@fastify/cookie';
import notificationRouter from './routes/notification.routes.js';
import chatRouter from './routes/chat.routes.js';


dotenv.config();

const fastify = Fastify({ logger: true });


fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});

// fastify.register(cors, {
//   origin: ["http://localhost:3000", "http://localhost:8080"],
//   credentials: true,
// });

await fastify.register(cors, {
  origin: [
    'http://localhost:8080', "http://localhost:3000" ,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(notificationRouter, { prefix: '/api/v1/notifications' });
fastify.register(chatRouter, { prefix: '/api/v1/chats' });


fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
}); 

const start = async () => {
  try {
    await prisma.$connect();
    fastify.log.info('✅ Prisma connected');

    const userCount = await prisma.user.count();
    fastify.log.info(`Users in DB: ${userCount}`);

    const PORT = Number(process.env.DB_PORT) || 4000;
    const HOST = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// gateway/index.ts
import Fastify from "fastify";
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyHttpProxy from "@fastify/http-proxy";
import { authMiddleware, isPublicRoute } from './middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const gateway = Fastify({
  logger: true,
});

gateway.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'default-secret',
});

gateway.register(cors, {
  origin: [
    'http://localhost:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
});


gateway.register(fastifyHttpProxy, {
  upstream: "http://user-service-container:4000",
  prefix: "/api/v1/user", 
  rewritePrefix: "/api/v1/user",
  preHandler: async (request, reply, done) => {
    try {
      console.log('User service proxy - checking auth for:', request.url);
      
      if (isPublicRoute(request.url)) {
        console.log('Public route, skipping auth');
        return done();
      }
      
      console.log('Applying authentication for user service');
      
      await authMiddleware(request, reply);
      
      if (reply.sent) {
        console.log('Reply already sent by auth middleware');
        return; 
      }
      
      console.log('User service proxy - headers after auth:', {
        'x-user-id': request.headers['x-user-id'],
        'x-user-email': request.headers['x-user-email']
      });
      
      done();
    } catch (error) {
      console.error('Auth error in user proxy:', error);
      if (!reply.sent) {
        done(error);
      }
    }
  }
});

gateway.register(fastifyHttpProxy, {
  upstream: "http://user-service-container:4000",
  prefix: "/api/v1/auth", 
  rewritePrefix: "/api/v1/auth",
});

gateway.register(fastifyHttpProxy, {
  upstream: "http://user-service-container:4000",
  prefix: "/api/v1/friends",
  rewritePrefix: "/api/v1/friends",
  preHandler: async (request, reply, done) => {
    try {
      console.log('Friends service proxy - checking auth for:', request.url);
      
      if (isPublicRoute(request.url)) {
        console.log('Public route, skipping auth');
        return done();
      }
      
      await authMiddleware(request, reply);
      
      console.log('Friends service proxy - headers after auth:', {
        'x-user-id': request.headers['x-user-id'],
        'x-user-email': request.headers['x-user-email']
      });
      
      done();
    } catch (error) {
      console.error('Auth error in friends proxy:', error);
      done(error);
    }
  }
});

gateway.register(fastifyHttpProxy, {
  upstream: "http://chat-service-container:4002",
  prefix: "/api/v1/notifications",
  rewritePrefix: "/api/v1/notifications",
  preHandler: async (request, reply, done) => {
    try {
      console.log('Notifications service proxy - checking auth for:', request.url);
      
      if (isPublicRoute(request.url)) {
        console.log('Public route, skipping auth');
        return done();
      }
      
      await authMiddleware(request, reply);
      
      console.log('Notifications service proxy - headers after auth:', {
        'x-user-id': request.headers['x-user-id'],
        'x-user-email': request.headers['x-user-email']
      });
      
      done();
    } catch (error) {
      console.error('Auth error in notifications proxy:', error);
      done(error);
    }
  }
});

gateway.register(fastifyHttpProxy, {
  upstream: "http://chat-service-container:4002",
  prefix: "/api/v1/chats",
  rewritePrefix: "/api/v1/chats",
  preHandler: async (request, reply, done) => {
    try {
      console.log('Chats service proxy - checking auth for:', request.url);
      
      if (isPublicRoute(request.url)) {
        console.log('Public route, skipping auth');
        return done();
      }
      
      await authMiddleware(request, reply);
      
      console.log('Chats service proxy - headers after auth:', {
        'x-user-id': request.headers['x-user-id'],
        'x-user-email': request.headers['x-user-email']
      });
      
      done();
    } catch (error) {
      console.error('Auth error in chats proxy:', error);
      done(error);
    }
  }
});

gateway.register(fastifyHttpProxy, {
  upstream: "http://log-service-container:4001",
  prefix: "/api/v1/log",
  rewritePrefix: "/api/v1/log",
  preHandler: async (request, reply, done) => {
    try {
      console.log('Log service proxy - checking auth for:', request.url);
      
      if (isPublicRoute(request.url)) {
        console.log('Public route, skipping auth');
        return done();
      }
      
      await authMiddleware(request, reply);
      
      console.log('Log service proxy - headers after auth:', {
        'x-user-id': request.headers['x-user-id'],
        'x-user-email': request.headers['x-user-email']
      });
      
      done();
    } catch (error) {
      console.error('Auth error in log proxy:', error);
      done(error);
    }
  }
});

gateway.get("/", async () => {
  return { status: "✅ Gateway is running" };
});


const start = async () => {
      try {
        await gateway.listen({ 
          port: 3000, 
          host: "0.0.0.0"
        });
        console.log("🚀 Gateway running on http://localhost:3000");
      } catch (err) {
        gateway.log.error(err);
        process.exit(1);
      }
};


start();

import Fastify from "fastify";
import logRouter from "./routes/log.routes.js";
import prisma from "./conf/db.js";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL;

const fastify = Fastify({ logger: true });

fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});

await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests from localhost or any IP address on ports 8080 or 3000
    // (local dev), or the deployed frontend's own origin (e.g. Railway's public URL).
    if (
      !origin ||
      origin.includes(':8080') ||
      origin.includes(':3000') ||
      (FRONTEND_URL && origin === FRONTEND_URL)
    ) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(logRouter, { prefix: "/api/v1/log" });

fastify.get("/", async (request, reply) => {
  return { hello: "world logs " };
});

const start = async () => {
  try {
    await prisma.$connect();
    fastify.log.info("✅ Prisma connected");

    const userCount = await prisma.user.count();
    fastify.log.info(`Users in DB: ${userCount}`);

    const PORT = Number(process.env.DB_PORT) || 4001;
    const HOST = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

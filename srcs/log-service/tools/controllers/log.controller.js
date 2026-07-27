import prisma from "../conf/db.js";
import { JWT_SECRET, JWT_EXPIRATION } from "../conf/env.js";
import cookie from "cookie";

export const getUserIdFromToken = async (request) => {
  try {
    // Get user ID from header set by gateway authentication
    const userId = request.headers["x-user-id"];

    if (!userId) {
      throw new Error("User ID not found in request headers");
    }

    return userId;
  } catch (error) {
    throw new Error("Invalid or missing user authentication");
  }
};

export const addLog = async (request, reply) => {
  try {
    // Get user ID from header set by gateway authentication
    const userId = request.headers["x-user-id"];

    // Handle raw stringified JSON body (e.g., from Postman)
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : (request.body ?? {});

    console.log("Body typeof:", typeof request.body, "Parsed body:", body);

    const { level, message, component } = body;

    // Validation (optional)
    if (!level || !message || !component) {
      return reply.status(400).send({ error: "Missing required fields" });
    }

    await prisma.logEntry.create({
      data: {
        level,
        message,
        component,
        userId, // can be null
      },
    });

    return reply.status(201).send({ message: "Log received" });
  } catch (error) {
    console.error("Failed to add log:", error);
    return reply.status(500).send({ error: "Could not process log." });
  }
};

export const getLogs = async (request, reply) => {
  try {
    const userId = await getUserIdFromToken(request);

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const logs = await prisma.logEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send(logs);
  } catch (error) {
    console.error("Failed to get user logs:", error);
    return reply.status(500).send({ error: "Could not retrieve user logs." });
  }
};

export const clearLogs = async (request, reply) => {
  try {
    await prisma.logEntry.deleteMany({});
    return reply.status(200).send({ message: "Logs cleared successfully." });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return reply.status(500).send({ error: "Could not clear logs." });
  }
};

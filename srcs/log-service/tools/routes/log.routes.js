// import { getUser , getUsers , addUser ,leaderboard, updateUser, deleteUser,searchUsersByName, userInfo} from "../controllers/user.controller.js";
import { getLogs, addLog, clearLogs } from "../controllers/log.controller.js";
// import userRateLimitMiddleware from '../middleware/arcjet.middleware.js';
// import authorize from "../middleware/auth.middleware.js";

export default async function logRouter(fastify, opts) {
  fastify.get('/logs', getLogs);
  fastify.post('/logs', addLog);
  fastify.delete('/logs', clearLogs);
}
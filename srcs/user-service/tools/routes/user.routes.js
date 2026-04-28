// import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUser, getUsers, addUser, leaderboard, updateUser, deleteUser, searchUsersByName, userInfo } from "../controllers/user.controller.js";

export default async function userRouter(fastify, opts){
  fastify.get('/', getUsers);
  
  // Specific routes must come before parameterized routes
  fastify.get('/me', userInfo);
  fastify.get("/search", searchUsersByName);
  fastify.get("/leaderboard", leaderboard);
  
  // Parameterized routes come last
  fastify.get('/:id', getUser);
  fastify.post('/', addUser);
  fastify.put('/:id', updateUser);
  fastify.delete('/:id', deleteUser);
}

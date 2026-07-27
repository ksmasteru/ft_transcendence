import {
  getChats,
  createChat,
  updateChat,
  deleteChat,
  addParticipants,
  removeParticipant,
  getMessages,
  sendMessage,
  markChatAsRead,
} from "../controllers/chat.controller.js";

export default async function chatRouter(fastify, opts) {
  fastify.get("/", getChats);
  fastify.post("/", createChat);
  fastify.put("/:chatId", updateChat);
  fastify.delete("/:chatId", deleteChat);
  fastify.post("/:chatId/participants", addParticipants);
  fastify.delete("/:chatId/participants/:userId", removeParticipant);
  fastify.get("/:chatId/messages", getMessages);
  fastify.post("/:chatId/messages", sendMessage);
  fastify.post("/:chatId/read", markChatAsRead);
}

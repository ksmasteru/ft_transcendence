import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockRequests,
} from "../controllers/friends.controller.js";

export default async function friendsRouter(fastify, opts) {
  // List friends
  fastify.get("/", getFriends);
  // Pending requests (incoming/outgoing)
  fastify.get("/requests", getPendingRequests);
  fastify.get("/block", getBlockRequests);

  // Send request
  fastify.post("/request", sendFriendRequest);
  // Accept/Decline by requestId
  fastify.put("/:requestId/accept", acceptFriendRequest);
  fastify.put("/:requestId/decline", declineFriendRequest);
  // Remove friend by friendId (userId of the other user)
  fastify.delete("/:friendId", removeFriend);
  // Block / Unblock
  fastify.post("/block", blockUser);
  fastify.delete("/block/:userId", unblockUser);
}

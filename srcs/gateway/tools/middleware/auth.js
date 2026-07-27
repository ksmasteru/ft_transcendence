import jwt from "jsonwebtoken";

export const authMiddleware = async (request, reply) => {
  try {
    let token;
    if (request.cookies?.auth) {
      token = request.cookies.auth;
    } else if (request.headers.authorization?.startsWith("Bearer ")) {
      token = request.headers.authorization.split(" ")[1];
      if (token.startsWith("auth=")) {
        token = token.slice(5);
      }
    }

    console.log("Extracted token:", token ? "Token found" : "No token");
    if (!token) {
      reply.code(401).send({ error: "Unauthorized: No token provided." });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", { id: decoded.id, email: decoded.email });

    request.headers["x-user-id"] = decoded.id;

    request.headers["x-user-email"] = decoded.email;

    console.log("Headers set:", {
      "x-user-id": decoded.id,
      "x-user-email": decoded.email,
    });

    return;
  } catch (error) {
    console.error("Authorization error:", error);

    if (error.name === "JsonWebTokenError") {
      reply.code(401).send({ error: "Unauthorized: Invalid token." });
      return;
    }
    if (error.name === "TokenExpiredError") {
      reply.code(401).send({ error: "Unauthorized: Token expired." });
      return;
    }

    reply.code(500).send({ error: "Internal Server Error" });
    return;
  }
};

export const publicRoutes = [
  "/api/v1/auth/sign-in",
  "/api/v1/auth/sign-up",
  "/api/v1/auth/sign-out",
  "/api/v1/auth/verify",
  "/api/v1/auth/verify/:userId/:uniqueString",
  "/api/v1/auth/resend-verification",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/reset-password/:userId/:uniqueString",
  "/api/v1/auth/checkAuthCookie",
  "/api/v1/auth/42intra",
  "/api/v1/auth/42/callback",
  "/api/v1/auth/google",
  "/api/v1/auth/google/callback",
  "/api/v1/auth/verify-2fa",
  "/api/v1/auth/enable-2fa",
  "/api/v1/auth/disable-2fa",
  "/api/v1/auth/verify-login-2fa",
  "/api/v1/auth/2fa-status/:userId",
];

export const isPublicRoute = (url) => {
  console.log("Checking if public route:", url);

  if (url === "/") {
    console.log("Matched root path, public route");
    return true;
  }

  const isPublic = publicRoutes.some((route) => {
    if (route.includes(":")) {
      const routePattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}(/.*)?$`);
      const matches = regex.test(url);
      if (matches) console.log(`Matched parameterized route: ${route}`);
      return matches;
    }
    const matches = url.startsWith(route);
    if (matches) console.log(`Matched route: ${route}`);
    return matches;
  });

  console.log(`Route ${url} is ${isPublic ? "public" : "protected"}`);
  return isPublic;
};

import prisma from "../conf/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  JWT_EXPIRATION,
  UID,
  SECRET,
  CALLBACK_URL,
} from "../conf/env.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../conf/nodemailer.js";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import axios from "axios";
import qs from "qs";

// Helper function to get cookie options based on request protocol
// For HTTP (local network), secure must be false
// For HTTPS (production), secure should be true
const getCookieOptions = (request) => {
  // Check if request is over HTTPS
  // In Fastify, check multiple sources for protocol detection
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = forwardedProto || 
                   (request.socket?.encrypted ? 'https' : 'http') ||
                   'http'; // Default to http for local network
  
  // Only use HTTPS if explicitly detected or in production with HTTPS
  const isSecure = protocol === 'https' || 
                   (process.env.NODE_ENV === 'production' && forwardedProto === 'https');
  
  // For HTTP (local network), we MUST use secure: false and sameSite: "lax"
  // For HTTPS, we can use secure: true and sameSite: "none" for cross-site
  const options = {
    httpOnly: true,
    secure: isSecure, // false for HTTP, true for HTTPS
    sameSite: isSecure ? "none" : "lax", // "none" requires secure, "lax" works with HTTP
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
  
  // Log cookie options for debugging (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cookie options:', {
      protocol,
      forwardedProto,
      isSecure,
      secure: options.secure,
      sameSite: options.sameSite,
      origin: request.headers.origin || request.headers.host,
      url: request.url
    });
  }
  
  return options;
};

export const signUp = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        console.error("Invalid JSON in request body:", request.body);
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    console.log("Parsed body:", body);

    const { firstName, lastName, email, password } = body;

    // if (!name || !email || !password) {
    //     return reply.status(400).send({ error: 'Name, email, and password are required.' });
    // }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        verified: false,
        name: `${firstName} ${lastName}`,
      },
    });

    try {
      await sendVerificationEmail(
        { _id: newUser.id, email: newUser.email },
        reply,
      );

      return reply.status(201).send({
        message:
          "User registered successfully! Please check your email and verify your account before signing in.",
        data: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          verified: false,
          name: `${firstName} ${lastName}`,
        },
      });
    } catch (emailError) {
      await prisma.user.delete({ where: { id: newUser.id } });
      throw emailError;
    }
  } catch (error) {
    console.error("Sign up error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred during sign up." });
  }
};

export const signUpGoogle = async (request, reply) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  reply.redirect(redirectUrl);
};

export const callbackGoogle = async (request, reply) => {
  const { code } = request.query;

  if (!code) {
    return reply.code(400).send({ error: "Missing code" });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { access_token, id_token } = tokenResponse.data;

    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const googleUser = userResponse.data;

    console.log("Google user info:", googleUser);
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          name: googleUser.name,
          password: "null", // since Google handles auth
          verified: googleUser.email_verified,
          avatar: googleUser.picture,
          onlineStatus: true, // Set online status on creation
        },
      });
    } else {
      // Update existing user's online status
      await prisma.user.update({
        where: { id: user.id },
        data: { onlineStatus: true },
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: process.env.JWT_EXPIRATION || "7d" },
    );

    // Set cookie + redirect
    reply
      .setCookie("auth", token, getCookieOptions(request))
      .redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("Google OAuth error:", err.response?.data || err.message);
    return reply.code(500).send({ error: "Authentication failed" });
  }
};

export const signUp42 = async (request, reply) => {
  const redirectUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${process.env.UID}&redirect_uri=${process.env.CALLBACK_URL}&response_type=code`;
  reply.redirect(redirectUrl);
};

export const callback42 = async (request, reply) => {
  const { code } = request.query;

  if (!code) {
    return reply.code(400).send({ error: "Missing code" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://api.intra.42.fr/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: process.env.UID,
        client_secret: process.env.SECRET,
        code,
        redirect_uri: process.env.CALLBACK_URL,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.intra.42.fr/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const intraUser = userResponse.data;

    let user = await prisma.user.findUnique({
      where: { email: intraUser.email },
    });

    const profileImage =
      intraUser.image?.link || intraUser.image?.versions?.medium || null;

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: intraUser.first_name,
          lastName: intraUser.last_name,
          email: intraUser.email,
          name:
            intraUser.usual_full_name ||
            `${intraUser.first_name} ${intraUser.last_name}`,
          password: "null",
          verified: true,
          avatar: profileImage,
          onlineStatus: true, // Set online status on creation
        },
      });
    } else {
      // Update existing user's online status
      await prisma.user.update({
        where: { id: user.id },
        data: { onlineStatus: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: process.env.JWT_EXPIRATION || "7d" },
    );
    reply
      .setCookie("auth", token, getCookieOptions(request))
      .redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("42 OAuth error:", err.response?.data || err.message);
    return reply.code(500).send({ error: "Authentication failed" });
  }
};

export const verifyEmail = async (request, reply) => {
  const { userId, uniqueString } = request.params;

  try {
    if (!userId || !uniqueString) {
      return reply
        .status(400)
        .send({ error: "User ID and unique string are required." });
    }

    const userVerification = await prisma.userVerification.findUnique({
      where: { userId },
    });

    if (!userVerification) {
      return reply.status(404).send({
        error:
          "Verification record not found. Please request a new verification email.",
      });
    }

    const isValid = await bcrypt.compare(uniqueString, userVerification.token);
    if (!isValid) {
      return reply.status(400).send({ error: "Invalid verification token." });
    }

    const currentTime = new Date();
    if (currentTime > userVerification.expiresAt) {
      await prisma.userVerification.delete({ where: { userId } });
      return reply.status(400).send({
        error:
          "Verification link has expired. Please request a new verification email.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });

    await prisma.userVerification.delete({
      where: { userId },
    });

    return reply.status(200).send({
      message:
        "Email verified successfully! You can now sign in to your account.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred during email verification." });
  }
};

export const resendVerification = async (request, reply) => {
  try {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ error: "Email is required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    if (user.verified) {
      return reply.status(400).send({ error: "User is already verified." });
    }

    await prisma.userVerification.deleteMany({ where: { userId: user.id } });

    await sendVerificationEmail({ _id: user.id, email: user.email }, reply);

    return reply.status(200).send({
      message: "Verification email sent successfully! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while resending verification email." });
  }
};

export const checkAuthStatus = async (request, reply) => {
  try {
    const token = request.cookies.auth;

    if (!token) {
      return reply.status(401).send({
        isAuthenticated: false,
        message: "No active session found.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        isAuthenticated: false,
        message: "User not found.",
      });
    }

    return reply.status(200).send({ isAuthenticated: true, user: user });
  } catch (error) {
    console.error("Auth check error:", error.message);
    return reply.status(401).send({
      isAuthenticated: false,
      message: "Your session is invalid or has expired. Please sign in again.",
    });
  }
};

export const checkAuthCookie = async (request, reply) => {
  try {
    const token = request.cookies.auth;

    if (!token) {
      return reply
        .status(401)
        .send({ error: "Unauthorized: No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized: User not found." });
    }

    request.user = user;
  } catch (error) {
    console.error("Authorization error:", error.message);
    return reply.status(401).send({ error: "Unauthorized: Invalid token." });
  }
};

export const signIn = async (request, reply) => {
  try {
    let body;
    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        console.error("Invalid JSON in request body:", request.body);
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { email, password } = body;
    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Invalid credentials." });
    }

    // Update user's online status to true
    await prisma.user.update({
      where: { id: user.id },
      data: { onlineStatus: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: process.env.JWT_EXPIRATION || "7d",
      },
    );

    reply
      .setCookie("auth", token, getCookieOptions(request))
      .code(200)
      .send({
        ok: true,
        message: "Sign in successful.",
        token,
      });
  } catch (error) {
    console.error("Sign in error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred during sign in." });
  }
};

export const signOut = async (request, reply) => {
  try {
    // Get user ID from JWT token before clearing cookie
    const token = request.cookies.auth;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        // Update user's online status to false
        await prisma.user.update({
          where: { id: decoded.id },
          data: { onlineStatus: false },
        });
      } catch (error) {
        console.error("Error updating online status on logout:", error);
        // Continue with sign out even if status update fails
      }
    }

    reply
      .clearCookie("auth", getCookieOptions(request))
      .status(200)
      .send({
        message: "Sign out successful.",
      });
  } catch (error) {
    console.error("Sign out error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred during sign out." });
  }
};

export const forgotPassword = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        console.error("Invalid JSON in request body:", request.body);
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { email } = body;

    if (!email) {
      return reply.status(400).send({ error: "Email is required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 3600000);

    // Delete any existing reset records for this user before creating a new one
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    await sendResetPasswordEmail({
      email: user.email,
      resetToken,
      _id: user.id,
    });

    return reply.status(200).send({
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Forget password error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while processing your request." });
  }
};

export const setup2FA = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        console.error("Invalid JSON in request body:", request.body);
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { userId } = body;

    if (!userId) {
      return reply.status(400).send({ error: "User ID is required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, twoFactorEnabled: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    if (!user.email) {
      console.error(`User with ID ${userId} does not have an email address.`);
      return reply
        .status(400)
        .send({
          error: "User account is missing an email, cannot set up 2FA.",
        });
    }

    if (user.twoFactorEnabled) {
      return reply
        .status(400)
        .send({ error: "2FA is already enabled for this user." });
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: user.email,
      issuer: "Your App Name",
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    return reply.status(200).send({
      message:
        "2FA setup initiated successfully. Please scan the QR code and verify.",
      secret: secret.otpauth_url,
      qrCode: qrCodeDataURL,
      backupCodes: generateBackupCodes(),
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while setting up 2FA." });
  }
};

export const verify2FA = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { userId, token } = body;

    if (!userId || !token) {
      return reply
        .status(400)
        .send({ error: "User ID and token are required." });
    }

    if (!/^\d{6}$/.test(token)) {
      return reply
        .status(400)
        .send({ error: "Token must be a 6-digit number." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    if (!user.twoFactorSecret) {
      return reply
        .status(400)
        .send({ error: "2FA setup not initiated. Please start setup first." });
    }

    if (user.twoFactorEnabled) {
      return reply
        .status(400)
        .send({ error: "2FA is already enabled for this user." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return reply
        .status(400)
        .send({ error: "Invalid token. Please try again." });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return reply.status(200).send({
      message: "2FA has been successfully enabled.",
      twoFactorEnabled: true,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while verifying 2FA." });
  }
};

export const disable2FA = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { userId, token } = body;

    if (!userId) {
      return reply.status(400).send({ error: "User ID is required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    if (!user.twoFactorEnabled) {
      return reply
        .status(400)
        .send({ error: "2FA is not enabled for this user." });
    }

    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token,
        window: 2,
      });

      if (!verified) {
        return reply
          .status(400)
          .send({ error: "Invalid token. Cannot disable 2FA." });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return reply.status(200).send({
      message: "2FA has been successfully disabled.",
      twoFactorEnabled: false,
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while disabling 2FA." });
  }
};

export const verifyLogin2FA = async (request, reply) => {
  try {
    let body;

    if (typeof request.body === "string") {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        return reply
          .status(400)
          .send({ error: "Invalid JSON format in request body." });
      }
    } else {
      body = request.body ?? {};
    }

    const { userId, token } = body;

    if (!userId || !token) {
      return reply
        .status(400)
        .send({ error: "User ID and token are required." });
    }

    if (!/^\d{6}$/.test(token)) {
      return reply
        .status(400)
        .send({ error: "Token must be a 6-digit number." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return reply
        .status(400)
        .send({ error: "2FA is not enabled for this user." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return reply.status(400).send({ error: "Invalid 2FA token." });
    }

    return reply.status(200).send({
      message: "2FA verification successful.",
      verified: true,
    });
  } catch (error) {
    console.error("2FA login verification error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while verifying 2FA token." });
  }
};

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export const get2FAStatus = async (request, reply) => {
  try {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: "User ID is required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorEnabled: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    return reply.status(200).send({
      userId: user.id,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Get 2FA status error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while getting 2FA status." });
  }
};

export const reset2FA = async (request, reply) => {
  const { userId } = request.body;

  if (!userId) {
    return reply.status(400).send({ error: "User ID is required." });
  }

  try {
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null },
    });

    return reply.status(200).send({
      message: "2FA reset successfully.",
    });
  } catch (error) {
    console.error("Reset 2FA error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while resetting 2FA." });
  }
};

export const changePassword = async (request, reply) => {
  const { userId, oldPassword, newPassword } = request.body;

  if (!userId || !oldPassword || !newPassword) {
    return reply
      .status(400)
      .send({ error: "User ID, old password, and new password are required." });
  }

  try {
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }

    const isPasswordValid = await fastify.bcrypt.compare(
      oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Invalid old password." });
    }

    const hashedPassword = await fastify.bcrypt.hash(newPassword, 10);

    await fastify.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return reply.status(200).send({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while changing the password." });
  }
};

export const resetPassword = async (request, reply) => {
  try {
    const { userId } = request.params;
    const { resetToken, newPassword } = request.body;

    console.log("Reset password request:", { 
      userId, 
      hasToken: !!resetToken, 
      tokenLength: resetToken?.length,
      hasPassword: !!newPassword 
    });

    if (!resetToken || !newPassword || !userId) {
      return reply
        .status(400)
        .send({ error: "Reset token, new password, and user ID are required." });
    }

    // Find the reset record by userId since token is hashed in database
    // Note: We'll check expiration after finding the record
    const resetRecord = await prisma.passwordReset.findFirst({
      where: { 
        userId: userId,
      },
      orderBy: {
        expiresAt: 'desc' // Get the most recent one
      },
    });

    console.log("Reset record found:", { 
      found: !!resetRecord, 
      userId: resetRecord?.userId,
      expiresAt: resetRecord?.expiresAt 
    });

    if (!resetRecord) {
      // Check if there's an expired record
      const expiredRecord = await prisma.passwordReset.findFirst({
        where: { userId: userId },
      });
      
      if (expiredRecord) {
        console.log("Found expired reset record");
        await prisma.passwordReset.delete({ where: { id: expiredRecord.id } });
        return reply.status(400).send({ error: "Reset token has expired. Please request a new password reset link." });
      }
      
      return reply
        .status(400)
        .send({ error: "Invalid reset token. Please request a new password reset link." });
    }

    // Check if token has expired (double check)
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      return reply.status(400).send({ error: "Reset token has expired. Please request a new password reset link." });
    }

    // Compare the plain token with the hashed token in database
    console.log("Comparing tokens...");
    const isTokenValid = await bcrypt.compare(resetToken, resetRecord.token);
    console.log("Token comparison result:", isTokenValid);
    
    if (!isTokenValid) {
      return reply.status(400).send({ error: "Invalid reset token. Please request a new password reset link." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    return reply.status(200).send({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      userId: request.params?.userId,
    });
    return reply
      .status(500)
      .send({ 
        error: "An error occurred while resetting the password.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
  }
};

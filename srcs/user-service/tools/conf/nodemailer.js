import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { EMAIL_USER, EMAIL_PASSWORD, FRONTEND_URL } from "./env.js";
import prisma from "../conf/db.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying transporter:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

export const sendVerificationEmail = async ({ _id, email }, res) => {
  const currentUrl = process.env.CURRENT_URL || "http://localhost:8080";
  const uniqueString = uuidv4() + _id;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification - Verify Your Account",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome! Please Verify Your Email</h2>
                <p>Thank you for signing up! To complete your registration and start using your account, please verify your email address.</p>
                <p>Click the button below to verify your email:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${currentUrl}/api/v1/auth/verify/${_id}/${uniqueString}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #666;">${currentUrl}/api/v1/auth/verify/${_id}/${uniqueString}</p>
                <p style="color: #666; font-size: 14px;">
                    <strong>Note:</strong> This verification link will expire in 60 hours. 
                    If you didn't create an account, please ignore this email.
                </p>
            </div>
        `,
  };

  const saltRounds = 10;

  try {
    const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds);

    await prisma.userVerification.deleteMany({
      where: { userId: _id },
    });

    await prisma.userVerification.create({
      data: {
        userId: _id,
        token: hashedUniqueString,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 216000000),
      },
    });

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

// export const sendResetPasswordEmail = async ({ _id, email }, res) => {
//     const currentUrl = process.env.CURRENT_URL || 'http://localhost:3000';
//     const uniqueString = uuidv4() + _id;

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Password Reset Request',
//         html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//                 <h2 style="color: #333;">Reset Your Password</h2>
//                 <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
//                 <div style="text-align: center; margin: 30px 0;">
//                     <a href="${currentUrl}/api/v1/auth/reset-password/${_id}/${uniqueString}"
//                        style="background-color: #007bff; color: white; padding: 12px 30px;
//                               text-decoration: none; border-radius: 5px; display: inline-block;">
//                         Reset Password
//                     </a>
//                 </div>
//                 <p>Or copy and paste this link in your browser:</p>
//                 <p style="word-break: break-all; color: #666;">${currentUrl}/api/v1/auth/reset-password/${_id}/${uniqueString}</p>
//                 <p style="color: #666; font-size: 14px;">
//                     <strong>Note:</strong> This link will expire in 1 hour.
//                     If you didn't request a password reset, please ignore this email.
//                 </p>
//             </div>
//         `,
//     };

//     const saltRounds = 10;

//     try {
//         const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds);

//         await prisma.passwordReset.deleteMany({
//             where: { userId: _id }
//         });

//         await prisma.passwordReset.create({
//             data: {
//                 userId: _id,
//                 token: hashedUniqueString,
//                 createdAt: new Date(),
//                 expiresAt: new Date(Date.now() + 3600000),
//             },
//         });

//         await transporter.sendMail(mailOptions);
//         console.log('Password reset email sent successfully to:', email);

//         return { success: true, message: 'Password reset email sent successfully' };

//     } catch (error) {
//         console.error('Error sending password reset email:', error);
//         throw new Error('Failed to send password reset email');
//     }
// };

export const sendResetPasswordEmail = async ({ email, resetToken, _id }) => {
  try {
    const frontendUrl = FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:8080";
    const resetLink = `${frontendUrl}/reset-password/${_id}/?token=${resetToken}`;
    // Configurez et envoyez l'email
    await transporter.sendMail({
      from: "no-reply@your-app.com",
      to: email,
      subject: "Password Reset Request",
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <p style="color: #666; font-size: 14px;">
                    <strong>Note:</strong> This link will expire in 1 hour. 
                    If you didn't request a password reset, please ignore this email.
                </p>
            </div>
        `,
    });
    console.log("Password reset email sent successfully.");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

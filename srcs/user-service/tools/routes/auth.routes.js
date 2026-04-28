import crypto from 'crypto';
import {
    signUp,
    signIn,
    signOut,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    checkAuthCookie,
    reset2FA,
    setup2FA,
    disable2FA,
    verify2FA,
    changePassword,
    get2FAStatus,
    checkAuthStatus,
    verifyLogin2FA,
    signUp42,
    callback42,
    signUpGoogle,
    callbackGoogle


    
} from '../controllers/auth.controller.js';

async function authRoutes(fastify, options) {
  fastify.post('/sign-up', signUp);
  fastify.post('/sign-in', signIn);
  fastify.post('/sign-out', signOut);

  fastify.get('/verify/:userId/:uniqueString', verifyEmail);
  fastify.post('/resend-verification', resendVerification);

  fastify.post('/forgot-password', forgotPassword);
  fastify.get('/checkAuthCookie', checkAuthStatus);
  fastify.get("/42intra" , signUp42);
  fastify.get("/42/callback", callback42);
  fastify.get("/google" , signUpGoogle);
  fastify.get("/google/callback", callbackGoogle);

  fastify.get('/reset-password', forgotPassword);
  fastify.get('/reset-password/:userId/:uniqueString', resetPassword);

  fastify.post('/enable-2fa', {
      schema: {
          body: {
              type: 'object',
              required: ['userId'],
              properties: {
                  userId: { type: 'string' }
              }
          }
      }
  }, setup2FA);

  fastify.post('/verify-2fa', {
      schema: {
          body: {
              type: 'object',
              required: ['userId', 'token'],
              properties: {
                  userId: { type: 'string' },
                  token: { type: 'string', pattern: '^\\d{6}$' }
              }
          }
      }
  }, verify2FA);

  fastify.post('/disable-2fa', {
      schema: {
          body: {
              type: 'object',
              required: ['userId'],
              properties: {
                  userId: { type: 'string' },
                  token: { type: 'string', pattern: '^\\d{6}$' } // Optional for extra security
              }
          }
      }
  }, disable2FA);

  fastify.post('/verify-login-2fa', {
      schema: {
          body: {
              type: 'object',
              required: ['userId', 'token'],
              properties: {
                  userId: { type: 'string' },
                  token: { type: 'string', pattern: '^\\d{6}$' }
              }
          }
      }
  }, verifyLogin2FA);

  fastify.get('/2fa-status/:userId', {
      schema: {
          params: {
              type: 'object',
              required: ['userId'],
              properties: {
                  userId: { type: 'string' }
              }
          }
      }
  }, get2FAStatus);
  // fastify.post('/reset-2fa', reset2FA);
  // fastify.post('/enable-2fa', setup2FA); 
  // fastify.post('/disable-2fa', disable2FA); 
  // fastify.post('/verify-2fa', verify2FA); 

  fastify.post('/change-password', changePassword);
}

export default authRoutes;
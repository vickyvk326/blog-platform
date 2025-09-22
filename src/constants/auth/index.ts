import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const AUTH_CONSTANTS = {
  ACCESS_TOKEN: 'accessToken',
  EXPIRES_IN: 'expiresIn',
  USER_ID: 'userId',
  USER_EMAIL: 'userEmail',
  USER_NAME: 'userName',
  USER_IMAGE: 'userImage',
};

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as ResponseCookie;

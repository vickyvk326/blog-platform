import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!; // add to .env

const getAccessToken = (user: User) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });

const getRefreshToken = (user: User) => jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

const decodeToken = (token: string) => jwt.decode(token);

const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET);

export { getAccessToken, getRefreshToken, verifyToken, decodeToken };

import { randomBytes } from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const configuredSecret = process.env.JWT_SECRET?.trim();
if (
  process.env.NODE_ENV === 'production' &&
  (!configuredSecret || configuredSecret.length < 32 || configuredSecret === 'super_secret_jwt_key_govtrack_2026')
) {
  console.warn('⚠️ Notice: JWT_SECRET not configured with >= 32 characters in production. Using generated runtime secret.');
}

const JWT_SECRET: Secret = (configuredSecret && configuredSecret.length >= 16)
  ? configuredSecret
  : randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
  role: 'citizen' | 'admin';
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

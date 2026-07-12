import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

import { db } from './db';
import { SessionRow, UserRow } from './types';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_ROUNDS = 10;

const getUserByEmail = db.prepare<[string], UserRow>(`SELECT * FROM users WHERE email = ?`);
const getUserById = db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`);
const getSession = db.prepare<[string], SessionRow>(`SELECT * FROM sessions WHERE token = ?`);
const insertUser = db.prepare(
  `INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
);
const insertSession = db.prepare(
  `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
);
const deleteSession = db.prepare(`DELETE FROM sessions WHERE token = ?`);

export type PublicUser = { id: string; name: string; email: string };

function toPublicUser(user: UserRow): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export function createUser(name: string, email: string, password: string): PublicUser {
  const existing = getUserByEmail.get(email.toLowerCase());
  if (existing) {
    throw new Error('an account with this email already exists');
  }
  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  insertUser.run(id, name, email.toLowerCase(), passwordHash, Date.now());
  return { id, name, email: email.toLowerCase() };
}

export function verifyPassword(email: string, password: string): PublicUser | null {
  const user = getUserByEmail.get(email.toLowerCase());
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return toPublicUser(user);
}

export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  insertSession.run(token, userId, now, expiresAt);
  return { token, expiresAt };
}

export function revokeSession(token: string): void {
  deleteSession.run(token);
}

export function getUserForToken(token: string): PublicUser | null {
  const session = getSession.get(token);
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    deleteSession.run(token);
    return null;
  }
  const user = getUserById.get(session.user_id);
  return user ? toPublicUser(user) : null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

// Validates "Authorization: Bearer <token>" and attaches req.user. Routes that
// use this run after account creation (signup/login); existing device/firmware
// routes are intentionally left as-is — this is a front-door gate for the app,
// not a retrofit of the whole API.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  const user = getUserForToken(token);
  if (!user) {
    res.status(401).json({ error: 'invalid or expired session' });
    return;
  }
  req.user = user;
  next();
}

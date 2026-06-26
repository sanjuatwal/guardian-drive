import { Router } from 'express';
import { z } from 'zod';

import { createSession, createUser, requireAuth, revokeSession, verifyPassword } from '../auth';

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

authRouter.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let user;
  try {
    user = createUser(parsed.data.name, parsed.data.email, parsed.data.password);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'signup failed';
    return res.status(409).json({ error: message });
  }

  const session = createSession(user.id);
  return res.status(201).json({ user, token: session.token, expiresAt: session.expiresAt });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = verifyPassword(parsed.data.email, parsed.data.password);
  if (!user) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const session = createSession(user.id);
  return res.json({ user, token: session.token, expiresAt: session.expiresAt });
});

authRouter.post('/logout', requireAuth, (req, res) => {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) revokeSession(token);
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

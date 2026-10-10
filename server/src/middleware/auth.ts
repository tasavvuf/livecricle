import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { User, IUser } from '../models/User';

export const JWT_SECRET = process.env.JWT_SECRET || 'livecircle-super-secret-editorial-key-2026';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export async function authenticateRest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User associated with token not found' });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
}

export async function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return next(new Error('Authentication token missing from socket handshake'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('User not found for socket connection'));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (err: any) {
    next(new Error(`Socket authentication failed: ${err.message}`));
  }
}

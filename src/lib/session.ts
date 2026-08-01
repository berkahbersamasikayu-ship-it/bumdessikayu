import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: number;
  nama?: string;
  username?: string;
  role?: 'Bumdes' | 'Umum';
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string, // minimal 32 karakter
  cookieName: 'bumdes_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 jam
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
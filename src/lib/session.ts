import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: string;
  username?: string;
  nama?: string;
  role?: 'Bumdes' | 'Umum';
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'bumdes_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
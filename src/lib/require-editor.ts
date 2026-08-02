import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function requireEditor() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    return {
      error: NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 }),
      session: null,
    };
  }
  if (session.role === 'Umum') {
    return {
      error: NextResponse.json({ message: 'Akun viewer tidak memiliki izin untuk mengubah data.' }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireLoggedIn() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    return {
      error: NextResponse.json({ message: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}
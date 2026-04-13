import { NextResponse } from 'next/server';

// POST /api/auth/logout — выход
export async function POST() {
  const response = NextResponse.json({ message: 'Выход выполнен' });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

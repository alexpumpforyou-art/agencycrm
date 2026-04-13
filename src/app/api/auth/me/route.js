import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET /api/auth/me — текущий пользователь
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/auth/me — текущий пользователь
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Fetch fresh user data including onboardingDone
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        agentCode: true,
        onboardingDone: true,
        commissionRate: true,
        balance: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
}

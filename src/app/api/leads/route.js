import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/leads — список лидов (агент — свои, админ — все)
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');

    const where = {};

    // Агент видит только своих лидов
    if (session.role === 'AGENT') {
      where.agentId = session.id;
    } else if (session.role === 'ADMIN' && agentId) {
      where.agentId = parseInt(agentId);
    }

    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, agentCode: true, commissionRate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

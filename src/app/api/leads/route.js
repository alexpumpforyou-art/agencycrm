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

// POST /api/leads — ручное создание лида (только админ)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { name, contactMethod, projectDescription, budget, agentId, status, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        contactMethod: contactMethod || '',
        projectDescription: projectDescription || '',
        budget: budget || '',
        source: 'Ручной ввод',
        agentId: agentId ? parseInt(agentId) : null,
        status: status || 'NEW',
        notes: notes || '',
      },
      include: {
        agent: { select: { id: true, name: true, agentCode: true } },
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

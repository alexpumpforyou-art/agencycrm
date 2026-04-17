import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/candidates — список кандидатов
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const candidates = await prisma.candidate.findMany({
      include: {
        linkedAgent: { select: { id: true, name: true, agentCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Get candidates error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/candidates — создать кандидата
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { name, contact, source, notes, callDate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        contact: contact || '',
        source: source || 'OTHER',
        notes: notes || '',
        callDate: callDate ? new Date(callDate) : null,
        status: callDate ? 'CALL_SCHEDULED' : 'NEW',
      },
    });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    console.error('Create candidate error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

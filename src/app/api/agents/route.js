import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hashPassword, generateAgentCode } from '@/lib/auth';

// GET /api/agents — список агентов (только админ)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
        agentCode: true,
        commissionRate: true,
        balance: true,
        isBlocked: true,
        telegramUsername: true,
        agentNotes: true,
        createdAt: true,
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/agents — создание агента (только админ)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { email, password, name, commissionRate } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email уже используется' }, { status: 409 });
    }

    let agentCode;
    let codeExists = true;
    while (codeExists) {
      agentCode = generateAgentCode();
      codeExists = await prisma.user.findUnique({ where: { agentCode } });
    }

    const passwordHash = await hashPassword(password);
    const rate = commissionRate ? Math.min(30, Math.max(10, parseFloat(commissionRate))) : 10;

    const agent = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        agentCode,
        role: 'AGENT',
        commissionRate: rate,
      },
    });

    return NextResponse.json({
      message: 'Агент создан',
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        agentCode: agent.agentCode,
        commissionRate: agent.commissionRate,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

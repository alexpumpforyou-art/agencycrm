import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, createToken } from '@/lib/auth';

// POST /api/agents/[id]/impersonate — войти как агент (только админ)
export async function POST(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const agentId = parseInt(id);

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || agent.role !== 'AGENT') {
      return NextResponse.json({ error: 'Агент не найден' }, { status: 404 });
    }

    const token = await createToken({
      id: agent.id,
      email: agent.email,
      role: agent.role,
      agentCode: agent.agentCode,
      name: agent.name,
    });

    const response = NextResponse.json({ message: 'Вход как агент' });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 часа
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

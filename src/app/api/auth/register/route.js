import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateAgentCode } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Generate unique agent code
    let agentCode;
    let codeExists = true;
    while (codeExists) {
      agentCode = generateAgentCode();
      codeExists = await prisma.user.findUnique({ where: { agentCode } });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        agentCode,
        role: 'AGENT',
        commissionRate: 10.0,
      },
    });

    return NextResponse.json({
      message: 'Регистрация успешна',
      agentCode: user.agentCode,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

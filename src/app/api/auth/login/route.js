import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Введите email и пароль' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован. Обратитесь к администратору.' },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      agentCode: user.agentCode,
      name: user.name,
    });

    const response = NextResponse.json({
      message: 'Вход выполнен',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agentCode: user.agentCode,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

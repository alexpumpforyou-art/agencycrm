import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/landing-pages — список страниц
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const where = session.role === 'AGENT' ? { isActive: true } : {};
    const pages = await prisma.landingPage.findMany({ where, orderBy: { createdAt: 'desc' } });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Get landing pages error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/landing-pages — создать страницу (только админ)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { title, url, description } = await request.json();
    if (!title || !url) {
      return NextResponse.json({ error: 'Название и URL обязательны' }, { status: 400 });
    }

    // Убираем trailing slash
    const cleanUrl = url.replace(/\/+$/, '');

    const page = await prisma.landingPage.create({
      data: { title, url: cleanUrl, description: description || '' },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Create landing page error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

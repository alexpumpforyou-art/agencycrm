import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/materials — список материалов (все авторизованные)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/materials — добавить материал (только админ)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { title, description, url, category } = await request.json();

    if (!title || !url) {
      return NextResponse.json({ error: 'Название и ссылка обязательны' }, { status: 400 });
    }

    const material = await prisma.material.create({
      data: { title, description: description || '', url, category: category || 'OTHER' },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Create material error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

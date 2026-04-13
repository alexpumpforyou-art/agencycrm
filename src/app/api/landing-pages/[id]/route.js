import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/landing-pages/[id] — обновить страницу
export async function PATCH(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.url !== undefined) updateData.url = body.url.replace(/\/+$/, '');
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const page = await prisma.landingPage.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Update landing page error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/landing-pages/[id] — удалить страницу
export async function DELETE(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    await prisma.landingPage.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete landing page error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

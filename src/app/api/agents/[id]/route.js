import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/agents/[id] — управление агентом (только админ)
export async function PATCH(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const agentId = parseInt(id);
    const body = await request.json();
    const updateData = {};

    if (body.isBlocked !== undefined) updateData.isBlocked = body.isBlocked;
    if (body.commissionRate !== undefined) {
      const rate = parseFloat(body.commissionRate);
      if (rate < 10 || rate > 30) {
        return NextResponse.json({ error: 'Комиссия от 10% до 30%' }, { status: 400 });
      }
      updateData.commissionRate = rate;
    }
    if (body.name) updateData.name = body.name;

    const agent = await prisma.user.update({
      where: { id: agentId },
      data: updateData,
      select: {
        id: true, name: true, email: true, agentCode: true,
        commissionRate: true, isBlocked: true, createdAt: true,
      },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/agents/[id] — удаление агента (только админ)
export async function DELETE(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const agentId = parseInt(id);
    await prisma.user.delete({ where: { id: agentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

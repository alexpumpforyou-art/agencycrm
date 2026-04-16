import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

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
      if (rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'Комиссия от 0% до 100%' }, { status: 400 });
      }
      updateData.commissionRate = rate;
    }
    if (body.name) updateData.name = body.name;
    if (body.telegramUsername !== undefined) updateData.telegramUsername = body.telegramUsername;
    if (body.agentNotes !== undefined) updateData.agentNotes = body.agentNotes;

    // Админ может менять пароль агента
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(body.newPassword);
    }

    // Начисление/списание баланса
    if (body.balanceChange !== undefined) {
      const change = parseFloat(body.balanceChange);
      if (isNaN(change)) {
        return NextResponse.json({ error: 'Некорректная сумма' }, { status: 400 });
      }
      const currentAgent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { balance: true },
      });
      updateData.balance = (currentAgent?.balance || 0) + change;
    }

    const agent = await prisma.user.update({
      where: { id: agentId },
      data: updateData,
      select: {
        id: true, name: true, email: true, agentCode: true,
        commissionRate: true, isBlocked: true, createdAt: true,
        balance: true, telegramUsername: true, agentNotes: true,
        _count: { select: { leads: true, clicks: true } },
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

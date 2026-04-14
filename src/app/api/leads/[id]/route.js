import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Разрешённые переходы для агента
const AGENT_ALLOWED_TRANSITIONS = {
  NEW: ['NEGOTIATIONS', 'REJECTED'],
  NEGOTIATIONS: ['REJECTED'],
};

// PATCH /api/leads/[id] — обновление лида
export async function PATCH(request, props) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { id } = await props.params;
    const leadId = parseInt(id);
    const body = await request.json();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ error: 'Лид не найден' }, { status: 404 });

    // Агент может обновлять только своих лидов
    if (session.role === 'AGENT') {
      if (lead.agentId !== session.id) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
      }

      // Проверяем разрешённые переходы статусов
      if (body.status) {
        const allowed = AGENT_ALLOWED_TRANSITIONS[lead.status] || [];
        if (!allowed.includes(body.status)) {
          return NextResponse.json({ error: 'Недопустимый переход статуса' }, { status: 400 });
        }
      }

      const agentData = {};
      if (body.status) agentData.status = body.status;
      if (body.notes !== undefined) agentData.notes = body.notes;

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: agentData,
      });
      return NextResponse.json({ lead: updated });
    }

    // Админ может менять всё
    if (session.role === 'ADMIN') {
      const updateData = {};
      if (body.status) updateData.status = body.status;
      if (body.orderCost !== undefined) updateData.orderCost = body.orderCost;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.agentId !== undefined) updateData.agentId = body.agentId;
      if (body.name) updateData.name = body.name;
      if (body.contactMethod) updateData.contactMethod = body.contactMethod;
      if (body.budget !== undefined) updateData.budget = body.budget;
      if (body.projectDescription !== undefined) updateData.projectDescription = body.projectDescription;

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
        include: {
          agent: { select: { id: true, name: true, agentCode: true, commissionRate: true } },
        },
      });
      return NextResponse.json({ lead: updated });
    }

    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/leads/[id] — удаление лида (только админ)
export async function DELETE(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const leadId = parseInt(id);
    await prisma.lead.delete({ where: { id: leadId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

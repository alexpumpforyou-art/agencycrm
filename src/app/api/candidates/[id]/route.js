import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/candidates/[id] — обновить кандидата
export async function PATCH(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    const candidateId = parseInt(id);
    const body = await request.json();
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.contact !== undefined) updateData.contact = body.contact;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.linkedAgentId !== undefined) {
      updateData.linkedAgentId = body.linkedAgentId ? parseInt(body.linkedAgentId) : null;
    }

    // Обработка даты созвона
    if (body.callDate !== undefined) {
      updateData.callDate = body.callDate ? new Date(body.callDate) : null;
      updateData.callReminded = false; // сброс напоминания при изменении даты
      if (body.callDate && body.status === undefined) {
        updateData.status = 'CALL_SCHEDULED';
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
      include: {
        linkedAgent: { select: { id: true, name: true, agentCode: true } },
      },
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error('Update candidate error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/candidates/[id]
export async function DELETE(request, props) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await props.params;
    await prisma.candidate.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete candidate error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramNotification, formatNewLeadMessage } from '@/lib/telegram';

// POST /api/leads/webhook — публичный постбек с вашего сайта
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contactMethod, projectDescription, budget, agentCode } = body;

    if (!name || !contactMethod) {
      return NextResponse.json({ error: 'Имя и способ связи обязательны' }, { status: 400 });
    }

    // Находим агента по коду (параметр ?a=12345)
    let agent = null;
    if (agentCode) {
      agent = await prisma.user.findUnique({
        where: { agentCode: String(agentCode) },
        select: { id: true, agentCode: true, isBlocked: true },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        contactMethod,
        projectDescription: projectDescription || '',
        budget: budget || '',
        source: agentCode ? `Реферальная ссылка агента ${agentCode}` : 'Прямой переход',
        agentId: agent && !agent.isBlocked ? agent.id : null,
        status: 'NEW',
      },
    });

    // Telegram уведомление админу
    const code = agent?.agentCode || 'нет агента';
    await sendTelegramNotification(formatNewLeadMessage(lead, code));

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

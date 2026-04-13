import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramNotification, formatNewLeadMessage } from '@/lib/telegram';

// POST /api/leads/webhook — универсальный вебхук для любой формы
//
// Принимает ЛЮБЫЕ поля. Маппинг:
//   name / имя / Имя / Ваше имя              → name
//   phone / email / телефон / контакт / ...   → contactMethod
//   site / website / url / ссылка / ...       → projectDescription
//   message / description / описание / ...    → projectDescription
//   budget / бюджет                           → budget
//   agentCode / agent_code / a                → agentCode
//
// Обязательно: хотя бы name ИЛИ email ИЛИ phone
//
export async function POST(request) {
  try {
    const body = await request.json();

    // Универсальный маппинг полей
    const name = body.name || body.имя || body['Ваше имя'] || body['Имя'] || body.fullname || body.full_name || '';
    const email = body.email || body.Email || body.EMAIL || body.почта || '';
    const phone = body.phone || body.tel || body.телефон || body.Телефон || body.mobile || '';
    const site = body.site || body.website || body.url || body['Ссылка на ваш сайт'] || body.ссылка || body.link || '';
    const message = body.message || body.description || body.projectDescription || body.описание || body.комментарий || body.comment || '';
    const budget = body.budget || body.бюджет || body.Бюджет || '';
    const agentCode = body.agentCode || body.agent_code || body.a || body.ref || '';

    // Собираем контакт из доступных данных
    const contactParts = [];
    if (phone) contactParts.push(phone);
    if (email) contactParts.push(email);
    const contactMethod = body.contactMethod || contactParts.join(' / ') || '';

    // Собираем описание проекта из доступных данных
    const descParts = [];
    if (site) descParts.push(`Сайт: ${site}`);
    if (message) descParts.push(message);
    const projectDescription = descParts.join('\n') || '';

    // Проверка — нужно хоть что-то для идентификации лида
    if (!name && !contactMethod) {
      return NextResponse.json({
        error: 'Нужно хотя бы одно поле: name, email или phone',
        hint: 'Отправьте JSON с любыми полями. Например: {"name":"Иван","email":"ivan@test.ru","agentCode":"12345"}',
      }, { status: 400 });
    }

    // Находим агента по коду
    let agent = null;
    if (agentCode) {
      agent = await prisma.user.findUnique({
        where: { agentCode: String(agentCode) },
        select: { id: true, agentCode: true, isBlocked: true },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        name: name || contactMethod,
        contactMethod,
        projectDescription,
        budget: String(budget),
        source: agentCode ? `Агент ${agentCode}` : 'Прямой переход',
        agentId: agent && !agent.isBlocked ? agent.id : null,
        status: 'NEW',
      },
    });

    // Telegram уведомление
    const code = agent?.agentCode || 'нет агента';
    await sendTelegramNotification(formatNewLeadMessage(lead, code));

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

// GET /api/cron/reminders — проверяет созвоны в ближайшие 30 минут и отправляет напоминание
// Вызывается кроном каждые 15 минут
export async function GET(request) {
  try {
    // Простой секрет для защиты от спама
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== (process.env.CRON_SECRET || 'crm-reminder-2024')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);

    // Ищем кандидатов с созвоном в ближайшие 30 минут, которым ещё не отправляли напоминание
    const upcoming = await prisma.candidate.findMany({
      where: {
        callDate: { gte: now, lte: in30min },
        callReminded: false,
        status: 'CALL_SCHEDULED',
      },
    });

    let sent = 0;
    for (const c of upcoming) {
      const callTime = new Date(c.callDate).toLocaleString('ru-RU', {
        timeZone: process.env.TZ || 'Asia/Yekaterinburg',
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });

      const message = [
        '📅 <b>Напоминание о созвоне!</b>',
        '',
        `👤 Кандидат: <b>${c.name}</b>`,
        `📱 Контакт: ${c.contact || '—'}`,
        `🕐 Время: <b>${callTime}</b>`,
        c.notes ? `📝 Заметка: ${c.notes.slice(0, 200)}` : '',
      ].filter(Boolean).join('\n');

      const ok = await sendTelegramNotification(message);
      if (ok) {
        await prisma.candidate.update({
          where: { id: c.id },
          data: { callReminded: true },
        });
        sent++;
      }
    }

    return NextResponse.json({ checked: upcoming.length, sent, time: now.toISOString() });
  } catch (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

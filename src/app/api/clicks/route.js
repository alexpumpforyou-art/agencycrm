import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/clicks — публичный эндпоинт для трекинга кликов
export async function POST(request) {
  try {
    const body = await request.json();
    const { agentCode, page } = body;

    if (!agentCode) {
      return NextResponse.json({ ok: true }); // тихо игнорируем
    }

    const agent = await prisma.user.findUnique({
      where: { agentCode: String(agentCode) },
      select: { id: true },
    });

    const headers = request.headers;

    await prisma.click.create({
      data: {
        agentCode: String(agentCode),
        agentId: agent?.id || null,
        ip: headers.get('x-forwarded-for')?.split(',')[0] || '',
        userAgent: (headers.get('user-agent') || '').slice(0, 500),
        referer: (headers.get('referer') || '').slice(0, 500),
        page: (page || '').slice(0, 500),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Click track error:', error);
    return NextResponse.json({ ok: true }); // не ломаем сайт клиента
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS — preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET — для диагностики
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'clicks' }, { headers: CORS_HEADERS });
}

// POST /api/clicks — публичный эндпоинт для трекинга кликов
export async function POST(request) {
  try {
    const body = await request.json();
    const { agentCode, page } = body;

    if (!agentCode) {
      return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
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

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Click track error:', error);
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }
}

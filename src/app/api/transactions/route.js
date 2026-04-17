import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/transactions?agentId=X — история транзакций
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    let agentId;

    if (session.role === 'ADMIN') {
      agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')) : null;
    } else {
      agentId = session.id; // агент видит только свои
    }

    if (!agentId) {
      return NextResponse.json({ transactions: [] });
    }

    const transactions = await prisma.balanceTransaction.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/transactions — создать транзакцию (только админ)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { agentId, type, amount, comment } = await request.json();

    if (!agentId || !type || amount === undefined) {
      return NextResponse.json({ error: 'agentId, type и amount обязательны' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: 'Некорректная сумма' }, { status: 400 });
    }

    // Определяем изменение баланса
    const balanceChange = type === 'PAYOUT' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    // Транзакция Prisma: запись + обновление баланса атомарно
    const [transaction] = await prisma.$transaction([
      prisma.balanceTransaction.create({
        data: {
          agentId: parseInt(agentId),
          type,
          amount: parsedAmount,
          comment: comment || '',
        },
      }),
      prisma.user.update({
        where: { id: parseInt(agentId) },
        data: { balance: { increment: balanceChange } },
      }),
    ]);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

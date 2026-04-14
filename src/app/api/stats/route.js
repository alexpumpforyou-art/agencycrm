import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/stats — статистика
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN';
    const whereAgent = isAdmin ? {} : { agentId: session.id };

    // Общее количество лидов
    const totalLeads = await prisma.lead.count({ where: whereAgent });

    // Клики
    const whereClicks = isAdmin ? {} : { agentId: session.id };
    const totalClicks = await prisma.click.count({ where: whereClicks });

    // По статусам
    const byStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: true,
      where: whereAgent,
    });

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });

    // Сумма заказов по закрытым сделкам
    const closedDeals = await prisma.lead.aggregate({
      _sum: { orderCost: true },
      _count: true,
      where: { ...whereAgent, status: 'DEAL_CLOSED' },
    });

    // Статистика для агента: его заработок
    let earnings = 0;
    if (!isAdmin) {
      const agent = await prisma.user.findUnique({
        where: { id: session.id },
        select: { commissionRate: true },
      });
      const totalClosed = closedDeals._sum.orderCost || 0;
      earnings = totalClosed * (agent.commissionRate / 100);
    }

    // Для админа: топ агенты
    let topAgents = [];
    if (isAdmin) {
      topAgents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: {
          id: true, name: true, agentCode: true, commissionRate: true,
          _count: { select: { leads: true, clicks: true } },
        },
        orderBy: { leads: { _count: 'desc' } },
        take: 10,
      });

      // Сумма закрытых сделок для каждого агента
      for (const agent of topAgents) {
        const agentClosed = await prisma.lead.aggregate({
          _sum: { orderCost: true },
          where: { agentId: agent.id, status: 'DEAL_CLOSED' },
        });
        agent.totalRevenue = agentClosed._sum.orderCost || 0;
        agent.earnings = agent.totalRevenue * (agent.commissionRate / 100);
      }
    }

    // Данные для графика
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';
    let chartData = {};

    if (period === 'all') {
      const allLeadsDates = await prisma.lead.findMany({
        where: whereAgent,
        select: { createdAt: true },
      });
      allLeadsDates.forEach(l => {
        const key = l.createdAt.toISOString().substring(0, 7); // YYYY-MM
        chartData[key] = (chartData[key] || 0) + 1;
      });
      // Sort months
      chartData = Object.fromEntries(Object.entries(chartData).sort());
    } else {
      const daysStr = parseInt(period) === 30 ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysStr + 1);
      startDate.setHours(0, 0, 0, 0);

      const recentLeads = await prisma.lead.findMany({
        where: { ...whereAgent, createdAt: { gte: startDate } },
        select: { createdAt: true },
      });

      for (let i = daysStr - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        chartData[key] = 0;
      }
      recentLeads.forEach(l => {
        const key = l.createdAt.toISOString().split('T')[0];
        if (chartData[key] !== undefined) chartData[key]++;
      });
    }

    // Общая выручка и комиссии (для админа)
    let totalRevenue = 0;
    let totalCommissions = 0;
    if (isAdmin) {
      totalRevenue = closedDeals._sum.orderCost || 0;
      // Рассчитываем суммарные комиссии всех агентов
      const allClosedLeads = await prisma.lead.findMany({
        where: { status: 'DEAL_CLOSED', orderCost: { not: null } },
        select: { orderCost: true, agent: { select: { commissionRate: true } } },
      });
      totalCommissions = allClosedLeads.reduce((sum, l) => {
        if (l.agent && l.orderCost) {
          return sum + l.orderCost * (l.agent.commissionRate / 100);
        }
        return sum;
      }, 0);
    }

    return NextResponse.json({
      totalLeads,
      totalClicks,
      statusMap,
      closedDeals: closedDeals._count,
      closedSum: closedDeals._sum.orderCost || 0,
      earnings,
      topAgents: isAdmin ? topAgents : undefined,
      dailyLeads: chartData, // Возвращаем под старым ключом для обратной совместимости
      totalRevenue: isAdmin ? totalRevenue : undefined,
      totalCommissions: isAdmin ? totalCommissions : undefined,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

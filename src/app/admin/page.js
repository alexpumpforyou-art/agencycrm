'use client';

import { useState, useEffect } from 'react';

const STATUS_LABELS = {
  NEW: 'Новый',
  NEGOTIATIONS: 'Переговоры',
  IN_PROGRESS: 'В работе',
  DEAL_CLOSED: 'Сделка закрыта',
  REJECTED: 'Отказ',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  if (!stats) return <p>Ошибка загрузки</p>;

  return (
    <>
      <div className="page-header">
        <h1>Обзор</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card info">
          <div className="stat-icon">📨</div>
          <div className="stat-value">{stats.totalLeads}</div>
          <div className="stat-label">Всего лидов</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.statusMap?.NEGOTIATIONS || 0}</div>
          <div className="stat-label">В переговорах</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon">⚙️</div>
          <div className="stat-value">{stats.statusMap?.IN_PROGRESS || 0}</div>
          <div className="stat-label">В работе</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.closedDeals}</div>
          <div className="stat-label">Закрыто сделок</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{stats.statusMap?.REJECTED || 0}</div>
          <div className="stat-label">Отказов</div>
        </div>
      </div>

      {/* Revenue */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card success">
          <div className="stat-icon">💵</div>
          <div className="stat-value">{(stats.totalRevenue || 0).toLocaleString('ru-RU')} ₽</div>
          <div className="stat-label">Общая выручка</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">💸</div>
          <div className="stat-value">{(stats.totalCommissions || 0).toLocaleString('ru-RU')} ₽</div>
          <div className="stat-label">Комиссии агентам</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            {stats.totalLeads > 0 ? Math.round(((stats.closedDeals || 0) / stats.totalLeads) * 100) : 0}%
          </div>
          <div className="stat-label">Конверсия</div>
        </div>
      </div>

      {/* Chart */}
      {stats.dailyLeads && (
        <div className="chart-container">
          <h3>Лиды за 7 дней</h3>
          <div className="chart-bars">
            {Object.entries(stats.dailyLeads).map(([date, count]) => {
              const max = Math.max(...Object.values(stats.dailyLeads), 1);
              const h = Math.max((count / max) * 140, 4);
              const day = new Date(date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
              return (
                <div key={date} className="chart-bar-group">
                  <div className="chart-bar-value">{count}</div>
                  <div className="chart-bar" style={{ height: h }}></div>
                  <div className="chart-bar-label">{day}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Agents */}
      {stats.topAgents && stats.topAgents.length > 0 && (
        <div className="table-container">
          <div className="table-header">
            <h3>🏆 Топ агентов</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Агент</th>
                <th>Код</th>
                <th>Лидов</th>
                <th>Выручка</th>
                <th>Комиссия</th>
                <th>Заработок</th>
              </tr>
            </thead>
            <tbody>
              {stats.topAgents.map((agent, i) => (
                <tr key={agent.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {i + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{agent.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{agent.agentCode}</td>
                  <td>{agent._count?.leads || 0}</td>
                  <td>{(agent.totalRevenue || 0).toLocaleString('ru-RU')} ₽</td>
                  <td>{agent.commissionRate}%</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {(agent.earnings || 0).toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABELS = {
  NEW: 'Новый',
  NEGOTIATIONS: 'Переговоры',
  IN_PROGRESS: 'В работе',
  DEAL_CLOSED: 'Сделка закрыта',
  REJECTED: 'Отказ',
};

const AGENT_TRANSITIONS = {
  NEW: ['NEGOTIATIONS', 'REJECTED'],
  NEGOTIATIONS: ['REJECTED'],
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, statsRes, leadsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/stats'),
        fetch('/api/leads' + (filter ? `?status=${filter}` : '')),
      ]);

      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'AGENT') {
        router.replace(meData.user?.role === 'ADMIN' ? '/admin' : '/login');
        return;
      }
      setUser(meData.user);

      const statsData = await statsRes.json();
      setStats(statsData);

      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads || []);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleStatusChange(leadId, newStatus) {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function copyLink() {
    const url = `${window.location.origin}/api/leads/webhook`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;
  }

  const refLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/form?a=${user?.agentCode}`;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🚀 CRM</h2>
          <div className="agent-code">Агент #{user?.agentCode}</div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-link active">📊 Дашборд</button>
          <button className="nav-link" onClick={() => document.getElementById('leads-section')?.scrollIntoView({ behavior: 'smooth' })}>
            📋 Мои лиды
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" onClick={handleLogout}>🚪 Выйти</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <h1>Добро пожаловать, {user?.name}!</h1>
        </div>

        {/* Referral Link */}
        <div className="copy-link-box">
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>🔗 Ваша ссылка:</span>
          <input type="text" readOnly value={refLink} />
          <button onClick={() => { navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
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
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.closedDeals}</div>
              <div className="stat-label">Закрыто сделок</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{(stats.earnings || 0).toLocaleString('ru-RU')} ₽</div>
              <div className="stat-label">Мой заработок</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {stats?.dailyLeads && (
          <div className="chart-container">
            <h3>Лиды за 7 дней</h3>
            <div className="chart-bars">
              {Object.entries(stats.dailyLeads).map(([date, count]) => {
                const max = Math.max(...Object.values(stats.dailyLeads), 1);
                const h = Math.max((count / max) * 140, 4);
                const day = new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' });
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

        {/* Leads Table */}
        <div id="leads-section" className="table-container">
          <div className="table-header">
            <h3>Мои лиды ({leads.length})</h3>
            <div className="table-filters">
              <button className={`filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Все</button>
              <button className={`filter-btn ${filter === 'NEW' ? 'active' : ''}`} onClick={() => setFilter('NEW')}>Новые</button>
              <button className={`filter-btn ${filter === 'NEGOTIATIONS' ? 'active' : ''}`} onClick={() => setFilter('NEGOTIATIONS')}>Переговоры</button>
              <button className={`filter-btn ${filter === 'DEAL_CLOSED' ? 'active' : ''}`} onClick={() => setFilter('DEAL_CLOSED')}>Закрытые</button>
              <button className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`} onClick={() => setFilter('REJECTED')}>Отказ</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Связь</th>
                <th>Проект</th>
                <th>Бюджет</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Пока нет лидов. Поделитесь своей реферальной ссылкой!
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const transitions = AGENT_TRANSITIONS[lead.status] || [];
                  return (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>{lead.name}</td>
                      <td>{lead.contactMethod}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.projectDescription || '—'}
                      </td>
                      <td>{lead.budget || '—'}</td>
                      <td><span className={`badge badge-${lead.status.toLowerCase()}`}>{STATUS_LABELS[lead.status]}</span></td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        {transitions.length > 0 && (
                          <select
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: 12, width: 'auto', minWidth: 130 }}
                            value=""
                            onChange={(e) => { if (e.target.value) handleStatusChange(lead.id, e.target.value); }}
                          >
                            <option value="">Изменить...</option>
                            {transitions.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [materials, setMaterials] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [landingPages, setLandingPages] = useState([]);
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, statsRes, leadsRes, matsRes, pagesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/stats'),
        fetch('/api/leads' + (filter ? `?status=${filter}` : '')),
        fetch('/api/materials'),
        fetch('/api/landing-pages'),
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

      const matsData = await matsRes.json();
      setMaterials(matsData.materials || []);

      const pagesData = await pagesRes.json();
      setLandingPages(pagesData.pages || []);

      // Show onboarding for new agents
      if (!meData.user.onboardingDone) {
        setShowOnboarding(true);
      }
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

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pwForm),
    });
    const data = await res.json();
    if (!res.ok) { setPwError(data.error); return; }
    setPwSuccess('Пароль изменён!');
    setPwForm({ currentPassword: '', newPassword: '' });
    setTimeout(() => { setShowPassword(false); setPwSuccess(''); }, 1500);
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
          <button className="nav-link" onClick={() => document.getElementById('materials-section')?.scrollIntoView({ behavior: 'smooth' })}>
            📦 Материалы
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" onClick={() => setShowPassword(true)}>🔑 Сменить пароль</button>
          <button className="nav-link" onClick={handleLogout}>🚪 Выйти</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <h1>Добро пожаловать, {user?.name}!</h1>
        </div>

        {/* Referral Links */}
        {landingPages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>🔗 Ваши реферальные ссылки:</h3>
            {landingPages.map(page => {
              const link = `${page.url}?a=${user?.agentCode}`;
              return (
                <div key={page.id} className="copy-link-box">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 120 }}>{page.title}:</span>
                  <input type="text" readOnly value={link} />
                  <button onClick={() => { navigator.clipboard.writeText(link); setCopiedLink(page.id); setTimeout(() => setCopiedLink(null), 2000); }}>
                    {copiedLink === page.id ? '✓' : 'Копировать'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="copy-link-box">
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Посадочные страницы ещё не настроены администратором</span>
          </div>
        )}

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

        {/* Materials Section */}
        <div id="materials-section" className="table-container" style={{ marginTop: 32 }}>
          <div className="table-header">
            <h3>📦 Материалы для работы ({materials.length})</h3>
          </div>
          <div style={{ padding: 16 }}>
            {materials.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Материалов пока нет</p>
            ) : (
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', margin: 0 }}>
                {materials.map(m => (
                  <div key={m.id} className="stat-card">
                    <span className="badge badge-negotiations" style={{ marginBottom: 8 }}>
                      {m.category === 'CASE' ? '📂 Кейс' : m.category === 'PORTFOLIO' ? '🎨 Портфолио' : m.category === 'PROMO' ? '📣 Промо' : m.category === 'GUIDE' ? '📖 Гайд' : '📎 Другое'}
                    </span>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{m.title}</h4>
                    {m.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{m.description}</p>}
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">🔗 Открыть</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            {onboardingStep === 0 && (
              <>
                <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>👋</div>
                <h2 style={{ textAlign: 'center' }}>Добро пожаловать в CRM!</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                  Краткое знакомство с системой — займёт 30 секунд
                </p>
              </>
            )}
            {onboardingStep === 1 && (
              <>
                <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>🔗</div>
                <h2 style={{ textAlign: 'center' }}>Реферальная ссылка</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                  Наверху дашборда — ваша уникальная ссылка. Отправляйте её клиентам. Когда клиент заполнит форму на нашем сайте — лид автоматически привяжется к вам.
                </p>
              </>
            )}
            {onboardingStep === 2 && (
              <>
                <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>📊</div>
                <h2 style={{ textAlign: 'center' }}>Статусы лидов</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8, marginBottom: 12 }}>
                  Каждый лид проходит через воронку:
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                  <span className="badge badge-new">Новый</span>
                  <span>→</span>
                  <span className="badge badge-negotiations">Переговоры</span>
                  <span>→</span>
                  <span className="badge badge-in_progress">В работе</span>
                  <span>→</span>
                  <span className="badge badge-deal_closed">Сделка</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>
                  Вы можете перевести лид в «Переговоры» или «Отказ». Остальные статусы ставит администратор.
                </p>
              </>
            )}
            {onboardingStep === 3 && (
              <>
                <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>💰</div>
                <h2 style={{ textAlign: 'center' }}>Вознаграждение</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                  Вы получаете комиссию от каждой закрытой сделки. Сумма отображается на дашборде. В разделе «Материалы» — кейсы и промо для работы с клиентами.
                </p>
              </>
            )}
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              {onboardingStep > 0 && (
                <button className="btn btn-outline" onClick={() => setOnboardingStep(s => s - 1)}>← Назад</button>
              )}
              {onboardingStep < 3 ? (
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setOnboardingStep(s => s + 1)}>
                  Далее →
                </button>
              ) : (
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={async () => {
                  await fetch('/api/auth/onboarding', { method: 'PATCH' });
                  setShowOnboarding(false);
                }}>
                  Начать работу! 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPassword && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPassword(false); }}>
          <div className="modal">
            <h2>Сменить пароль</h2>
            {pwError && <div className="alert alert-error">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Текущий пароль</label>
                <input type="password" className="form-input" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input type="password" className="form-input" placeholder="Минимум 6 символов" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPassword(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

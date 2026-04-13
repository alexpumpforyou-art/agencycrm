'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', commissionRate: '10' });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchAgents = useCallback(async () => {
    const res = await fetch('/api/agents');
    const data = await res.json();
    setAgents(data.agents || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function handleBlock(id, isBlocked) {
    await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !isBlocked }),
    });
    fetchAgents();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Удалить агента "${name}"? Это действие необратимо.`)) return;
    await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    fetchAgents();
  }

  async function handleSaveRate(id) {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 10 || rate > 30) {
      alert('Комиссия должна быть от 10% до 30%');
      return;
    }
    await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionRate: rate }),
    });
    setEditingId(null);
    fetchAgents();
  }

  async function handleCreateAgent(e) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();

    if (!res.ok) {
      setCreateError(data.error);
      return;
    }

    setCreateSuccess(`Агент создан! Код: ${data.agent.agentCode}`);
    setCreateForm({ name: '', email: '', password: '', commissionRate: '10' });
    fetchAgents();
    setTimeout(() => { setShowCreate(false); setCreateSuccess(''); }, 2000);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Управление агентами</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
          + Создать агента
        </button>
      </div>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <h2>Создать агента</h2>

            {createError && <div className="alert alert-error">{createError}</div>}
            {createSuccess && <div className="alert alert-success">{createSuccess}</div>}

            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label>Имя</label>
                <input
                  className="form-input"
                  placeholder="Иван Петров"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="agent@example.com"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Комиссия (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min={10}
                  max={30}
                  value={createForm.commissionRate}
                  onChange={e => setCreateForm({ ...createForm, commissionRate: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>{agents.length} агентов</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Код</th>
              <th>Комиссия</th>
              <th>Лидов</th>
              <th>Статус</th>
              <th>Регистрация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Нажмите «Создать агента» чтобы добавить первого
                </td>
              </tr>
            ) : (
              agents.map(agent => (
                <tr key={agent.id} style={{ opacity: agent.isBlocked ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{agent.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{agent.email}</td>
                  <td style={{ fontFamily: 'monospace' }}>{agent.agentCode}</td>
                  <td>
                    {editingId === agent.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: 70, padding: '4px 8px', fontSize: 13 }}
                          value={editRate}
                          onChange={e => setEditRate(e.target.value)}
                          min={10}
                          max={30}
                        />
                        <span style={{ fontSize: 13 }}>%</span>
                        <button className="btn btn-sm btn-success" onClick={() => handleSaveRate(agent.id)}>✓</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>✕</button>
                      </div>
                    ) : (
                      <span
                        style={{ cursor: 'pointer', borderBottom: '1px dashed var(--text-muted)' }}
                        onClick={() => { setEditingId(agent.id); setEditRate(agent.commissionRate.toString()); }}
                        title="Нажмите чтобы изменить"
                      >
                        {agent.commissionRate}%
                      </span>
                    )}
                  </td>
                  <td>{agent._count?.leads || 0}</td>
                  <td>
                    <span className={`badge ${agent.isBlocked ? 'badge-rejected' : 'badge-deal_closed'}`}>
                      {agent.isBlocked ? '🚫 Заблокирован' : '✅ Активен'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(agent.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`btn btn-sm ${agent.isBlocked ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => handleBlock(agent.id, agent.isBlocked)}
                      >
                        {agent.isBlocked ? 'Разблокировать' : 'Блокировать'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(agent.id, agent.name)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

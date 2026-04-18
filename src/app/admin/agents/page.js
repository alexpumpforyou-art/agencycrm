'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [balanceAgent, setBalanceAgent] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState('CREDIT');
  const [balanceComment, setBalanceComment] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', commissionRate: '10' });
  const [editForm, setEditForm] = useState({});
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (e) { console.error('Fetch agents error:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // Escape закрывает любую модалку
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setShowCreate(false);
        setEditAgent(null);
        setBalanceAgent(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    if (!res.ok) { setCreateError(data.error); return; }
    setCreateSuccess(`Агент создан! Код: ${data.agent.agentCode}`);
    setCreateForm({ name: '', email: '', password: '', commissionRate: '10' });
    fetchAgents();
    setTimeout(() => { setShowCreate(false); setCreateSuccess(''); }, 2000);
  }

  function startEdit(agent) {
    setEditAgent(agent);
    setEditForm({
      name: agent.name,
      commissionRate: agent.commissionRate.toString(),
      telegramUsername: agent.telegramUsername || '',
      agentNotes: agent.agentNotes || '',
      newPassword: '',
    });
    setEditError('');
  }

  async function handleSaveEdit() {
    setEditError('');
    const body = {
      name: editForm.name,
      commissionRate: parseFloat(editForm.commissionRate),
      telegramUsername: editForm.telegramUsername,
      agentNotes: editForm.agentNotes,
    };
    if (editForm.newPassword) body.newPassword = editForm.newPassword;

    const res = await fetch(`/api/agents/${editAgent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error);
      return;
    }
    setEditAgent(null);
    fetchAgents();
  }

  async function openBalance(agent) {
    setBalanceAgent(agent);
    setBalanceAmount('');
    setBalanceType('CREDIT');
    setBalanceComment('');
    const res = await fetch(`/api/transactions?agentId=${agent.id}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
  }

  async function handleBalanceChange() {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: balanceAgent.id, type: balanceType, amount, comment: balanceComment }),
    });
    // Обновить историю и баланс
    const res = await fetch(`/api/transactions?agentId=${balanceAgent.id}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setBalanceAmount('');
    setBalanceComment('');
    fetchAgents();
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
                <input className="form-input" placeholder="Иван Петров" value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="agent@example.com" value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input className="form-input" type="password" placeholder="Минимум 6 символов" value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Комиссия (%)</label>
                <input className="form-input" type="number" min={0} max={100} value={createForm.commissionRate}
                  onChange={e => setCreateForm({ ...createForm, commissionRate: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editAgent && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditAgent(null); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2>Редактировать: {editAgent.name}</h2>
            {editError && <div className="alert alert-error">{editError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Имя</label>
                <input className="form-input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Комиссия (%)</label>
                <input className="form-input" type="number" min={0} max={100} value={editForm.commissionRate}
                  onChange={e => setEditForm({ ...editForm, commissionRate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Telegram (юзернейм или ссылка на чат)</label>
              <input className="form-input" placeholder="@username или https://t.me/..." value={editForm.telegramUsername}
                onChange={e => setEditForm({ ...editForm, telegramUsername: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Заметки об агенте</label>
              <textarea className="form-input" rows={3} placeholder="Свободная заметка..."
                value={editForm.agentNotes}
                onChange={e => setEditForm({ ...editForm, agentNotes: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Новый пароль (оставьте пустым чтобы не менять)</label>
              <input className="form-input" type="password" placeholder="Минимум 6 символов"
                value={editForm.newPassword}
                onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditAgent(null)}>Отмена</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSaveEdit}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {balanceAgent && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setBalanceAgent(null); }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <h2>💰 Баланс: {balanceAgent.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Текущий баланс: <strong style={{ color: 'var(--success)', fontSize: 18 }}>
                {(balanceAgent.balance || 0).toLocaleString('ru-RU')} ₽
              </strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Тип</label>
                <select className="form-input" value={balanceType} onChange={e => setBalanceType(e.target.value)}>
                  <option value="CREDIT">💵 Начисление</option>
                  <option value="PAYOUT">📤 Выплата</option>
                  <option value="ADJUSTMENT">🔧 Корректировка</option>
                </select>
              </div>
              <div className="form-group">
                <label>Сумма (₽)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="5000"
                  value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Комментарий</label>
              <input className="form-input" placeholder="Комиссия за лид #42 / Выплата на карту..."
                value={balanceComment} onChange={e => setBalanceComment(e.target.value)} />
            </div>
            <div className="modal-actions" style={{ marginBottom: 16 }}>
              <button className="btn btn-outline" onClick={() => setBalanceAgent(null)}>Закрыть</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleBalanceChange}>
                {balanceType === 'PAYOUT' ? '📤 Списать' : '💵 Начислить'}
              </button>
            </div>

            {/* История */}
            {transactions.length > 0 && (
              <div>
                <h4 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>История операций</h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <table style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Тип</th>
                        <th>Сумма</th>
                        <th>Комментарий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <span style={{ color: t.type === 'PAYOUT' ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                              {t.type === 'CREDIT' ? '💵' : t.type === 'PAYOUT' ? '📤' : '🔧'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: t.type === 'PAYOUT' ? 'var(--danger)' : 'var(--success)' }}>
                            {t.type === 'PAYOUT' ? '-' : '+'}{t.amount.toLocaleString('ru-RU')} ₽
                          </td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.comment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
              <th>Баланс</th>
              <th>Лидов</th>
              <th>TG</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Нажмите «Создать агента» чтобы добавить первого
                </td>
              </tr>
            ) : (
              agents.map(agent => (
                <tr key={agent.id} style={{ opacity: agent.isBlocked ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{agent.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{agent.email}</td>
                  <td style={{ fontFamily: 'monospace' }}>{agent.agentCode}</td>
                  <td>{agent.commissionRate}%</td>
                  <td>
                    <span
                      style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--success)', borderBottom: '1px dashed var(--text-muted)' }}
                      onClick={() => openBalance(agent)}
                      title="Нажмите чтобы начислить/списать"
                    >
                      {(agent.balance || 0).toLocaleString('ru-RU')} ₽
                    </span>
                  </td>
                  <td>{agent._count?.leads || 0}</td>
                  <td style={{ fontSize: 12, color: agent.telegramUsername ? 'var(--info)' : 'var(--text-muted)' }}>
                    {agent.telegramUsername || '—'}
                  </td>
                  <td>
                    <span className={`badge ${agent.isBlocked ? 'badge-rejected' : 'badge-deal_closed'}`}>
                      {agent.isBlocked ? '🚫' : '✅'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => startEdit(agent)}>✏️</button>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ width: 'auto' }}
                        onClick={async () => {
                          await fetch(`/api/agents/${agent.id}/impersonate`, { method: 'POST' });
                          router.push('/dashboard');
                        }}
                      >
                        👤
                      </button>
                      <button
                        className={`btn btn-sm ${agent.isBlocked ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => handleBlock(agent.id, agent.isBlocked)}
                      >
                        {agent.isBlocked ? '🔓' : '🔒'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(agent.id, agent.name)}
                      >
                        🗑
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

'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS = {
  NEW: '🆕 Новый',
  CONTACTED: '📞 Связались',
  CALL_SCHEDULED: '📅 Созвон назначен',
  ACCEPTED: '✅ Принят',
  REJECTED: '❌ Отклонён',
};

const SOURCE_LABELS = {
  HH: 'HeadHunter',
  KWORK: 'Kwork',
  AVITO: 'Авито',
  TELEGRAM: 'Telegram',
  OTHER: 'Другое',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);
const ALL_SOURCES = Object.keys(SOURCE_LABELS);

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', contact: '', source: 'OTHER', notes: '', callDate: '' });
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const [candRes, agentsRes] = await Promise.all([
      fetch('/api/candidates'),
      fetch('/api/agents'),
    ]);
    const candData = await candRes.json();
    const agentsData = await agentsRes.json();
    setCandidates(candData.candidates || []);
    setAgents(agentsData.agents || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = candidates.filter(c => !filter || c.status === filter);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setCreateForm({ name: '', contact: '', source: 'OTHER', notes: '', callDate: '' });
    setShowCreate(false);
    fetchData();
  }

  function startEdit(c) {
    setEditCandidate(c);
    setEditForm({
      name: c.name,
      contact: c.contact,
      source: c.source,
      status: c.status,
      notes: c.notes,
      callDate: c.callDate ? new Date(c.callDate).toISOString().slice(0, 16) : '',
      linkedAgentId: c.linkedAgentId || '',
    });
  }

  async function handleSaveEdit() {
    const body = { ...editForm };
    if (!body.callDate) body.callDate = null;
    if (!body.linkedAgentId) body.linkedAgentId = null;
    await fetch(`/api/candidates/${editCandidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditCandidate(null);
    fetchData();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Удалить кандидата "${name}"?`)) return;
    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function formatCallDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diff = date - now;
    const hours = Math.round(diff / 3600000);
    let color = 'var(--text-muted)';
    let prefix = '';
    if (diff < 0) { color = '#ff6b6b'; prefix = '⏰ Просрочено: '; }
    else if (hours < 24) { color = '#f59e0b'; prefix = '🔔 Скоро: '; }
    return (
      <span style={{ color, fontSize: 12 }}>
        {prefix}{date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Кандидаты в агенты</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
          + Добавить кандидата
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <h2>Новый кандидат</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Имя</label>
                <input className="form-input" placeholder="Иван Петров" value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Контакт (тг / телефон / email)</label>
                <input className="form-input" placeholder="@username или +7..." value={createForm.contact}
                  onChange={e => setCreateForm({ ...createForm, contact: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Источник</label>
                  <select className="form-input" value={createForm.source}
                    onChange={e => setCreateForm({ ...createForm, source: e.target.value })}>
                    {ALL_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата созвона</label>
                  <input className="form-input" type="datetime-local" value={createForm.callDate}
                    onChange={e => setCreateForm({ ...createForm, callDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Заметки</label>
                <textarea className="form-input" rows={2} placeholder="Опыт, навыки..." value={createForm.notes}
                  onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCandidate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditCandidate(null); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2>Редактировать: {editCandidate.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Имя</label>
                <input className="form-input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Контакт</label>
                <input className="form-input" value={editForm.contact}
                  onChange={e => setEditForm({ ...editForm, contact: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Источник</label>
                <select className="form-input" value={editForm.source}
                  onChange={e => setEditForm({ ...editForm, source: e.target.value })}>
                  {ALL_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Статус</label>
                <select className="form-input" value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Дата и время созвона</label>
              <input className="form-input" type="datetime-local" value={editForm.callDate}
                onChange={e => setEditForm({ ...editForm, callDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Привязать к агенту</label>
              <select className="form-input" value={editForm.linkedAgentId}
                onChange={e => setEditForm({ ...editForm, linkedAgentId: e.target.value })}>
                <option value="">— Не привязан —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.agentCode})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Заметки</label>
              <textarea className="form-input" rows={3} value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditCandidate(null)}>Отмена</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSaveEdit}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>{filtered.length} кандидатов</h3>
          <div className="table-filters">
            <button className={`filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Все</button>
            {ALL_STATUSES.map(s => (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Контакт</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Созвон</th>
              <th>Агент</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Нет кандидатов
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.contact || '—'}</td>
                  <td><span className="badge badge-negotiations" style={{ fontSize: 11 }}>{SOURCE_LABELS[c.source]}</span></td>
                  <td><span className={`badge badge-${c.status === 'ACCEPTED' ? 'deal_closed' : c.status === 'REJECTED' ? 'rejected' : 'new'}`} style={{ fontSize: 11 }}>{STATUS_LABELS[c.status]}</span></td>
                  <td>{formatCallDate(c.callDate)}</td>
                  <td style={{ fontSize: 12, color: c.linkedAgent ? 'var(--info)' : 'var(--text-muted)' }}>{c.linkedAgent?.name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => startEdit(c)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id, c.name)}>🗑</button>
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

'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS = {
  NEW: 'Новый',
  NEGOTIATIONS: 'Переговоры',
  IN_PROGRESS: 'В работе',
  DEAL_CLOSED: 'Сделка закрыта',
  REJECTED: 'Отказ',
};

const ALL_STATUSES = ['NEW', 'NEGOTIATIONS', 'IN_PROGRESS', 'DEAL_CLOSED', 'REJECTED'];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '', contactMethod: '', projectDescription: '', budget: '', agentId: '', status: 'NEW', notes: '',
  });
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const [leadsRes, agentsRes] = await Promise.all([
      fetch('/api/leads' + (filter ? `?status=${filter}` : '')),
      fetch('/api/agents'),
    ]);
    const leadsData = await leadsRes.json();
    const agentsData = await agentsRes.json();
    setLeads(leadsData.leads || []);
    setAgents(agentsData.agents || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    if (!res.ok) { setError((await res.json()).error); return; }
    setCreateForm({ name: '', contactMethod: '', projectDescription: '', budget: '', agentId: '', status: 'NEW', notes: '' });
    setShowCreate(false);
    fetchData();
  }

  async function handleUpdate(leadId) {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingLead(null);
    fetchData();
  }

  async function handleDelete(id) {
    if (!confirm('Удалить этот лид?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function startEdit(lead) {
    setEditingLead(lead.id);
    setEditForm({
      name: lead.name,
      contactMethod: lead.contactMethod,
      projectDescription: lead.projectDescription,
      budget: lead.budget,
      status: lead.status,
      orderCost: lead.orderCost || '',
      notes: lead.notes || '',
      agentId: lead.agentId || '',
    });
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Все лиды</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
          + Добавить лид
        </button>
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <h2>Добавить лид вручную</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Имя *</label>
                  <input className="form-input" placeholder="Иван Петров" value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Контакт</label>
                  <input className="form-input" placeholder="+7 999 123-45-67" value={createForm.contactMethod}
                    onChange={e => setCreateForm({ ...createForm, contactMethod: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Описание проекта</label>
                <textarea className="form-input" rows={2} placeholder="Что нужно клиенту..." value={createForm.projectDescription}
                  onChange={e => setCreateForm({ ...createForm, projectDescription: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Бюджет</label>
                  <input className="form-input" placeholder="100 000 ₽" value={createForm.budget}
                    onChange={e => setCreateForm({ ...createForm, budget: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Статус</label>
                  <select className="form-input" value={createForm.status}
                    onChange={e => setCreateForm({ ...createForm, status: e.target.value })}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Привязать к агенту</label>
                <select className="form-input" value={createForm.agentId}
                  onChange={e => setCreateForm({ ...createForm, agentId: e.target.value })}>
                  <option value="">Без агента</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.agentCode})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Заметки</label>
                <textarea className="form-input" rows={2} placeholder="Внутренние заметки..." value={createForm.notes}
                  onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingLead(null); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <h2>Редактировать лид #{editingLead}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingLead); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input className="form-input" value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Контакт</label>
                  <input className="form-input" value={editForm.contactMethod}
                    onChange={e => setEditForm({ ...editForm, contactMethod: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Описание проекта</label>
                <textarea className="form-input" rows={2} value={editForm.projectDescription}
                  onChange={e => setEditForm({ ...editForm, projectDescription: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Бюджет</label>
                  <input className="form-input" value={editForm.budget}
                    onChange={e => setEditForm({ ...editForm, budget: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Стоимость заказа (₽)</label>
                  <input className="form-input" type="number" placeholder="0" value={editForm.orderCost}
                    onChange={e => setEditForm({ ...editForm, orderCost: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Статус</label>
                  <select className="form-input" value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Агент</label>
                  <select className="form-input" value={editForm.agentId}
                    onChange={e => setEditForm({ ...editForm, agentId: e.target.value ? parseInt(e.target.value) : null })}>
                    <option value="">Без агента</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.agentCode})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Заметки</label>
                <textarea className="form-input" rows={2} value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingLead(null)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="table-container">
        <div className="table-header">
          <h3>{leads.length} лидов</h3>
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
              <th>Проект</th>
              <th>Бюджет</th>
              <th>Агент</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Нет лидов
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 600 }}>{lead.name}</td>
                  <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.contactMethod || '—'}</td>
                  <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.projectDescription || '—'}
                  </td>
                  <td>{lead.budget || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {lead.agent ? `${lead.agent.name} (${lead.agent.agentCode})` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge badge-${lead.status.toLowerCase()}`}>{STATUS_LABELS[lead.status]}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => startEdit(lead)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(lead.id)}>🗑</button>
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

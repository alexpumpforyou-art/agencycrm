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
  const [filter, setFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editLead, setEditLead] = useState(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (agentFilter) params.set('agentId', agentFilter);

    const [leadsRes, agentsRes] = await Promise.all([
      fetch('/api/leads?' + params.toString()),
      fetch('/api/agents'),
    ]);
    const leadsData = await leadsRes.json();
    const agentsData = await agentsRes.json();
    setLeads(leadsData.leads || []);
    setAgents(agentsData.agents || []);
    setLoading(false);
  }, [filter, agentFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleUpdateLead() {
    if (!editLead) return;
    await fetch(`/api/leads/${editLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editLead.status,
        orderCost: editLead.orderCost ? parseFloat(editLead.orderCost) : null,
        notes: editLead.notes,
        agentId: editLead.agentId ? parseInt(editLead.agentId) : null,
      }),
    });
    setEditLead(null);
    fetchData();
  }

  async function handleDeleteLead(id) {
    if (!confirm('Удалить этот лид?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    fetchData();
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Все лиды</h1>
        <span className="text-secondary">{leads.length} лидов</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="table-filters">
          <button className={`filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Все</button>
          {ALL_STATUSES.map(s => (
            <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <select
          className="form-input"
          style={{ width: 200, padding: '6px 12px', fontSize: 13 }}
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
        >
          <option value="">Все агенты</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.agentCode})</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Связь</th>
              <th>Проект</th>
              <th>Бюджет</th>
              <th>Стоимость</th>
              <th>Агент</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Нет лидов</td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{lead.id}</td>
                  <td style={{ fontWeight: 600 }}>{lead.name}</td>
                  <td>{lead.contactMethod}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.projectDescription || '—'}
                  </td>
                  <td>{lead.budget || '—'}</td>
                  <td style={{ fontWeight: 600, color: lead.orderCost ? 'var(--success)' : 'var(--text-muted)' }}>
                    {lead.orderCost ? `${lead.orderCost.toLocaleString('ru-RU')} ₽` : '—'}
                  </td>
                  <td>
                    {lead.agent ? (
                      <span style={{ fontSize: 12 }}>{lead.agent.name} <span style={{ color: 'var(--text-muted)' }}>({lead.agent.agentCode})</span></span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td><span className={`badge badge-${lead.status.toLowerCase()}`}>{STATUS_LABELS[lead.status]}</span></td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setEditLead({
                          id: lead.id,
                          status: lead.status,
                          orderCost: lead.orderCost || '',
                          notes: lead.notes || '',
                          agentId: lead.agentId || '',
                          name: lead.name,
                        })}
                      >
                        ✏️
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLead(lead.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editLead && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditLead(null); }}>
          <div className="modal">
            <h2>Редактировать лид #{editLead.id}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{editLead.name}</p>

            <div className="form-group">
              <label>Статус</label>
              <select
                className="form-input"
                value={editLead.status}
                onChange={e => setEditLead({ ...editLead, status: e.target.value })}
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Стоимость заказа (₽)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Например: 150000"
                value={editLead.orderCost}
                onChange={e => setEditLead({ ...editLead, orderCost: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Переназначить агенту</label>
              <select
                className="form-input"
                value={editLead.agentId}
                onChange={e => setEditLead({ ...editLead, agentId: e.target.value })}
              >
                <option value="">Без агента</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.agentCode})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Заметки</label>
              <textarea
                className="form-input"
                value={editLead.notes}
                onChange={e => setEditLead({ ...editLead, notes: e.target.value })}
                placeholder="Внутренние заметки..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditLead(null)}>Отмена</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleUpdateLead}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

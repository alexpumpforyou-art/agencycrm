'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORY_LABELS = {
  CASE: '📂 Кейс',
  PORTFOLIO: '🎨 Портфолио',
  PROMO: '📣 Промо',
  GUIDE: '📖 Гайд',
  OTHER: '📎 Другое',
};

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', category: 'CASE' });
  const [error, setError] = useState('');

  const fetchMaterials = useCallback(async () => {
    const res = await fetch('/api/materials');
    const data = await res.json();
    setMaterials(data.materials || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error); return; }
    setForm({ title: '', description: '', url: '', category: 'CASE' });
    setShowCreate(false);
    fetchMaterials();
  }

  async function handleDelete(id) {
    if (!confirm('Удалить этот материал?')) return;
    await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    fetchMaterials();
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Материалы для агентов</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
          + Добавить материал
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <h2>Добавить материал</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Название</label>
                <input className="form-input" placeholder="Кейс: Интернет-магазин" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-input" placeholder="Краткое описание..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ссылка (URL)</label>
                <input className="form-input" type="url" placeholder="https://drive.google.com/..." value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select className="form-input" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {materials.length === 0 ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>
            Нет материалов. Добавьте первый!
          </div>
        ) : (
          materials.map(m => (
            <div key={m.id} className="stat-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge badge-negotiations">{CATEGORY_LABELS[m.category] || m.category}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(m.id)} title="Удалить">🗑</button>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{m.title}</h3>
              {m.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{m.description}</p>}
              <a href={m.url} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm btn-outline" style={{ marginTop: 'auto' }}>
                🔗 Открыть ссылку
              </a>
            </div>
          ))
        )}
      </div>
    </>
  );
}

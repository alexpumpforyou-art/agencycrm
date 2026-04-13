'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [editForm, setEditForm] = useState({ title: '', url: '', description: '' });
  const [error, setError] = useState('');

  const fetchPages = useCallback(async () => {
    const res = await fetch('/api/landing-pages');
    const data = await res.json();
    setPages(data.pages || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/landing-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error); return; }
    setForm({ title: '', url: '', description: '' });
    setShowCreate(false);
    fetchPages();
  }

  async function handleUpdate(id) {
    await fetch(`/api/landing-pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchPages();
  }

  async function handleToggle(id, isActive) {
    await fetch(`/api/landing-pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchPages();
  }

  async function handleDelete(id) {
    if (!confirm('Удалить эту посадочную страницу?')) return;
    await fetch(`/api/landing-pages/${id}`, { method: 'DELETE' });
    fetchPages();
  }

  const crmUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-crm.railway.app';

  const embedCode = `<!-- CRM Lead Tracker — вставить перед </head> -->
<script>
(function(){
  var params = new URLSearchParams(window.location.search);
  var code = params.get('a');
  if(code) {
    document.cookie = 'agent_code='+code+';path=/;max-age=2592000';
  }
})();
</script>

<!-- Добавить в обработчик отправки формы -->
<script>
function sendLeadToCRM(formData) {
  var code = document.cookie.match(/agent_code=([^;]+)/);
  fetch('${crmUrl}/api/leads/webhook', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: formData.name || '',
      contactMethod: formData.phone || formData.email || '',
      projectDescription: formData.message || formData.description || '',
      budget: formData.budget || '',
      agentCode: code ? code[1] : ''
    })
  });
}

// Пример использования: sendLeadToCRM({ name: 'Иван', phone: '+7999...', message: 'Нужен сайт' })
</script>`;

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Посадочные страницы</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setShowIntegration(true)}>
            📋 Инструкция интеграции
          </button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
            + Добавить страницу
          </button>
        </div>
      </div>

      {/* Integration Instructions Modal */}
      {showIntegration && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowIntegration(false); }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <h2>📋 Инструкция по интеграции</h2>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--info)' }}>Шаг 1: Вставьте код на сайт</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Скопируйте код ниже и вставьте на все посадочные страницы вашего сайта. 
                Код сохраняет код агента из URL (<code>?a=XXXXX</code>) в cookie на 30 дней.
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 400,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>{embedCode}</pre>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ position: 'absolute', top: 8, right: 8, width: 'auto' }}
                  onClick={() => { navigator.clipboard.writeText(embedCode); }}
                >
                  Скопировать
                </button>
              </div>

              <h3 style={{ fontSize: 14, marginBottom: 8, marginTop: 20, color: 'var(--info)' }}>Шаг 2: Подключите к вашей форме</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                В обработчике отправки формы вызовите <code>sendLeadToCRM()</code> с данными клиента:
              </p>
              <pre style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: 16,
                borderRadius: 8,
                fontSize: 12,
                overflow: 'auto',
              }}>{`// В обработчике submit формы:
sendLeadToCRM({
  name: document.getElementById('name').value,
  phone: document.getElementById('phone').value,
  message: document.getElementById('message').value,
  budget: document.getElementById('budget')?.value || ''
});`}</pre>

              <h3 style={{ fontSize: 14, marginBottom: 8, marginTop: 20, color: 'var(--info)' }}>Шаг 3: Как это работает</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <p>1. Агент делится ссылкой: <code>https://ваш-сайт.ru?a=56290</code></p>
                <p>2. Клиент переходит → код <b>56290</b> сохраняется в cookie на 30 дней</p>
                <p>3. Клиент заполняет форму → данные + код агента отправляются в CRM</p>
                <p>4. Лид автоматически привязывается к агенту в системе</p>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setShowIntegration(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <h2>Добавить посадочную страницу</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Название</label>
                <input className="form-input" placeholder="Главная — Веб-разработка" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>URL страницы</label>
                <input className="form-input" type="url" placeholder="https://webstudio.ru/landing-one" value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Описание (необязательно)</label>
                <textarea className="form-input" rows={2} placeholder="Лендинг под SEO продвижение..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="table-container">
        <div className="table-header">
          <h3>{pages.length} страниц</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>URL</th>
              <th>Описание</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Добавьте первую посадочную страницу
                </td>
              </tr>
            ) : (
              pages.map(page => (
                <tr key={page.id} style={{ opacity: page.isActive ? 1 : 0.5 }}>
                  {editingId === page.id ? (
                    <>
                      <td>
                        <input className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                      </td>
                      <td>—</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-success" onClick={() => handleUpdate(page.id)}>✓</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{page.title}</td>
                      <td>
                        <a href={page.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--info)', fontSize: 13 }}>{page.url}</a>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{page.description || '—'}</td>
                      <td>
                        <span className={`badge ${page.isActive ? 'badge-deal_closed' : 'badge-rejected'}`}>
                          {page.isActive ? '✅ Активна' : '⏸ Выключена'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn btn-sm btn-outline"
                            onClick={() => { setEditingId(page.id); setEditForm({ title: page.title, url: page.url, description: page.description }); }}>
                            ✏️
                          </button>
                          <button className={`btn btn-sm ${page.isActive ? 'btn-outline' : 'btn-success'}`}
                            onClick={() => handleToggle(page.id, page.isActive)}>
                            {page.isActive ? '⏸' : '▶'}
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(page.id)}>🗑</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

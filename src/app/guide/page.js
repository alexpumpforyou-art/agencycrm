'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GuidePage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) router.replace('/login');
      else setOk(true);
    });
  }, [router]);

  if (!ok) return null;

  return (
    <div style={{ background: '#0b0f1a', minHeight: '100vh', color: '#e6edf3' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Back button */}
        <button onClick={() => router.back()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#8b949e', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14, marginBottom: 32 }}>
          ← Назад в CRM
        </button>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 3, color: '#4f9cff', marginBottom: 12 }}>Агентская система</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, #4f9cff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LOGOSSTUDIO
          </h1>
          <p style={{ fontSize: 20, color: '#8b949e', maxWidth: 500, margin: '0 auto' }}>
            Полное руководство по привлечению клиентов.<br/>Читай, применяй, зарабатывай.
          </p>
        </div>

        {/* Card component helper */}
        {/* Section 1: Главное */}
        <Card emoji="🎯" title="Главное правило">
          <p style={styles.bold}>Ты не продаёшь сайты.</p>
          <p>Ты находишь людей, которым <Accent>нужны клиенты</Accent>. Сайт — это инструмент, который мы даём. Но разговор всегда про деньги и заявки, а не про дизайн и вёрстку.</p>
          <Highlight>Твоя цепочка: найти → зацепить → передать нам → получить %</Highlight>
        </Card>

        {/* Section: Наш продукт */}
        <Card emoji="🚀" title="Что мы предлагаем клиентам">
          <div style={styles.grid}>
            <Stat value="1–2 дня" label="Готовый сайт с момента договора" />
            <Stat value="10–50K ₽" label="Стоимость — ниже рынка" />
          </div>
          <p style={{ marginTop: 16 }}>Мы делаем <Accent>премиальные, современные сайты с красивым дизайном</Accent> — быстро и за доступные деньги. Клиент получает сайт уровня студии за 200k, но платит от 10 до 50 тысяч. Это наше главное оружие.</p>
          <Highlight>Быстро. Красиво. Дёшево. — Это то, что отличает нас от конкурентов и продаёт сильнее любого скрипта.</Highlight>
        </Card>

        {/* Section 2: Как зарабатывают */}
        <Card emoji="💰" title="Как здесь зарабатывают">
          <div style={styles.grid}>
            <Stat value="15%" label="Комиссия со старта" />
            <Stat value="до 25%" label="Рост при хорошем результате" />
          </div>
          <p style={{ marginTop: 16 }}>Стоимость сайта — <Accent>от 10 000 до 50 000 ₽</Accent>. С каждого закрытого клиента ты получаешь 15% от суммы продажи — это от 1 500 до 7 500 ₽ за одну сделку.</p>
          <p>Формула простая: <Accent>деньги = объём действий</Accent>. Чем больше пишешь — тем больше зарабатываешь. Нет потолка.</p>
        </Card>

        {/* Section 3: Психология */}
        <Card emoji="🧠" title="Психология продажи">
          <div style={styles.grid}>
            <div style={styles.badBox}>
              <p style={styles.bad}>❌ «Хотите сайт?»</p>
              <p style={{ fontSize: 13, color: '#8b949e' }}>Никто не просыпается с мыслью «мне нужен сайт». Это абстракция, которая не продаёт.</p>
            </div>
            <div style={styles.goodBox}>
              <p style={styles.good}>✅ «Хотите больше клиентов?»</p>
              <p style={{ fontSize: 13, color: '#8b949e' }}>Все хотят денег и заявки. Ты говоришь на языке выгоды, а не технологий.</p>
            </div>
          </div>
          <Highlight>Запомни: ты продаёшь не продукт, а результат. Не «сайт за 20к», а «система, которая приносит заявки каждый день».</Highlight>
        </Card>

        {/* Section: Channels header */}
        <div style={{ textAlign: 'center', margin: '56px 0 32px' }}>
          <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 3, color: '#4f9cff', marginBottom: 8 }}>Практика</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Каналы привлечения</h2>
          <p style={{ color: '#8b949e', marginTop: 8 }}>Пошаговые скрипты для каждого источника лидов</p>
        </div>

        {/* Channel: 2GIS */}
        <Card emoji="📍" title="2ГИС / Google Карты / Яндекс Карты" badge="Тёплый трафик">
          <p><strong>Кого ищем:</strong> салоны красоты, автосервисы, ремонт квартир, юридические услуги, стоматологии — любой локальный бизнес.</p>
          <p><strong>Наш клиент:</strong> у него либо <Accent>плохой сайт</Accent> (визитка из 2010-х), либо <Accent>нет сайта вообще</Accent> — на карточке только номер телефона.</p>

          <Script label="Первое сообщение">
            Здравствуйте! Увидел вашу карточку в 2ГИС. У вас сайт приносит заявки или больше работает как визитка?
          </Script>
          <Script label="Если ответили">
            Вы довольны количеством клиентов с интернета или хотелось бы больше?
          </Script>
          <Script label="Дожим">
            Обычно можно увеличить поток заявок без увеличения бюджета на рекламу — просто за счёт правильно выстроенного сайта. Хотите, покажу на вашем примере, что можно улучшить?
          </Script>
        </Card>

        {/* Channel: Instagram */}
        <Card emoji="📸" title="Instagram" badge="Большой объём">
          <p><strong>Кого ищем:</strong> экспертов, фрилансеров, мастеров, студии — всех, кто ведёт Инстаграм вместо сайта.</p>

          <Script label="Первое сообщение">
            Классный профиль! Вопрос: вы клиентов только через Instagram привлекаете или есть площадка, куда ведёте из рекламы?
          </Script>
          <Script label="Дожим">
            Инстаграм — это хорошо, но зависеть от одного канала рискованно. Можно собрать систему, которая стабильно даёт заявки независимо от алгоритма. Рассказать?
          </Script>
        </Card>

        {/* Channel: Avito */}
        <Card emoji="📦" title="Авито / Юла / OLX" badge="Входящий поток">
          <p>Здесь ты не пишешь первым — <Accent>клиенты приходят сами</Accent>. Нужно лишь правильно составить объявление.</p>

          <p style={{ fontWeight: 600, color: '#4f9cff', marginTop: 16 }}>Примеры заголовков:</p>
          <ul style={styles.list}>
            <li>Сайт, который приносит клиентов — а не просто висит</li>
            <li>Переделаю сайт и увеличу количество заявок</li>
            <li>Ваш сайт не даёт клиентов? Исправим за 2 недели</li>
          </ul>

          <div style={styles.scriptBox}>
            <p style={styles.scriptLabel}>Текст объявления:</p>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              90% сайтов не приносят клиентов. Проблема не в рекламе — а в самом сайте.<br/><br/>
              Мы делаем сайты, которые реально приводят заявки:<br/>
              — понятная структура и логика продаж<br/>
              — сильный первый экран, который цепляет<br/>
              — адаптация под мобильные<br/><br/>
              Напишите — бесплатно разберём вашу ситуацию и покажем, что можно улучшить.
            </p>
          </div>

          <Script label="Ответ на входящее сообщение">
            Спасибо за интерес! У вас уже есть сайт или нужно делать с нуля? Расскажите в двух словах — чем занимаетесь?
          </Script>
        </Card>

        {/* Channel: Email */}
        <Card emoji="📧" title="Email-рассылка" badge="Массовый охват">
          <p>Собираешь контакты бизнесов с сайтов, 2ГИС, справочников. Отправляешь короткое письмо.</p>
          <div style={styles.scriptBox}>
            <p style={styles.scriptLabel}>Шаблон письма:</p>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              Здравствуйте!<br/><br/>
              Посмотрел ваш сайт — есть несколько точек роста, которые могут увеличить количество заявок без увеличения рекламного бюджета.<br/><br/>
              Мы помогаем бизнесам выстроить понятную воронку на сайте. Если тема актуальна — могу коротко рассказать, что можно улучшить.
            </p>
          </div>
        </Card>

        {/* Dialog example */}
        <Card emoji="💬" title="Пример реального диалога">
          <div style={styles.dialog}>
            <Msg who="Клиент" color="#ff6b6b">Есть сайт, но толку мало</Msg>
            <Msg who="Ты" color="#4f9cff">Он вам даёт заявки или просто висит как визитка?</Msg>
            <Msg who="Клиент" color="#ff6b6b">Ну, поток слабый. В основном через сарафан</Msg>
            <Msg who="Ты" color="#4f9cff">Обычно это значит, что сайт не выстроен под продажи. Можно сильно усилить. Давайте передам нашим специалистам — они посмотрят бесплатно и скажут, что конкретно поменять. Хорошо?</Msg>
          </div>
        </Card>

        {/* Mistakes */}
        <Card emoji="⚡" title="Частые ошибки новичков">
          <div style={styles.grid}>
            <div>
              <p style={styles.bad}>❌ Длинные тексты-простыни</p>
              <p style={styles.bad}>❌ Попытка продать в лоб</p>
              <p style={styles.bad}>❌ Сложные технические термины</p>
              <p style={styles.bad}>❌ Спам одним шаблоном</p>
            </div>
            <div>
              <p style={styles.good}>✅ Коротко, по делу, с уважением</p>
              <p style={styles.good}>✅ Вопросами, а не утверждениями</p>
              <p style={styles.good}>✅ Простой язык без жаргона</p>
              <p style={styles.good}>✅ Адаптируй под контекст</p>
            </div>
          </div>
        </Card>

        {/* Daily targets */}
        <Card emoji="📈" title="Ежедневный план действий">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
            <Stat value="50+" label="Сообщений в день" />
            <Stat value="2–3" label="Канала параллельно" />
            <Stat value="< 30 мин" label="Время ответа лиду" />
          </div>
          <p style={{ marginTop: 16 }}>Утром — собираешь базу контактов. Днём — отправляешь сообщения. Вечером — обрабатываешь ответы. <Accent>Каждый день, без пропусков.</Accent></p>

          <div style={{ marginTop: 20, padding: 20, background: 'rgba(74,222,128,0.06)', borderRadius: 12, border: '1px solid rgba(74,222,128,0.15)' }}>
            <p style={{ fontWeight: 700, color: '#4ade80', fontSize: 16, marginBottom: 12 }}>💵 Расчёт заработка</p>
            <div style={styles.grid}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14 }}>
                <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>📊 Стабильный режим</p>
                <p style={{ fontSize: 14 }}>50 сообщений/день → 10 ответов → <Accent>4 клиента в неделю</Accent></p>
                <p style={{ fontSize: 14 }}>Средний чек 20 000 ₽ × 15% = <strong style={{ color: '#4ade80' }}>3 000 ₽/сделка</strong></p>
                <p style={{ fontSize: 14 }}>В месяц: <strong style={{ color: '#4ade80', fontSize: 18 }}>~50 000 ₽</strong></p>
                <p style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>≈ $550/мес</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14 }}>
                <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>🔥 Режим хищника</p>
                <p style={{ fontSize: 14 }}>50+ сообщений × 3 канала → <Accent>12–14 клиентов в неделю</Accent></p>
                <p style={{ fontSize: 14 }}>Средний чек 35 000 ₽ × 15% = <strong style={{ color: '#4ade80' }}>5 250 ₽/сделка</strong></p>
                <p style={{ fontSize: 14 }}>В месяц: <strong style={{ color: '#4ade80', fontSize: 18 }}>~280 000 ₽</strong></p>
                <p style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>≈ $3 000/мес</p>
              </div>
            </div>
            <Highlight>Разница между 50к и 280к — это не удача, а количество сообщений в день и каналов в работе.</Highlight>
          </div>
        </Card>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '40px 24px', background: 'linear-gradient(135deg, rgba(79,156,255,0.1), rgba(167,139,250,0.1))', borderRadius: 20, border: '1px solid rgba(79,156,255,0.2)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Хватит читать — пора действовать</h2>
          <p style={{ color: '#8b949e', fontSize: 16, marginBottom: 24 }}>Твой первый лид ждёт прямо сейчас. Открой CRM, возьми свою ссылку и начни писать.</p>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'linear-gradient(135deg, #4f9cff, #a78bfa)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 40px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Перейти в CRM →
          </button>
        </div>

      </div>
    </div>
  );
}

// --- Reusable pieces ---

const styles = {
  card: { background: '#121826', borderRadius: 16, padding: '28px 28px 24px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' },
  bold: { fontWeight: 700, fontSize: 18 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  list: { paddingLeft: 20, lineHeight: 2 },
  bad: { color: '#ff6b6b', fontWeight: 600, marginBottom: 6 },
  good: { color: '#4ade80', fontWeight: 600, marginBottom: 6 },
  badBox: { background: 'rgba(255,107,107,0.08)', borderRadius: 12, padding: 16 },
  goodBox: { background: 'rgba(74,222,128,0.08)', borderRadius: 12, padding: 16 },
  scriptBox: { background: 'rgba(79,156,255,0.08)', borderRadius: 12, padding: 16, marginTop: 12 },
  scriptLabel: { fontWeight: 600, color: '#4f9cff', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  dialog: { display: 'flex', flexDirection: 'column', gap: 12 },
};

function Card({ emoji, title, badge, children }) {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{emoji}</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, flex: 1 }}>{title}</h2>
        {badge && <span style={{ fontSize: 12, color: '#4f9cff', background: 'rgba(79,156,255,0.12)', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Accent({ children }) {
  return <span style={{ color: '#4f9cff', fontWeight: 600 }}>{children}</span>;
}

function Highlight({ children }) {
  return (
    <div style={{ marginTop: 16, padding: '14px 18px', background: 'linear-gradient(135deg, rgba(79,156,255,0.12), rgba(167,139,250,0.08))', borderRadius: 12, borderLeft: '3px solid #4f9cff', fontWeight: 600 }}>
      {children}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #4f9cff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Script({ label, children }) {
  return (
    <div style={styles.scriptBox}>
      <p style={styles.scriptLabel}>{label}:</p>
      <p style={{ fontSize: 14, margin: 0, fontStyle: 'italic' }}>«{children}»</p>
    </div>
  );
}

function Msg({ who, color, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontWeight: 700, color, minWidth: 60, fontSize: 14 }}>{who}:</span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </div>
  );
}

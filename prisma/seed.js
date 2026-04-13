const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Создаём администратора
  const adminEmail = 'admin@crm.com';
  const adminPassword = 'admin123';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('✅ Админ уже существует:', adminEmail);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: 'Администратор',
      role: 'ADMIN',
      agentCode: '00001',
      commissionRate: 0,
    },
  });

  console.log('✅ Админ создан!');
  console.log('   Email:', adminEmail);
  console.log('   Пароль:', adminPassword);
  console.log('   ID:', admin.id);
  console.log('');
  console.log('⚠️  ОБЯЗАТЕЛЬНО смените пароль после первого входа!');
}

main()
  .catch(e => { console.error('❌ Ошибка:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

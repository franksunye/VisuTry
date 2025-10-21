import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking admin users...\n');

  try {
    const adminUsers = await prisma.$queryRaw`
      SELECT id, email, name, role 
      FROM "User" 
      WHERE email = 'franksunye@hotmail.com';
    `;
    console.log('Admin users:', adminUsers);

  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


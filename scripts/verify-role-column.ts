import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking if role column exists...\n');

  try {
    // Check if UserRole enum exists
    const enumCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'UserRole'
      ) as exists;
    `;
    console.log('UserRole enum exists:', enumCheck);

    // Check if role column exists in User table
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'role';
    `;
    console.log('\nrole column in User table:', columnCheck);

    // Try to query a user with role
    const user = await prisma.$queryRaw`
      SELECT id, email, role FROM "User" LIMIT 1;
    `;
    console.log('\nSample user with role:', user);

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


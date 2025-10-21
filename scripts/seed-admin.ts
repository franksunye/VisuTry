import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration: Set the email of the user you want to make an admin.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

async function main() {
  console.log(`Searching for user with email: ${ADMIN_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: {
      email: ADMIN_EMAIL,
    },
  });

  if (!user) {
    console.error(`Error: User with email "${ADMIN_EMAIL}" not found.`);
    console.log('Please ensure the user exists in the database before running this script.');
    return;
  }

  if (user.role === UserRole.ADMIN) {
    console.log(`User "${user.name}" (${user.email}) is already an ADMIN.`);
    return;
  }

  console.log(`Updating user "${user.name}" (${user.email}) to ADMIN role...`);

  await prisma.user.update({
    where: {
      email: ADMIN_EMAIL,
    },
    data: {
      role: UserRole.ADMIN,
    },
  });

  console.log('Successfully updated user role to ADMIN.');
}

main()
  .catch((e) => {
    console.error('An error occurred while seeding the admin user:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

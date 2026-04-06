/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@company.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin User",
      password: passwordHash,
    },
    create: {
      email,
      name: "Admin User",
      password: passwordHash,
    },
  });

  console.log("Seeded admin:", email, password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

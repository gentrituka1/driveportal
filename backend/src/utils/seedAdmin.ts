import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function seedAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ role: "ADMIN" }, { email: "admin@driveportal.local" }],
    },
  });

  if (existingAdmin) {
    console.log("Admin already exists.");
    console.log(`email: ${existingAdmin.email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: "admin@driveportal.local",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      role: "ADMIN",
    },
  });

  console.log("Admin user created.");
  console.log("email: admin@driveportal.local");
  console.log("password: Admin123!");
}

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
async function seedAdmin() {
    const existingAdmin = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ role: "ADMIN" }, { email: "admin@driveportal.local" }],
        },
    });
    if (existingAdmin) {
        console.log("Admin already exists.");
        console.log(`email: ${existingAdmin.email}`);
        return;
    }
    await prisma_1.prisma.user.create({
        data: {
            email: "admin@driveportal.local",
            passwordHash: await bcryptjs_1.default.hash("Admin123!", 10),
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
    await prisma_1.prisma.$disconnect();
});

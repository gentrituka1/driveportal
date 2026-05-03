"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
const prisma_1 = require("../lib/prisma");
const tokenService_1 = require("../services/tokenService");
const registerSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(8),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(1),
});
async function register(req, res) {
    if (!env_1.default.allowSelfRegistration) {
        return res.status(403).json({ message: "Self registration is disabled." });
    }
    if (req.body && typeof req.body === "object" && "role" in req.body) {
        return res.status(400).json({ message: "Role field is not allowed in self-registration." });
    }
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const { email, password } = parsed.data;
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existingUser) {
        return res.status(409).json({ message: "Email already exists." });
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash: await bcryptjs_1.default.hash(password, 10),
            role: "USER",
        },
    });
    return res.status(201).json({
        user: { id: user.id, email: user.email, role: user.role },
        token: (0, tokenService_1.signToken)(user),
    });
}
async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const { email, password } = parsed.data;
    const user = await prisma_1.prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
    }
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid credentials." });
    }
    return res.json({
        user: { id: user.id, email: user.email, role: user.role },
        token: (0, tokenService_1.signToken)(user),
    });
}

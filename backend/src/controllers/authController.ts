import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import env from "../config/env";
import { prisma } from "../lib/prisma";
import { signToken } from "../services/tokenService";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  if (!env.allowSelfRegistration) {
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
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "USER",
    },
  });

  return res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role },
    token: signToken(user),
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  return res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token: signToken(user),
  });
}

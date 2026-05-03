import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import env from "../config/env";

type TokenUser = Pick<User, "id" | "email" | "role">;

export function signToken(user: TokenUser) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: "12h",
  });
}

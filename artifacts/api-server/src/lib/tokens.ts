import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function expiryFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

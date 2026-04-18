import crypto from "node:crypto";

export function computeChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
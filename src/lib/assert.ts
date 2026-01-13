// src/lib/assert.ts
export function assertDev(cond: any, msg: string, data?: any) {
  if (process.env.NODE_ENV !== "production" && !cond) {
    console.error("[assertDev]", msg, data ?? "");
  }
}

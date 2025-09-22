// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // reuse client during hot-reloads in development to avoid multiple instances
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // guard so we attach handlers only once
  var __prismaHandlersAttached: boolean | undefined;
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * We purposefully DO NOT enable "query" in the PrismaClient `log` array
 * to avoid Prisma printing queries automatically **AND** printing them again
 * from our custom $on('query') handler (which causes duplicate logs).
 *
 * Instead we enable info/warn/error and attach a custom structured logger
 * for 'query' events only when needed (dev).
 */
const logLevels = isDev ? ["info", "warn", "error"] : ["warn", "error"] as const;

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: logLevels,
  });

// keep singleton in dev
if (isDev) global.prisma = prisma;

/**
 * Use an app-level logger if available (e.g. global.logger = pino())
 * otherwise fallback to console. This keeps the implementation flexible.
 */
const logger = (global as any).logger ?? console;

/** sanitize and truncate param string to avoid huge JS logs or leaking tokens */
function sanitizeParams(rawParams: string) {
  // params comes as a string (Prisma prints them as JSON array string)
  if (!rawParams) return rawParams;
  // try parse -> sanitize -> stringify so we redact/truncate long strings
  try {
    const parsed = JSON.parse(rawParams);
    const sanitized = JSON.parse(
      JSON.stringify(parsed, (_key, value) => {
        if (typeof value === "string") {
          // heuristic: redact values that look like JWTs or very long strings
          if (value.length > 300) return `${value.slice(0, 120)}...[TRUNCATED:${value.length}]`;
          // redact common secrets patterns (bearer tokens) - basic heuristic
          if (/^(eyJ|eyJhbGci)/.test(value)) return "[JWT_REDACTED]";
        }
        return value;
      })
    );
    return JSON.stringify(sanitized);
  } catch {
    // fallback: truncate raw string
    return rawParams.length > 1000 ? `${rawParams.slice(0, 1000)}...[TRUNCATED]` : rawParams;
  }
}

/**
 * Attach handlers only once to avoid duplicate logs across modules/hmr.
 */
if (!global.__prismaHandlersAttached) {
  // query events — structured logging
  prisma.$on("query", (e) => {
    const msg = {
      event: "prisma.query",
      query: e.query,
      params: sanitizeParams(e.params),
      durationMs: e.duration,
    };
    if (typeof logger.info === "function") logger.info(msg);
    else logger.log?.(msg);
  });

  // info/warn/error events from prisma (these come from Prisma's `log` option)
  prisma.$on("info", (e) => {
    const msg = { event: "prisma.info", message: (e as any).message ?? e };
    if (typeof logger.info === "function") logger.info(msg);
    else logger.log?.(msg);
  });

  prisma.$on("warn", (e) => {
    const msg = { event: "prisma.warn", message: (e as any).message ?? e };
    if (typeof logger.warn === "function") logger.warn(msg);
    else logger.log?.(msg);
  });

  prisma.$on("error", (e) => {
    const msg = { event: "prisma.error", message: (e as any).message ?? e, stack: (e as any).stack };
    if (typeof logger.error === "function") logger.error(msg);
    else logger.log?.(msg);
  });

  global.__prismaHandlersAttached = true;
}

export default prisma;

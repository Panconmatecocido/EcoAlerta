import { prisma } from '../config/db';

/**
 * Generates a unique correlative report code in the format REP-YYYY-XXX.
 * Example: REP-2026-001, REP-2026-002, …
 */
export async function generateReportCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REP-${year}-`;

  // Count how many denuncias already have a code starting with this year's prefix
  const count = await prisma.denuncia.count({
    where: {
      codigo: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}${sequence}`;
}

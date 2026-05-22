/**
 * Insight Validation Schemas
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { z } from 'zod';

// Placeholder for future query params (e.g. severity filter).
// Currently the endpoint takes no query, but we expose a schema for symmetry.
export const insightsQuerySchema = z.object({});

export type InsightsQuery = z.infer<typeof insightsQuerySchema>;

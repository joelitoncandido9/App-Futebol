import { z } from 'zod';

export const jogosQuerySchema = z.object({
  liga: z.string().optional(),
});

export const dashboardParamsSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});

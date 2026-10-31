import { z } from 'zod';
import { NotificationStatus, NotificationEventType } from '@prisma/client';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(NotificationStatus).optional(),
  eventType: z.nativeEnum(NotificationEventType).optional(),
  recipientEmail: z.string().email().optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const runJobsSchema = z.object({
  batchSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

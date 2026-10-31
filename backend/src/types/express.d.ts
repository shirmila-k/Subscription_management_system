import { UserRole } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  const session = await requireRole(request, ['admin', 'staff']);
  return ok({
    user_id: session.user_id,
    full_name: session.full_name,
    role: session.role,
  });
});


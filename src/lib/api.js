import { NextResponse } from 'next/server';

export function ok(data, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      console.error('API Error:', err);

      // Explicit HTTP errors (e.g. from requireRole or custom throws)
      if (err.status) {
        return NextResponse.json(
          { ok: false, error: { message: err.message } },
          { status: err.status }
        );
      }

      // PostgreSQL error code mapping
      const code = err.code;

      // 400: Check violation or NOT NULL violation
      if (code === '23514' || code === '23502') {
        return NextResponse.json(
          { ok: false, error: { message: 'Invalid input' } },
          { status: 400 }
        );
      }

      // 409: Unique violation
      if (code === '23505') {
        return NextResponse.json(
          { ok: false, error: { message: `Duplicate value: ${err.constraint}` } },
          { status: 409 }
        );
      }

      // 409: Foreign key violation
      if (code === '23503') {
        return NextResponse.json(
          { ok: false, error: { message: 'Record is in use or does not exist' } },
          { status: 409 }
        );
      }

      // 409: GiST exclusion violation (overlapping bookings - R1)
      if (code === '23P01') {
        return NextResponse.json(
          { ok: false, error: { message: 'Vehicle is already booked for these dates' } },
          { status: 409 }
        );
      }

      // 409: PL/pgSQL RAISE EXCEPTION (P0001) - rules R2-R15
      if (code === 'P0001') {
        return NextResponse.json(
          { ok: false, error: { message: err.message } },
          { status: 409 }
        );
      }

      // 500: Fallback
      return NextResponse.json(
        { ok: false, error: { message: 'Something went wrong' } },
        { status: 500 }
      );
    }
  };
}


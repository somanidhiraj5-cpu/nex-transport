import { NextRequest } from 'next/server';

export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  const expected = process.env.ADMIN_SECRET
    ? Buffer.from(process.env.ADMIN_SECRET).toString('base64')
    : null;
  return Boolean(token && expected && token === expected);
}

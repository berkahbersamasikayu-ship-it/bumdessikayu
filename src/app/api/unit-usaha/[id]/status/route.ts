import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor } from '@/lib/require-editor';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    const { id } = await params;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['Aktif', 'Tidak Aktif'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
    }

    const result = await sql`
      UPDATE unit_usaha SET status = ${status} WHERE id = ${id}
      RETURNING nama
    `;

    if (result.length === 0) {
      return NextResponse.json({ message: 'Unit usaha tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (
        ${session.userId},
        ${status === 'Aktif' ? 'aktifkan_unit_usaha' : 'nonaktifkan_unit_usaha'},
        ${(status === 'Aktif' ? 'Mengaktifkan' : 'Menonaktifkan') + ' unit usaha "' + result[0].nama + '"'}
      )
    `;

    return NextResponse.json({ message: 'Status berhasil diubah.' });
  } catch (error) {
    console.error('Unit usaha status error:', error);
    return NextResponse.json({ message: 'Gagal mengubah status.' }, { status: 500 });
  }
}
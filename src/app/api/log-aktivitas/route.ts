import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET() {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const rows = await sql`
      SELECT 
        TO_CHAR(l.created_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY, HH24:MI') AS created_at,
        u.nama AS user_nama, 
        l.aksi, 
        l.detail
      FROM log_aktivitas l
      JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    const aksiLabel: Record<string, string> = {
      tambah_transaksi: 'Tambah Transaksi',
      edit_transaksi: 'Edit Transaksi',
      tambah_unit_usaha: 'Tambah Unit Usaha',
      aktifkan_unit_usaha: 'Aktifkan Unit Usaha',
      nonaktifkan_unit_usaha: 'Nonaktifkan Unit Usaha',
      tambah_akun: 'Tambah Akun',
      edit_akun: 'Edit Akun',
      reset_password: 'Reset Password',
      aktifkan_akun: 'Aktifkan Akun',
      nonaktifkan_akun: 'Nonaktifkan Akun',
      tambah_penjualan: 'Tambah Penjualan',
      tambah_monitoring_greenhouse: 'Monitoring Greenhouse',
      tambah_monitoring_pakan: 'Monitoring Pakan',
      tambah_monitoring_pertumbuhan: 'Monitoring Pertumbuhan',
      tambah_kolam: 'Tambah Kolam',
      edit_kolam: 'Edit Kolam',
      tambah_monitoring_kualitas: "Monitoring Kualitas"
    };

    return NextResponse.json(
      rows.map((r) => ({
        waktu: new Date(r.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\./g, ':'),
        user: r.user_nama,
        aksi: aksiLabel[r.aksi] || r.aksi,
        detail: r.detail,
      }))
    );
  } catch (error) {
    console.error('Log aktivitas error:', error);
    return NextResponse.json({ message: 'Gagal memuat log aktivitas.' }, { status: 500 });
  }
}
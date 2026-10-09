-- RESET: hapus semua tabel & enum di schema `public`.
-- Jalankan HANYA saat database masih kosong (belum ada data produksi).
-- Setelah ini, jalankan drizzle/0000_slim_amazoness.sql untuk membuat schema lengkap.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

-- ==========================================================================
-- si4care — Least-Privilege DB User Setup
-- Jalankan sekali sebagai root di MariaDB/MySQL sebelum deploy production.
-- ==========================================================================

-- 1. Buat user aplikasi (ganti password sebelum deploy!)
CREATE USER IF NOT EXISTS 'si4care_app'@'localhost'
  IDENTIFIED BY 'GANTI_PASSWORD_INI_SEBELUM_DEPLOY';

-- Untuk staging/production di server terpisah, ganti 'localhost' dengan IP app server:
-- CREATE USER IF NOT EXISTS 'si4care_app'@'10.0.0.5'  IDENTIFIED BY '...';

-- 2. Berikan hak minimum yang dibutuhkan aplikasi:
--    SELECT, INSERT, UPDATE, DELETE  → operasi CRUD normal
--    CREATE, DROP, ALTER             → hanya saat migration (cabut setelah migration selesai)
--    INDEX                           → Drizzle push/migrate membuat index
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES
  ON db_toko_si4care.*
  TO 'si4care_app'@'localhost';

-- 3. Terapkan perubahan hak akses
FLUSH PRIVILEGES;

-- ==========================================================================
-- Setelah migration selesai, cabut hak DDL (CREATE/DROP/ALTER/INDEX):
-- ==========================================================================
-- REVOKE CREATE, DROP, ALTER, INDEX, REFERENCES
--   ON db_toko_si4care.*
--   FROM 'si4care_app'@'localhost';
-- FLUSH PRIVILEGES;
-- ==========================================================================

-- Verifikasi:
-- SHOW GRANTS FOR 'si4care_app'@'localhost';

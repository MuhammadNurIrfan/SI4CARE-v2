-- Jalankan di XAMPP phpMyAdmin atau mysql client
-- mysql -u root -h 127.0.0.1 -P 3307 db_toko_si4care < docs/sql/chat-migration.sql

CREATE TABLE IF NOT EXISTS chat_threads (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  customer_id  VARCHAR(36)  NOT NULL,
  status       ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_threads_customer
    FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  thread_id  VARCHAR(36)  NOT NULL,
  sender_id  VARCHAR(36)  NOT NULL,
  body       TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_thread
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_sender
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
);

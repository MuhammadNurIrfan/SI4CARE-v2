// Tabel auth (user/session/account/verification) di-generate oleh Better Auth CLI:
//   npx @better-auth/cli generate --config src/lib/auth/index.ts --output src/lib/db/auth-schema.ts
// Jangan edit auth-schema.ts manual — regenerate ulang kalau konfigurasi auth berubah.
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  json,
  pgEnum,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

// ─── PostgreSQL Enum Types ───────────────────────────────────────────────────

export const stockModeEnum = pgEnum("stock_mode", ["fifo", "fefo"]);
export const voucherTypeEnum = pgEnum("voucher_type", ["percent", "fixed"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const outboundChannelEnum = pgEnum("outbound_channel", ["pos", "marketplace"]);
export const outboundStatusEnum = pgEnum("outbound_status", ["completed", "pending_settlement", "cancelled"]);
export const ledgerChannelEnum = pgEnum("ledger_channel", ["pos", "web", "marketplace"]);
export const articleStatusEnum = pgEnum("article_status", ["draft", "terbit", "terjadwal"]);
export const stockOpnameStatusEnum = pgEnum("stock_opname_status", ["open", "selesai"]);
export const returnReasonEnum = pgEnum("return_reason", ["rusak", "tidak_sesuai", "kurang", "expired", "lainnya"]);
export const returnStatusEnum = pgEnum("return_status", ["pending", "inspeksi", "layak_jual", "write_off", "ditolak"]);
export const chatStatusEnum = pgEnum("chat_status", ["open", "closed"]);

// ─── Alamat pengiriman ───────────────────────────────────────────────────────

export const addresses = pgTable("addresses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));

// ─── Katalog: kategori → produk → varian → batch ────────────────────────────

export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  /** URL relatif (/uploads/...) atau URL cloud. null = belum ada foto. */
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  categoryId: varchar("category_id", { length: 36 }).references(
    () => categories.id,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  description: text("description"),
  /** URL foto utama produk — /uploads/... (lokal) atau https://... (R2/S3). null = belum ada foto. */
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const variants = pgTable("variants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }),
  /** Atribut dinamis, mis: {"warna":"Merah","ukuran":"L"} */
  attributes: json("attributes").$type<Record<string, string>>(),
  activePrice: decimal("active_price", { precision: 15, scale: 2 }).notNull(),
  minStock: integer("min_stock").default(5).notNull(),
  /** FIFO (default) atau FEFO (untuk produk dengan tanggal kadaluarsa) */
  stockMode: stockModeEnum("stock_mode").default("fifo").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const batches = pgTable("batches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  variantId: varchar("variant_id", { length: 36 })
    .notNull()
    .references(() => variants.id, { onDelete: "cascade" }),
  batchNumber: varchar("batch_number", { length: 100 }),
  /** Harga pokok pembelian per unit, snapshot saat inbound */
  hpp: decimal("hpp", { precision: 15, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  remaining: integer("remaining").notNull(),
  expiredDate: date("expired_date", { mode: "string" }),
  supplier: varchar("supplier", { length: 255 }),
  receivedAt: timestamp("received_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Voucher / promo code ─────────────────────────────────────────────────────

export const vouchers = pgTable("vouchers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: voucherTypeEnum().notNull(),
  /** Nilai diskon: persen (0–100) atau nominal Rupiah */
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  /** Minimum subtotal agar voucher berlaku */
  minOrder: decimal("min_order", { precision: 15, scale: 2 }),
  /** Maksimum potongan (untuk type percent) */
  maxDiscount: decimal("max_discount", { precision: 15, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Keranjang belanja (per user, persisten) ──────────────────────────────────

export const cartItems = pgTable(
  "cart_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 36 })
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    addedAt: timestamp("added_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("uq_cart_user_variant").on(t.userId, t.variantId)],
);

// ─── Pesanan ──────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 }).default("main").notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  status: orderStatusEnum()
    .default("pending_payment")
    .notNull(),
  /** Snapshot alamat saat order dibuat — tidak berubah walau user edit alamat */
  snapAddress: json("snap_address")
    .$type<{ name: string; phone: string; address: string; city: string }>()
    .notNull(),
  courier: varchar("courier", { length: 50 }),
  courierService: varchar("courier_service", { length: 50 }),
  shippingCost: decimal("shipping_cost", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  ppn: decimal("ppn", { precision: 15, scale: 2 }).default("0").notNull(),
  serviceFee: decimal("service_fee", { precision: 15, scale: 2 }).default("4500").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  voucherId: varchar("voucher_id", { length: 36 }).references(() => vouchers.id, {
    onDelete: "set null",
  }),
  /** ID pesanan yang dikirim ke Midtrans (format: SI4-{uuid pendek}) */
  midtransOrderId: varchar("midtrans_order_id", { length: 100 }).unique(),
  /** Snap token dari Midtrans — dipakai client untuk buka popup */
  midtransToken: varchar("midtrans_token", { length: 500 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id", { length: 36 }).references(() => variants.id, {
    onDelete: "set null",
  }),
  /** Snapshot nama & SKU saat order — tidak berubah walau produk diedit/dihapus */
  productName: varchar("product_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  /** Alokasi FIFO/FEFO: [{ batchId, qty, hpp }] — dicatat untuk laporan COGS */
  batchAllocations: json("batch_allocations")
    .$type<{ batchId: string; qty: number; hpp: number }[]>(),
});

// ─── POS: Transaksi keluar (kasir toko + marketplace) ────────────────────────

export const outboundTransactions = pgTable("outbound_transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 }).default("main").notNull(),
  channel: outboundChannelEnum().notNull(),
  refNumber: varchar("ref_number", { length: 100 }).notNull(),
  // Marketplace-only
  platform: varchar("platform", { length: 50 }),
  platformOrderId: varchar("platform_order_id", { length: 100 }),
  customerName: varchar("customer_name", { length: 255 }),
  // POS-only
  paymentMethod: varchar("payment_method", { length: 50 }),
  cashReceived: decimal("cash_received", { precision: 15, scale: 2 }),
  // Ringkasan keuangan
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  itemDiscountTotal: decimal("item_discount_total", { precision: 15, scale: 2 }).default("0").notNull(),
  cartDiscountAmount: decimal("cart_discount_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  totalDiscount: decimal("total_discount", { precision: 15, scale: 2 }).default("0").notNull(),
  dpp: decimal("dpp", { precision: 15, scale: 2 }).default("0").notNull(),
  ppn: decimal("ppn", { precision: 15, scale: 2 }).default("0").notNull(),
  mdrAmount: decimal("mdr_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  totalHpp: decimal("total_hpp", { precision: 15, scale: 2 }).notNull(),
  /** Biaya marketplace (JSON) — null untuk channel=pos */
  marketplaceFees: json("marketplace_fees").$type<{
    platformFee: number;
    mdrAmount: number;
    serviceFee: number;
    shippingReceived: number;
    shippingSubsidy: number;
    shippingPaid: number;
    voucherPlatform: number;
    customFees: Array<{ name: string; kind: "pct" | "rp"; value: number; sign: "minus" | "plus"; nominal: number }>;
  }>(),
  status: outboundStatusEnum().default("completed").notNull(),
  settledAt: timestamp("settled_at"),
  /** Dana yang benar-benar masuk rekening saat marketplace settlement */
  settledAmount: decimal("settled_amount", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdBy: varchar("created_by", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
});

export const outboundItems = pgTable("outbound_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  transactionId: varchar("transaction_id", { length: 36 })
    .notNull()
    .references(() => outboundTransactions.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id", { length: 36 }).references(() => variants.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  unitHpp: decimal("unit_hpp", { precision: 15, scale: 2 }).notNull(),
  itemDiscountAmount: decimal("item_discount_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  batchAllocations: json("batch_allocations").$type<{ batchId: string; qty: number; hpp: number }[]>(),
});

// ─── Ledger (ringkasan keuangan per transaksi, semua channel) ─────────────────

export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  branchId: varchar("branch_id", { length: 36 }).default("main").notNull(),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  channel: ledgerChannelEnum().notNull(),
  referenceId: varchar("reference_id", { length: 36 }).notNull(),
  refNumber: varchar("ref_number", { length: 100 }).notNull(),
  totalSales: decimal("total_sales", { precision: 15, scale: 2 }).notNull(),
  totalHpp: decimal("total_hpp", { precision: 15, scale: 2 }).notNull(),
  grossMargin: decimal("gross_margin", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── App Settings (konfigurasi global: subsidi ongkir, diskon berjenjang) ────

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── Cabang / Branch ─────────────────────────────────────────────────────────

export const branches = pgTable("branches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Artikel / Blog ───────────────────────────────────────────────────────────

export const articles = pgTable("articles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default("Edukasi"),
  excerpt: text("excerpt"),
  body: text("body"),
  coverImage: varchar("cover_image", { length: 500 }),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  schemaType: varchar("schema_type", { length: 50 }).default("Article"),
  status: articleStatusEnum().default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  authorId: varchar("author_id", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()).notNull(),
});

// ─── Stock Opname ─────────────────────────────────────────────────────────────

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionNo: varchar("session_no", { length: 50 }).notNull().unique(),
  branchId: varchar("branch_id", { length: 36 }).default("main").notNull(),
  conductedBy: varchar("conducted_by", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
  status: stockOpnameStatusEnum().default("open").notNull(),
  notes: text("notes"),
  conductedAt: timestamp("conducted_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  closedAt: timestamp("closed_at"),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("session_id", { length: 36 })
    .notNull()
    .references(() => stockOpnameSessions.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id", { length: 36 }).references(() => variants.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  lokasi: varchar("lokasi", { length: 100 }),
  systemStock: integer("system_stock").default(0).notNull(),
  physicalStock: integer("physical_stock"),
  adjustmentDelta: integer("adjustment_delta"),
  hpp: decimal("hpp", { precision: 15, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
});

// ─── Retur pelanggan ──────────────────────────────────────────────────────────

export const returns = pgTable("returns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).references(() => orders.id, { onDelete: "set null" }),
  userId: varchar("user_id", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
  reason: returnReasonEnum().notNull(),
  detail: text("detail"),
  photos: json("photos").$type<string[]>(),
  status: returnStatusEnum()
    .default("pending")
    .notNull(),
  inspectionNotes: text("inspection_notes"),
  adminId: varchar("admin_id", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── Chat ────────────────────────────────────────────────────────────────────

export const chatThreads = pgTable("chat_threads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerId: varchar("customer_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: chatStatusEnum().default("open").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  threadId: varchar("thread_id", { length: 36 })
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── CMS Konten (Landing page sections) ──────────────────────────────────────

export const contentSections = pgTable("content_sections", {
  key: varchar("key", { length: 100 }).primaryKey(),
  /** JSON: hero, testimonials, faq, cta, sections (visibility flags) */
  data: json("data").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── Relasi ──────────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  batches: many(batches),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  outboundItems: many(outboundItems),
}));

export const batchesRelations = relations(batches, ({ one }) => ({
  variant: one(variants, {
    fields: [batches.variantId],
    references: [variants.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(user, { fields: [cartItems.userId], references: [user.id] }),
  variant: one(variants, { fields: [cartItems.variantId], references: [variants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  voucher: one(vouchers, { fields: [orders.voucherId], references: [vouchers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(variants, { fields: [orderItems.variantId], references: [variants.id] }),
}));

export const outboundTransactionsRelations = relations(outboundTransactions, ({ one, many }) => ({
  createdByUser: one(user, { fields: [outboundTransactions.createdBy], references: [user.id] }),
  items: many(outboundItems),
}));

export const outboundItemsRelations = relations(outboundItems, ({ one }) => ({
  transaction: one(outboundTransactions, { fields: [outboundItems.transactionId], references: [outboundTransactions.id] }),
  variant: one(variants, { fields: [outboundItems.variantId], references: [variants.id] }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
  user: one(user, { fields: [returns.userId], references: [user.id] }),
  admin: one(user, { fields: [returns.adminId], references: [user.id] }),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(user, { fields: [articles.authorId], references: [user.id] }),
}));

export const stockOpnameSessionsRelations = relations(stockOpnameSessions, ({ one, many }) => ({
  conductedByUser: one(user, { fields: [stockOpnameSessions.conductedBy], references: [user.id] }),
  items: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
  session: one(stockOpnameSessions, { fields: [stockOpnameItems.sessionId], references: [stockOpnameSessions.id] }),
  variant: one(variants, { fields: [stockOpnameItems.variantId], references: [variants.id] }),
}));

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 100 }),
  detail: json("detail"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, { fields: [auditLogs.userId], references: [user.id] }),
}));

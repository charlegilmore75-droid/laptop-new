-- ============================================================
-- LaptopStore — Complete Database Schema
-- Compatible with: PostgreSQL 14+, Neon, Supabase, Railway
-- Run this once to create all tables from scratch
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'OUT_OF_STOCK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTopupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'SEEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name            TEXT,
  email           TEXT        UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  "passwordHash"  TEXT,
  phone           TEXT,
  address         TEXT,
  avatar          TEXT,
  role            "Role"      NOT NULL DEFAULT 'USER',
  "isBanned"      BOOLEAN     NOT NULL DEFAULT FALSE,
  language        TEXT        NOT NULL DEFAULT 'ar',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OTP CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON otp_codes(email);

-- ============================================================
-- PASSWORD RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "nameAr"    TEXT        NOT NULL,
  "nameEn"    TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  image       TEXT,
  description TEXT,
  "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "sortOrder" INT         NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "nameAr"        TEXT        NOT NULL,
  "nameEn"        TEXT        NOT NULL,
  "descriptionAr" TEXT,
  "descriptionEn" TEXT,
  price           DOUBLE PRECISION NOT NULL,
  "discountPrice" DOUBLE PRECISION,
  stock           INT         NOT NULL DEFAULT 0,
  images          TEXT[]      NOT NULL DEFAULT '{}',
  thumbnail       TEXT,
  "categoryId"    TEXT        NOT NULL REFERENCES categories(id),
  brand           TEXT,
  model           TEXT,
  "specsAr"       JSONB,
  "specsEn"       JSONB,
  "isFeatured"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "isActive"      BOOLEAN     NOT NULL DEFAULT TRUE,
  slug            TEXT        UNIQUE NOT NULL,
  sku             TEXT        UNIQUE,
  weight          DOUBLE PRECISION,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products("categoryId");
CREATE INDEX IF NOT EXISTS products_active_idx   ON products("isActive");
CREATE INDEX IF NOT EXISTS products_featured_idx ON products("isFeatured");

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  code            TEXT        UNIQUE NOT NULL,
  "discountType"  TEXT        NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "minOrderValue" DOUBLE PRECISION,
  "maxUses"       INT,
  "usedCount"     INT         NOT NULL DEFAULT 0,
  "expiresAt"     TIMESTAMPTZ,
  "isActive"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COUPON USAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "couponId"  TEXT        NOT NULL REFERENCES coupons(id),
  "userId"    TEXT        NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("couponId", "userId")
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"          TEXT          NOT NULL REFERENCES users(id),
  "fullName"        TEXT          NOT NULL,
  phone             TEXT          NOT NULL,
  address           TEXT          NOT NULL,
  "shippingBranch"  TEXT,
  status            "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalAmount"     DOUBLE PRECISION NOT NULL,
  "paidFromWallet"  BOOLEAN       NOT NULL DEFAULT FALSE,
  "walletAmountUsed" DOUBLE PRECISION,
  "couponId"        TEXT          REFERENCES coupons(id),
  "discountAmount"  DOUBLE PRECISION,
  notes             TEXT,
  "createdAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_idx   ON orders("userId");
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "orderId"   TEXT             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId" TEXT             NOT NULL REFERENCES products(id),
  quantity    INT              NOT NULL,
  price       DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items("orderId");

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id          TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT             UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN          NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "walletId"    TEXT             NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount        DOUBLE PRECISION NOT NULL,
  type          TEXT             NOT NULL,
  description   TEXT,
  "referenceId" TEXT,
  "createdAt"   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_tx_wallet_idx ON wallet_transactions("walletId");

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "nameAr"      TEXT        NOT NULL,
  "nameEn"      TEXT        NOT NULL,
  description   TEXT,
  "accountInfo" TEXT,
  logo          TEXT,
  "isActive"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "sortOrder"   INT         NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WALLET TOPUP REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_topup_requests (
  id                TEXT                 PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"          TEXT                 NOT NULL REFERENCES users(id),
  "paymentMethodId" TEXT                 NOT NULL REFERENCES payment_methods(id),
  amount            DOUBLE PRECISION     NOT NULL,
  "transactionRef"  TEXT,
  "receiptImage"    TEXT,
  status            "WalletTopupStatus"  NOT NULL DEFAULT 'PENDING',
  "adminNote"       TEXT,
  "approvedAmount"  DOUBLE PRECISION,
  "createdAt"       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS topup_user_idx   ON wallet_topup_requests("userId");
CREATE INDEX IF NOT EXISTS topup_status_idx ON wallet_topup_requests(status);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId"  TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating       INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  "isApproved" BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews("productId");

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

-- ============================================================
-- COMPARE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS compare_items (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

-- ============================================================
-- CONVERSATIONS (Support Chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"        TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "lastMessage"   TEXT,
  "lastMessageAt" TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations("userId");

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id               TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "conversationId" TEXT            NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId"       TEXT            NOT NULL REFERENCES users(id),
  content          TEXT,
  "imageUrl"       TEXT,
  status           "MessageStatus" NOT NULL DEFAULT 'SENT',
  "isFromAdmin"    BOOLEAN         NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages("conversationId");

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "titleAr"   TEXT        NOT NULL,
  "titleEn"   TEXT        NOT NULL,
  "bodyAr"    TEXT,
  "bodyEn"    TEXT,
  link        TEXT,
  "isRead"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx  ON notifications("userId");
CREATE INDEX IF NOT EXISTS notifications_read_idx  ON notifications("isRead");

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "titleAr"    TEXT,
  "titleEn"    TEXT,
  "subtitleAr" TEXT,
  "subtitleEn" TEXT,
  image        TEXT        NOT NULL,
  link         TEXT,
  "isActive"   BOOLEAN     NOT NULL DEFAULT TRUE,
  "sortOrder"  INT         NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key         TEXT        UNIQUE NOT NULL,
  value       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEFAULT SITE SETTINGS
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('siteName',          'LaptopStore'),
  ('siteLogo',          ''),
  ('otpEnabled',        'true'),
  ('walletEnabled',     'true'),
  ('maintenanceMode',   'false'),
  ('reviewsEnabled',    'true'),
  ('couponEnabled',     'true'),
  ('contactEmail',      ''),
  ('contactPhone',      ''),
  ('address',           ''),
  ('facebook',          ''),
  ('instagram',         ''),
  ('twitter',           ''),
  ('whatsapp',          '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- DEFAULT PAYMENT METHODS
-- ============================================================
INSERT INTO payment_methods (id, "nameAr", "nameEn", description, "accountInfo", "isActive", "sortOrder") VALUES
  (gen_random_uuid()::TEXT, 'شام كاش', 'Sham Cash',
   'تحويل عبر شام كاش',
   E'رقم الحساب: 0991234567\nاسم الحساب: متجر اللابتوب',
   TRUE, 1),
  (gen_random_uuid()::TEXT, 'سيريتل كاش', 'Syriatel Cash',
   'تحويل عبر سيريتل كاش',
   E'رقم الحساب: 0931234567\nاسم الحساب: متجر اللابتوب',
   TRUE, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEFAULT ADMIN USER
-- Password: Admin@123456 (bcrypt hash)
-- IMPORTANT: Change this immediately after first login!
-- ============================================================
INSERT INTO users (id, name, email, "passwordHash", "emailVerified", role)
VALUES (
  gen_random_uuid()::TEXT,
  'Admin',
  'admin@laptopstore.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeqR0Y3V/OA7Fh4XO',
  NOW(),
  'SUPER_ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DEFAULT CATEGORY
-- ============================================================
INSERT INTO categories (id, "nameAr", "nameEn", slug, "isActive", "sortOrder") VALUES
  (gen_random_uuid()::TEXT, 'لابتوبات', 'Laptops', 'laptops', TRUE, 1),
  (gen_random_uuid()::TEXT, 'أجهزة مكتبية', 'Desktops', 'desktops', TRUE, 2),
  (gen_random_uuid()::TEXT, 'إكسسوارات', 'Accessories', 'accessories', TRUE, 3),
  (gen_random_uuid()::TEXT, 'شاشات', 'Monitors', 'monitors', TRUE, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TRIGGERS: auto-update "updatedAt"
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','categories','products','orders','wallets',
    'wallet_topup_requests','payment_methods','reviews',
    'conversations','banners','site_settings'
  ]) LOOP
    EXECUTE FORMAT('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
      CREATE TRIGGER trg_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================
-- Done! All tables created.
-- Next steps:
-- 1. Set DATABASE_URL in your .env file
-- 2. Run: npx prisma db push   (or use this SQL directly)
-- 3. Run: npm run prisma:seed  (optional demo data)
-- 4. Login with: admin@laptopstore.com / Admin@123456
-- ============================================================

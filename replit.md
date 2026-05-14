# LaptopStore

متجر إلكتروني شامل لبيع اللابتوبات وإكسسوارات الحاسب، يدعم اللغتين العربية والإنجليزية مع RTL كامل.

## Run & Operate

- `cd laptop && npm run dev` — run the dev server (port 3000)
- `cd laptop && npx prisma db push` — push DB schema changes
- `cd laptop && npx prisma generate` — regenerate Prisma client
- `cd laptop && npx prisma db seed` — seed sample data
- `cd laptop && npm run build` — build for production

## Stack

- **Framework**: Next.js 14 App Router + TypeScript
- **Auth**: NextAuth v4 (JWT + credentials) with OTP via Brevo SMTP
- **Database**: PostgreSQL + Prisma v5
- **Styling**: Tailwind CSS + Framer Motion
- **i18n**: next-intl v3 (Arabic RTL default, English)
- **Uploads**: Cloudinary (images, logos, banners)
- **State**: Zustand (cart), React Query (server state)

## Where things live

```
laptop/
├── src/
│   ├── app/
│   │   ├── [locale]/            # All pages (ar, en)
│   │   │   ├── auth/            # Login, Register (multi-step OTP), Verify, Reset
│   │   │   ├── products/        # Catalog with filters, offers, search
│   │   │   ├── product/[slug]/  # Product detail + reviews
│   │   │   ├── cart/            # Shopping cart
│   │   │   ├── checkout/        # Order checkout
│   │   │   ├── orders/          # User order history
│   │   │   ├── wallet/          # Wallet + topup (3-step flow)
│   │   │   ├── wishlist/        # Saved products
│   │   │   ├── compare/         # Product comparison
│   │   │   ├── support/         # Real-time chat
│   │   │   ├── notifications/   # User notifications
│   │   │   └── admin/           # Admin panel
│   │   └── api/                 # API routes
│   ├── components/              # Reusable components
│   ├── lib/                     # Utilities (auth, db, mailer, store)
│   └── messages/                # i18n translation files (ar.json, en.json)
├── prisma/
│   └── schema.prisma            # Database schema (source of truth)
├── database.sql                 # Raw SQL for manual DB setup
├── railway.json                 # Railway deployment config
└── .env.example                 # Required environment variables
```

## Environment Variables (Required)

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=random-32-char-secret
NEXTAUTH_URL=https://your-domain.com

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=ab2202001@smtp-brevo.com
SMTP_PASSWORD=your-brevo-smtp-password
SMTP_FROM=LaptopStore <noreply@yourdomain.com>

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Architecture decisions

- **Locale routing**: Arabic (`/ar`) as default with RTL, English (`/en`) as secondary
- **Auth flow**: OTP sent via Brevo SMTP (fire-and-forget, non-blocking). Admin can disable OTP → direct email+password registration
- **Wallet topup**: 3-step modal — select payment method → show copyable account info → confirm amount + reference
- **Admin wallet**: Approves topup requests with custom approved amount (can differ from requested)
- **Image uploads**: All images (products, banners, logos) upload via `/api/upload` → Cloudinary CDN
- **Products API**: Supports `offers=true` param to filter `discountPrice IS NOT NULL`
- **Register**: Single-page multi-step form (no redirect) — checks `otpEnabled` setting to determine flow

## Admin Panel Features

- `/admin/products` — CRUD with multi-image Cloudinary upload, thumbnail picker
- `/admin/banners` — File upload (not URL), Cloudinary
- `/admin/orders` — Order management, status updates
- `/admin/users` — Ban/unban, wallet balance add/subtract/set
- `/admin/wallet` — Topup request approval with custom approved amount
- `/admin/chat` — Real-time support chat with users
- `/admin/coupons` — Coupon management
- `/admin/categories` — Category management
- `/admin/settings` — Site name, logo upload, OTP toggle, wallet toggle, social links

## Product

- Public-facing store in Arabic (RTL) and English
- Product catalog with search, filters (category, brand, price, offers, in-stock)
- Product detail with specs, images, reviews & ratings
- Shopping cart with wallet balance option at checkout
- Order placement and order history
- Wallet system: topup via payment methods, check balance, transaction history
- Wishlist, product comparison (up to 4 products)
- Real-time support chat
- Push notifications (in-app)

## User preferences

- Project is a standalone Next.js app in `laptop/` directory, NOT a Replit artifact
- Ready for Railway deployment (`railway.json` included)
- Arabic RTL is the default language

## Gotchas

- Always run `npx prisma generate` after schema changes
- The `database.sql` file can be used to set up DB manually (Railway PostgreSQL, Supabase, Neon)
- Admin default credentials: `admin@laptopstore.com` / `Admin@123456` — change immediately!
- Cloudinary must be configured for image uploads to work
- SMTP (Brevo) must be configured for OTP emails; OTP can be disabled in admin settings
- `otpEnabled` setting in DB controls registration flow (default: true)

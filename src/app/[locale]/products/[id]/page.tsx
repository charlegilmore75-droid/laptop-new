import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
  }).catch(() => null);

  if (!product) return {};

  return {
    title: params.locale === 'ar' ? product.nameAr : product.nameEn,
    description:
      params.locale === 'ar'
        ? product.descriptionAr ?? ''
        : product.descriptionEn ?? '',
  };
}

async function getProduct(id: string) {
  return prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { reviews: true } },
    },
  });
}

async function getRelated(categoryId: string, excludeId: string) {
  return prisma.product.findMany({
    where: { categoryId, isActive: true, id: { not: excludeId } },
    take: 4,
    include: {
      category: true,
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id).catch(() => null);
  if (!product) notFound();

  const related = await getRelated(product.categoryId, product.id).catch(() => []);

  const avgRating = product.reviews.length
    ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
    : 0;

  // ✅ تنظيف وتحويل البيانات بدون TypeScript conflicts
  const serializedProduct = {
    ...product,
    avgRating,
    specsAr: product.specsAr as Record<string, string> | null,
    specsEn: product.specsEn as Record<string, string> | null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: {
      ...product.category,
      createdAt: product.category.createdAt.toISOString(),
      updatedAt: product.category.updatedAt.toISOString(),
    },
    reviews: product.reviews.map((r) => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  isApproved: r.isApproved,

  userId: r.userId,
  productId: r.productId,

  user: {
    name: r.user?.name ?? undefined,
    avatar: r.user?.avatar ?? undefined,
  },

  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
})),
  };

 const serializedRelated = related.map((r) => ({
  ...r,

  avgRating: r.reviews.length
    ? r.reviews.reduce((a, rv) => a + rv.rating, 0) / r.reviews.length
    : 0,

  specsAr: r.specsAr as Record<string, string> | null,
  specsEn: r.specsEn as Record<string, string> | null,

  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),

  category: {
    ...r.category,
    createdAt: r.category.createdAt.toISOString(),
    updatedAt: r.category.updatedAt.toISOString(),
  },

  reviews: r.reviews.map((rv) => ({
    id: crypto.randomUUID(),
    rating: rv.rating,

    comment: null,
    isApproved: true,

    userId: '',
    productId: r.id,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
}));

  return (
    <>
      <Navbar />

      <main className="container mx-auto px-4 py-10 min-h-screen">
        <ProductDetailClient
          product={serializedProduct}
          related={serializedRelated}
          locale={params.locale}
        />
      </main>

      <Footer />
    </>
  );
}

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function createShareLink(itineraryId: string, userId: string) {
  // Verify ownership
  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, userId },
  });
  if (!itinerary) throw new Error('行程不存在');

  const token = nanoid(12);
  const link = await prisma.shareLink.create({
    data: { token, itineraryId },
  });
  return { token: link.token };
}

export async function getSharedItinerary(token: string) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      itinerary: {
        include: {
          days: {
            include: { items: { orderBy: { orderIndex: 'asc' } } },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  });
  if (!link) throw new Error('分享链接无效');
  return link.itinerary;
}

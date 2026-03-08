import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { planRoute, searchPOI, batchGeocode } from '../services/amap.service';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Get my itineraries
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itineraries = await prisma.itinerary.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { days: { select: { id: true, dayNumber: true, theme: true } } },
    });
    res.json(itineraries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get itinerary detail
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        days: {
          include: { items: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!itinerary) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }
    res.json(itinerary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update itinerary
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await prisma.itinerary.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { title: req.body.title, status: req.body.status },
    });
    if (itinerary.count === 0) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete itinerary
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.itinerary.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch update day items (reorder / update)
router.put('/:id/days/:dayId/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!itinerary) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }

    const items = req.body.items as Array<{
      id: string;
      name?: string;
      address?: string;
      description?: string;
      orderIndex: number;
      type?: string;
      estimatedMinutes?: number;
      lat?: number | null;
      lng?: number | null;
    }>;

    for (const item of items) {
      await prisma.dayItem.update({
        where: { id: item.id },
        data: {
          orderIndex: item.orderIndex,
          ...(item.name && { name: item.name }),
          ...(item.address !== undefined && { address: item.address }),
          ...(item.description !== undefined && { description: item.description }),
          ...(item.type && { type: item.type }),
          ...(item.estimatedMinutes !== undefined && { estimatedMinutes: item.estimatedMinutes }),
          ...(item.lat !== undefined && { lat: item.lat }),
          ...(item.lng !== undefined && { lng: item.lng }),
        },
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to a day
const addItemSchema = z.object({
  type: z.string(),
  name: z.string(),
  address: z.string().default(''),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  description: z.string().default(''),
  estimatedMinutes: z.number().default(60),
});

router.post('/:id/days/:dayId/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!itinerary) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }

    const data = addItemSchema.parse(req.body);

    // Auto-geocode if no coordinates provided
    if (data.lat == null || data.lng == null) {
      const destinations = JSON.parse(itinerary.destinations) as string[];
      const city = destinations[0] || undefined;
      const geoResults = await batchGeocode([{ name: data.name, address: data.address || '', city }]);
      const geo = geoResults.get(data.name);
      if (geo) {
        data.lat = geo.lat;
        data.lng = geo.lng;
        if (!data.address && geo.address) data.address = geo.address;
      }
    }

    // Get max orderIndex
    const maxItem = await prisma.dayItem.findFirst({
      where: { dayId: req.params.dayId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = (maxItem?.orderIndex ?? -1) + 1;

    const item = await prisma.dayItem.create({
      data: {
        dayId: req.params.dayId,
        ...data,
        orderIndex,
      },
    });

    res.json(item);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete item
router.delete('/:id/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!itinerary) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }

    await prisma.dayItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-geocode items with missing coordinates
router.post('/:id/regeocode', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itineraryId = req.params.id as string;
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: itineraryId, userId: req.user!.userId },
      include: {
        days: {
          include: { items: true },
        },
      },
    });
    if (!itinerary) {
      res.status(404).json({ error: '行程不存在' });
      return;
    }

    const destinations = JSON.parse(itinerary.destinations) as string[];
    const city = destinations[0] || undefined;
    let updatedCount = 0;

    for (const day of itinerary.days) {
      // Collect items and hotel that need geocoding
      const itemsToGeocode: Array<{ id: string; name: string; address: string; isHotel?: boolean }> = [];

      if (day.hotelName && (day.hotelLat == null || day.hotelLng == null)) {
        itemsToGeocode.push({ id: day.id, name: day.hotelName, address: day.hotelAddress || '', isHotel: true });
      }

      for (const item of day.items) {
        if (item.lat == null || item.lng == null) {
          itemsToGeocode.push({ id: item.id, name: item.name, address: item.address || '' });
        }
      }

      if (itemsToGeocode.length === 0) continue;

      const geoResults = await batchGeocode(
        itemsToGeocode.map(i => ({ name: i.name, address: i.address, city }))
      );

      for (const item of itemsToGeocode) {
        const geo = geoResults.get(item.name);
        if (!geo) continue;

        if (item.isHotel) {
          await prisma.itineraryDay.update({
            where: { id: item.id },
            data: { hotelLat: geo.lat, hotelLng: geo.lng },
          });
        } else {
          await prisma.dayItem.update({
            where: { id: item.id },
            data: {
              lat: geo.lat,
              lng: geo.lng,
              ...((!item.address && geo.address) ? { address: geo.address } : {}),
            },
          });
        }
        updatedCount++;
      }
    }

    console.log(`[regeocode] 行程 ${itineraryId} 更新了 ${updatedCount} 个地点坐标`);
    res.json({ success: true, updatedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create share link
router.post('/:id/share', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { createShareLink } = await import('../services/share.service');
    const result = await createShareLink(req.params.id, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get route for a day
router.get('/:id/days/:dayId/route', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const day = await prisma.itineraryDay.findUnique({
      where: { id: req.params.dayId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!day) {
      res.status(404).json({ error: '行程天不存在' });
      return;
    }

    // Build waypoints from hotel + items with coordinates
    const points: Array<{ lat: number; lng: number }> = [];
    if (day.hotelLat && day.hotelLng) {
      points.push({ lat: day.hotelLat, lng: day.hotelLng });
    }
    for (const item of day.items) {
      if (item.lat && item.lng) {
        points.push({ lat: item.lat, lng: item.lng });
      }
    }

    if (points.length < 2) {
      res.json({ routes: [] });
      return;
    }

    // Plan route between consecutive points
    const routes = [];
    for (let i = 0; i < points.length - 1; i++) {
      const route = await planRoute(points[i], points[i + 1]);
      if (route) {
        routes.push({
          from: i,
          to: i + 1,
          ...route,
        });
      }
    }

    res.json({ routes, points });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POI search
router.get('/places/search', async (req: AuthRequest, res: Response) => {
  try {
    const keyword = req.query.keyword as string;
    const city = req.query.city as string | undefined;
    if (!keyword) {
      res.status(400).json({ error: '请输入搜索关键词' });
      return;
    }
    const results = await searchPOI(keyword, city);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as itineraryRoutes };

import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { generateItineraryStream } from '../services/deepseek.service';
import { batchGeocode } from '../services/amap.service';
import { AIDayResult } from '../types';

const router = Router();
const prisma = new PrismaClient();

const generateSchema = z.object({
  destinations: z.array(z.string()).min(1, '请选择至少一个目的地'),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number().min(1).max(30),
  adults: z.number().min(1),
  children: z.number().min(0),
  preferences: z.string().default(''),
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = generateSchema.parse(req.body);
    const userId = req.user!.userId;

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendSSE = (event: string, payload: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    // Create itinerary record
    const itinerary = await prisma.itinerary.create({
      data: {
        userId,
        title: `${data.destinations.join('、')}之旅`,
        destinations: JSON.stringify(data.destinations),
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        adults: data.adults,
        children: data.children,
        preferences: data.preferences,
        status: 'draft',
      },
    });

    sendSSE('status', { message: '正在创建行程...', itineraryId: itinerary.id });

    const days: AIDayResult[] = [];

    await generateItineraryStream(data, {
      onStatus: (message) => {
        sendSSE('status', { message });
      },
      onDay: async (day) => {
        days.push(day);
        sendSSE('day', day);
      },
      onComplete: async () => {
        // Save all days to database with geocoding
        try {
          const mainCity = data.destinations[0];

          for (const day of days) {
            // Collect all places for geocoding
            const places = [
              { name: day.hotel.name, address: day.hotel.address, city: mainCity },
              ...day.spots.map(s => ({ name: s.name, address: s.address, city: mainCity })),
              ...day.restaurants.map(r => ({ name: r.name, address: r.address, city: mainCity })),
            ];

            const geoResults = await batchGeocode(places);

            // Calculate date for this day
            const startDate = new Date(data.startDate);
            startDate.setDate(startDate.getDate() + day.dayNumber - 1);
            const dateStr = startDate.toISOString().split('T')[0];

            const hotelGeo = geoResults.get(day.hotel.name);

            const createdDay = await prisma.itineraryDay.create({
              data: {
                itineraryId: itinerary.id,
                dayNumber: day.dayNumber,
                date: dateStr,
                theme: day.theme,
                hotelName: day.hotel.name,
                hotelAddress: day.hotel.address,
                hotelLat: hotelGeo?.lat || null,
                hotelLng: hotelGeo?.lng || null,
                notes: day.notes,
                orderIndex: day.dayNumber,
              },
            });

            let orderIndex = 0;

            // Add spots
            for (const spot of day.spots) {
              const geo = geoResults.get(spot.name);
              await prisma.dayItem.create({
                data: {
                  dayId: createdDay.id,
                  type: spot.type || 'spot',
                  name: spot.name,
                  address: spot.address,
                  lat: geo?.lat || null,
                  lng: geo?.lng || null,
                  description: spot.description,
                  estimatedMinutes: spot.estimatedMinutes || 60,
                  orderIndex: orderIndex++,
                },
              });
            }

            // Add restaurants
            for (const restaurant of day.restaurants) {
              const geo = geoResults.get(restaurant.name);
              await prisma.dayItem.create({
                data: {
                  dayId: createdDay.id,
                  type: 'restaurant',
                  name: restaurant.name,
                  address: restaurant.address,
                  lat: geo?.lat || null,
                  lng: geo?.lng || null,
                  description: restaurant.description,
                  estimatedMinutes: restaurant.estimatedMinutes || 60,
                  orderIndex: orderIndex++,
                },
              });
            }
          }

          await prisma.itinerary.update({
            where: { id: itinerary.id },
            data: { status: 'saved' },
          });

          sendSSE('complete', { itineraryId: itinerary.id });
        } catch (err: any) {
          sendSSE('error', { message: '保存行程数据失败: ' + err.message });
        }
        res.end();
      },
      onError: (error) => {
        sendSSE('error', { message: error });
        res.end();
      },
    });
  } catch (err: any) {
    if (!res.headersSent) {
      if (err.name === 'ZodError') {
        res.status(400).json({ error: err.errors[0].message });
        return;
      }
      res.status(500).json({ error: err.message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  }
});

export { router as aiRoutes };

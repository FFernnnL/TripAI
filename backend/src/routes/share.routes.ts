import { Router, Request, Response } from 'express';
import { getSharedItinerary } from '../services/share.service';

const router = Router();

router.get('/:token', async (req: Request, res: Response) => {
  try {
    const itinerary = await getSharedItinerary(req.params.token);
    res.json(itinerary);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

export { router as shareRoutes };

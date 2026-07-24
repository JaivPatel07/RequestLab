import { Router, Request, Response } from 'express';
import { prisma } from '../database/db';

export const historyRouter = Router();

// Get request history items, sorted by newest
historyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const history = await prisma.historyItem.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete history item
historyRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.historyItem.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete all history items
historyRouter.delete('/', async (req: Request, res: Response) => {
  try {
    await prisma.historyItem.deleteMany();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

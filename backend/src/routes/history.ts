import { Router, Request, Response } from 'express';
import { prisma } from '../database/db';

export const historyRouter = Router();

// Get all history items
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

// Update a history item (e.g., for favoriting)
historyRouter.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isFavorite } = req.body;
  try {
    const updatedItem = await prisma.historyItem.update({
      where: { id },
      data: { isFavorite }
    });
    return res.json(updatedItem);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a single history item
historyRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.historyItem.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Clear all history
historyRouter.delete('/', async (req: Request, res: Response) => {
  await prisma.historyItem.deleteMany();
  return res.json({ success: true });
});
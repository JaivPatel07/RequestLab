import { Router, Request, Response } from 'express';
import { prisma } from '../database/db';

export const environmentsRouter = Router();

// Get all environments
environmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const environments = await prisma.environment.findMany();
    return res.json(environments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create Environment
environmentsRouter.post('/', async (req: Request, res: Response) => {
  const { name, isGlobal = false, variables = '[]' } = req.body;
  try {
    const env = await prisma.environment.create({
      data: {
        name,
        isGlobal,
        variables
      }
    });
    return res.json(env);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update Environment
environmentsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, isGlobal, variables } = req.body;
  try {
    const env = await prisma.environment.update({
      where: { id },
      data: {
        name,
        isGlobal,
        variables
      }
    });
    return res.json(env);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete Environment
environmentsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.environment.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

import { Router, Request, Response } from 'express';
import { prisma } from '../database/db';
import { runRequest } from '../services/requestRunner';

export const collectionsRouter = Router();

// Get all collections, subfolders, and requests
collectionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        requests: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    return res.json(collections);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create Collection or Folder
collectionsRouter.post('/', async (req: Request, res: Response) => {
  const { name, parentId, isFavorite = false } = req.body;
  try {
    const collection = await prisma.collection.create({
      data: {
        name,
        parentId,
        isFavorite
      },
      include: {
        requests: true
      }
    });
    return res.json(collection);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update Collection or Folder
collectionsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, parentId, isFavorite } = req.body;
  try {
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        parentId,
        isFavorite
      },
      include: {
        requests: true
      }
    });
    return res.json(collection);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete Collection or Folder
collectionsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.collection.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create Request under a Collection/Folder
collectionsRouter.post('/requests', async (req: Request, res: Response) => {
  const {
    name,
    method = 'GET',
    url = '',
    headers = '[]',
    params = '[]',
    authType = 'none',
    authConfig = '{}',
    bodyType = 'none',
    bodyContent = '',
    cookies = '[]',
    settings = '{}',
    collectionId,
    order = 0
  } = req.body;

  if (!collectionId) {
    return res.status(400).json({ error: 'collectionId is required' });
  }

  try {
    const request = await prisma.request.create({
      data: {
        name,
        method,
        url,
        headers,
        params,
        authType,
        authConfig,
        bodyType,
        bodyContent,
        cookies,
        settings,
        collectionId,
        order
      }
    });
    return res.json(request);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update Request
collectionsRouter.patch('/requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    method,
    url,
    headers,
    params,
    authType,
    authConfig,
    bodyType,
    bodyContent,
    cookies,
    settings,
    collectionId,
    order
  } = req.body;

  try {
    const request = await prisma.request.update({
      where: { id },
      data: {
        name,
        method,
        url,
        headers,
        params,
        authType,
        authConfig,
        bodyType,
        bodyContent,
        cookies,
        settings,
        collectionId,
        order
      }
    });
    return res.json(request);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete Request
collectionsRouter.delete('/requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.request.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Duplicate Request
collectionsRouter.post('/requests/:id/duplicate', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const request = await prisma.request.findUnique({
      where: { id }
    });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const duplicatedRequest = await prisma.request.create({
      data: {
        name: `${request.name} (Copy)`,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        authType: request.authType,
        authConfig: request.authConfig,
        bodyType: request.bodyType,
        bodyContent: request.bodyContent,
        cookies: request.cookies,
        settings: request.settings,
        collectionId: request.collectionId,
        order: request.order + 1
      }
    });

    return res.json(duplicatedRequest);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Duplicate Collection
collectionsRouter.post('/:id/duplicate', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const duplicateCollectionRecursive = async (collectionId: string, newParentId: string | null) => {
      const originalCollection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: { requests: true },
      });

      if (!originalCollection) return;

      // 1. Duplicate the collection/folder itself
      const newCollection = await prisma.collection.create({
        data: {
          name: `${originalCollection.name} (Copy)`,
          parentId: newParentId,
          isFavorite: false, // Duplicates are not favorited by default
        },
      });

      // 2. Duplicate all requests within this collection/folder
      if (originalCollection.requests.length > 0) {
        const requestsToCreate = originalCollection.requests.map(req => ({
          ...req,
          id: undefined, // Let prisma generate a new ID
          collectionId: newCollection.id,
        }));
        await prisma.request.createMany({
          data: requestsToCreate,
        });
      }

      // 3. Find and recursively duplicate sub-folders
      const subFolders = await prisma.collection.findMany({
        where: { parentId: collectionId },
      });

      for (const subFolder of subFolders) {
        await duplicateCollectionRecursive(subFolder.id, newCollection.id);
      }
    };

    // Start the process from the root collection ID
    const originalCollection = await prisma.collection.findUnique({ where: { id } });
    if (originalCollection) {
      await duplicateCollectionRecursive(id, originalCollection.parentId);
    }

    return res.status(201).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to duplicate collection: ' + error.message });
  }
});

// Run Collection
collectionsRouter.post('/:id/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { environment } = req.body; // Pass active environment from client

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        requests: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const runResults = [];
    const collectionVariables: Record<string, any> = {}; // Shared context for the run

    for (const request of collection.requests) {
      const result = await runRequest(request, environment, collectionVariables);
      runResults.push(result);

      // If a request fails critically (e.g., script error), we might want to stop the run.
      // For now, we'll continue running all requests.
    }

    const summary = {
      total: runResults.length,
      passed: runResults.filter((r: any) => r.tests.every((t: { pass: boolean; }) => t.pass)).length,
      failed: runResults.filter((r: any) => r.tests.some((t: { pass: boolean; }) => !t.pass)).length,
    };

    return res.json({ summary, results: runResults });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Reorder requests
collectionsRouter.patch('/requests/reorder/batch', async (req: Request, res: Response) => {
  const { orders } = req.body; // Array of { id: string, order: number, collectionId?: string }
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: 'orders array is required' });
  }
  try {
    const transactions = orders.map(item =>
      prisma.request.update({
        where: { id: item.id },
        data: {
          order: item.order,
          collectionId: item.collectionId
        }
      })
    );
    await prisma.$transaction(transactions);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

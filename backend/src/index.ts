import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { proxyRouter } from './routes/proxy';
import { collectionsRouter } from './routes/collections';
import { environmentsRouter } from './routes/environments';
import { historyRouter } from './routes/history';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS for frontend interactions
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request payload limit adjustments for larger API requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Mounting routers
app.use('/api/proxy', proxyRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/environments', environmentsRouter);
app.use('/api/history', historyRouter);

// Start server
app.listen(PORT, () => {
  console.log(`[RequestLab] Backend running on port http://localhost:${PORT}`);
});

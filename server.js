import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/utils/db.js';
import { startBot } from './src/bot/index.js';
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import orderRoutes from './src/routes/orders.js';
import mpesaRoutes from './src/routes/mpesa.js';
import settingsRoutes from './src/routes/settings.js';
import statsRoutes from './src/routes/stats.js';
import { authMiddleware } from './src/middleware/auth.js';
import { startAbandonmentCron } from './src/utils/cron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve admin dashboard
app.use(express.static(path.join(__dirname, 'admin')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/mpesa', mpesaRoutes); // No auth - Daraja callback
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'SOLEZ KE Bot is alive 👟' }));

// Serve admin UI on all non-api routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
});

async function bootstrap() {
  await connectDB();
  startAbandonmentCron();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n👟 SOLEZ KE Server running on port ${PORT}`);
    console.log(`🖥️  Admin Dashboard: http://localhost:${PORT}`);
  });

  // Start WhatsApp bot
  await startBot();
}

bootstrap().catch(console.error);

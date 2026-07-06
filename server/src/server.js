import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studyRoutes from './routes/study.routes.js';
import rolePlayRoutes from './routes/rolePlay.routes.js';
import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middlewares/auth.middleware.js';
import { rateLimitByIp } from './middlewares/rateLimit.middleware.js';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', rateLimitByIp, authRoutes);
app.use('/api/study', rateLimitByIp, requireAuth, studyRoutes);
app.use('/api/role-play', rateLimitByIp, requireAuth, rolePlayRoutes);


export default app;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
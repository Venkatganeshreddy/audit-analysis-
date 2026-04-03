import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bigqueryRoutes from './routes/bigquery.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Configure CORS
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Mount BigQuery routes
app.use('/api/bigquery', bigqueryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origin: ${FRONTEND_URL}`);
});

import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import voteRoutes from './routes/voteRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', service: 'lecture-bunk-predictor-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/votes', voteRoutes);

app.use((error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    message: error.message || 'Something went wrong'
  });
});

export default app;



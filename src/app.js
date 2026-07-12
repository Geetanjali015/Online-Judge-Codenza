const express = require('express');
const cors = require('cors');

const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const hiddenTestRoutes = require('./routes/hiddenTestRoutes');
const judgeRoutes = require('./routes/judgeRoutes');
const problemRoutes = require('./routes/problemRoutes');
const readinessRoutes = require('./routes/readinessRoutes');
const runRoutes = require('./routes/runRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Allow the React frontend to call the API from Vite during development.
// In production, set FRONTEND_URL to the deployed frontend origin.
app.use(
  cors({
    origin(origin, callback) {
      // Requests from tools like Thunder Client/curl do not include an Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parse JSON request bodies for the application.
app.use(express.json());

app.use('/ai', aiRoutes);
app.use('/auth', authRoutes);
app.use('/hidden-tests', hiddenTestRoutes);
app.use('/judge', judgeRoutes);
app.use('/problems', problemRoutes);
app.use('/readiness', readinessRoutes);
app.use('/run', runRoutes);
app.use('/submissions', submissionRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

module.exports = app;

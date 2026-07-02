const express = require('express');

const authRoutes = require('./routes/authRoutes');
const hiddenTestRoutes = require('./routes/hiddenTestRoutes');
const problemRoutes = require('./routes/problemRoutes');

const app = express();

// Parse JSON request bodies for the application.
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/hidden-tests', hiddenTestRoutes);
app.use('/problems', problemRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

module.exports = app;

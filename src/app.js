const express = require('express');

const authRoutes = require('./routes/authRoutes');

const app = express();

// Parse JSON request bodies for the application.
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

module.exports = app;

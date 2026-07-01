const express = require('express');

const app = express();

// Parse JSON request bodies for the application.
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

module.exports = app;


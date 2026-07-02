const express = require('express');

const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const hiddenTestRoutes = require('./routes/hiddenTestRoutes');
const judgeRoutes = require('./routes/judgeRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();

// Parse JSON request bodies for the application.
app.use(express.json());

app.use('/ai', aiRoutes);
app.use('/auth', authRoutes);
app.use('/hidden-tests', hiddenTestRoutes);
app.use('/judge', judgeRoutes);
app.use('/problems', problemRoutes);
app.use('/submissions', submissionRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

module.exports = app;

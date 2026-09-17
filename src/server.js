const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const eventRoutes = require('./routes/eventRoutes');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/events', eventRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'charity-events-api', access: 'GET only' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3060);
if (require.main === module) {
  app.listen(port, () => console.log(`Charity Events running at http://localhost:${port}`));
}

module.exports = app;

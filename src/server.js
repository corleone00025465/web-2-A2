const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const eventRoutes = require('./routes/eventRoutes');
const db = require('./event_db');

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
async function startServer() {
  try {
    await db.testConnection();
    const server = app.listen(port, () => console.log(`Charity Events running at http://127.0.0.1:${port}`));
    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the existing server before starting another instance.`);
      } else {
        console.error(`HTTP server error: ${error.message}`);
      }
      await db.end().catch(() => {});
      process.exitCode = 1;
    });
    return server;
  } catch (_error) {
    console.error('Server startup stopped because the database connection failed.');
    process.exitCode = 1;
    return null;
  }
}

if (require.main === module) startServer();

module.exports = app;
module.exports.startServer = startServer;

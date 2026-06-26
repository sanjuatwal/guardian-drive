import http from 'node:http';
import express from 'express';

import { config } from './config';
import { attachLiveHub } from './live';
import { alertsRouter } from './routes/alerts';
import { authRouter } from './routes/auth';
import { commandsRouter } from './routes/commands';
import { devicesRouter } from './routes/devices';
import { legacyEventsRouter } from './routes/legacyEvents';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'guardian-backend' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/alerts', alertsRouter);

// Legacy endpoints consumed directly by guardian-firmware (ESP32):
// POST /api/events and GET /api/commands?device_id=...
app.use('/api', legacyEventsRouter);
app.use('/api', commandsRouter);

const server = http.createServer(app);
attachLiveHub(server);

server.listen(config.port, () => {
  console.log(`guardian-backend listening on http://localhost:${config.port}`);
  console.log(`live updates on ws://localhost:${config.port}/live?deviceId=<id>`);
});

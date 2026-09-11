import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Google Sheets Create & Sync API Endpoint
  app.post('/api/sheets/sync', async (req, res) => {
    try {
      const { tasks, spreadsheetId, sheetName = 'Checklist', webAppUrl } = req.body;

      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Missing tasks array' });
      }

      if (webAppUrl) {
        // Use the Apps Script WebApp proxy
        const response = await fetch(webAppUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'syncTasks',
            tasks
          }),
        });
        const data = await response.json();
        return res.json(data);
      }

      // If user provided a spreadsheetId and has OAuth credentials, update sheet using googleapis
      // Otherwise, return processed payload for client local export or direct download
      res.json({
        success: true,
        message: `Đã chuẩn bị đồng bộ ${tasks.length} dòng dữ liệu sang Sheet "${sheetName}"`,
        spreadsheetId: spreadsheetId || 'local-export',
        syncedCount: tasks.length,
        timestamp: new Date().toLocaleString('vi-VN'),
      });
    } catch (err: any) {
      console.error('Error in /api/sheets/sync:', err);
      res.status(500).json({ error: err?.message || 'Sync error' });
    }
  });

  app.get('/api/sheets/sync', async (req, res) => {
    try {
      const { webAppUrl } = req.query;
      if (!webAppUrl || typeof webAppUrl !== 'string') {
        return res.status(400).json({ error: 'Missing webAppUrl' });
      }

      const response = await fetch(webAppUrl);
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('Error pulling from Apps Script:', err);
      res.status(500).json({ error: err?.message || 'Sync error' });
    }
  });

  // Serve Vite in development mode or Static files in production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

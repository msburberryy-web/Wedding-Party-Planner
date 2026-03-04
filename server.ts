import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'wedding_plans.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed sample data if empty
const count = db.prepare('SELECT count(*) as count FROM plans').get() as { count: number };
if (count.count === 0) {
  const sampleData = {
    activities: [],
    metadata: {
      date: '2026-04-12',
      venue: 'East Gallery 5F',
      groomName: 'Man Zaw Nyein',
      brideName: 'Chit Su Hlaing',
      guestCount: 60,
      staffName: 'EI EI',
      mcName: 'Myo Nyunt'
    },
    language: 'en'
  };
  db.prepare('INSERT INTO plans (id, data) VALUES (?, ?)').run('2026-04-12-M-C', JSON.stringify(sampleData));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/plans', (req, res) => {
    try {
      const { data, id: customId } = req.body;
      const id = customId || crypto.randomUUID();
      
      // Check if ID already exists
      const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(id);
      if (existing) {
        // If it exists, update it instead of failing, or return error.
        // The user might want to "Save" again with the same deterministic ID.
        // Let's update it if it exists to be more user-friendly.
        const stmt = db.prepare('UPDATE plans SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(JSON.stringify(data), id);
        return res.json({ id });
      }

      const stmt = db.prepare('INSERT INTO plans (id, data) VALUES (?, ?)');
      stmt.run(id, JSON.stringify(data));
      res.json({ id });
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  });

  app.put('/api/plans/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { data } = req.body;
      const stmt = db.prepare('UPDATE plans SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(JSON.stringify(data), id);
      
      if (result.changes === 0) {
        // If not found, maybe create it? Or return 404.
        // Let's create it if it doesn't exist for robustness, or just 404.
        // For now, 404.
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  app.get('/api/plans/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('SELECT data FROM plans WHERE id = ?');
      const row = stmt.get(id) as { data: string } | undefined;
      
      if (!row) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      res.json({ data: JSON.parse(row.data) });
    } catch (error) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ error: 'Failed to fetch plan' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

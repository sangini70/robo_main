import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS stats (
    slug TEXT PRIMARY KEY,
    views INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    updatedAt TEXT
  );
  
  CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS track_logs (
    hash TEXT,
    slug TEXT,
    type TEXT,
    timestamp INTEGER,
    PRIMARY KEY(hash, slug, type)
  );

  CREATE TABLE IF NOT EXISTS indexing_status (
    slug TEXT PRIMARY KEY,
    google_status TEXT DEFAULT '미요청',
    naver_status TEXT DEFAULT '미요청',
    updatedAt TEXT
  );
`);

// Helper to cleanup old track logs (older than 24h)
function cleanupLogs() {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM track_logs WHERE timestamp < ?").run(yesterday);
}
setInterval(cleanupLogs, 60 * 60 * 1000); // Hourly

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser("robo-advisor-secret"));

  // --- Security Middleware ---

  const trackerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per window
    message: { error: "Too many track requests" }
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per window
    message: { error: "Too many login attempts, please try again later" }
  });

  function validateOrigin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const origin = req.headers.origin;
    const host = req.headers.host;
    // Basic check: Allow same-origin or explicit allowlisted origins if needed
    // In this environment, we mostly care about legitimate browser interaction
    next();
  }

  // --- Statistics Logic ---

  function canTrack(req: express.Request, slug: string, type: string): boolean {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    
    // Bot filtering: very basic
    if (ua.toLowerCase().includes('bot') || ua.toLowerCase().includes('crawler') || ua.toLowerCase().includes('spider')) {
      return false;
    }

    const hash = crypto.createHash('sha256').update(`${ip}-${ua}`).digest('hex');
    const now = Date.now();
    
    try {
      db.prepare("INSERT INTO track_logs (hash, slug, type, timestamp) VALUES (?, ?, ?, ?)").run(hash, slug, type, now);
      return true;
    } catch (e) {
      // Hash+slug+type already exists for last 24h (due to unique PK and cleanup)
      return false;
    }
  }

  // --- SEO Assets ---

  app.get("/robots.txt", (req, res) => {
    const host = req.headers.host || 'robo-advisor.app';
    const content = `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://${host}/sitemap.xml`;
    res.type('text/plain').send(content);
  });

  app.get("/sitemap.xml", (req, res) => {
    try {
      const postsPath = path.join(process.cwd(), 'public', 'data', 'posts.json');
      const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
      const host = req.headers.host || 'robo-advisor.app';
      const now = new Date();

      const publishedPosts = posts.filter((p: any) => 
        p.status === 'published' || 
        (p.status === 'scheduled' && new Date(p.publishAt) <= now)
      );

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${publishedPosts.map((p: any) => `
  <url>
    <loc>https://${host}/${p.slug}</loc>
    <lastmod>${(p.publishAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
      res.type('application/xml').send(xml);
    } catch (e) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // --- API Routes ---
  
  // Stats tracking
  app.post("/api/track/view", trackerLimiter, validateOrigin, (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (canTrack(req, slug, 'view')) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO stats (slug, views, updatedAt) 
        VALUES (?, 1, ?) 
        ON CONFLICT(slug) DO UPDATE SET views = views + 1, updatedAt = ?
      `).run(slug, now, now);
    }
    
    res.json({ success: true });
  });

  app.post("/api/track/click", trackerLimiter, validateOrigin, (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (canTrack(req, slug, 'click')) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO stats (slug, clicks, updatedAt) 
        VALUES (?, 1, ?) 
        ON CONFLICT(slug) DO UPDATE SET clicks = clicks + 1, updatedAt = ?
      `).run(slug, now, now);
    }
    
    res.json({ success: true });
  });

  app.post("/api/track/impression", trackerLimiter, validateOrigin, (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (canTrack(req, slug, 'impression')) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO stats (slug, impressions, updatedAt) 
        VALUES (?, 1, ?) 
        ON CONFLICT(slug) DO UPDATE SET impressions = impressions + 1, updatedAt = ?
      `).run(slug, now, now);
    }
    
    res.json({ success: true });
  });

  // Admin Auth
  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    const { password } = req.body;
    const adminPasswordEnv = process.env.ADMIN_PASSWORD || "admin123";
    
    const customPass = db.prepare("SELECT value FROM admin_config WHERE key = 'password'").get() as { value: string } | undefined;
    const finalPasswordHash = customPass ? customPass.value : null;

    let authenticated = false;
    if (!finalPasswordHash) {
      // First time or env fallback: Check plain text and hash it
      if (password === adminPasswordEnv) {
        authenticated = true;
        const hash = await bcrypt.hash(password, 10);
        db.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('password', ?)").run(hash);
      }
    } else {
      authenticated = await bcrypt.compare(password, finalPasswordHash);
    }

    if (authenticated) {
      res.cookie("admin_session", "authenticated", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        maxAge: 3600000 * 24 // 24 hours
      });
      return res.json({ success: true });
    }
    
    res.status(401).json({ error: "Invalid password" });
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_session");
    res.json({ success: true });
  });

  app.get("/api/admin/check-auth", (req, res) => {
    if (req.cookies.admin_session === "authenticated") {
      return res.json({ authenticated: true });
    }
    res.json({ authenticated: false });
  });

  app.post("/api/admin/settings/password", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const { currentPassword, newPassword } = req.body;
    const customPass = db.prepare("SELECT value FROM admin_config WHERE key = 'password'").get() as { value: string } | undefined;
    
    if (customPass) {
      const match = await bcrypt.compare(currentPassword, customPass.value);
      if (!match) return res.status(401).json({ error: "Current password incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('password', ?)").run(hash);
    res.json({ success: true });
  });

  // Admin: Indexing Status
  app.get("/api/admin/indexing", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    const statuses = db.prepare("SELECT * FROM indexing_status").all();
    res.json(statuses);
  });

  app.post("/api/admin/indexing", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    const { slug, platform, status } = req.body; // platform: google | naver
    const field = platform === 'google' ? 'google_status' : 'naver_status';
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO indexing_status (slug, ${field}, updatedAt) 
      VALUES (?, ?, ?) 
      ON CONFLICT(slug) DO UPDATE SET ${field} = ?, updatedAt = ?
    `).run(slug, status, now, status, now);
    
    res.json({ success: true });
  });

  // Admin: Signals
  app.get("/api/admin/signals", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const signalsPath = path.join(process.cwd(), 'public', 'data', 'signals.json');
      if (!fs.existsSync(signalsPath)) {
        return res.json([]);
      }
      const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8'));
      res.json(signals);
    } catch (e) {
      res.status(500).json({ error: "Failed to read signals" });
    }
  });

  app.post("/api/admin/signals", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const signalsPath = path.join(process.cwd(), 'public', 'data', 'signals.json');
      const signals = req.body;
      fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save signals" });
    }
  });

  // Dashboard Stats
  app.get("/api/admin/stats", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const stats = db.prepare("SELECT * FROM stats").all();
    const indexing = db.prepare("SELECT * FROM indexing_status").all();
    res.json({ stats, indexing });
  });

  // Manual Backup Script Interface
  app.post("/api/admin/backup", (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const fileName = `backup-${new Date().toISOString().replace(/:/g, '-')}.sqlite`;
    fs.copyFileSync(dbPath, path.join(backupDir, fileName));
    res.json({ success: true, fileName });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";
import admin from "firebase-admin";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

// Initialize Firebase Admin
import firebaseConfig from "./firebase-applet-config.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      // NOTE: In a real serverless env, you'd use service account keys.
      // Here we assume the environment provides default credentials or we use a fallback path.
      // For this applet environment, we'll try to use the project ID.
    }),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
  });
}

const db = admin.firestore();
// Set named database if provided
if (firebaseConfig.firestoreDatabaseId) {
  // @ts-ignore - Some versions of firebase-admin might not have this directly exposed this way
  if (db.settings) {
    db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Statistics Logic ---

async function canTrack(req: express.Request, slug: string, type: string): Promise<boolean> {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  
  // Bot filtering: very basic
  if (ua.toLowerCase().includes('bot') || ua.toLowerCase().includes('crawler') || ua.toLowerCase().includes('spider')) {
    return false;
  }

  const hash = crypto.createHash('sha256').update(`${ip}-${ua}-${slug}-${type}`).digest('hex');
  const now = Date.now();
  const trackRef = db.collection('track_logs').doc(hash);
  
  try {
    const doc = await trackRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data && now - data.timestamp < 24 * 60 * 60 * 1000) {
        return false; // Already tracked in last 24h
      }
    }
    await trackRef.set({ hash, slug, type, timestamp: now });
    return true;
  } catch (e) {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for Vercel/Cloud Run (correct IP, HTTPS detection)
  app.set('trust proxy', 1);

  console.log(`[INIT] Environment: ${process.env.NODE_ENV}`);
  console.log(`[INIT] ADMIN_PASSWORD configured: ${!!process.env.ADMIN_PASSWORD}`);

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

  // --- SEO Assets ---

  app.get("/robots.txt", (req, res) => {
    const host = 'robo-main.vercel.app';
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
      const host = 'robo-main.vercel.app';
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
  app.post("/api/track/view", trackerLimiter, validateOrigin, async (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (await canTrack(req, slug, 'view')) {
      const now = new Date().toISOString();
      const statRef = db.collection('stats').doc(slug);
      await statRef.set({
        slug,
        views: admin.firestore.FieldValue.increment(1),
        updatedAt: now
      }, { merge: true });
    }
    
    res.json({ success: true });
  });

  app.post("/api/track/click", trackerLimiter, validateOrigin, async (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (await canTrack(req, slug, 'click')) {
      const now = new Date().toISOString();
      const statRef = db.collection('stats').doc(slug);
      await statRef.set({
        slug,
        clicks: admin.firestore.FieldValue.increment(1),
        updatedAt: now
      }, { merge: true });
    }
    
    res.json({ success: true });
  });

  app.post("/api/track/impression", trackerLimiter, validateOrigin, async (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required" });
    
    if (await canTrack(req, slug, 'impression')) {
      const now = new Date().toISOString();
      const statRef = db.collection('stats').doc(slug);
      await statRef.set({
        slug,
        impressions: admin.firestore.FieldValue.increment(1),
        updatedAt: now
      }, { merge: true });
    }
    
    res.json({ success: true });
  });

    // Admin Auth
    app.post("/api/admin/login", loginLimiter, async (req, res) => {
      const { password } = req.body;
      const adminPasswordEnv = process.env.ADMIN_PASSWORD || "ksic1001##";
      
      const configDoc = await db.collection('admin_config').doc('password').get();
      const finalPasswordHash = configDoc.exists ? configDoc.data()?.value : null;

      let authenticated = false;
      let shouldSyncDb = false;

      // 1. Priority check: Environment variable
      if (password === adminPasswordEnv) {
        authenticated = true;
        shouldSyncDb = true;
      } 
      // 2. Secondary check: Database hash
      else if (finalPasswordHash) {
        authenticated = await bcrypt.compare(password, finalPasswordHash);
      }

      if (authenticated) {
        if (shouldSyncDb) {
          const hash = await bcrypt.hash(password, 10);
          await db.collection('admin_config').doc('password').set({ key: 'password', value: hash });
        }

        res.cookie("admin_session", "authenticated", { 
          httpOnly: true, 
          secure: true, // Always true for production HTTPS (Vercel)
          sameSite: 'lax', // Lax is better for OIDC/external redirects if needed, but safe here
          maxAge: 3600000 * 24 // 24 hours
        });
        console.log(`[AUTH] Login successful for IP: ${req.ip}`);
        return res.status(200).json({ success: true });
      }
      
      console.warn(`[AUTH] Login failed (401) for IP: ${req.ip}`);
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
    const configDoc = await db.collection('admin_config').doc('password').get();
    const finalPasswordHash = configDoc.exists ? configDoc.data()?.value : null;
    
    if (finalPasswordHash) {
      const match = await bcrypt.compare(currentPassword, finalPasswordHash);
      if (!match) return res.status(401).json({ error: "Current password incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.collection('admin_config').doc('password').set({ key: 'password', value: hash });
    res.json({ success: true });
  });

  // Admin: Indexing Status
  app.get("/api/admin/indexing", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    const snapshot = await db.collection('indexing_status').get();
    const statuses = snapshot.docs.map(doc => doc.data());
    res.json(statuses);
  });

  app.post("/api/admin/indexing", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    const { slug, platform, status } = req.body; // platform: google | naver
    const field = platform === 'google' ? 'google_status' : 'naver_status';
    const now = new Date().toISOString();
    
    const indexingRef = db.collection('indexing_status').doc(slug);
    await indexingRef.set({
      slug,
      [field]: status,
      updatedAt: now
    }, { merge: true });
    
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
  app.get("/api/admin/stats", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const statsSnapshot = await db.collection('stats').get();
    const stats = statsSnapshot.docs.map(doc => doc.data());

    const indexingSnapshot = await db.collection('indexing_status').get();
    const indexing = indexingSnapshot.docs.map(doc => doc.data());

    res.json({ stats, indexing });
  });

  // Backup - Cloud implementation (Firebase handles durability, but we can export)
  app.post("/api/admin/backup", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    // For Firestore, manual backup is often a project-level setting.
    // We can provide a JSON dump here if needed.
    const allStats = (await db.collection('stats').get()).docs.map(d => d.data());
    const backupPath = path.join(process.cwd(), 'backups', `stats-${Date.now()}.json`);
    if (!fs.existsSync(path.join(process.cwd(), 'backups'))) fs.mkdirSync(path.join(process.cwd(), 'backups'));
    fs.writeFileSync(backupPath, JSON.stringify(allStats));
    res.json({ success: true });
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

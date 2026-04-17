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
const projectId = process.env.FIREBASE_PROJECT_ID || "robo-advisor-prod";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });
  } else {
    // Fallback for local development if env vars are missing
    import("./firebase-applet-config.json").then((config) => {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.default.projectId,
        }),
      });
    }).catch(() => {
      console.error("Firebase Admin initialization failed: Missing credentials");
    });
  }
}

const db = admin.firestore();
const FIRESTORE_DB_ID = process.env.VITE_FIREBASE_FIRESTORE_DB_ID;

// Set named database if provided
if (FIRESTORE_DB_ID) {
  // @ts-ignore
  if (db.settings) {
    db.settings({ databaseId: FIRESTORE_DB_ID });
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

    // Admin Auth (Firebase Token Based)
    app.post("/api/admin/login", loginLimiter, async (req, res) => {
      const { idToken } = req.body;
      const adminEmail = "luganopizza@gmail.com";
      
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const email = decodedToken.email;
        const emailVerified = decodedToken.email_verified;

        if (email === adminEmail && emailVerified) {
          res.cookie("admin_session", "authenticated", { 
            httpOnly: true, 
            secure: true, // Always true for production HTTPS (Vercel)
            sameSite: 'lax',
            maxAge: 3600000 * 24 // 24 hours
          });
          console.log(`[AUTH] Admin login successful for: ${email}`);
          return res.status(200).json({ success: true });
        } else {
          console.warn(`[AUTH] Unauthorized login attempt by: ${email}`);
          return res.status(403).json({ error: "Unauthorized email" });
        }
      } catch (error) {
        console.error(`[AUTH] Token verification failed:`, error);
        res.status(401).json({ error: "Invalid token" });
      }
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
    // This functionality is deprecated in favor of Firebase Auth
    return res.status(501).json({ error: "Legacy password settings are disabled. Use Firebase Auth." });
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

  // Admin: Posts CRUD (Firestore based)
  app.get("/api/admin/posts", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const snapshot = await db.collection('posts').get();
      const posts = snapshot.docs.map(doc => doc.data());
      res.json(posts);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch posts from Firestore" });
    }
  });

  app.post("/api/admin/posts", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const post = req.body;
      if (!post.slug) return res.status(400).json({ error: "Slug is required" });
      
      await db.collection('posts').doc(post.slug).set({
        ...post,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save post to Firestore" });
    }
  });

  app.delete("/api/admin/posts/:slug", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const { slug } = req.params;
      await db.collection('posts').doc(slug).delete();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete post from Firestore" });
    }
  });

  // Admin: Publish (Export Firestore to JSON for public speed)
  app.post("/api/admin/publish", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      // 1. Sync Posts
      const postsSnapshot = await db.collection('posts').get();
      const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive or unnecessary fields for public JSON
        const { ...summary } = data;
        return summary;
      });
      fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'posts.json'), JSON.stringify(posts, null, 2));

      // 2. Sync Signals
      const signalsSnapshot = await db.collection('signals').get();
      const signals = signalsSnapshot.docs.map(doc => doc.data());
      fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'signals.json'), JSON.stringify(signals, null, 2));

      // 3. Sync Flow Index
      const flowIndex: any = {};
      posts.forEach((p: any) => {
        if (!flowIndex[p.hub]) flowIndex[p.hub] = {};
        if (!flowIndex[p.hub][p.flowStep]) flowIndex[p.hub][p.flowStep] = [];
        flowIndex[p.hub][p.flowStep].push(p.slug);
      });
      fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'flow-index.json'), JSON.stringify(flowIndex, null, 2));

      // 4. Create Detail JSONs (for visits)
      const detailDir = path.join(process.cwd(), 'public', 'data', 'detail');
      if (!fs.existsSync(detailDir)) fs.mkdirSync(detailDir, { recursive: true });
      posts.forEach((p: any) => {
        fs.writeFileSync(path.join(detailDir, `${p.slug}.json`), JSON.stringify(p, null, 2));
      });

      res.json({ success: true, message: "Production sync completed. Content published to static storage." });
    } catch (e) {
      console.error("Publish failed:", e);
      res.status(500).json({ error: "Failed to publish static content" });
    }
  });

  // Admin: Signals (Update to Firestore)
  app.get("/api/admin/signals", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const snapshot = await db.collection('signals').get();
      const signals = snapshot.docs.map(doc => doc.data());
      res.json(signals);
    } catch (e) {
      res.status(500).json({ error: "Failed to read signals from Firestore" });
    }
  });

  app.post("/api/admin/signals", async (req, res) => {
    if (req.cookies.admin_session !== "authenticated") return res.status(403).json({ error: "Unauthorized" });
    try {
      const signals = req.body; // Array of signals
      // Transactional or batch update
      const batch = db.batch();
      // First clear old? Or just update. 
      // Usually better to use a dedicated collection.
      const signalsRef = db.collection('signals');
      
      // Update/Set all
      signals.forEach((s: any) => {
        const ref = signalsRef.doc(s.id.toString());
        batch.set(ref, s);
      });
      
      await batch.commit();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save signals to Firestore" });
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

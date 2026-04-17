import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const backupDir = path.join(process.cwd(), 'backups');

function backup() {
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    return;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);

  try {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Backup completed: ${backupPath}`);
    
    // Optional: Keep only last 30 backups
    const files = fs.readdirSync(backupDir).sort().filter(f => f.startsWith('backup-'));
    if (files.length > 30) {
      const toDelete = files.slice(0, files.length - 30);
      toDelete.forEach(f => fs.unlinkSync(path.join(backupDir, f)));
      console.log(`Cleaned up ${toDelete.length} old backups`);
    }
  } catch (err) {
    console.error('Backup failed:', err);
  }
}

backup();

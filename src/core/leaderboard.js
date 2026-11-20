import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_PATH = path.resolve(__dirname, '../../data/leaderboard.json');

export class LeaderboardManager {
  constructor(filePath = DEFAULT_DATA_PATH) {
    this.filePath = filePath;
    this.entries = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data = JSON.parse(raw);
        this.entries = Array.isArray(data.entries) ? data.entries : [];
      } else {
        this.entries = [];
      }
    } catch {
      this.entries = [];
    }
    this.sortAndTrim();
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify({ entries: this.entries }, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save leaderboard:', err);
    }
  }

  addEntry({ name, score, nights_won = 0, achieved_at, seed = 42 }) {
    const trimmedName = String(name || '').trim();
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 12) {
      throw new Error('Name must be between 3 and 12 characters');
    }

    const isoDate = achieved_at || new Date().toISOString();
    const entry = {
      name: trimmedName,
      score: Math.max(0, Math.floor(Number(score) || 0)),
      nights_won: Math.max(0, Math.min(3, Math.floor(Number(nights_won) || 0))),
      achieved_at: isoDate,
      seed: Number(seed) || 42
    };

    this.entries.push(entry);
    this.sortAndTrim();
    this.save();
    return entry;
  }

  sortAndTrim() {
    this.entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const tA = new Date(a.achieved_at).getTime() || 0;
      const tB = new Date(b.achieved_at).getTime() || 0;
      return tA - tB; // Earliest timestamp first on tie
    });
    this.entries = this.entries.slice(0, 10);
  }

  getEntries() {
    return [...this.entries];
  }

  exportToFile(outPath) {
    this.sortAndTrim();
    const resolvedPath = path.resolve(process.cwd(), outPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, JSON.stringify({ entries: this.entries }, null, 2), 'utf8');
  }
}

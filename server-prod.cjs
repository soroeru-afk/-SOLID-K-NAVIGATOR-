// 本番プレビュー専用サーバー（Vite不使用）
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => globalThis.fetch(...args));

const app = express();
const PORT = 3000;

// CORS: GitHub PagesのPWAからのアクセスを許可
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://soroeru-afk.github.io',
  ],
  credentials: false
}));

app.use(express.json());

// 株価取得API
app.get('/api/fetch-price', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Stock code is required' });

    const url = `https://kabutan.jp/stock/?code=${code}`;
    const response = await globalThis.fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch from Kabutan' });

    const html = await response.text();

    // 終値を取得（簡易パース）
    let price = '?';
    const match = html.match(/終値[^<]*<\/th>[^<]*<td[^>]*>([0-9,\.]+)/);
    if (match) price = match[1];

    res.json({ price });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock price' });
  }
});

// タイトル取得API
app.get('/api/fetch-title', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await globalThis.fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch URL' });

    const html = await response.text();
    const match = html.match(/<title>([^<]*)<\/title>/i);
    const title = match && match[1] ? match[1].trim() : '';
    res.json({ title });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch title' });
  }
});

// distフォルダを静的配信
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(` SOLID K-NAVIGATOR`);
  console.log(` http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

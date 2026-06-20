import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/fetch-price", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ error: "Stock code is required" });
      }

      const url = `https://kabutan.jp/stock/?code=${code}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from Kabutan" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      let closePrice = null;
      const kobLeft = $('#kobetsu_left');
      if (kobLeft.length > 0) {
          const ft = kobLeft.find('table').length > 0 ? kobLeft.find('table') : kobLeft;
          ft.find('tr').each((_, tr) => {
              const th = $(tr).find('th');
              const td = $(tr).find('td');
              if (th.length > 0 && td.length > 0) {
                  if (th.text().trim() === '終値') {
                      closePrice = td.text().trim().split(/\s/)[0];
                  }
              }
          });
      }

      let price = null;
      const i1 = $('#stockinfo_i1');
      
      // Phase 1: Try to find the price in #stockinfo_i1 
      if (i1.length > 0) {
          const valElements = i1.find('td.val, dd.val, span.val');
          valElements.each((_, el) => {
            if (price) return;
            const row = $(el).closest('tr, dl, div');
            if (row.length > 0 && /PTS|夜間|ナイト/.test(row.text())) return;
            
            const text = $(el).text().trim();
            const cleanText = text.replace(/[^\d,.]/g, '');
            if (cleanText.length >= 2) {
                price = text;
            }
          });
      }

      // Phase 2: Try alternative ways if not found
      if (!price) {
        $('th, dt, td').each((_, el) => {
            if (price) return;
            const text = $(el).text().trim();
            if (/^(現在値|現値|株価)$/.test(text)) {
                const nextEl = $(el).next();
                if (nextEl.length > 0) {
                    const row = $(el).closest('tr, dl, div');
                    if (row.length > 0 && /PTS|夜間|ナイト/.test(row.text())) return;
                    const nextText = nextEl.text().trim();
                    const numMatch = nextText.match(/[\d,.]+/);
                    if (numMatch) {
                        price = numMatch[0];
                    }
                }
            }
        });
      }

      // Phase 3: Final fallback using regex on the raw HTML
      if (!price) {
        const i1h = i1.length > 0 ? i1.html() || html : html;
        const pi = i1h.search(/PTS|夜間|ナイト/);
        const sh = pi > 0 ? i1h.substring(0, pi) : i1h;
        const nums = sh.replace(/<[^>]+>/g, ' ').match(/[\d]{1,5}[,\d]*\.[\d]+|[\d,]{4,}/g);
        if (nums) {
            const cn = code.replace(/[^0-9]/g, '');
            for (let ni = 0; ni < nums.length; ni++) {
                const n = nums[ni].replace(/,/g, '');
                if (cn && n === cn) continue;
                if (parseFloat(n) >= 100) { 
                    price = nums[ni]; 
                    break; 
                }
            }
        }
      }

      const finalPrice = closePrice || price;
      
      // Clean up finalPrice
      let cleanFinalPrice = '?';
      if (finalPrice) {
          const m = finalPrice.match(/[\d,.]+/);
          if (m) cleanFinalPrice = m[0];
      }

      res.json({ price: cleanFinalPrice });
    } catch (error) {
      console.error('Error fetching stock:', error);
      res.status(500).json({ error: "Failed to fetch stock price" });
    }
  });

  app.get("/api/fetch-title", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch URL" });
      }

      const html = await response.text();
      const match = html.match(/<title>([^<]*)<\/title>/i);
      const title = match && match[1] ? match[1].trim() : '';

      res.json({ title });
    } catch (error) {
      console.error('Error fetching title:', error);
      res.status(500).json({ error: "Failed to fetch title" });
    }
  });

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

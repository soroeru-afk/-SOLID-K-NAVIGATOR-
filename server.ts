import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/fetch-price", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ error: "Stock code is required" });
      }

      let closePrice: string | null = null;
      let price: string | null = null;

      // Method 1: Try Kabutan
      try {
        const url = `https://kabutan.jp/stock/?code=${code}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
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

          const i1 = $('#stockinfo_i1');
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
        }
      } catch (kError) {
        console.warn(`Kabutan fetch failed for ${code}, trying Yahoo Finance fallback...`, kError);
      }

      // Method 2: Fallback to Yahoo! Finance JP if Kabutan price was not found
      if (!closePrice && !price) {
        try {
          const yUrl = `https://finance.yahoo.co.jp/quote/${code}.T`;
          const yRes = await fetch(yUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (yRes.ok) {
            const yHtml = await yRes.text();
            const $y = cheerio.load(yHtml);
            
            // Search price in Yahoo Finance JP structure
            $y('[data-testid="stock-price"], [class*="_CommonPriceBoard__price"], [class*="StyledStockPrice"], [class*="price"]').each((_, el) => {
              if (price) return;
              const t = $y(el).text().trim();
              if (/^[0-9,]+(\.[0-9]+)?$/.test(t)) {
                price = t;
              }
            });
          }
        } catch (yError) {
          console.warn(`Yahoo Finance JP fetch failed for ${code}:`, yError);
        }
      }

      const finalPrice = closePrice || price;
      let cleanFinalPrice = '?';
      if (finalPrice) {
          const m = finalPrice.match(/[\d,.]+/);
          if (m) cleanFinalPrice = m[0];
      }

      if (cleanFinalPrice === '?') {
        return res.status(404).json({ error: "Stock price not found", price: '?' });
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

  app.get("/api/market-news", async (req, res) => {
    try {
      const response = await fetch("https://kabutan.jp/news/marketnews/", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch news from Kabutan" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const items: Array<{ id: string; time: string; category: string; title: string; url: string }> = [];

      $("table tr").each((_, tr) => {
        const timeEl = $(tr).find(".news_time time");
        const ctgEl = $(tr).find(".newslist_ctg");
        const aEl = $(tr).find("td a");
        if (timeEl.length && aEl.length) {
          const rawHref = aEl.attr("href") || "";
          const url = rawHref.startsWith("http") ? rawHref : `https://kabutan.jp${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;
          const m = rawHref.match(/[?&]b=([a-zA-Z0-9]+)/);
          const newsId = m ? m[1] : `news_${items.length}`;
          const title = aEl.text().trim();
          if (title) {
            items.push({
              id: newsId,
              time: timeEl.text().replace(/\s+/g, " ").trim(),
              category: ctgEl.text().trim() || "市況",
              title,
              url
            });
          }
        }
      });

      res.json({ items });
    } catch (error) {
      console.error('Error fetching market news:', error);
      res.status(500).json({ error: "Failed to fetch market news" });
    }
  });

  app.get("/api/news-detail", async (req, res) => {
    try {
      const b = req.query.b as string;
      const rawUrl = req.query.url as string;
      const targetUrl = b ? `https://kabutan.jp/news/marketnews/?b=${b}` : rawUrl;

      if (!targetUrl) {
        return res.status(400).json({ error: "News ID or URL is required" });
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch news article" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $("h1, .news_title, #news_title").first().text().trim();
      const time = $("time").first().text().trim();
      const category = $(".newslist_ctg, .news_category").first().text().trim() || "ニュース";
      
      const bodyEl = $("div.body").first();
      bodyEl.find("script, style, .kanren_news, .ad").remove();
      const bodyText = bodyEl.text().trim();

      res.json({
        title,
        time,
        category,
        body: bodyText,
        url: targetUrl
      });
    } catch (error) {
      console.error('Error fetching news detail:', error);
      res.status(500).json({ error: "Failed to fetch news detail" });
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

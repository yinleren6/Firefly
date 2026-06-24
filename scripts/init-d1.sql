-- D1 阅读统计数据库建表语句
-- 在 Cloudflare Dashboard → D1 → 对应数据库 → Console 中执行
-- 或使用 wrangler: npx wrangler d1 execute blog-stats --command="..."

CREATE TABLE IF NOT EXISTS pageviews (
  path TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  is_crawler INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path);
CREATE INDEX IF NOT EXISTS idx_pageviews_ip ON pageviews(ip_hash);

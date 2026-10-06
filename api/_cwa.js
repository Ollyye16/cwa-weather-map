// 共用工具：呼叫 CWA API、回傳 JSON。
// 檔名以底線開頭，Vercel 不會把它當成 API 路由。

const BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/";

async function cwaFetch(dataset) {
  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey) throw new Error("伺服器未設定 CWA_API_KEY 環境變數");
  const resp = await fetch(`${BASE}${dataset}?Authorization=${encodeURIComponent(apiKey)}`);
  if (!resp.ok) throw new Error(`CWA API 回應 ${resp.status}`);
  return resp.json();
}

// cacheSeconds：Vercel CDN 快取秒數，避免每個訪客都直接呼叫 CWA
function send(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (cacheSeconds) res.setHeader("Cache-Control", `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
  res.end(JSON.stringify(body));
}

// CWA 以 -99 / -999 等負值表示「無資料」
function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > -90 ? n : null;
}

module.exports = { cwaFetch, send, num };

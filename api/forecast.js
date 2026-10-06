// GET /api/forecast?county=臺北市
// F-D0047-091（臺灣各縣市未來 1 週逐 12 小時天氣預報），整理成每日預報。

const { cwaFetch, send, num } = require("./_cwa");

// 取出某個天氣因子的所有時段：[{ start, value }]
function series(location, elementName) {
  const element = location.WeatherElement.find((e) => e.ElementName === elementName);
  return element.Time.map((t) => ({ start: t.StartTime, value: Object.values(t.ElementValue[0])[0] }));
}

// 逐 12 小時 → 每日：最高溫取最大、最低溫取最小、降雨機率取最大、天氣取當天第一個白天時段
function toDaily(location) {
  const days = {};
  const day = (start) => (days[start.slice(0, 10)] ||= { date: start.slice(0, 10), maxT: null, minT: null, pop: null, weather: null });
  const pick = (a, b, fn) => (a === null ? b : b === null ? a : fn(a, b));

  for (const { start, value } of series(location, "最高溫度")) day(start).maxT = pick(day(start).maxT, num(value), Math.max);
  for (const { start, value } of series(location, "最低溫度")) day(start).minT = pick(day(start).minT, num(value), Math.min);
  for (const { start, value } of series(location, "12小時降雨機率")) day(start).pop = pick(day(start).pop, num(value), Math.max);
  for (const { start, value } of series(location, "天氣現象")) {
    const d = day(start);
    if (!d.weather || start.slice(11, 13) === "06") d.weather = value;
  }
  return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = async (req, res) => {
  const county = new URL(req.url, "http://localhost").searchParams.get("county");
  if (!county) return send(res, 400, { error: "請提供 county 參數，例如 ?county=臺北市" });

  try {
    const data = await cwaFetch("F-D0047-091");
    const location = data.records.Locations[0].Location.find((l) => l.LocationName === county);
    if (!location) return send(res, 404, { error: `找不到縣市：${county}` });

    // 預報每 6 小時更新，CDN 快取 30 分鐘
    send(res, 200, { source: "CWA F-D0047-091", county, days: toDaily(location) }, 1800);
  } catch (err) {
    send(res, 502, { error: `無法取得預報資料：${err.message}` });
  }
};

// Vercel Serverless Function：GET /api/weather
// 向中央氣象署 CWA 取得 O-A0003-001（現在天氣觀測報告），整理成前端需要的精簡格式。
// 授權碼放在環境變數 CWA_API_KEY，不會出現在前端或 GitHub。

const CWA_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001";

// CWA 以 -99 / -999 等負值表示「無資料」
function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > -90 ? n : null;
}

function toStation(s) {
  const wgs84 = s.GeoInfo.Coordinates.find((c) => c.CoordinateName === "WGS84") || s.GeoInfo.Coordinates[0];
  const w = s.WeatherElement;
  const daily = w.DailyExtreme || {};
  return {
    id: s.StationId,
    name: s.StationName,
    county: s.GeoInfo.CountyName,
    town: s.GeoInfo.TownName,
    lat: num(wgs84.StationLatitude),
    lon: num(wgs84.StationLongitude),
    altitude: num(s.GeoInfo.StationAltitude),
    weather: w.Weather && w.Weather !== "-99" ? w.Weather : null,
    temp: num(w.AirTemperature),
    rain: num(w.Now && w.Now.Precipitation),
    windSpeed: num(w.WindSpeed),
    windDir: num(w.WindDirection),
    humidity: num(w.RelativeHumidity),
    pressure: num(w.AirPressure),
    high: num(daily.DailyHigh && daily.DailyHigh.TemperatureInfo.AirTemperature),
    low: num(daily.DailyLow && daily.DailyLow.TemperatureInfo.AirTemperature),
  };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "伺服器未設定 CWA_API_KEY 環境變數" }));
  }

  try {
    const resp = await fetch(`${CWA_URL}?Authorization=${encodeURIComponent(apiKey)}`);
    if (!resp.ok) throw new Error(`CWA API 回應 ${resp.status}`);
    const data = await resp.json();

    const stations = data.records.Station
      .map(toStation)
      .filter((s) => s.lat !== null && s.lon !== null);

    // CDN 快取 5 分鐘：觀測資料約 10 分鐘更新一次，也避免頻繁呼叫 CWA API
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.end(JSON.stringify({
      source: "CWA O-A0003-001",
      obsTime: data.records.Station[0].ObsTime.DateTime,
      count: stations.length,
      stations,
    }));
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: `無法取得 CWA 資料：${err.message}` }));
  }
};

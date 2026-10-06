// GET /api/weather
// O-A0003-001（現在天氣觀測報告）：全台測站即時觀測，整理成前端需要的精簡格式。

const { cwaFetch, send, num } = require("./_cwa");

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
  try {
    const data = await cwaFetch("O-A0003-001");
    const stations = data.records.Station
      .map(toStation)
      .filter((s) => s.lat !== null && s.lon !== null);

    // 觀測資料約 10 分鐘更新一次，CDN 快取 5 分鐘
    send(res, 200, {
      source: "CWA O-A0003-001",
      obsTime: data.records.Station[0].ObsTime.DateTime,
      count: stations.length,
      stations,
    }, 300);
  } catch (err) {
    send(res, 502, { error: `無法取得 CWA 資料：${err.message}` });
  }
};

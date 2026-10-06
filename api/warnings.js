// GET /api/warnings
// W-C0033-001：各縣市目前生效中的天氣特報（用來在地圖上標示縣市）
// W-C0033-002：特報全文（顯示在特報面板）

const { cwaFetch, send } = require("./_cwa");

const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

module.exports = async (req, res) => {
  try {
    const [byCounty, texts] = await Promise.all([cwaFetch("W-C0033-001"), cwaFetch("W-C0033-002")]);

    // 縣市 → 特報名稱列表，例如 { "桃園市": ["陸上強風特報"] }
    const counties = {};
    for (const loc of byCounty.records.location) {
      const hazards = loc.hazardConditions.hazards.map((h) => `${h.info.phenomena}${h.info.significance}`);
      if (hazards.length) counties[loc.locationName] = hazards;
    }

    // 只保留仍有影響範圍的特報（已解除的特報沒有 hazardConditions）
    const warnings = asArray(texts.records.record)
      .filter((r) => r.hazardConditions)
      .map((r) => ({
        title: r.datasetInfo.datasetDescription,
        issueTime: r.datasetInfo.issueTime,
        startTime: r.datasetInfo.validTime.startTime,
        endTime: r.datasetInfo.validTime.endTime,
        text: r.contents.content.contentText.trim(),
        areas: asArray(r.hazardConditions.hazards.hazard)
          .flatMap((h) => asArray(h.info.affectedAreas && h.info.affectedAreas.location))
          .map((l) => l.locationName),
      }));

    send(res, 200, { counties, warnings }, 300);
  } catch (err) {
    send(res, 502, { error: `無法取得特報資料：${err.message}` });
  }
};

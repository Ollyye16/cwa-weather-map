# 台灣即時氣象地圖

用中央氣象署（CWA）開放資料 **O-A0003-001（現在天氣觀測報告）** 製作的互動式即時氣象地圖，部署於 Vercel。

## 功能
- **全台 360+ 個測站即時觀測**，依數值在地圖上以色階顯示
- **圖層切換**：🌡️ 氣溫、🌧️ 今日累積雨量、💨 風速、💧 相對濕度，色階圖例隨圖層更新
- **統計卡**：全台最高溫、最低溫、今日最大雨量、最大風速，以及發生的測站
- **數值標籤**：放大到一定程度後，測站改以數值標籤顯示（避免縮小時互相重疊）
- **測站詳細資訊**：點測站顯示天氣、氣溫與今日高低溫、雨量、風速風向、濕度、氣壓、海拔
- **底圖切換**：深色 / 街道圖
- **定位我的位置**（瀏覽器 Geolocation）
- **自動更新**：每 10 分鐘自動重新取得資料，也可手動「重新整理」

## 架構
| 檔案 | 說明 |
|---|---|
| `index.html` | 前端：Leaflet 地圖、圖層與統計卡 |
| `api/weather.js` | Vercel Serverless Function：呼叫 CWA API，整理成精簡 JSON 給前端 |

前端只呼叫自己的 `/api/weather`，**CWA 授權碼只存在 Vercel 的環境變數中**，不會出現在前端或 GitHub。
API 回應在 Vercel CDN 快取 5 分鐘，避免頻繁呼叫 CWA。

## 部署到 Vercel
1. 將此 repository Import 到 [Vercel](https://vercel.com/new)
2. 在 **Settings → Environment Variables** 新增 `CWA_API_KEY` = 你的 CWA 授權碼（到 [氣象資料開放平臺](https://opendata.cwa.gov.tw/) 註冊取得）
3. Deploy

資料來源：中央氣象署 開放資料平臺 O-A0003-001

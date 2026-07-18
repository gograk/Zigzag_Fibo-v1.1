# ZIGZAG_FIBO Dashboard — XAUUSD

Dashboard Android trading XAUUSD: harga live WebSocket, sinyal ZigZag+Fibonacci, RSI-14 per timeframe (5M/15M/30M/1H/4H).

## Cara Build APK via GitHub Actions (TANPA expo.dev)

1. **Push repo ini ke GitHub** (buat repo baru, push semua file ini)
2. **Push ke branch `main`** → GitHub Actions otomatis build APK
3. **Download APK** dari tab **Actions** → pilih run terbaru → bagian **Artifacts** → `ZIGZAG_FIBO-APK`

> Tidak perlu akun expo.dev, tidak perlu token EAS — build langsung pakai Gradle di GitHub runner.

## Cara Kerja Build

GitHub Actions menjalankan langkah berikut:
1. Install Java 17 + Node.js 20
2. `npm install` — install semua dependencies
3. `npx expo prebuild --platform android` — generate native Android project
4. `./gradlew assembleDebug` — compile APK dengan Gradle
5. Upload APK sebagai artifact

## Dev Lokal (test di HP via Expo Go)

```bash
npm install
npm start
# Scan QR code dengan Expo Go di Android
```

## Fitur App

- **Dashboard** — Harga XAUUSD live (WebSocket TwelveData), RSI-14 untuk 5 TF, statistik sinyal, log
- **Sinyal** — Kartu sinyal BUY/SELL dengan filter ALL/OPEN/WIN/LOSS/PENDING
- **Fibo** — Level Fibonacci ZigZag per timeframe, filter per TF, marker harga mendekati level

## Stack
- React Native + Expo SDK 54
- TwelveData WebSocket — harga XAUUSD live
- TwelveData REST API — OHLC data per TF (update tiap 5 menit)
- ZigZag + Fibonacci Extension signal detection
- RSI-14 calculation

## Credits
ZIGZAG_FIBO BY GOGRAK

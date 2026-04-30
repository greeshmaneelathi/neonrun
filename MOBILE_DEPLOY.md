# NeonRun — Mobile & App Store Deployment Guide

## ✅ What's already done (in this build)
- Touch controls (left/right/jump buttons)
- PWA manifest (installable on iOS & Android)
- Service worker (works offline)
- Mobile viewport & safe area support (notch, home indicator)
- Landscape orientation lock
- Prevents iOS bounce scroll, zoom, context menu
- Multi-touch support (move + jump simultaneously)

---

## 🌐 Step 1: Deploy to web (required for all mobile options)

Deploy to Vercel or GitHub Pages as before. Your live URL is needed for the next steps.

---

## 📱 Option A: Add to Home Screen (easiest — no app store)

### iOS (Safari)
1. Open your game URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Name it "NeonRun" → tap **Add**
5. Opens fullscreen like a native app ✓

### Android (Chrome)
1. Open your game URL in Chrome
2. Tap the **⋮ menu** → **"Add to Home screen"**
3. Or Chrome shows an install banner automatically
4. Opens fullscreen like a native app ✓

---

## 📦 Option B: Wrap as Native App with Capacitor (App Store / Play Store)

### Prerequisites
```bash
node -v        # needs Node 16+
npm -v
# For iOS: Mac with Xcode installed
# For Android: Android Studio installed
```

### Setup
```bash
# 1. In your neonrun folder, init npm
cd neonrun
npm init -y

# 2. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# 3. Initialize
npx cap init NeonRun com.yourname.neonrun --web-dir .

# 4. Add platforms
npx cap add ios
npx cap add android

# 5. Sync your web files
npx cap sync
```

### iOS (App Store)
```bash
npx cap open ios
# Xcode opens → set your Team (Apple Developer account needed)
# Product → Archive → Distribute App → App Store Connect
```

### Android (Play Store)
```bash
npx cap open android
# Android Studio opens → Build → Generate Signed Bundle/APK
# Upload .aab to Google Play Console
```

---

## 🎮 Touch Controls Layout

```
[◀]  [▶]                    [▲ JUMP]
Left  Right              (right side, big)
```

- Tap LEFT/RIGHT to move
- Tap JUMP to jump (tap again mid-air = double jump)
- Controls appear automatically on touch devices
- Hidden on desktop

---

## 💡 Tips for App Store Approval

1. **Privacy Policy** — required. Use a free generator like privacypolicies.com
2. **Age Rating** — set to 4+ (no violence, no purchases)
3. **Screenshots** — take 3-5 on simulator at required sizes
4. **In-App Purchases** — none in this game, state "no" everywhere
5. **Description** — use the resume description from README.md

---

## 🔧 Recommended: Add real app icons

Replace the SVG emoji icon with proper PNGs:
- iOS needs: 1024×1024 PNG (no transparency)
- Android needs: 512×512 PNG

Tools: **MakeAppIcon** (makeappicon.com) — upload one 1024px image, get all sizes.

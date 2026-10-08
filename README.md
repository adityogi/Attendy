# Attendy — RVCE Attendance & CIE Eligibility Manager

A high-performance, offline-capable Progressive Web App (PWA) tailored for college students (pre-configured for RVCE CSE-AIML Section CI-A). Tracks class-by-class attendance, provides instant one-tap logging, and computes precise CIE (85%) exam eligibility and safe bunk counts.

---

## ⚡ Motorola Edge 60 Fusion Optimizations

Attendy is specifically fine-tuned for the **Moto Edge 60 Fusion** display and hardware specs:

| Feature | Moto Edge 60 Fusion Spec | Attendy Implementation |
|---|---|---|
| **P-OLED Display** | 6.67" Super HD+ (1220 × 2712 px) | Pure black theme (`#000000`) in dark mode turns off OLED pixels to maximize battery life. |
| **Refresh Rate** | 120Hz fluid panel | GPU-accelerated transitions via `will-change: transform` and tuned easing curves for zero-jank 120fps interactions. |
| **Pixel Density** | ~446 ppi | Sharp typography, crisp SVG vector icons, and scaled borders adapted for high-DPI viewports. |
| **Curved 3D Glass** | Quad-Curved edge-to-edge | Dynamic `env(safe-area-inset-*)` padding ensures buttons and headers never clip on curved edges. |
| **Gesture Navigation** | Android bottom bar | Extended bottom navigation padding (`safe-bottom`) prevents conflict with Android swipe navigation gestures. |
| **Haptic Feedback** | Linear vibration motor | Sub-audible 15ms haptic feedback pulses on tapping Present / Absent buttons (`navigator.vibrate(15)`). |
| **Touch Targets** | Ergonomic single-hand reach | 48dp minimum touch target sizes following Android Material Design standards. |

---

## 🚀 How to Host on Vercel

Attendy is 100% static and zero-dependency, making Vercel deployment instant and free.

### Option A: Using the Vercel CLI (Recommended)

1. Open your terminal and install Vercel CLI if you haven't already:
   ```bash
   npm i -g vercel
   ```
2. Navigate to this directory and deploy:
   ```bash
   cd /Users/roost/Downloads/Attendy
   vercel
   ```
3. Follow the quick prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* Select your personal account
   - *Link to existing project?* **N**
   - *Project name?* `attendy` (or your choice)
   - *Directory?* `./`
4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option B: Deploying via GitHub & Vercel Dashboard

1. Push this directory to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Attendy"
   git remote add origin https://github.com/<your-username>/attendy.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New** $\to$ **Project**.
4. Import your `attendy` repository.
5. Leave Framework Preset as **Other** (Root directory `./`).
6. Click **Deploy**. Vercel will immediately deploy and assign an SSL `https://attendy-*.vercel.app` URL.

---

## 📱 How to Install & Run on Android (Moto Edge 60 Fusion)

Once hosted on Vercel (or any HTTPS domain):

1. **Open Google Chrome** (or Edge / Brave) on your Moto Edge 60 Fusion.
2. Navigate to your deployed Vercel URL (e.g. `https://attendy.vercel.app`).
3. You will see an **"Install app"** banner, or tap the **three dots menu (⋮)** in the top right.
4. Tap **"Install app"** or **"Add to Home Screen"**.
5. Tap **Add**.
6. The app will install directly onto your home screen and app drawer as an independent, full-screen application without URL bars.

### PWA & Offline Capabilities:
- **100% Offline Support**: Works even with Airplane mode enabled using the Service Worker cache (`attendy-cache-v4`).
- **App Shortcuts**: Long-press the home screen icon on your Moto Edge 60 Fusion to quickly open:
  - 📅 *Mark Today's Attendance*
  - 🛡️ *CIE Eligibility Check*
  - 🔮 *Future Predictor*
- **Local Storage Isolation**: Your data remains private on your device; no database or external tracking required.

---

## 🌟 Key Features

### 1. 🏛️ Pre-Loaded Timetable: RVCE CSE (AIML) Section CI-A
- **Classroom**: `AIML CR-001`
- **Courses**:
  - `MA211TC`: Fundamentals of Linear Algebra & Calculus *(Dr. Satish V.M.)* — *pre-configured baseline 15/18*
  - `CM211IA`: Chemistry of Smart Materials *(Dr. Girisha kumar)*
  - `ME112GL`: Computer Aided Engineering Graphics Theory & Lab *(Dr. Ramakrishna Hegde)*
  - `XX113XTX`: Engineering Science Course-1
  - `XX115XIX`: Programming Language Courses (Theory & Lab)
  - `HS111EL`: Communicative English-1 *(Prof. Ramthilak)*
  - `HS112TC`: Indian Constitution *(Vageesh Hp)*
  - `HS115YL`: Health & Yoga Practice *(Rajesh / Manasa)*
  - `Experiential Learning` & `Counselling`
- **AI / Text Timetable Importer**: Paste any schedule or upload a photo to extract your slots via on-demand OCR (Tesseract.js).

### 2. 📅 Today's Classes & Daily Tracking
- One-tap marking:
  - **Present**: Increases attended and total counts.
  - **Absent**: Marks miss and alerts you immediately of your bunk buffer.
  - **Free / Cancelled**: Class called off; does not penalize percentage.
- **Catch-Up Banner**: Notifies you of any past unmarked sessions.
- **Mark All Present / All Absent**: Rapid bulk marking.
- **Add Extra Class**: Record substitute or compensation lectures.

### 3. 🎯 85% Target & Smart Bunk Calculator
- **Safe Zone ($\ge 85\%$)**:
  $$\text{Safe Bunks} = \left\lfloor \frac{\text{Attended} - 0.85 \times \text{Total}}{0.85} \right\rfloor$$
- **Shortage Zone ($< 85\%$)**:
  $$\text{Classes Needed} = \left\lceil \frac{0.85 \times \text{Total} - \text{Attended}}{1 - 0.85} \right\rceil$$
- **Custom Threshold**: Adjust per-course targets from 50% to 100% with the slider.

### 4. 🔮 Future Attendance Predictor
- Pick upcoming dates you plan to take off.
- Automatically takes 2026 RVCE college holidays into account.
- Simulates your projected semester percentage before you skip!

### 5. 📜 History, Audit Logs & Backup
- Complete record of dates, times, and reason chips (Medical, OD, Fest, etc.).
- Export / Import full JSON or CSV backups.

---

## 📁 File Structure

```
Attendy/
├── index.html       # Single-page application entry point (Vercel default)
├── styles.css       # Tailwind utility styles + Moto Edge 60 Fusion OLED & 120Hz rules
├── app.js           # Application engine, bunk calculator math, PWA shortcuts, haptics
├── sw.js            # Offline service worker (stale-while-revalidate)
├── manifest.json    # Android PWA manifest (shortcuts, standalone display, maskable icons)
├── vercel.json      # Vercel deployment configuration, security & caching headers
├── icon.svg         # High-resolution vector icon
├── rvce_holidays_2026.json # Pre-loaded RVCE academic holidays
└── README.md        # Documentation and deployment guide
```

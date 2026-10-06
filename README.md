# 🎓 MITS Campus Hub
### Muthoot Institute of Technology and Science (MITS) — S3 CS AI Student Utility App

A clean, modern, mobile-first utility app tailored for **S3 Computer Science & Artificial Intelligence (S3 CS AI, Jul-Dec 2026)** students at Muthoot Institute of Technology and Science (MITS Autonomous), Kochi, Kerala. Fast, responsive, and demo-ready for peers and faculty.

---

## 🚀 How to Run

1. **⚡ Live ETLAB Sync & Launch (`run.bat`)**:
   - Double-click `run.bat`.
   - It connects to `https://mits.etlab.app/user/login`, automatically logs in with your credentials, fetches the latest subject-wise attendance numbers, updates the app files, and opens MITS Campus Hub in your browser.

2. **Direct Launch (Offline / Standalone)**:
   - Double-click `index.html` in your file explorer (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).
   - Zero setup required, no node or build step needed.

3. **Mobile Simulation Frame on Desktop**:
   - On desktop screens, the app displays within an iPhone/Android style mobile device frame with realistic bezels.
   - Use the **"Full Width / Phone Frame"** toggle in the header anytime during presentations.

---

## 📱 Core Features

### 1. 📅 Timetable
- **Weekly Master Grid**: Complete Monday–Saturday schedule with time slots as rows and days as columns. Smooth horizontal scroll with fixed time columns.
- **"Today's View"**: Vertical timeline showing today's classes with room numbers (e.g., Faraday 204, Turing Lab, Newton 301) and faculty names.
- **Real-Time Indicator**: Automatically detects current period and highlights the **Ongoing** or **Up Next** class with an animated pulsing badge.
- **Full Editing**: Tap any class block or click **"+ Add Class"** to add, edit, or delete periods. Changes persist in local storage.

### 2. 📊 Attendance Tracker & 75% Bunk Calculator
- **75% Requirement Math**:
  - **If $\ge 75\%$**: Calculates exact maximum bunkable classes:
    $$\text{bunkable} = \left\lfloor \frac{4 \times \text{attended} - 3 \times \text{held}}{3} \right\rfloor$$
    *Example: Attended 28 of 32 (87.5%) $\rightarrow$ "You can safely miss 5 classes and stay $\ge 75\%$".*
  - **If $< 75\%$**: Calculates exact consecutive classes required to recover to 75%:
    $$\text{needed} = \max(1, 3 \times \text{held} - 4 \times \text{attended})$$
    *Example: Attended 19 of 28 (67.8%) $\rightarrow$ "Must attend next 8 consecutive classes to reach 75%".*
- **Visual Progress Rings**: Animated SVG circular progress ring for each subject and semester total.
  - 🟢 **Safe ($\ge 75\%$)**
  - 🟡 **Warning / Boundary ($70\% - 74.9\%$)**
  - 🔴 **Shortage ($< 70\%$)**
- **One-Tap Attendance Marking**:
  - **✓ Present** (+1 attended, +1 held)
  - **✕ Absent** (+0 attended, +1 held)
  - **– Cancelled** (faculty on leave; counts unchanged)
  - **↩ Undo Button**: Reverts mistaken taps immediately from a local history stack.
- **Subject Management**: Add new semester courses or adjust base counts anytime via the **"Manage"** modal.
---

## 👥 Multi-User ETLAB Live Sync Architecture

MITS Campus Hub is architected with a **Stateless, Zero-Database Architecture** tailored for the S3 CS AI class:
- **Zero Server Password Storage**: Student passwords are never saved to any database. They exist in server memory solely for the 2–3 seconds required to perform the ETLAB session handshake and are immediately discarded.
- **Client-Side Persistence**: Scraped attendance records and student profiles are cached in the user's browser `localStorage`, providing 0ms instant loading and complete offline functionality.
- **1-Tap Quick Sync**: Once connected, students can tap the header **"🔄 Sync"** button anytime to refresh attendance numbers from ETLAB in real time.

```
[ Classmate's Phone / Laptop ]
       │
       │ 1. Enter ETLAB Login (or tap "Sync")
       ▼
[ Scraper Backend API (Node.js on Render) ]
       │
       │ 2. Authenticates with ETLAB & discovers dynamic URL
       ▼
[ https://mits.etlab.app ]
       │
       │ 3. Returns HTML table with subject attendance
       ▼
[ Backend API parses JSON & discards credentials ]
       │
       ▼
[ Classmate's Phone / Laptop updates localStorage & dashboard ]
```

---

## 📂 Project Architecture

```
MITS/
├── backend/                      # Stateless Node.js ETLAB Scraper Microservice
│   ├── package.json              # Express, Cheerio, Axios, Tough-Cookie
│   ├── server.js                 # API server with rate-limiting & CORS
│   ├── scraper.js                # Dynamic CSRF, session, and table parser
│   ├── render.yaml               # 1-Click Render.com deployment blueprint
│   ├── Dockerfile                # Container deployment definition
│   └── README.md                 # Backend documentation
├── index.html                    # Standalone single-page app (React 18 + Tailwind + Babel)
├── vercel.json                   # Vercel deployment configuration
├── attendance_scraped.json       # Local fallback attendance cache
├── scrape_attendance.ps1         # Standalone PowerShell scraper utility
├── run.bat                       # 1-click local launch script
└── src/                          # Modular React components
    ├── App.js                    # Multi-user state orchestration
    ├── components/
    │   ├── Header.js             # Student greeting & 1-tap Sync button
    │   ├── SyncModal.js          # Interactive ETLAB connection modal
    │   ├── AttendanceTab.js      # Dynamic student profile, rings, bunk math
    │   ├── TimetableTab.js       # Today list & Weekly grid views
    │   ├── BottomNav.js          # Responsive bottom navigation bar
    │   └── Toast.js              # Toast notifications
    ├── services/
    │   └── etlabService.js       # Live API client & subject merger
    ├── data/
    │   └── defaultData.js        # S3 CS AI master timetable & course list
    └── utils/
        └── attendanceMath.js     # 90% (Internal marks) & 75% (Eligibility) formulas
```

---

## ☁️ Free Cloud Deployment

### 1. Backend Scraper (Render.com - 100% Free)
1. Push this repository to GitHub.
2. Go to [Render.com](https://render.com) and create a **New Web Service**.
3. Select your repository, set **Root Directory** to `backend`.
4. Render automatically detects `npm install` and `node server.js`.
5. Deploy and copy your HTTPS service URL (e.g., `https://mits-scraper.onrender.com`).

### 2. Frontend Web App (Vercel / GitHub Pages - 100% Free)
1. Go to [Vercel.com](https://vercel.com) and import the repository.
2. Set root directory to `MITS`.
3. Deploy! Vercel automatically deploys the frontend with SSL and fast CDN routing.
4. Open the deployed app, open the **Sync Modal** $\rightarrow$ **Advanced Settings**, and set your Render API URL. All classmates can now connect and sync their attendance anytime!

---

## 🎨 Design System
- **Light Theme**: Soft Dashboard Canvas (`#dbe4f3` / `#ffffff`)
- **Dark Theme**: Helios Deep Surface (`#121114` / `#1a1921`) with fuchsia & violet ambient glows
- **Typography**: Plus Jakarta Sans & Inter
- **Offline First**: Instant startup with Service Worker PWA caching (`sw.js`).


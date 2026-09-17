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

## 📂 Project Architecture

```
MITS/
├── index.html                    # Standalone single-page app (React 18 + Tailwind CDN + Babel)
├── README.md                     # Documentation & usage guide
└── src/                          # Modular source files for future backend integration
    ├── App.js                    # Core App component and state synchronization
    ├── components/
    │   ├── Header.js             # MITS branding, date, and frame toggle
    │   ├── BottomNav.js          # Bottom navigation with active indicators
    │   ├── TimetableTab.js       # Today list & Weekly grid views
    │   ├── AttendanceTab.js      # Circular rings, bunk math, quick actions
    │   ├── EditTimetableModal.js # Add/Edit schedule slot modal
    │   ├── ManageSubjectsModal.js# Add/Edit subjects & counts
    │   └── Toast.js              # Feedback toasts
    ├── data/
    │   └── defaultData.js        # MITS S3 CS AI schedule & faculty data
    └── utils/
        └── attendanceMath.js     # Exact 75% attendance and bunk formulas
```

---

## 🎨 Design System
- **Primary Color**: Academic Navy (`#0b1e3d` / `#1e3a8a`)
- **Accent Color**: Warm Amber Gold (`#f59e0b` / `#fbbf24`)
- **Typography**: Plus Jakarta Sans & Inter
- **Storage**: Browser `localStorage` for offline persistence across page reloads.

# 📋 MITS Campus Hub — Project Handover & Status Summary

**Date Saved:** October 6, 2026  
**Target Class:** MITS S3 CS AI (Jul–Dec 2026, Autonomous)  
**Status:** ✅ Fully Implemented, Synchronized & Ready for Testing  

---

## 📌 Summary of Completed Work

### 1. Multi-User ETLAB Live Sync Architecture
- **Stateless Microservice (`backend/`)**:
  - Express API listening on port 4000 (`POST /api/scrape-attendance`).
  - Zero password storage: credentials exist strictly in-memory during sync and are immediately discarded.
  - Ephemeral `tough-cookie` jars prevent session crosstalk.
  - Multi-page probing across `student/home`, `student/profile`, and `ktuacademics/student/viewattendancesubject`.
  - Automatic fallback & auto-detection for Shawn Subin Philip (`25CT256` / `MITS25UCA065` $\rightarrow$ `46380601013`).
  - Rate limiting (20 requests per 5 minutes per IP) & CORS enabled.

### 2. Streamlined Onboarding Login UX Flow
- **Auto-Prompt on Entry**: First-time visitors and unauthenticated students are immediately greeted with the Login Modal (*"Welcome to MITS Hub 👋"*).
- **Guest Option**: Students can tap *"Explore Demo Mode"* to preview timetables without logging in immediately (dismissal saved to `sessionStorage`).
- **Clean Header**: Redundant "Account & Portal Sync Settings" gear button in the top right has been removed.
- **Interactive Greeting**: The `👋 Shawn` greeting chip is now clickable, allowing users to view sync details, switch account, or disconnect cleanly.

### 3. Attendance & Bunk Intelligence
- **Dual Bunk Tiers**:
  - **Tier 1 (90% Marks Threshold)**: Can bunk classes while keeping 5 internal marks:
    $$\text{bunkable}_{90} = \left\lfloor \frac{10 \times \text{attended} - 9 \times \text{held}}{9} \right\rfloor$$
  - **Tier 2 (75% Exam Eligibility)**: Can bunk classes while staying eligible for semester exams:
    $$\text{bunkable}_{75} = \left\lfloor \frac{4 \times \text{attended} - 3 \times \text{held}}{3} \right\rfloor$$
- **What-If Bunk Simulator**: Interactive 3-scenario calculator synced with the class timetable:
  1. *1st Hour Off*
  2. *First 4 Hours Off*
  3. *Entire Day Off*
- **Subject-Wise Progress Rings**: Individual course cards with color codes, faculty info, and batch absence application.

### 4. S3 CS AI Master Timetable
- Verified timetable for S3 CS AI (Room 512, Turing Lab, Lovelace Lab).
- Custom Friday schedule (Recess after Period 2; Period 5 ends at 12:40 PM).

### 5. Dual Visual Themes
- **Helios Dark Mode**: Vibrant cyber-neon dark aesthetic (`#121114`, `#1a1921`).
- **Soft Light Dashboard**: Clean, crisp academic dashboard (`#dbe4f3`, `#ffffff`).

---

## 🚀 How to Resume Work

Whenever you want to continue working on this project:

### Step 1: Start the Scraper Backend
In your terminal:
```powershell
cd "c:\Users\HP\OneDrive\Desktop\EVERYTHING\Projects\MITS\backend"
npm start
```
*(Verify output: `🚀 MITS Campus Hub Scraper API running on port 4000`)*

### Step 2: Open the Web App
Open [index.html](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/index.html) in your browser:
- The app will automatically prompt you with the Login Modal.
- Enter `25CT256` and `Shawn@2007`.
- Tap **"Connect & Sync"**.
- Your live attendance and bunk metrics will populate immediately.

### Step 3 (Optional): Deploy Free to Cloud
- **Frontend**: Deploy to Vercel or GitHub Pages (already configured via `vercel.json`).
- **Backend**: Deploy to Render.com using [backend/render.yaml](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/backend/render.yaml).

---

## 📂 Key Files Reference

- [index.html](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/index.html) — Standalone single-page distribution
- [backend/scraper.js](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/backend/scraper.js) — ETLAB scraping and attendance parsing logic
- [backend/server.js](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/backend/server.js) — Express REST API service
- [src/components/SyncModal.js](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/src/components/SyncModal.js) — Login & sync modal component
- [src/components/Header.js](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/src/components/Header.js) — Clean header with interactive student chip
- [src/App.js](file:///c:/Users/HP/OneDrive/Desktop/EVERYTHING/Projects/MITS/src/App.js) — Main React application container

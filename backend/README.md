# 🚀 MITS Campus Hub — Scraper Backend Microservice

A stateless, privacy-first Node.js microservice that logs into the **MITS ETLAB** student portal (`https://mits.etlab.app`), dynamically resolves individual student attendance links, parses subject-wise records, and calculates **90% (Internal marks)** and **75% (Exam eligibility)** bunk telemetry.

---

## 🔒 Privacy & Architecture Principles

- **Zero Database / Zero Storage**: Student passwords are **NEVER** stored in any database or written to disk.
- **In-Memory Lifespan**: Credentials exist in server RAM only for the 2–3 seconds required to execute the ETLAB HTTP session and are immediately garbage-collected.
- **Isolated Sessions**: Every incoming request creates an ephemeral `tough-cookie` jar, guaranteeing zero cross-contamination between students.

---

## 🛠️ Local Setup & Running

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   # Or for auto-reload during development:
   npm run dev
   ```

3. **Verify the server is running**:
   ```bash
   curl http://localhost:4000/api/health
   ```

---

## 📡 API Reference

### `POST /api/scrape-attendance`

Fetches and parses live attendance records from ETLAB.

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "25CT256",
  "password": "your_etlab_password"
}
```

**Successful Response (`200 OK`)**:
```json
{
  "success": true,
  "timestamp": "2026-10-06 11:30:00",
  "targetUrl": "https://mits.etlab.app/ktuacademics/student/viewattendancesubject/46380601013",
  "student": {
    "name": "SHAWN SUBIN PHILIP",
    "rollNo": "65",
    "regNo": "MITS25UCA065"
  },
  "overall": {
    "totalAttended": 278,
    "totalHeld": 298,
    "percentage": 93,
    "bunkTill90": 10,
    "bunkTill75": 72
  },
  "subjects": [
    {
      "courseId": "B250802/CN310B",
      "code": "CN310B",
      "attended": 59,
      "held": 63,
      "percentage": 94,
      "bunkTill90": 1,
      "bunkTill75": 7,
      "neededFor90": 0,
      "neededFor75": 0
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Missing username or password.
- `401 Unauthorized`: Invalid ETLAB username or password.
- `429 Too Many Requests`: Rate limit exceeded (more than 20 requests in 5 minutes).
- `502 / 503 Service Unavailable`: ETLAB is unreachable or undergoing maintenance.

---

## ☁️ 1-Click Free Deployment to Render

1. Create a free account on [Render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **Create Web Service**. Render gives you a live HTTPS URL (e.g. `https://mits-scraper.onrender.com`).
6. Paste your Render URL into the MITS Hub web app under the Sync Settings modal!

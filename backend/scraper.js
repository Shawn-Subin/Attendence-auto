/**
 * MITS ETLAB Attendance Scraper Module
 * Dynamically logs into mits.etlab.app, resolves the student's attendance URL,
 * parses the attendance table, and calculates 90% and 75% bunk limits.
 */

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const cheerio = require('cheerio');

const ETLAB_BASE_URL = 'https://mits.etlab.app';
const LOGIN_URL = `${ETLAB_BASE_URL}/user/login`;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Creates an Axios client with an isolated CookieJar for a single scrape request.
 * Ensures zero cross-talk between multiple students.
 */
function createSessionClient() {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 25000,
      maxRedirects: 5
    })
  );
  return { client, jar };
}

/**
 * Scrapes attendance for a given username and password.
 * 
 * @param {string} username - ETLAB username (e.g. "25CT256")
 * @param {string} password - ETLAB password
 * @param {string} [customAttendanceUrl] - Optional pre-known attendance URL
 * @returns {Promise<Object>} Scraped attendance payload
 */
async function scrapeAttendance(username, password, customAttendanceUrl = null) {
  if (!username || !password) {
    const error = new Error('Username and password are required');
    error.status = 400;
    throw error;
  }

  const { client } = createSessionClient();

  // ----------------------------------------------------
  // Step 1: Fetch Login Page & Extract CSRF Token
  // ----------------------------------------------------
  let loginPageRes;
  try {
    loginPageRes = await client.get(LOGIN_URL);
  } catch (err) {
    const error = new Error('Unable to connect to ETLAB login portal. Service might be down.');
    error.status = 503;
    error.details = err.message;
    throw error;
  }

  const $login = cheerio.load(loginPageRes.data);
  let csrfToken = $login('input[name="YII_CSRF_TOKEN"]').val();

  if (!csrfToken) {
    const match1 = loginPageRes.data.match(/YII_CSRF_TOKEN":\s*"([^"]+)"/);
    const match2 = loginPageRes.data.match(/name="YII_CSRF_TOKEN"\s+value="([^"]+)"/);
    csrfToken = match1 ? match1[1] : (match2 ? match2[1] : '');
  }

  // ----------------------------------------------------
  // Step 2: Authenticate with ETLAB
  // ----------------------------------------------------
  const params = new URLSearchParams();
  params.append('LoginForm[username]', username.trim());
  params.append('LoginForm[password]', password);
  params.append('yt0', 'Login');
  if (csrfToken) {
    params.append('YII_CSRF_TOKEN', csrfToken);
  }

  let loginPostRes;
  try {
    loginPostRes = await client.post(LOGIN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': LOGIN_URL
      }
    });
  } catch (err) {
    const error = new Error('Failed to send login request to ETLAB.');
    error.status = 502;
    throw error;
  }

  const loginHtml = loginPostRes.data;
  const $afterLogin = cheerio.load(loginHtml);

  // Check for authentication failure
  const flashError = $afterLogin('.flash-error').text().trim();
  const hasAuthError = 
    flashError ||
    loginHtml.includes('Incorrect username or password') ||
    loginHtml.includes('Username or password cannot be blank');

  const isLoggedIn =
    !hasAuthError &&
    (loginHtml.includes('Logout') ||
     loginHtml.includes('student/profile') ||
     loginHtml.includes('student/home') ||
     loginHtml.includes('/user/logout'));

  if (!isLoggedIn) {
    const errorMsg = flashError || 'Incorrect ETLAB username or password.';
    const error = new Error(errorMsg);
    error.status = 401;
    throw error;
  }

  // ----------------------------------------------------
  // Step 3: Discover Student's Dynamic Attendance URL
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Step 3: Discover Student's Dynamic Attendance URL
  // ----------------------------------------------------
  let targetUrl = null;

  // 3a. If caller passed a custom URL or studentId, use it
  if (customAttendanceUrl && customAttendanceUrl.trim()) {
    const rawCustom = customAttendanceUrl.trim();
    if (/^\d{8,14}$/.test(rawCustom)) {
      targetUrl = `${ETLAB_BASE_URL}/ktuacademics/student/viewattendancesubject/${rawCustom}`;
    } else if (rawCustom.startsWith('http')) {
      targetUrl = rawCustom;
    } else {
      targetUrl = `${ETLAB_BASE_URL}/${rawCustom.replace(/^\/+/, '')}`;
    }
    console.log(`[Scraper] Using provided target URL: ${targetUrl}`);
  }

  // 3b. Probing candidates: check login redirect HTML first
  if (!targetUrl) {
    targetUrl = findAttendanceLinkInHtml(loginHtml);
    if (targetUrl) console.log(`[Scraper] Found attendance link in post-login page: ${targetUrl}`);
  }

  // 3c. Probe /student/home
  if (!targetUrl) {
    try {
      console.log(`[Scraper] Probing ${ETLAB_BASE_URL}/student/home...`);
      const homeRes = await client.get(`${ETLAB_BASE_URL}/student/home`);
      targetUrl = findAttendanceLinkInHtml(homeRes.data);
      if (targetUrl) console.log(`[Scraper] Found attendance link in student/home: ${targetUrl}`);
    } catch (e) {
      console.log(`[Scraper] Failed probing student/home: ${e.message}`);
    }
  }

  // 3d. Probe /student/profile (ETLAB lists semester registrations on the profile page)
  if (!targetUrl) {
    try {
      console.log(`[Scraper] Probing ${ETLAB_BASE_URL}/student/profile...`);
      const profRes = await client.get(`${ETLAB_BASE_URL}/student/profile`);
      targetUrl = findAttendanceLinkInHtml(profRes.data);
      if (targetUrl) console.log(`[Scraper] Found attendance link in student/profile: ${targetUrl}`);
    } catch (e) {
      console.log(`[Scraper] Failed probing student/profile: ${e.message}`);
    }
  }

  // 3e. Probe /ktuacademics/student/home or /ktuacademics/student/index
  if (!targetUrl) {
    try {
      console.log(`[Scraper] Probing ${ETLAB_BASE_URL}/ktuacademics/student/home...`);
      const acadHomeRes = await client.get(`${ETLAB_BASE_URL}/ktuacademics/student/home`);
      targetUrl = findAttendanceLinkInHtml(acadHomeRes.data);
      if (targetUrl) console.log(`[Scraper] Found attendance link in ktuacademics/student/home: ${targetUrl}`);
    } catch (_) {}
  }

  // 3f. Probe /ktuacademics/student/viewattendancesubject directly
  if (!targetUrl) {
    try {
      console.log(`[Scraper] Probing ${ETLAB_BASE_URL}/ktuacademics/student/viewattendancesubject...`);
      const acadRes = await client.get(`${ETLAB_BASE_URL}/ktuacademics/student/viewattendancesubject`);
      if (acadRes.request?.res?.responseUrl && acadRes.request.res.responseUrl.includes('viewattendancesubject/')) {
        targetUrl = acadRes.request.res.responseUrl;
        console.log(`[Scraper] viewattendancesubject redirected to: ${targetUrl}`);
      } else if (acadRes.status === 200 && acadRes.data && acadRes.data.includes('<table')) {
        targetUrl = `${ETLAB_BASE_URL}/ktuacademics/student/viewattendancesubject`;
        console.log(`[Scraper] Direct viewattendancesubject contains table!`);
      } else {
        targetUrl = findAttendanceLinkInHtml(acadRes.data);
      }
    } catch (_) {}
  }

  // 3g. Known fallback for Shawn Subin Philip (25CT256 / MITS25UCA065)
  if (!targetUrl) {
    const cleanUser = username.trim().toUpperCase();
    if (cleanUser.includes('25CT256') || cleanUser.includes('MITS25UCA065') || cleanUser.includes('SHAWN')) {
      targetUrl = `${ETLAB_BASE_URL}/ktuacademics/student/viewattendancesubject/46380601013`;
      console.log(`[Scraper] Applied verified fallback URL for Shawn: ${targetUrl}`);
    }
  }

  if (!targetUrl) {
    const error = new Error('Authenticated successfully, but could not automatically locate attendance URL. Please enter your semester attendance ID in Advanced Options (or verify ETLAB portal permissions).');
    error.status = 404;
    throw error;
  }

  if (!targetUrl.startsWith('http')) {
    targetUrl = targetUrl.startsWith('/') ? `${ETLAB_BASE_URL}${targetUrl}` : `${ETLAB_BASE_URL}/${targetUrl}`;
  }

  // ----------------------------------------------------
  // Step 4: Fetch Attendance Table Page
  // ----------------------------------------------------
  let attRes;
  try {
    attRes = await client.get(targetUrl);
  } catch (err) {
    const error = new Error('Failed to fetch attendance records from ETLAB.');
    error.status = 502;
    throw error;
  }

  const attHtml = attRes.data;
  const $att = cheerio.load(attHtml);

  const $table = $att('table.items.table, table.table').first();
  if (!$table || $table.length === 0) {
    const error = new Error('Attendance table not found on ETLAB page.');
    error.status = 500;
    throw error;
  }

  // ----------------------------------------------------
  // Step 5: Parse Table & Calculate Bunk Telemetry
  // ----------------------------------------------------
  const headerCols = [];
  $table.find('thead th, tr:first-child th').each((_, el) => {
    headerCols.push($att(el).text().replace(/\s+/g, ' ').trim());
  });

  const bodyCells = [];
  $table.find('tbody tr:first-child td, tr:nth-child(2) td').each((_, el) => {
    bodyCells.push($att(el).text().replace(/\s+/g, ' ').trim());
  });

  if (headerCols.length === 0 || bodyCells.length === 0) {
    const error = new Error('Failed to extract table cells from attendance data.');
    error.status = 500;
    throw error;
  }

  // Student metadata
  const regNo = bodyCells[0] || '';
  const rollNo = bodyCells[1] || '';
  const studentName = bodyCells[2] || '';

  const parsedSubjects = [];
  let totalAttended = 0;
  let totalHeld = 0;

  for (let i = 3; i < headerCols.length; i++) {
    const colName = headerCols[i];
    if (colName === 'Total' || colName === 'Percentage') continue;

    if (i < bodyCells.length) {
      const cellValue = bodyCells[i];
      const match = cellValue.match(/(\d+)\s*\/\s*(\d+)(?:\s*\(([\d.]+)%\))?/);

      if (match) {
        const attended = parseInt(match[1], 10);
        const held = parseInt(match[2], 10);
        const rawPct = match[3] ? parseFloat(match[3]) : (held > 0 ? (attended / held) * 100 : 100);
        const percentage = Math.round(rawPct);

        // Extract clean course code: "B250802/CN310B" -> "CN310B"
        let code = colName;
        const codeMatch = colName.match(/\/([A-Za-z0-9_]+)$/);
        if (codeMatch) {
          code = codeMatch[1];
        }

        // Bunk calculation formulas:
        // Tier 1: 90% (5 full internal marks) -> floor((10 * attended - 9 * held) / 9)
        // Tier 2: 75% (exam eligibility)    -> floor((4 * attended - 3 * held) / 3)
        const bunkTill90 = Math.max(0, Math.floor((10 * attended - 9 * held) / 9));
        const bunkTill75 = Math.max(0, Math.floor((4 * attended - 3 * held) / 3));

        // Needed to recover if below threshold:
        const neededFor90 = attended / held < 0.9 ? Math.max(1, Math.floor((0.9 * held - attended) / 0.1) + 1) : 0;
        const neededFor75 = attended / held < 0.75 ? Math.max(1, Math.floor((0.75 * held - attended) / 0.25) + 1) : 0;

        parsedSubjects.push({
          courseId: colName,
          code,
          attended,
          held,
          percentage,
          bunkTill90,
          bunkTill75,
          neededFor90,
          neededFor75
        });

        totalAttended += attended;
        totalHeld += held;
      }
    }
  }

  const overallPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 100;
  const overallBunk90 = Math.max(0, Math.floor((10 * totalAttended - 9 * totalHeld) / 9));
  const overallBunk75 = Math.max(0, Math.floor((4 * totalAttended - 3 * totalHeld) / 3));

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return {
    success: true,
    timestamp,
    targetUrl,
    student: {
      name: studentName,
      rollNo,
      regNo
    },
    overall: {
      totalAttended,
      totalHeld,
      percentage: overallPct,
      bunkTill90: overallBunk90,
      bunkTill75: overallBunk75
    },
    subjects: parsedSubjects
  };
}

/**
 * Searches HTML text for any link leading to the attendance page.
 */
function findAttendanceLinkInHtml(html) {
  if (!html) return null;
  const $ = cheerio.load(html);

  // Strategy 1: specific anchor with viewattendancesubject
  const anchor = $('a[href*="viewattendancesubject"]').first();
  if (anchor.length > 0 && anchor.attr('href')) {
    return anchor.attr('href');
  }

  // Strategy 2: anchor with viewattendance or attendancesubject
  const altAnchor = $('a[href*="viewattendance"], a[href*="attendancesubject"]').first();
  if (altAnchor.length > 0 && altAnchor.attr('href')) {
    return altAnchor.attr('href');
  }

  // Strategy 3: Regex match for url pattern in HTML / scripts / onclick
  const regexMatch = html.match(/(?:href=["']|url\s*:\s*["'])([^"']*(?:viewattendancesubject|viewattendance|attendancesubject)[^"']*)/i);
  if (regexMatch) {
    return regexMatch[1];
  }

  // Strategy 4: Search for attendance link with numeric ID in raw text
  const idMatch = html.match(/(?:ktuacademics\/student\/viewattendancesubject\/|\/viewattendancesubject\/)(\d{8,14})/i);
  if (idMatch) {
    return `https://mits.etlab.app/ktuacademics/student/viewattendancesubject/${idMatch[1]}`;
  }

  // Strategy 5: Search for student registration ID in student profile links
  const studentRegMatch = html.match(/\/ktuacademics\/student\/[a-zA-Z]+\/(\d{10,12})/i);
  if (studentRegMatch) {
    return `https://mits.etlab.app/ktuacademics/student/viewattendancesubject/${studentRegMatch[1]}`;
  }

  return null;
}

module.exports = {
  scrapeAttendance
};

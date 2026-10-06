/**
 * ETLAB Sync Service for MITS Campus Hub
 * Handles communication with the scraper backend, local credential persistence,
 * and intelligent subject matching and merging.
 */

export const STORAGE_KEYS = {
  CREDENTIALS: 'mits_saved_credentials_v1',
  STUDENT_PROFILE: 'mits_student_profile_v1',
  LAST_SYNC_INFO: 'mits_last_synced_info',
  BACKEND_API_URL: 'mits_backend_api_url',
  APPLIED_SYNC_TIMESTAMP: 'mits_applied_sync_timestamp'
};

// Default fallback backend URL (can be customized by students in the UI)
export const DEFAULT_BACKEND_URL = 'http://localhost:4000';

/**
 * Gets the configured backend API URL from local storage or defaults.
 */
export function getBackendApiUrl() {
  return localStorage.getItem(STORAGE_KEYS.BACKEND_API_URL) || DEFAULT_BACKEND_URL;
}

/**
 * Sets a custom backend API URL (e.g. deployed Render URL).
 */
export function setBackendApiUrl(url) {
  if (url) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEYS.BACKEND_API_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEYS.BACKEND_API_URL);
  }
}

/**
 * Gets stored credentials from localStorage (if student checked "Remember on this device")
 */
export function getStoredCredentials() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && parsed.username && parsed.password) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved credentials', e);
  }
  return null;
}

/**
 * Saves student credentials locally for 1-tap quick sync.
 */
export function saveCredentials(username, password, studentId = '') {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify({ username: username.trim(), password, studentId: studentId ? studentId.trim() : '' })
    );
  } catch (e) {
    console.error('Failed to save credentials', e);
  }
}

/**
 * Clears stored credentials and logs out student session.
 */
export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
  localStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILE);
}

/**
 * Gets active student profile from localStorage.
 */
export function getStoredStudentProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

/**
 * Saves active student profile to localStorage.
 */
export function saveStudentProfile(student) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(student));
  } catch (e) {}
}

/**
 * Performs a live attendance scrape via the backend microservice.
 */
export async function fetchLiveAttendance(username, password, studentId = null, customApiUrl = null) {
  const apiUrl = (customApiUrl || getBackendApiUrl()).trim().replace(/\/+$/, '');
  const endpoint = `${apiUrl}/api/scrape-attendance`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
        studentId: studentId ? studentId.trim() : undefined
      })
    });
  } catch (err) {
    throw new Error(
      `Cannot connect to scraper backend at ${apiUrl}. Please check your internet connection or verify the backend server is running.`
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    const errorMessage = result.error || `Sync failed with HTTP status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return result;
}

/**
 * Intelligent matcher that merges scraped attendance into the existing class subject list.
 * Preserves custom UI colors, faculty assignments, and classroom metadata.
 */
export function matchAndMergeSubjects(scrapedSubjects, currentSubjects = []) {
  if (!Array.isArray(scrapedSubjects) || scrapedSubjects.length === 0) {
    return currentSubjects;
  }

  const updatedSubjects = [...currentSubjects];
  const matchedScrapedCodes = new Set();

  // First pass: update existing subjects
  const result = updatedSubjects.map(sub => {
    const match = scrapedSubjects.find(s => {
      const codeA = (s.code || '').trim().toUpperCase();
      const codeB = (sub.code || '').trim().toUpperCase();
      const courseIdA = (s.courseId || '').trim().toUpperCase();
      const courseIdB = (sub.courseId || '').trim().toUpperCase();
      return (codeA && codeA === codeB) || (courseIdA && courseIdA === courseIdB);
    });

    if (match) {
      matchedScrapedCodes.add((match.code || '').toUpperCase());
      return {
        ...sub,
        attended: match.attended !== undefined ? match.attended : match.Attended,
        held: match.held !== undefined ? match.held : match.Held
      };
    }
    return sub;
  });

  // Second pass: dynamically append any new subjects found in the student's portal
  const palette = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
  scrapedSubjects.forEach((s, idx) => {
    const sCode = (s.code || '').trim().toUpperCase();
    if (sCode && !matchedScrapedCodes.has(sCode)) {
      const attended = s.attended !== undefined ? s.attended : s.Attended || 0;
      const held = s.held !== undefined ? s.held : s.Held || 0;
      result.push({
        id: `sub-dynamic-${sCode.toLowerCase()}`,
        code: sCode,
        courseId: s.courseId || s.CourseId || sCode,
        name: s.name || sCode,
        shortName: sCode,
        faculty: 'Class Faculty',
        color: palette[idx % palette.length],
        attended,
        held,
        room: 'Room 512'
      });
    }
  });

  return result;
}

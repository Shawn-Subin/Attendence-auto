// Attendance calculation utilities for MITS Campus Hub
// Tier 1: 90% Threshold (Full 5 Internal Marks)
// Tier 2: 75% Threshold (University Exam Eligibility Minimum)

export const MARKS_ATTENDANCE_TARGET = 90;
export const MIN_ATTENDANCE_TARGET = 75;

/**
 * Calculates attendance percentage rounded to 1 decimal
 */
export function calculatePercentage(attended, held) {
  if (!held || held <= 0) return 100;
  const pct = (attended / held) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Status colors and badges based on the 90% (5 marks) and 75% (eligibility) tiers
 */
export function getAttendanceStatus(percentage) {
  if (percentage >= 90) {
    return {
      status: 'full-marks',
      label: '5 Marks Zone (≥90%)',
      color: 'amber',
      ringColor: '#f59e0b', // Gold / Amber ring
      bgColor: 'bg-amber-500/10 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
    };
  } else if (percentage >= 75) {
    return {
      status: 'eligible',
      label: 'Safe (75-89%)',
      color: 'emerald',
      ringColor: '#10b981', // Emerald green
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    };
  } else if (percentage >= 70) {
    return {
      status: 'warning',
      label: 'Near Boundary (70-74%)',
      color: 'orange',
      ringColor: '#f97316',
      bgColor: 'bg-orange-500/10 dark:bg-orange-950/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-500/30',
      badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    };
  } else {
    return {
      status: 'critical',
      label: 'Shortage (<70%)',
      color: 'rose',
      ringColor: '#f43f5e',
      bgColor: 'bg-rose-500/10 dark:bg-rose-950/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-500/30',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
    };
  }
}

/**
 * Calculates exact consecutive classes required to reach a target attendance percentage (default 90%).
 * - To reach >= targetPct: ceil((target * held - 100 * attended) / (100 - target))
 * - To get strictly OVER targetPct (> targetPct): floor((target * held - 100 * attended) / (100 - target)) + 1
 */
export function getClassesToReachTarget(attended, held, targetPct = 90, strictlyOver = false) {
  if (held <= 0) return 0;
  const currentPct = (attended / held) * 100;
  
  if (strictlyOver) {
    if (currentPct > targetPct) return 0;
    const diff = (targetPct * held - 100 * attended) / (100 - targetPct);
    return Math.max(1, Math.floor(diff) + 1);
  }

  if (currentPct >= targetPct) return 0;
  const needed = Math.ceil((targetPct * held - 100 * attended) / (100 - targetPct));
  return Math.max(1, needed);
}

/**
 * Calculates bunks till 90% (5 Marks) OR bunks till 75% if below 90%
 * 
 * Target 90% Condition:
 *   attended / (held + bunk90) >= 0.90
 *   => 10 * attended >= 9 * (held + bunk90)
 *   => 9 * bunk90 <= 10 * attended - 9 * held
 *   => bunk90 = floor((10 * attended - 9 * held) / 9)
 * 
 * Target 75% Condition (when attendance < 90%):
 *   bunk75 = floor((4 * attended - 3 * held) / 3)
 * 
 * Recovery to 75% Condition (when attendance < 75%):
 *   needed75 = max(1, 3 * held - 4 * attended)
 */
export function calculateBunkInfo(attended, held) {
  if (held === 0) {
    return {
      type: 'initial',
      tier: 90,
      count: 0,
      message: 'No classes conducted yet'
    };
  }

  const pct = (attended / held) * 100;

  // Case 1: Attendance is AT OR ABOVE 90% (Full 5 marks secured)
  if (pct >= 90) {
    const bunk90 = Math.floor((10 * attended - 9 * held) / 9);
    const bunk75 = Math.floor((4 * attended - 3 * held) / 3);

    if (bunk90 === 0) {
      return {
        type: 'edge-90',
        tier: 90,
        count: 0,
        bunksTo75: bunk75,
        message: '⭐ 5 Marks Edge: Missing the next class drops attendance below 90%!'
      };
    }

    return {
      type: 'safe-90',
      tier: 90,
      count: bunk90,
      bunksTo75: bunk75,
      message: `⭐ 5 Marks Safe: You can bunk ${bunk90} ${bunk90 === 1 ? 'class' : 'classes'} till you drop below 90%`
    };
  }

  // Case 2: Attendance is BELOW 90% but AT OR ABOVE 75% (Show bunks till 75%)
  if (pct >= 75) {
    const bunk75 = Math.floor((4 * attended - 3 * held) / 3);
    const neededFor90 = Math.max(1, 9 * held - 10 * attended);

    if (bunk75 === 0) {
      return {
        type: 'edge-75',
        tier: 75,
        count: 0,
        neededFor90,
        message: '⚡ 75% Boundary: Missing the next class causes exam shortage (<75%)!'
      };
    }

    return {
      type: 'bunk-to-75',
      tier: 75,
      count: bunk75,
      neededFor90,
      message: `⚠️ Below 90%: You can bunk ${bunk75} ${bunk75 === 1 ? 'class' : 'classes'} till you drop below 75%`
    };
  }

  // Case 3: Attendance is BELOW 75% (Shortage recovery)
  const needed75 = Math.max(1, (3 * held) - (4 * attended));
  return {
    type: 'recovery-75',
    tier: 75,
    count: needed75,
    message: `🚨 Shortage Alert: Must attend next ${needed75} consecutive ${needed75 === 1 ? 'class' : 'classes'} to reach 75%`
  };
}

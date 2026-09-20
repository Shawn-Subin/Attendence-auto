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
      marks: 5,
      marksLabel: '5 Mark',
      label: '5 Mark (≥90%)',
      color: 'amber',
      ringColor: '#f59e0b', // Gold / Amber ring
      bgColor: 'bg-amber-500/10 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
    };
  } else if (percentage >= 85) {
    return {
      status: 'four-marks',
      marks: 4,
      marksLabel: '4 Mark',
      label: '4 Mark (85-90%)',
      color: 'blue',
      ringColor: '#3b82f6', // Blue ring
      bgColor: 'bg-blue-500/10 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500/30',
      badgeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40'
    };
  } else if (percentage >= 80) {
    return {
      status: 'three-marks',
      marks: 3,
      marksLabel: '3 Mark',
      label: '3 Mark (80-85%)',
      color: 'teal',
      ringColor: '#14b8a6', // Teal ring
      bgColor: 'bg-teal-500/10 dark:bg-teal-950/30',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30',
      badgeBg: 'bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-300/40'
    };
  } else if (percentage >= 75) {
    return {
      status: 'two-marks',
      marks: 2,
      marksLabel: '2 Mark',
      label: '2 Mark (75-80%)',
      color: 'emerald',
      ringColor: '#10b981', // Emerald green ring
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40'
    };
  } else {
    return {
      status: 'critical',
      marks: 0,
      marksLabel: '0 Mark',
      label: 'Shortage (<75%)',
      color: 'rose',
      ringColor: '#f43f5e', // Rose red ring
      bgColor: 'bg-rose-500/10 dark:bg-rose-950/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-500/30',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300/40'
    };
  }
}

/**
 * Calculates classes needed to reach target percentage
 */
export function getClassesToReachTarget(attended, held, targetPct, strict = false) {
  if (held === 0) return 0;
  const currentPct = (attended / held) * 100;
  
  if (strict) {
    if (currentPct > targetPct) return 0;
    const diff = (targetPct * held - 100 * attended) / (100 - targetPct);
    return Math.max(1, Math.floor(diff) + 1);
  }

  if (currentPct >= targetPct) return 0;
  const needed = Math.ceil((targetPct * held - 100 * attended) / (100 - targetPct));
  return Math.max(1, needed);
}

/**
 * Calculates bunks and mark tier guidance:
 * - >= 90%: 5 Mark
 * - 85% to < 90%: 4 Mark
 * - 80% to < 85%: 3 Mark
 * - 75% to < 80%: 2 Mark
 * - < 75%: Shortage (0 Mark)
 */
export function calculateBunkInfo(attended, held) {
  if (held === 0) {
    return {
      type: 'initial',
      tier: 90,
      marks: 5,
      count: 0,
      message: 'No classes conducted yet'
    };
  }

  const pct = (attended / held) * 100;
  const bunk75 = Math.floor((4 * attended - 3 * held) / 3);

  // Case 1: Attendance is AT OR ABOVE 90% (5 Mark)
  if (pct >= 90) {
    const bunk90 = Math.floor((10 * attended - 9 * held) / 9);

    if (bunk90 === 0) {
      return {
        type: 'edge-90',
        tier: 90,
        marks: 5,
        count: 0,
        bunksTo75: bunk75,
        message: 'Missing the next class drops attendance to 4 Mark (<90%)!'
      };
    }

    return {
      type: 'safe-90',
      tier: 90,
      marks: 5,
      count: bunk90,
      bunksTo75: bunk75,
      message: `You can bunk ${bunk90} ${bunk90 === 1 ? 'class' : 'classes'} till you drop to 4 Mark (<90%)`
    };
  }

  // Case 2: 85% <= Attendance < 90% (4 Mark)
  if (pct >= 85) {
    const bunk85 = Math.floor((20 * attended - 17 * held) / 17);
    const neededFor90 = Math.max(1, 9 * held - 10 * attended);

    if (bunk85 === 0) {
      return {
        type: 'edge-85',
        tier: 85,
        marks: 4,
        count: 0,
        bunksTo75: bunk75,
        neededForNext: neededFor90,
        message: '4 Mark: Missing next class drops to 3 Mark (<85%)!'
      };
    }

    return {
      type: 'safe-85',
      tier: 85,
      marks: 4,
      count: bunk85,
      bunksTo75: bunk75,
      neededForNext: neededFor90,
      message: `4 Mark: You can bunk ${bunk85} ${bunk85 === 1 ? 'class' : 'classes'} till you drop to 3 Mark (<85%)`
    };
  }

  // Case 3: 80% <= Attendance < 85% (3 Mark)
  if (pct >= 80) {
    const bunk80 = Math.floor((5 * attended - 4 * held) / 4);
    const neededFor85 = Math.max(1, Math.ceil((17 * held - 20 * attended) / 3));

    if (bunk80 === 0) {
      return {
        type: 'edge-80',
        tier: 80,
        marks: 3,
        count: 0,
        bunksTo75: bunk75,
        neededForNext: neededFor85,
        message: '3 Mark: Missing next class drops to 2 Mark (<80%)!'
      };
    }

    return {
      type: 'safe-80',
      tier: 80,
      marks: 3,
      count: bunk80,
      bunksTo75: bunk75,
      neededForNext: neededFor85,
      message: `3 Mark: You can bunk ${bunk80} ${bunk80 === 1 ? 'class' : 'classes'} till you drop to 2 Mark (<80%)`
    };
  }

  // Case 4: 75% <= Attendance < 80% (2 Mark)
  if (pct >= 75) {
    const neededFor80 = Math.max(1, 4 * held - 5 * attended);

    if (bunk75 === 0) {
      return {
        type: 'edge-75',
        tier: 75,
        marks: 2,
        count: 0,
        neededForNext: neededFor80,
        message: '2 Mark: Missing next class causes exam shortage (<75%)!'
      };
    }

    return {
      type: 'safe-75',
      tier: 75,
      marks: 2,
      count: bunk75,
      neededForNext: neededFor80,
      message: `2 Mark: You can bunk ${bunk75} ${bunk75 === 1 ? 'class' : 'classes'} before exam shortage (<75%)`
    };
  }

  // Case 5: Attendance < 75% (Shortage / 0 Mark)
  const needed75 = Math.max(1, (3 * held) - (4 * attended));
  return {
    type: 'recovery-75',
    tier: 0,
    marks: 0,
    count: needed75,
    message: `🚨 Shortage (0 Mark): Must attend next ${needed75} consecutive ${needed75 === 1 ? 'class' : 'classes'} to reach 75%`
  };
}

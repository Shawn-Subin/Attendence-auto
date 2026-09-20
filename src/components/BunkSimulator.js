// BunkSimulator.js - What-If Attendance Bunk Scenario Simulator
// Accurately predicts attendance impact for:
// 1) 1st Hour Off (Period 1)
// 2) First 4 Hours Off (Periods 1 - 4)
// 3) Entire Day Off (All Periods)
// Includes recovery class calculation to restore 90% (5 Internal Marks)

import React, { useState, useMemo } from 'react';
import { calculatePercentage, getClassesToReachTarget } from '../utils/attendanceMath.js';

export function BunkSimulator({
  timetable,
  subjects,
  timeSlots,
  daysOfWeek,
  todayDayId,
  onApplyBatchAbsences,
  onResetToOfficial,
  isSimulated
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    return daysOfWeek && daysOfWeek.some(d => d.id === todayDayId) ? todayDayId : 'tue';
  });
  const [selectedScenario, setSelectedScenario] = useState('1st-hour'); // '1st-hour' | 'first-4-hours' | 'full-day'

  const subjectsMap = useMemo(() => {
    const map = {};
    (subjects || []).forEach(s => { map[s.id] = s; });
    return map;
  }, [subjects]);

  const timeSlotsMap = useMemo(() => {
    const map = {};
    (timeSlots || []).forEach(t => { map[t.id] = t; });
    return map;
  }, [timeSlots]);

  // Scheduled periods for selected day
  const daySchedule = useMemo(() => {
    const rawSlots = (timetable && timetable[selectedDay]) || [];
    return rawSlots.filter(slot => slot.subjectId && slot.subjectId !== 'free' && subjectsMap[slot.subjectId]);
  }, [timetable, selectedDay, subjectsMap]);

  // Base overall attendance
  const currentOverall = useMemo(() => {
    const attended = (subjects || []).reduce((sum, s) => sum + s.attended, 0);
    const held = (subjects || []).reduce((sum, s) => sum + s.held, 0);
    const pct = calculatePercentage(attended, held);
    const bunk90 = Math.floor((10 * attended - 9 * held) / 9);
    const bunk75 = Math.floor((4 * attended - 3 * held) / 3);
    const needed90 = getClassesToReachTarget(attended, held, 90);
    const needed75 = getClassesToReachTarget(attended, held, 75);
    return { 
      attended, 
      held, 
      pct, 
      bunk90: Math.max(0, bunk90), 
      bunk75: Math.max(0, bunk75),
      needed90,
      needed75
    };
  }, [subjects]);

  // Calculate outcome for any scenario
  const getScenarioOutcome = (scenarioKey) => {
    let missedSlots = [];
    if (scenarioKey === '1st-hour') {
      missedSlots = daySchedule.slice(0, 1);
    } else if (scenarioKey === 'first-4-hours') {
      missedSlots = daySchedule.slice(0, 4);
    } else {
      missedSlots = daySchedule.slice(0);
    }

    const missedCounts = {};
    missedSlots.forEach(s => {
      missedCounts[s.subjectId] = (missedCounts[s.subjectId] || 0) + 1;
    });

    const newHeld = currentOverall.held + missedSlots.length;
    const newAttended = currentOverall.attended; // all missed = 0 attended
    const newPct = calculatePercentage(newAttended, newHeld);
    const delta = Math.round((newPct - currentOverall.pct) * 10) / 10;
    const deltaFormatted = delta > 0 ? `+${delta}%` : `${delta}%`;

    const bunk90 = Math.floor((10 * newAttended - 9 * newHeld) / 9);
    const bunk75 = Math.floor((4 * newAttended - 3 * newHeld) / 3);
    const neededOverall90 = getClassesToReachTarget(newAttended, newHeld, 90, false);
    const neededOverallOver90 = getClassesToReachTarget(newAttended, newHeld, 90, true);
    const neededOverall75 = getClassesToReachTarget(newAttended, newHeld, 75, false);

    // Subject breakdown
    const subjectBreakdown = missedSlots.map(slot => {
      const sub = subjectsMap[slot.subjectId] || { name: 'Unknown', code: 'N/A', shortName: 'N/A', attended: 0, held: 0, faculty: '', color: '#3b82f6' };
      const slotInfo = timeSlotsMap[slot.slotId];
      const addHeld = missedCounts[slot.subjectId] || 1;
      const curSubPct = calculatePercentage(sub.attended, sub.held);
      const newSubHeld = sub.held + addHeld;
      const newSubPct = calculatePercentage(sub.attended, newSubHeld);
      const dropsBelow90 = curSubPct >= 90 && newSubPct < 90;
      const dropsBelow75 = curSubPct >= 75 && newSubPct < 75;
      const isBelow90 = newSubPct < 90;
      const subClassesTo90 = isBelow90 ? getClassesToReachTarget(sub.attended, newSubHeld, 90, false) : 0;
      const subClassesToOver90 = isBelow90 ? getClassesToReachTarget(sub.attended, newSubHeld, 90, true) : 0;
      const subAttendedAfterOver90 = sub.attended + subClassesToOver90;
      const subHeldAfterOver90 = newSubHeld + subClassesToOver90;
      const subPctAfterOver90 = calculatePercentage(subAttendedAfterOver90, subHeldAfterOver90);
      const subAttendedAfter90 = sub.attended + subClassesTo90;
      const subHeldAfter90 = newSubHeld + subClassesTo90;
      const subPctAfter90 = calculatePercentage(subAttendedAfter90, subHeldAfter90);
      const subBunk90 = !isBelow90 ? Math.max(0, Math.floor((10 * sub.attended - 9 * newSubHeld) / 9)) : 0;

      return {
        slot,
        slotInfo,
        sub,
        curSubPct,
        newSubHeld,
        newSubPct,
        dropsBelow90,
        dropsBelow75,
        isBelow90,
        subClassesTo90,
        subClassesToOver90,
        subAttendedAfterOver90,
        subHeldAfterOver90,
        subPctAfterOver90,
        subAttendedAfter90,
        subHeldAfter90,
        subPctAfter90,
        subBunk90
      };
    });

    // Unique subjects impacted
    const uniqueSubjectImpact = [];
    const seenSubs = new Set();
    subjectBreakdown.forEach(item => {
      if (!seenSubs.has(item.sub.id)) {
        seenSubs.add(item.sub.id);
        uniqueSubjectImpact.push(item);
      }
    });

    const anyDropBelow90 = uniqueSubjectImpact.some(s => s.dropsBelow90 || s.isBelow90);
    const anyDropBelow75 = uniqueSubjectImpact.some(s => s.dropsBelow75);

    return {
      scenarioKey,
      missedSlots,
      missedCount: missedSlots.length,
      missedSubjectIds: missedSlots.map(s => s.subjectId),
      newAttended,
      newHeld,
      newPct,
      deltaFormatted,
      bunk90: Math.max(0, bunk90),
      bunk75: Math.max(0, bunk75),
      neededOverall90,
      neededOverallOver90,
      neededOverall75,
      subjectBreakdown,
      uniqueSubjectImpact,
      anyDropBelow90,
      anyDropBelow75
    };
  };

  const scenarios = useMemo(() => {
    return {
      '1st-hour': getScenarioOutcome('1st-hour'),
      'first-4-hours': getScenarioOutcome('first-4-hours'),
      'full-day': getScenarioOutcome('full-day')
    };
  }, [daySchedule, currentOverall, subjectsMap, timeSlotsMap]);

  const activeData = scenarios[selectedScenario];
  const selectedDayObj = (daysOfWeek || []).find(d => d.id === selectedDay) || { full: 'Selected Day', short: 'Day' };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100 relative overflow-hidden transition-all duration-300">
      
      {/* Header & Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 shadow-xs">
            <span className="text-base">🔮</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                Attendance What-If Simulator
              </h3>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hidden xs:inline-block">
                Timetable Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Predict your attendance & see classes needed to recover 90%
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1 border border-slate-200 dark:border-slate-700 flex-shrink-0"
          title={isExpanded ? "Collapse Simulator" : "Expand Simulator"}
        >
          <span className="text-[11px] hidden sm:inline font-semibold">{isExpanded ? 'Hide' : 'Show'}</span>
          <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="relative z-10 mt-4 space-y-4 animate-fade-in">
          
          {/* Day Selector Tabs */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>📅</span>
              <span>Day:</span>
            </span>
            
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 gap-1">
              {(daysOfWeek || []).map(d => {
                const isToday = d.id === todayDayId;
                const isSelected = d.id === selectedDay;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{d.short}</span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500 animate-pulse'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Scenario Cards */}
          <div className="grid grid-cols-3 gap-2">
            
            {/* 1. 1st Hour Off */}
            <button
              onClick={() => setSelectedScenario('1st-hour')}
              className={`text-left p-2.5 sm:p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedScenario === '1st-hour'
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 shadow-xs text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold ${
                    selectedScenario === '1st-hour' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'
                  }`}>Option 1</span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{scenarios['1st-hour'].deltaFormatted}</span>
                </div>
                <div className={`font-extrabold text-xs sm:text-sm mt-0.5 ${
                  selectedScenario === '1st-hour' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  1st Hour Off
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Period 1 Only
                </div>
              </div>
              <div className={`mt-2 pt-1.5 flex items-baseline justify-between ${
                selectedScenario === '1st-hour' ? 'border-t border-blue-200/70 dark:border-blue-900/50' : 'border-t border-slate-100 dark:border-slate-700/60'
              }`}>
                <span className={`text-xs sm:text-base font-black ${
                  selectedScenario === '1st-hour' ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'
                }`}>{scenarios['1st-hour'].newPct}%</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">1 class</span>
              </div>
            </button>

            {/* 2. First 4 Hours Off */}
            <button
              onClick={() => setSelectedScenario('first-4-hours')}
              className={`text-left p-2.5 sm:p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedScenario === 'first-4-hours'
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 shadow-xs text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold ${
                    selectedScenario === 'first-4-hours' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'
                  }`}>Option 2</span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{scenarios['first-4-hours'].deltaFormatted}</span>
                </div>
                <div className={`font-extrabold text-xs sm:text-sm mt-0.5 ${
                  selectedScenario === 'first-4-hours' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  First 4 Hours
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Periods 1 to 4
                </div>
              </div>
              <div className={`mt-2 pt-1.5 flex items-baseline justify-between ${
                selectedScenario === 'first-4-hours' ? 'border-t border-blue-200/70 dark:border-blue-900/50' : 'border-t border-slate-100 dark:border-slate-700/60'
              }`}>
                <span className={`text-xs sm:text-base font-black ${
                  selectedScenario === 'first-4-hours' ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'
                }`}>{scenarios['first-4-hours'].newPct}%</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{scenarios['first-4-hours'].missedCount} classes</span>
              </div>
            </button>

            {/* 3. Entire Day Off */}
            <button
              onClick={() => setSelectedScenario('full-day')}
              className={`text-left p-2.5 sm:p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedScenario === 'full-day'
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 shadow-xs text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold ${
                    selectedScenario === 'full-day' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'
                  }`}>Option 3</span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{scenarios['full-day'].deltaFormatted}</span>
                </div>
                <div className={`font-extrabold text-xs sm:text-sm mt-0.5 ${
                  selectedScenario === 'full-day' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  Entire Day Off
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  All {daySchedule.length} Periods
                </div>
              </div>
              <div className={`mt-2 pt-1.5 flex items-baseline justify-between ${
                selectedScenario === 'full-day' ? 'border-t border-blue-200/70 dark:border-blue-900/50' : 'border-t border-slate-100 dark:border-slate-700/60'
              }`}>
                <span className={`text-xs sm:text-base font-black ${
                  selectedScenario === 'full-day' ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'
                }`}>{scenarios['full-day'].newPct}%</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{scenarios['full-day'].missedCount} classes</span>
              </div>
            </button>

          </div>

          {/* Active Scenario Detail Surface (Clean, Flat, Non-nested) */}
          <div className="bg-slate-50/70 dark:bg-[#15131b] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3.5">
            
            {/* Status & Overall Impact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedScenario === '1st-hour' ? '1st Hour Off' : selectedScenario === 'first-4-hours' ? 'First 4 Hours Off' : 'Entire Day Off'} on {selectedDayObj.full}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-mono">
                    {activeData.missedCount} {activeData.missedCount === 1 ? 'class' : 'classes'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Current: <b className="text-slate-700 dark:text-slate-300 font-semibold">{currentOverall.pct}%</b> ({currentOverall.attended}/{currentOverall.held}) → Projected: <b className="text-slate-900 dark:text-white font-bold">{activeData.newPct}%</b> ({activeData.newAttended}/{activeData.newHeld})
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Projected</span>
                  <span className={`text-xl font-black ${
                    activeData.newPct >= 90 ? 'text-amber-500 dark:text-amber-400' : activeData.newPct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {activeData.newPct}%
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-black font-mono ${
                  activeData.newPct >= 90 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' 
                    : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {activeData.deltaFormatted}
                </span>
              </div>
            </div>

            {/* Buffer & Recovery Stat Tiles (Soft, flat, not heavy boxes) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 5 Marks Zone */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-white">
                <div className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 tracking-wider">
                  <span>⭐</span>
                  <span>5 Marks (≥90%)</span>
                </div>
                <div className="mt-1">
                  {activeData.newPct >= 90 ? (
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm">
                        Can bunk <span className="text-amber-600 dark:text-amber-400 font-black text-sm sm:text-base">{activeData.bunk90}</span> classes
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Overall safe ({activeData.newPct}%)</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-rose-600 dark:text-rose-400 text-xs">Drops to {activeData.newPct}% (&lt;90%)</div>
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold mt-0.5">
                        Attend {activeData.neededOverallOver90} classes to recover
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Minimum (≥75%) */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-900 dark:text-white">
                <div className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 tracking-wider">
                  <span>🛡️</span>
                  <span>Exam Min (≥75%)</span>
                </div>
                <div className="mt-1">
                  {activeData.newPct >= 75 ? (
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm">
                        Can bunk <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base">{activeData.bunk75}</span> classes
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Safe from shortage</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-rose-600 dark:text-rose-400 text-xs">Shortage (&lt;75%)</div>
                      <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold mt-0.5">
                        Attend {activeData.neededOverall75} classes to reach 75%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject 90% Impact Alert (Single sleek callout, NO nested boxes!) */}
            {activeData.anyDropBelow90 && (
              <div className="border-l-4 border-amber-500 bg-amber-500/10 dark:bg-amber-500/[0.08] rounded-r-xl p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <div>
                    <span className="font-extrabold text-amber-900 dark:text-amber-300">Subject 90% Impact: </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      Missing this drops {activeData.uniqueSubjectImpact.filter(s => s.isBelow90).map(s => (
                        <b key={s.sub.id} className="text-slate-900 dark:text-white font-bold"> {s.sub.name} ({s.newSubPct}%)</b>
                      ))} below 90%, risking full 5 internal marks!
                    </span>
                  </div>
                </div>

                {/* Clean Recovery Target (NO nested sub-boxes!) */}
                <div className="space-y-1 pt-1.5 border-t border-amber-500/20">
                  {activeData.uniqueSubjectImpact.filter(s => s.isBelow90).map(s => (
                    <div key={s.sub.id} className="text-[11px] text-slate-800 dark:text-slate-200">
                      <div className="font-bold flex items-center justify-between flex-wrap gap-1">
                        <span>• {s.sub.name} ({s.sub.code}):</span>
                        <span className="text-amber-800 dark:text-amber-300 font-extrabold">
                          🎯 Attend next <span className="underline decoration-amber-500 font-black text-xs">{s.subClassesToOver90}</span> classes to get over 90%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-3">
                        Math check: Attend {s.subClassesToOver90} classes → {s.subAttendedAfterOver90}/{s.subHeldAfterOver90} = <b className="text-emerald-600 dark:text-emerald-400 font-bold">{s.subPctAfterOver90}%</b> (over 90%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Classes Missed List (Zero text overlap, mobile-first card design) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Specific Classes Missed ({activeData.missedSlots.length})
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {activeData.subjectBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#1a1921] p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2"
                  >
                    {/* Line 1: Period + Time & Impact Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                          {item.slotInfo ? item.slotInfo.label : `Period ${idx+1}`}
                        </span>
                        {item.slotInfo?.time && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                            {item.slotInfo.time}
                          </span>
                        )}
                      </div>

                      {item.isBelow90 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          &lt;90% Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Safe (≥90%)
                        </span>
                      )}
                    </div>

                    {/* Line 2: Subject Code Badge & Full Subject Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md flex-shrink-0"
                        style={{ 
                              backgroundColor: `${item.sub.color || '#3b82f6'}18`, 
                              color: item.sub.color || '#3b82f6',
                              border: `1px solid ${item.sub.color || '#3b82f6'}40`
                        }}
                      >
                        {item.sub.code}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {item.sub.name}
                      </span>
                    </div>

                    {/* Line 3: Attended/Held shift and recovery action */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/[0.05] text-[11px] gap-2">
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{item.sub.attended}/{item.sub.held} → <b className="text-slate-900 dark:text-white font-bold">{item.sub.attended}/{item.newSubHeld}</b></span>
                        <span className={`font-bold ${item.newSubPct >= 90 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ({item.curSubPct}% → {item.newSubPct}%)
                        </span>
                      </div>

                      <div className="flex-shrink-0">
                        {item.isBelow90 ? (
                          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span>🎯</span>
                            <span>Need {item.subClassesToOver90} classes</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {item.subBunk90} bunks left
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Simulator Action Buttons */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Test in tracker or revert anytime
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isSimulated && (
                  <button
                    onClick={onResetToOfficial}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-[#221f29] dark:hover:bg-[#2b2736] rounded-xl transition border border-slate-200 dark:border-white/[0.08] flex items-center gap-1 shadow-xs"
                    title="Restore original ETLAB attendance"
                  >
                    <span>🔄</span>
                    <span>Restore Official</span>
                  </button>
                )}

                <button
                  onClick={() => onApplyBatchAbsences && onApplyBatchAbsences(activeData.missedSubjectIds)}
                  className="px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Apply these missed periods as absent in the attendance tracker"
                >
                  <span>⚡</span>
                  <span>Test Bunk in Tracker</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

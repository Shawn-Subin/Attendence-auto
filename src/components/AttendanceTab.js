// AttendanceTab component - Attendance Tracker with Circular Progress & Exact Bunk/Recovery Math
// Tier 1: 90% (Full 5 Internal Marks)
// Tier 2: 75% (University Exam Eligibility Minimum)

import React, { useState, useMemo } from 'react';
import { calculatePercentage, getAttendanceStatus, calculateBunkInfo } from '../utils/attendanceMath.js';
import { ManageSubjectsModal } from './ManageSubjectsModal.js';
import { BunkSimulator } from './BunkSimulator.js';
import { STUDENT_PROFILE } from '../data/defaultData.js';

// Circular Progress Ring SVG Component
function AttendanceRing({ 
  percentage, 
  size = 68, 
  strokeWidth = 6, 
  color,
  textColor = 'text-slate-900 dark:text-white',
  trackColor = 'text-slate-100 dark:text-slate-800'
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackColor}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-xs sm:text-sm font-black tracking-tight leading-none ${textColor}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function AttendanceTab({
  subjects,
  onMarkAttendance,
  onUndoLastAction,
  canUndo,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onResetToOfficial,
  timetable,
  timeSlots,
  daysOfWeek,
  todayDayId,
  onApplyBatchAbsences,
  isSimulated,
  syncInfo
}) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'full-marks' | 'below-90'

  // Calculate overall semester stats
  const overallStats = useMemo(() => {
    let totalAttended = 0;
    let totalHeld = 0;
    let fullMarksCount = 0; // >= 90%
    let eligibleCount = 0;  // 75% - 89.9%
    let shortageCount = 0;  // < 75%

    subjects.forEach((s) => {
      totalAttended += s.attended;
      totalHeld += s.held;
      const pct = calculatePercentage(s.attended, s.held);
      if (pct >= 90) fullMarksCount++;
      else if (pct >= 75) eligibleCount++;
      else shortageCount++;
    });

    const overallPct = calculatePercentage(totalAttended, totalHeld);
    const overallStatus = getAttendanceStatus(overallPct);
    const overallBunk = calculateBunkInfo(totalAttended, totalHeld);

    return {
      totalAttended,
      totalHeld,
      overallPct,
      overallStatus,
      overallBunk,
      fullMarksCount,
      eligibleCount,
      shortageCount,
      totalSubjects: subjects.length
    };
  }, [subjects]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    if (filter === 'full-marks') {
      return subjects.filter(s => calculatePercentage(s.attended, s.held) >= 90);
    }
    if (filter === 'below-90') {
      return subjects.filter(s => calculatePercentage(s.attended, s.held) < 90);
    }
    return subjects;
  }, [subjects, filter]);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">

      {/* LIVE CLOUD SYNC BANNER */}
      {syncInfo && syncInfo.timestamp && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <div className="min-w-0">
              <p className="font-bold text-white text-[11px] truncate">
                ETLAB Attendance Synced
              </p>
              <p className="text-slate-400 text-[10px] truncate">
                Last refreshed: <b className="text-slate-200">{syncInfo.timestamp}</b>
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
            Auto 7am • 3pm • 9pm
          </span>
        </div>
      )}

      {/* STUDENT PROFILE CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 font-black flex items-center justify-center text-sm flex-shrink-0 shadow-md">
            SP
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {STUDENT_PROFILE.name}
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                Roll #{STUDENT_PROFILE.rollNo}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Reg: <span className="font-semibold text-slate-700 dark:text-slate-300">{STUDENT_PROFILE.regNo}</span> • S3 CS AI
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Internal Marks</span>
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
            <span>⭐</span>
            <span>{overallStats.percentage >= 90 ? 5 : overallStats.percentage >= 85 ? 4 : overallStats.percentage >= 80 ? 3 : overallStats.percentage >= 75 ? 2 : 0} / 5 Marks</span>
          </span>
        </div>
      </div>

      {/* OVERALL SEMESTER SUMMARY CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-blue-900/50">
        
        {/* Background glow decoration */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Attendance Overview
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${overallStats.overallStatus.badgeBg}`}>
                {overallStats.overallStatus.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1.5">
              <h2 className="text-3xl font-black tracking-tight text-white">
                {overallStats.overallPct}%
              </h2>
              <span className="text-xs text-slate-300 font-medium">
                ({overallStats.totalAttended} / {overallStats.totalHeld} classes)
              </span>
            </div>

            {/* DUAL TIER BUNKABLE DISPLAY */}
            <div className="mt-2.5 space-y-1">
              {overallStats.overallPct >= 90 ? (
                <div>
                  <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>⭐</span>
                    <span>
                      Can bunk <b>{overallStats.overallBunk.count}</b> classes before dropping below <b>90%</b> (5 marks).
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium pl-5">
                    (Still have <b>{overallStats.overallBunk.bunksTo75}</b> bunks left before 75% exam eligibility)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>🏖️</span>
                    <span>
                      Can bunk <b>{overallStats.overallBunk.count}</b> classes before dropping below <b>75%</b>.
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-300 font-medium pl-5">
                    (Need <b>{overallStats.overallBunk.neededFor90}</b> consecutive classes to reach 90% for 5 marks)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Big Overall Ring */}
          <div className="flex-shrink-0">
            <AttendanceRing
              percentage={overallStats.overallPct}
              size={76}
              strokeWidth={8}
              color={overallStats.overallStatus.ringColor}
              textColor="text-white font-extrabold"
              trackColor="text-white/20"
            />
          </div>
        </div>

        {/* Progress breakdown bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>≥ 90% (5 Marks): <b>{overallStats.fullMarksCount}</b></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>75 - 89%: <b>{overallStats.eligibleCount}</b></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>&lt; 75%: <b>{overallStats.shortageCount}</b></span>
          </div>
        </div>
      </div>

      {/* BUNK SCENARIO SIMULATOR */}
      <BunkSimulator
        timetable={timetable}
        subjects={subjects}
        timeSlots={timeSlots}
        daysOfWeek={daysOfWeek}
        todayDayId={todayDayId}
        onApplyBatchAbsences={onApplyBatchAbsences}
        onResetToOfficial={onResetToOfficial}
        isSimulated={isSimulated}
      />

      {/* FILTER & ACTIONS BAR */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            id="filter-all"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({subjects.length})
          </button>
          <button
            id="filter-full-marks"
            onClick={() => setFilter('full-marks')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'full-marks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <span>≥ 90% ({overallStats.fullMarksCount})</span>
          </button>
          <button
            id="filter-below-90"
            onClick={() => setFilter('below-90')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              filter === 'below-90'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            &lt; 90% ({overallStats.eligibleCount + overallStats.shortageCount})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {canUndo && (
            <button
              id="btn-undo-attendance"
              onClick={onUndoLastAction}
              title="Undo last attendance mark"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <span>↩</span>
              <span>Undo</span>
            </button>
          )}

          <button
            id="btn-manage-subjects"
            onClick={() => setIsManageModalOpen(true)}
            title="Add or edit courses"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl transition border border-blue-200 dark:border-blue-900"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>
      </div>

      {/* SUBJECTS LIST */}
      <div className="space-y-3">
        {filteredSubjects.map((sub) => {
          const pct = calculatePercentage(sub.attended, sub.held);
          const status = getAttendanceStatus(pct);
          const bunkInfo = calculateBunkInfo(sub.attended, sub.held);

          return (
            <div
              key={sub.id}
              id={`subject-card-${sub.id}`}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border transition-all ${
                pct >= 90
                  ? 'border-amber-300/80 dark:border-amber-900/50 bg-amber-50/10'
                  : pct >= 75
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
              }`}
            >
              {/* Left Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: sub.color || status.ringColor }}
              />

              <div className="flex items-start justify-between gap-3 pl-1">
                
                {/* Subject Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="px-2 py-0.5 text-[10px] font-extrabold rounded-md font-mono"
                      style={{ 
                        backgroundColor: `${sub.color}18`, 
                        color: sub.color,
                        border: `1px solid ${sub.color}35`
                      }}
                    >
                      {sub.code}
                    </span>

                    {sub.courseId && sub.courseId !== sub.code && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sub.courseId}
                      </span>
                    )}

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${status.badgeBg}`}>
                      {status.marksLabel || (pct >= 90 ? '5 Mark' : pct >= 85 ? '4 Mark' : pct >= 80 ? '3 Mark' : pct >= 75 ? '2 Mark' : '0 Mark')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                    {sub.faculty}
                  </p>

                  {/* Attendance numbers & linear progress bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span>Attended: <b className="text-slate-900 dark:text-white">{sub.attended}</b> of {sub.held}</span>
                      <span className="font-bold">{pct}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          backgroundColor: status.ringColor
                        }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Bunk Guidance Badge */}
                  <div className={`mt-2.5 p-2 rounded-xl text-xs flex items-center justify-between gap-2 ${
                    bunkInfo.tier === 90
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40'
                      : bunkInfo.tier === 85
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40'
                      : bunkInfo.tier === 80
                      ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40'
                      : bunkInfo.tier === 75
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40'
                      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {bunkInfo.tier === 0 && (
                        <span className="text-base flex-shrink-0">🚨</span>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold leading-snug block">
                          {bunkInfo.message}
                        </span>
                        {bunkInfo.tier === 90 && bunkInfo.bunksTo75 !== undefined && (
                          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">
                            ({bunkInfo.bunksTo75} bunks left before 75% exam eligibility)
                          </span>
                        )}
                        {bunkInfo.tier === 85 && (
                          <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 block mt-0.5">
                            (Need {bunkInfo.neededForNext} {bunkInfo.neededForNext === 1 ? 'class' : 'classes'} for 5 Mark • {bunkInfo.bunksTo75} bunks before 75%)
                          </span>
                        )}
                        {bunkInfo.tier === 80 && (
                          <span className="text-[10px] text-teal-700/80 dark:text-teal-400/80 block mt-0.5">
                            (Need {bunkInfo.neededForNext} {bunkInfo.neededForNext === 1 ? 'class' : 'classes'} for 4 Mark • {bunkInfo.bunksTo75} bunks before 75%)
                          </span>
                        )}
                        {bunkInfo.tier === 75 && (
                          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block mt-0.5">
                            (Need {bunkInfo.neededForNext} {bunkInfo.neededForNext === 1 ? 'class' : 'classes'} for 3 Mark)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Progress Ring */}
                <div className="flex flex-col items-center justify-start flex-shrink-0">
                  <AttendanceRing
                    percentage={pct}
                    size={62}
                    strokeWidth={5.5}
                    color={status.ringColor}
                  />
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    {pct >= 90 ? 'Req: 90%' : 'Req: 75%'}
                  </span>
                </div>

              </div>


            </div>
          );
        })}
      </div>

      {/* Manage Subjects Modal */}
      <ManageSubjectsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        subjects={subjects}
        onAddSubject={onAddSubject}
        onUpdateSubject={onUpdateSubject}
        onDeleteSubject={onDeleteSubject}
      />

    </div>
  );
}

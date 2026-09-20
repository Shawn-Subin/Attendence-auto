// Main App Component for MITS Campus Hub
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { TimetableTab } from './components/TimetableTab.js';
import { AttendanceTab } from './components/AttendanceTab.js';
import { Toast } from './components/Toast.js';

import {
  DEFAULT_SUBJECTS,
  DEFAULT_TIMETABLE,
  TIME_SLOTS,
  DAYS_OF_WEEK,
  ATTENDANCE_STORAGE_KEY
} from './data/defaultData.js';

import { calculatePercentage } from './utils/attendanceMath.js';

const STORAGE_KEYS = {
  SUBJECTS: ATTENDANCE_STORAGE_KEY || 'mits_s3_cs_ai_shawn_v1789446779',
  TIMETABLE: 'mits_s3_cs_ai_timetable_v15',
  ACTIVE_TAB: 'mits_s3_cs_ai_active_tab_v15',
  PHONE_FRAME: 'mits_s3_cs_ai_phone_frame_v15'
};

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = React.useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'timetable';
  });

  // Desktop Simulator Phone Frame Toggle
  const [isPhoneFrame, setIsPhoneFrame] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PHONE_FRAME);
    return saved !== null ? JSON.parse(saved) : true; // Default to mobile phone frame on desktop
  });

  // Subjects & Attendance Data
  const [subjects, setSubjects] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_SUBJECTS;
  });

  // Attendance Undo History Stack
  const [historyStack, setHistoryStack] = React.useState([]);

  // Timetable Data
  const [timetable, setTimetable] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const friSlots = parsed.fri || [];
        const wedSlots = parsed.wed || [];
        const friP3 = friSlots.find(s => s.slotId === 'p3');
        const friP6 = friSlots.find(s => s.slotId === 'p6');
        const wedP4 = wedSlots.find(s => s.slotId === 'p4');
        if (friP3?.subjectId === 'sub-fods' && !friP6 && wedP4?.subjectId === 'sub-aoop') {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(DEFAULT_TIMETABLE));
    } catch (e) {}
    return DEFAULT_TIMETABLE;
  });


  // Toast notifications
  const [toast, setToast] = React.useState(null);

  // Theme State: Dark Mode (Image 4 Helios) or Light Mode (Image 3 Dashboard)
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('mits_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return true; // Default to dark mode (Helios)
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mits_theme', 'dark');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#121114');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mits_theme', 'light');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#dbe4f3');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const [syncInfo, setSyncInfo] = React.useState(() => {
    const saved = localStorage.getItem('mits_last_synced_info');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const showToast = (message, type = 'info', icon = '✨') => {
    setToast({ message, type, icon });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Automatically fetch updated attendance on app load
  React.useEffect(() => {
    fetch('./attendance_scraped.json?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('No scraped file');
        return res.json();
      })
      .then(data => {
        if (data && data.Subjects && data.Subjects.length > 0) {
          const info = {
            timestamp: data.Timestamp,
            student: data.Student,
            overall: data.Overall
          };
          setSyncInfo(info);
          localStorage.setItem('mits_last_synced_info', JSON.stringify(info));

          const lastApplied = localStorage.getItem('mits_applied_sync_timestamp');
          if (lastApplied !== data.Timestamp) {
            setSubjects(prevSubjects => {
              return prevSubjects.map(sub => {
                const match = data.Subjects.find(s => s.Code && s.Code.toUpperCase() === sub.code.toUpperCase());
                if (match) {
                  return {
                    ...sub,
                    attended: match.Attended,
                    held: match.Held
                  };
                }
                return sub;
              });
            });
            localStorage.setItem('mits_applied_sync_timestamp', data.Timestamp);
            showToast(`ETLAB Synced: ${data.Timestamp}`, 'success', '⚡');
          }
        }
      })
      .catch(err => {
        // Standalone fallback
      });
  }, []);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PHONE_FRAME, JSON.stringify(isPhoneFrame));
  }, [isPhoneFrame]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
  }, [timetable]);


  // Today's day detection
  const { todayDayId, todayDayName, currentDateFormatted } = React.useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Format e.g. "Sep 12, 2026"
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);

    return {
      todayDayId: map[dayIndex],
      todayDayName: names[dayIndex],
      currentDateFormatted: dateStr
    };
  }, []);

  // Attendance Warnings Count
  const attendanceWarningCount = React.useMemo(() => {
    return subjects.filter(s => calculatePercentage(s.attended, s.held) < 75).length;
  }, [subjects]);

  // Attendance Actions
  const handleMarkAttendance = (subjectId, action) => {
    const targetSub = subjects.find(s => s.id === subjectId);
    if (!targetSub) return;

    // Push previous state onto history stack
    setHistoryStack(prev => [...prev, {
      subjects: JSON.parse(JSON.stringify(subjects)),
      actionDescription: `${action.toUpperCase()} for ${targetSub.code}`
    }]);

    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;

      if (action === 'present') {
        return { ...s, attended: s.attended + 1, held: s.held + 1 };
      } else if (action === 'absent') {
        return { ...s, held: s.held + 1 };
      } else if (action === 'cancelled') {
        return s; // No count change
      }
      return s;
    }));

    if (action === 'present') {
      showToast(`Marked Present for ${targetSub.code}`, 'success', '✓');
    } else if (action === 'absent') {
      showToast(`Marked Absent for ${targetSub.code}`, 'warning', '⚠️');
    } else {
      showToast(`Class marked Cancelled for ${targetSub.code}`, 'info', 'ℹ️');
    }
  };

  const handleUndoLastAction = () => {
    if (historyStack.length === 0) return;
    const lastItem = historyStack[historyStack.length - 1];
    setSubjects(lastItem.subjects);
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    showToast(`Undone: ${lastItem.actionDescription}`, 'info', '↩');
  };

  const handleAddSubject = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
    showToast(`Added subject ${newSubject.code}`, 'success', '📚');
  };

  const handleUpdateSubject = (updated) => {
    setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    showToast(`Updated ${updated.code}`, 'success', '✏️');
  };

  const handleDeleteSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    showToast('Subject removed', 'info', '🗑️');
  };

  // Timetable Actions
  const handleSaveSlot = ({ day, slotId, subjectId, room }) => {
    setTimetable(prev => {
      const daySlots = prev[day] || [];
      const filtered = daySlots.filter(s => s.slotId !== slotId);
      return {
        ...prev,
        [day]: [...filtered, { slotId, subjectId, room }]
      };
    });
    showToast('Timetable schedule updated', 'success', '📅');
  };

  const handleDeleteSlot = (day, slotId) => {
    setTimetable(prev => {
      const daySlots = prev[day] || [];
      return {
        ...prev,
        [day]: daySlots.filter(s => s.slotId !== slotId)
      };
    });
    showToast('Class removed from schedule', 'info', '🗑️');
  };

  // Reset to default
  const handleResetData = () => {
    const defAttended = DEFAULT_SUBJECTS.reduce((sum, s) => sum + s.attended, 0);
    const defHeld = DEFAULT_SUBJECTS.reduce((sum, s) => sum + s.held, 0);
    const defPct = calculatePercentage(defAttended, defHeld);
    if (confirm(`Reset all timetable and attendance changes to official ETLAB records (${defAttended}/${defHeld}, ${defPct}%)?`)) {
      localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
      localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
      setSubjects(DEFAULT_SUBJECTS);
      setTimetable(DEFAULT_TIMETABLE);
      setHistoryStack([]);
      showToast(`Reset to official ETLAB records (${defAttended}/${defHeld}, ${defPct}%)`, 'info', '🔄');
    }
  };

  const handleResetToOfficialAttendance = () => {
    const defAttended = DEFAULT_SUBJECTS.reduce((sum, s) => sum + s.attended, 0);
    const defHeld = DEFAULT_SUBJECTS.reduce((sum, s) => sum + s.held, 0);
    const defPct = calculatePercentage(defAttended, defHeld);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    setSubjects(DEFAULT_SUBJECTS);
    setHistoryStack([]);
    showToast(`Restored official ETLAB attendance (${defAttended}/${defHeld}, ${defPct}%)`, 'success', '🔄');
  };

  const handleApplyBatchAbsences = (subjectIds) => {
    if (!subjectIds || subjectIds.length === 0) return;

    setHistoryStack(prev => [...prev, {
      subjects: JSON.parse(JSON.stringify(subjects)),
      actionDescription: `Simulated bunk: ${subjectIds.length} classes`
    }]);

    const counts = {};
    subjectIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

    setSubjects(prev => prev.map(s => {
      if (counts[s.id]) {
        return { ...s, held: s.held + counts[s.id] };
      }
      return s;
    }));

    showToast(`Simulating ${subjectIds.length} missed classes in tracker`, 'warning', '⚠️');
  };

  const isSimulated = React.useMemo(() => {
    if (subjects.length !== DEFAULT_SUBJECTS.length) return true;
    return subjects.some(s => {
      const orig = DEFAULT_SUBJECTS.find(d => d.id === s.id);
      return !orig || orig.attended !== s.attended || orig.held !== s.held;
    });
  }, [subjects]);

  // Container wrapper: Full screen or centered mobile device frame
  return (
    <div className="min-h-screen bg-[#dbe4f3] dark:bg-[#121114] font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-blue-600 dark:selection:bg-pink-500 selection:text-white transition-colors duration-300">
      
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Main Container */}
      <div className={`w-full transition-all duration-300 ${
        isPhoneFrame 
          ? 'max-w-md my-0 sm:my-5 sm:rounded-[42px] sm:shadow-[0_25px_65px_-15px_rgba(71,85,105,0.25)] dark:sm:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] sm:border-[8px] sm:border-white/90 dark:sm:border-[#221f29] overflow-hidden bg-[#edf3fc] dark:bg-[#16141c] min-h-screen sm:min-h-[860px] relative'
          : 'max-w-xl md:max-w-3xl bg-[#edf3fc] dark:bg-[#16141c] min-h-screen relative shadow-2xl'
      }`}>
        
        {/* Phone Frame Speaker/Camera Notch (visible in phone frame on desktop) */}
        {isPhoneFrame && (
          <div className="hidden sm:flex justify-center pt-2.5 pb-1 bg-[#dbe4f3] dark:bg-[#121114] transition-colors">
            <div className="w-24 h-4 bg-[#cbd5e1] dark:bg-[#221f29] rounded-full flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#94a3b8] dark:bg-[#121114]"></span>
              <span className="w-10 h-1 bg-[#94a3b8] dark:bg-[#121114] rounded-full"></span>
            </div>
          </div>
        )}

        {/* Application Header */}
        <Header
          currentTab={activeTab}
          onResetData={handleResetData}
          isPhoneFrame={isPhoneFrame}
          setIsPhoneFrame={setIsPhoneFrame}
          todayDayName={todayDayName}
          currentDateFormatted={currentDateFormatted}
          syncInfo={syncInfo}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Dynamic Tab Content */}
        <main className="p-4 overflow-y-auto">
          {activeTab === 'timetable' && (
            <TimetableTab
              timetable={timetable}
              subjects={subjects}
              timeSlots={TIME_SLOTS}
              daysOfWeek={DAYS_OF_WEEK}
              todayDayId={todayDayId}
              onSaveSlot={handleSaveSlot}
              onDeleteSlot={handleDeleteSlot}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              subjects={subjects}
              onMarkAttendance={handleMarkAttendance}
              onUndoLastAction={handleUndoLastAction}
              canUndo={historyStack.length > 0}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetToOfficial={handleResetToOfficialAttendance}
              timetable={timetable}
              timeSlots={TIME_SLOTS}
              daysOfWeek={DAYS_OF_WEEK}
              todayDayId={todayDayId}
              onApplyBatchAbsences={handleApplyBatchAbsences}
              isSimulated={isSimulated}
              syncInfo={syncInfo}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          attendanceWarningCount={attendanceWarningCount}
        />

      </div>

    </div>
  );
}

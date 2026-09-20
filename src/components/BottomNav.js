// Bottom Navigation Bar component for MITS Campus Hub

export function BottomNav({ activeTab, setActiveTab, attendanceWarningCount = 0 }) {
  const tabs = [
    {
      id: 'timetable',
      label: 'Timetable',
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-amber-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'attendance',
      label: 'Attendance',
      badge: attendanceWarningCount > 0 ? attendanceWarningCount : null,
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-amber-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141318]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/[0.08] shadow-[0_-8px_25px_rgba(148,163,184,0.15)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.8)] transition-colors duration-300">
      <div className="max-w-md mx-auto sm:max-w-xl md:max-w-md">
        <div className="grid grid-cols-2 h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 select-none ${
                  isActive 
                    ? 'text-blue-600 dark:text-amber-400 font-bold' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute top-0 w-12 h-1 bg-blue-600 dark:bg-amber-400 rounded-b-full transition-all duration-300 shadow-sm shadow-blue-500/40 dark:shadow-amber-400/60"></span>
                )}

                <div className="relative">
                  {tab.icon(isActive)}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-white dark:ring-[#141318] animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[11px] tracking-tight transition-colors ${
                  isActive ? 'font-extrabold text-slate-900 dark:text-white' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Header component for MITS Campus Hub with Light & Helios Dark theme support

export function Header({ 
  currentTab, 
  onResetData, 
  isPhoneFrame, 
  setIsPhoneFrame, 
  todayDayName, 
  currentDateFormatted,
  syncInfo,
  isDarkMode,
  onToggleTheme
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#16141c]/95 backdrop-blur-md text-slate-800 dark:text-white shadow-xs border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 py-3 sm:max-w-xl md:max-w-4xl">
        <div className="flex items-center justify-between gap-2.5">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-purple-700 dark:via-pink-600 dark:to-amber-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-white dark:bg-[#16141c] rounded-[14px] flex items-center justify-center font-black text-blue-600 dark:text-amber-400 text-xs tracking-tighter">
                MITS
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  MITS Campus Hub
                </h1>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30">
                  S3 CS AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span>{todayDayName}, {currentDateFormatted}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-blue-600 dark:text-amber-400 font-semibold">Room 512</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {syncInfo && syncInfo.timestamp && (
              <div 
                title={`Last Synced with ETLAB: ${syncInfo.timestamp}`}
                className="hidden xs:flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-emerald-300 bg-blue-50 dark:bg-emerald-950/40 border border-blue-200 dark:border-emerald-700/50 rounded-xl select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-emerald-400 animate-pulse"></span>
                <span className="hidden sm:inline text-slate-600 dark:text-slate-300">ETLAB</span>
                <span>{syncInfo.timestamp.split(' ')[1] ? syncInfo.timestamp.split(' ')[1].substring(0, 5) : 'Synced'}</span>
              </div>
            )}

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? "Switch to Soft Light Mode (Dashboard)" : "Switch to Helios Dark Mode"}
              className="p-1.5 text-xs rounded-xl transition-all active:scale-90 flex items-center gap-1 border shadow-xs select-none bg-slate-100 hover:bg-indigo-50 border-slate-200 text-slate-700 dark:bg-[#221f29] dark:hover:bg-[#2b2736] dark:border-white/[0.08] dark:text-amber-300"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4 text-amber-300 transition-transform hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
              <span className="hidden sm:inline text-[11px] font-bold">
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              title={isPhoneFrame ? "Expand to Full Width" : "Switch to Mobile Phone Frame"}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#221f29] dark:hover:bg-[#2b2736] border border-slate-200 dark:border-white/[0.08] rounded-xl transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
                <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{isPhoneFrame ? "Full" : "Frame"}</span>
            </button>

            <button
              onClick={onResetData}
              title="Reset to official student attendance report (214/228, 94%)"
              className="p-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#221f29] dark:hover:bg-[#2b2736] border border-slate-200 dark:border-white/[0.08] rounded-xl transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline text-[11px]">Reset</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

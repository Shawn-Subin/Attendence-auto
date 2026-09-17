// Header component for MITS Campus Hub

export function Header({ 
  currentTab, 
  onResetData, 
  isPhoneFrame, 
  setIsPhoneFrame, 
  todayDayName, 
  currentDateFormatted,
  syncInfo 
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 py-3 sm:max-w-xl md:max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 p-0.5 shadow-lg flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-xs tracking-tighter">
                MITS
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  MITS Campus Hub
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  S3 CS AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{todayDayName}, {currentDateFormatted}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400/90 font-medium">JUL-DEC 2026</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Frame toggle (desktop) & Reset Data */}
          <div className="flex items-center gap-2">
            {syncInfo && syncInfo.timestamp && (
              <div 
                title={`Last Synced with ETLAB: ${syncInfo.timestamp}`}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-700/50 rounded-lg select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="hidden sm:inline text-slate-300">ETLAB</span>
                <span>{syncInfo.timestamp.split(' ')[1] ? syncInfo.timestamp.split(' ')[1].substring(0, 5) : 'Synced'}</span>
              </div>
            )}
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              title={isPhoneFrame ? "Expand to Full Width" : "Switch to Mobile Phone Frame"}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
                <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{isPhoneFrame ? "Full Width" : "Phone Frame"}</span>
            </button>

            <button
              onClick={onResetData}
              title="Reset to default MITS schedule & demo data"
              className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center gap-1"
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

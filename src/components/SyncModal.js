// SyncModal component for MITS Campus Hub
// Enables classmates to log into ETLAB and sync live attendance numbers

export function SyncModal({
  isOpen,
  onClose,
  onSyncSuccess,
  showToast,
  activeStudent,
  savedCreds,
  onClearSession,
  isFirstVisit
}) {
  const [username, setUsername] = React.useState(savedCreds?.username || '');
  const [password, setPassword] = React.useState(savedCreds?.password || '');
  const [studentId, setStudentId] = React.useState(savedCreds?.studentId || '');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  
  const [apiUrl, setApiUrl] = React.useState(() => {
    return localStorage.getItem('mits_backend_api_url') || 'http://localhost:4000';
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [syncStatusStep, setSyncStatusStep] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (savedCreds) {
      if (savedCreds.username) setUsername(savedCreds.username);
      if (savedCreds.password) setPassword(savedCreds.password);
      if (savedCreds.studentId) setStudentId(savedCreds.studentId);
    }
  }, [savedCreds]);

  // Auto-fill Shawn's known ID when his username is typed
  React.useEffect(() => {
    if (username.trim().toUpperCase() === '25CT256' && !studentId) {
      setStudentId('46380601013');
    }
  }, [username]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setSyncStatusStep(0);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    'Connecting to ETLAB portal...',
    'Authenticating credentials...',
    'Fetching S3 CS AI attendance...',
    'Calculating 90% & 75% bunk limits...'
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your ETLAB username and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setSyncStatusStep(0);

    const cleanUrl = apiUrl.trim().replace(/\/+$/, '');
    localStorage.setItem('mits_backend_api_url', cleanUrl);

    const stepInterval = setInterval(() => {
      setSyncStatusStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 900);

    try {
      const endpoint = `${cleanUrl}/api/scrape-attendance`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          studentId: studentId.trim() || undefined
        })
      });

      clearInterval(stepInterval);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Sync failed (HTTP ${response.status})`);
      }

      setSyncStatusStep(3);

      if (rememberMe) {
        localStorage.setItem('mits_saved_credentials_v1', JSON.stringify({
          username: username.trim(),
          password: password,
          studentId: studentId.trim()
        }));
      } else {
        localStorage.removeItem('mits_saved_credentials_v1');
      }

      showToast(`Synced successfully! Welcome, ${data.student?.name || 'Student'}!`, 'success', '🎉');
      onSyncSuccess(data);
      onClose();
    } catch (err) {
      clearInterval(stepInterval);
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to sync with ETLAB. Please check your credentials or backend server.');
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect this account and clear saved credentials from this device?')) {
      onClearSession();
      setUsername('');
      setPassword('');
      setStudentId('');
      setErrorMessage('');
      showToast('Account disconnected and credentials removed', 'info', '👋');
      onClose();
    }
  };

  const handleCloseModal = () => {
    try {
      sessionStorage.setItem('mits_dismissed_login_prompt', 'true');
    } catch (e) {}
    onClose();
  };

  const isConnected = !!(activeStudent && activeStudent.name && localStorage.getItem('mits_student_profile_v1'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1a1921] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-purple-600 dark:to-pink-600 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-white dark:bg-[#1a1921] rounded-[14px] flex items-center justify-center text-blue-600 dark:text-pink-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isConnected ? 'Sync ETLAB Attendance' : 'Welcome to MITS Hub 👋'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isConnected ? 'Refresh your live S3 CS AI attendance' : 'Sign in to load your personal attendance'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isConnected && (
            <div className="mt-3.5 px-3 py-2 rounded-xl bg-blue-50/80 dark:bg-pink-500/10 border border-blue-200/60 dark:border-pink-500/20 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-slate-500 dark:text-slate-400">Connected: </span>
                <span className="font-bold text-slate-800 dark:text-white">{activeStudent.name || activeStudent.Name}</span>
                <span className="text-slate-400 text-[11px] ml-1">({activeStudent.regNo || activeStudent.RegNo})</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex-shrink-0 ml-2"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ETLAB Username / Admission ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. 25CT256 or MITS25UCA065"
              disabled={isLoading}
              autoFocus={!username}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121114] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 text-sm font-medium transition"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ETLAB Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-blue-600 dark:text-pink-400 hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121114] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 text-sm font-medium transition"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Remember credentials on this device
              </span>
            </label>
          </div>

          {/* Live Progress Pipeline */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-white/[0.04] border border-blue-100 dark:border-white/10 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-pink-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-pink-500 animate-ping"></span>
                  {steps[syncStatusStep]}
                </span>
                <span className="font-mono text-[11px]">Step {syncStatusStep + 1}/4</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-pink-500 dark:to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((syncStatusStep + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              <strong>Zero-Storage Guarantee:</strong> Passwords are used strictly in-memory during sync and never stored on any server or external database.
            </span>
          </div>

          {/* Advanced Settings Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>Advanced Options (Student ID & Scraper URL)</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121114] border border-slate-200 dark:border-white/[0.08] space-y-3 animate-fade-in text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Student Semester Registration ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 46380601013 (Auto-detected if blank)"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1921] text-slate-800 dark:text-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Number found in your ETLAB attendance URL (e.g. <code>viewattendancesubject/46380601013</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Scraper Backend Endpoint
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:4000 or https://mits-scraper.onrender.com"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1921] text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              {isConnected ? 'Cancel' : 'Explore Demo Mode'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-pink-600 dark:to-purple-600 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isConnected ? 'Sync Now' : 'Connect & Sync'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

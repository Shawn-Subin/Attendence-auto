// Floating Toast notifications for smooth user feedback

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-slate-950',
    error: 'bg-rose-600 text-white'
  };

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-short">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-white/20 ${bgColors[toast.type] || bgColors.info}`}>
        <span>{toast.icon || 'ℹ️'}</span>
        <span>{toast.message}</span>
        <button 
          onClick={onClose}
          className="ml-2 opacity-80 hover:opacity-100 p-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

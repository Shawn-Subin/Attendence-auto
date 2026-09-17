// ManageSubjectsModal to add or edit subjects and initial attendance counts

export function ManageSubjectsModal({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject
}) {
  if (!isOpen) return null;

  const [mode, setMode] = React.useState('list'); // 'list' | 'add' | 'edit'
  const [selectedSub, setSelectedSub] = React.useState(null);

  // Form fields
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [faculty, setFaculty] = React.useState('');
  const [attended, setAttended] = React.useState(20);
  const [held, setHeld] = React.useState(25);
  const [room, setRoom] = React.useState('Room 512');
  const [color, setColor] = React.useState('#3b82f6');

  const colorOptions = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'
  ];

  const handleStartAdd = () => {
    setName('');
    setCode('');
    setFaculty('');
    setAttended(20);
    setHeld(25);
    setRoom('Room 512');
    setColor(colorOptions[Math.floor(Math.random() * colorOptions.length)]);
    setMode('add');
  };

  const handleStartEdit = (sub) => {
    setSelectedSub(sub);
    setName(sub.name);
    setCode(sub.code);
    setFaculty(sub.faculty);
    setAttended(sub.attended);
    setHeld(sub.held);
    setRoom(sub.room || 'Room 512');
    setColor(sub.color || '#3b82f6');
    setMode('edit');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const attendedNum = Math.max(0, parseInt(attended, 10) || 0);
    const heldNum = Math.max(attendedNum, parseInt(held, 10) || 0);

    if (mode === 'add') {
      onAddSubject({
        id: 'sub-' + Date.now(),
        code: code.trim().toUpperCase(),
        name: name.trim(),
        shortName: name.trim().split(' ')[0],
        faculty: faculty.trim() || 'Staff',
        room: room.trim() || 'Faraday 204',
        attended: attendedNum,
        held: heldNum,
        color
      });
    } else if (mode === 'edit' && selectedSub) {
      onUpdateSubject({
        ...selectedSub,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        faculty: faculty.trim() || 'Staff',
        room: room.trim() || 'Faraday 204',
        attended: attendedNum,
        held: heldNum,
        color
      });
    }

    setMode('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              ⚙️
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {mode === 'list' ? 'Manage Subjects' : mode === 'add' ? 'Add New Subject' : 'Edit Subject'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-3 flex-1 space-y-3">
          {mode === 'list' && (
            <div className="space-y-2">
              <button
                onClick={handleStartAdd}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <span>+ Add New Subject</span>
              </button>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => {
                  const pct = sub.held > 0 ? Math.round((sub.attended / sub.held) * 1000) / 10 : 100;
                  return (
                    <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: sub.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sub.code}: {sub.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {sub.faculty} • {sub.attended}/{sub.held} ({pct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(sub)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${sub.name}?`)) {
                              onDeleteSubject(sub.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CST 301"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. Prof. Biju Paul"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Attended Classes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attended}
                    onChange={(e) => setAttended(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Total Classes Held
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={held}
                    onChange={(e) => setHeld(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-900 dark:ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
                >
                  Back to List
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                >
                  Save Subject
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

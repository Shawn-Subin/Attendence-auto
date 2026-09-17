// Modal to add or edit timetable slots

export function EditTimetableModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  slotData, 
  subjects, 
  timeSlots, 
  daysOfWeek 
}) {
  if (!isOpen) return null;

  const [day, setDay] = React.useState(slotData?.day || 'mon');
  const [slotId, setSlotId] = React.useState(slotData?.slotId || 'p1');
  const [subjectId, setSubjectId] = React.useState(slotData?.subjectId || subjects[0]?.id || '');
  const [room, setRoom] = React.useState(slotData?.room || 'Room 512');

  const isEditing = Boolean(slotData?.isEditing);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectId) return;

    onSave({
      day,
      slotId,
      subjectId,
      room: room.trim() || 'TBA',
      originalSlotId: slotData?.slotId,
      originalDay: slotData?.day
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Class Slot' : 'Add Class Slot'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Day selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {daysOfWeek.map(d => (
                <option key={d.id} value={d.id}>{d.full}</option>
              ))}
            </select>
          </div>

          {/* Time Slot selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Period / Time Slot
            </label>
            <select
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeSlots.filter(s => !s.isBreak).map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.time})
                </option>
              ))}
            </select>
          </div>

          {/* Subject selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name} ({s.faculty})
                </option>
              ))}
            </select>
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Room / Classroom / Lab
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Faraday 204, Turing Lab"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this class from the schedule?')) {
                    onDelete(day, slotId);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition"
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20"
            >
              {isEditing ? 'Save Changes' : 'Add Class'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

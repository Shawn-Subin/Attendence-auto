// TimetableTab component - Today's Schedule & Weekly Grid view
import { calculatePercentage } from '../utils/attendanceMath.js';

export function TimetableTab({
  timetable,
  subjects,
  timeSlots,
  daysOfWeek,
  todayDayId,
  onSaveSlot,
  onDeleteSlot,
  onSwitchTab
}) {
  const [viewMode, setViewMode] = React.useState('today'); // 'today' | 'weekly'
  const [selectedDay, setSelectedDay] = React.useState(todayDayId || 'mon');
  const [editingSlot, setEditingSlot] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Subject lookup map
  const subjectsMap = React.useMemo(() => {
    const map = {};
    subjects.forEach(s => { map[s.id] = s; });
    return map;
  }, [subjects]);

  // Determine current active or upcoming slot based on current time
  const currentSlotStatus = React.useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse time strings like "09:00" to minutes
    const parseTime = (tStr) => {
      if (!tStr) return 0;
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    let activeId = null;
    let nextId = null;

    for (const slot of timeSlots) {
      if (slot.start && slot.end) {
        const startMin = parseTime(slot.start);
        const endMin = parseTime(slot.end);

        if (currentMinutes >= startMin && currentMinutes <= endMin) {
          activeId = slot.id;
          break;
        } else if (currentMinutes < startMin && !nextId) {
          nextId = slot.id;
        }
      }
    }

    return { activeId, nextId };
  }, [timeSlots]);

  // Handle slot click for editing
  const handleSlotClick = (day, slotId, currentEntry) => {
    setEditingSlot({
      day,
      slotId,
      subjectId: currentEntry?.subjectId || subjects[0]?.id,
      room: currentEntry?.room || 'Faraday 204',
      isEditing: Boolean(currentEntry)
    });
    setIsModalOpen(true);
  };

  const handleAddNewClass = () => {
    setEditingSlot({
      day: selectedDay,
      slotId: 'p1',
      subjectId: subjects[0]?.id,
      room: 'Faraday 204',
      isEditing: false
    });
    setIsModalOpen(true);
  };

  // Day's entries
  const daySchedule = timetable[selectedDay] || [];

  return (
    <div className="space-y-4 pb-20 animate-fade-in">

      {/* View Switcher & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'today'
                ? 'bg-white dark:bg-blue-600 text-blue-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Today's View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-blue-600 text-blue-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Weekly Grid
          </button>
        </div>

        <button
          onClick={handleAddNewClass}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition shadow-sm shadow-blue-500/30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Class</span>
        </button>
      </div>

      {/* Day Selector Pills for 'Today' mode */}
      {viewMode === 'today' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {daysOfWeek.map((d) => {
            const isToday = d.id === todayDayId;
            const isSelected = d.id === selectedDay;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`flex-1 min-w-[54px] py-2 px-1 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80">{d.short}</div>
                <div className="text-xs font-extrabold flex items-center justify-center gap-0.5 mt-0.5">
                  {d.short}
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}


      {/* TODAY'S VERTICAL SCHEDULE VIEW */}
      {viewMode === 'today' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Schedule for {daysOfWeek.find(d => d.id === selectedDay)?.full}
            </span>
            <span>{daySchedule.length} periods scheduled</span>
          </div>

          <div className="space-y-2">
            {timeSlots.map((slot) => {
              // Check if break
              if (slot.isBreak) {
                return (
                  <div 
                    key={slot.id} 
                    className="flex items-center gap-3 py-1.5 px-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs"
                  >
                    <span className="text-base">☕</span>
                    <span className="font-semibold">{slot.label}</span>
                    <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 ml-auto font-mono">
                      {slot.time}
                    </span>
                  </div>
                );
              }

              const entry = daySchedule.find(e => e.slotId === slot.id);
              const subject = entry ? subjectsMap[entry.subjectId] : null;

              const isCurrent = selectedDay === todayDayId && currentSlotStatus.activeId === slot.id;
              const isNext = selectedDay === todayDayId && !currentSlotStatus.activeId && currentSlotStatus.nextId === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(selectedDay, slot.id, entry)}
                  className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                      : isNext
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 shadow-sm'
                      : entry
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600 shadow-sm'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  {subject && (
                    <div 
                      className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full"
                      style={{ backgroundColor: subject.color || '#3b82f6' }}
                    />
                  )}

                  {/* Time & Slot Label */}
                  <div className="w-16 flex-shrink-0 text-left pl-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      {slot.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {slot.start}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      to {slot.end}
                    </span>
                  </div>

                  {/* Class Info */}
                  <div className="flex-1 min-w-0">
                    {entry && subject ? (
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                              style={{ 
                                backgroundColor: `${subject.color}15`, 
                                color: subject.color,
                                border: `1px solid ${subject.color}35`
                              }}
                            >
                              {subject.code}
                            </span>

                            {isCurrent && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-600 text-white animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                Ongoing Now
                              </span>
                            )}

                            {isNext && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500 text-slate-950">
                                Up Next
                              </span>
                            )}
                          </div>

                          <span className="text-slate-400 group-hover:text-blue-600 text-xs transition">
                            ✏️
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                          {subject.name}
                        </h4>

                        <div className="flex items-center justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 truncate">
                            <span>👤</span>
                            <span className="truncate">{subject.faculty}</span>
                          </div>
                          <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md flex-shrink-0">
                            <span>📍</span>
                            <span>{entry.room || subject.room}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-2 text-slate-400 text-xs">
                        <span className="italic">Free Period / Self Study</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                          + Assign Class
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEKLY FULL GRID VIEW */}
      {viewMode === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Weekly Master Grid (Mon – Fri • Room 512)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap any block to edit
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              
              {/* Header Row: Days (Mon-Fri) */}
              <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center">
                <div className="p-2.5 border-r border-slate-200 dark:border-slate-800">Time / Period</div>
                {daysOfWeek.map(d => (
                  <div 
                    key={d.id} 
                    className={`p-2.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                      d.id === todayDayId ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300' : ''
                    }`}
                  >
                    {d.short}
                    {d.id === todayDayId && <span className="block text-[9px] text-amber-600 dark:text-amber-400">Today</span>}
                  </div>
                ))}
              </div>

              {/* Slot Rows */}
              {timeSlots.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <div 
                      key={slot.id} 
                      className="py-1 px-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] font-semibold text-center border-b border-slate-200 dark:border-slate-800 font-mono"
                    >
                      ☕ {slot.label} ({slot.time})
                    </div>
                  );
                }

                return (
                  <div key={slot.id} className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                    {/* Time Column */}
                    <div className="p-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 font-mono text-[10px] text-slate-500 dark:text-slate-400 flex flex-col justify-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{slot.label}</span>
                      <span>{slot.time}</span>
                    </div>

                    {/* Day Cells */}
                    {daysOfWeek.map((d) => {
                      const entry = (timetable[d.id] || []).find(e => e.slotId === slot.id);
                      const subject = entry ? subjectsMap[entry.subjectId] : null;

                      return (
                        <div
                          key={d.id}
                          onClick={() => handleSlotClick(d.id, slot.id, entry)}
                          className={`p-1.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20 min-h-[64px] flex flex-col justify-between ${
                            d.id === todayDayId ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          {entry && subject ? (
                            <div 
                              className="h-full rounded-lg p-1.5 text-left border flex flex-col justify-between transition group hover:shadow-sm"
                              style={{ 
                                backgroundColor: `${subject.color}15`, 
                                borderColor: `${subject.color}40`
                              }}
                            >
                              <div>
                                <div className="font-bold text-[10px] truncate" style={{ color: subject.color }}>
                                  {subject.shortName || subject.code}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                  {subject.faculty?.split(' ')[0]}
                                </div>
                              </div>
                              <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
                                {entry.room || 'Faraday'}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:border-slate-400 hover:text-slate-500">
                              +
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      )}

      {/* Edit Slot Modal */}
      <EditTimetableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveSlot}
        onDelete={onDeleteSlot}
        slotData={editingSlot}
        subjects={subjects}
        timeSlots={timeSlots}
        daysOfWeek={daysOfWeek}
      />

    </div>
  );
}

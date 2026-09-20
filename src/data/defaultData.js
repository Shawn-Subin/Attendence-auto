// Official MITS S3 CS AI (Jul-Dec 2026) Timetable and Subject Data
// Student: Shawn Subin Philip (Roll No: 65 | Reg No: MITS25UCA065)
// Classroom: Room 512 (Mon - Fri)

export const STUDENT_PROFILE = {
  name: 'Shawn Subin Philip',
  rollNo: '65',
  regNo: 'MITS25UCA065',
  semester: 'S3 CS AI',
  department: 'Computer Science & Engineering (Artificial Intelligence)'
};

export const DEFAULT_SUBJECTS = [
  {
    id: 'sub-lsd',
    code: 'CN310B',
    courseId: 'B250802/CN310B',
    name: 'Logic System Design (LSD)',
    shortName: 'LSD',
    faculty: 'Angel B John (ABJ)',
    color: '#3b82f6',
    attended: 51,
    held: 54, // 93.6% -> 94% (Bunk till 90%: 1 class)
    room: 'Room 512'
  },
  {
    id: 'sub-fods',
    code: 'CN310C',
    courseId: 'B250802/CN310C',
    name: 'Fundamentals of Data Structures (FoDS)',
    shortName: 'FoDS',
    faculty: 'Dr. Parvathy Jyothi (Dr PJ) / Sheena Y',
    color: '#06b6d4',
    attended: 47,
    held: 48, // 97.7% -> 98% (Bunk till 90%: 3 classes)
    room: 'Room 512'
  },
  {
    id: 'sub-mis3',
    code: 'MA300A',
    courseId: 'B250904/MA300A',
    name: 'Mathematics for Information Science-3 (MIS3)',
    shortName: 'MIS3',
    faculty: 'Dr. S. Babu / Dr. J. Thomas',
    color: '#8b5cf6',
    attended: 37,
    held: 40, // 91.9% -> 92% (Bunk till 90%: 0 classes - on edge!)
    room: 'Room 512'
  },
  {
    id: 'sub-for',
    code: 'AI300E',
    courseId: 'B250006/AI300E',
    name: 'Foundations of Robotics (FoR)',
    shortName: 'FoR',
    faculty: 'Anitha S (AS)',
    color: '#10b981',
    attended: 37,
    held: 39, // 93.9% -> 94% (Bunk till 90%: 1 class)
    room: 'Room 512'
  },
  {
    id: 'sub-aoop',
    code: 'CN320D',
    courseId: 'B250802/CN320D',
    name: 'Advanced Object Oriented Programming (AOOP)',
    shortName: 'AOOP',
    faculty: 'Remya V (RV)',
    color: '#f59e0b',
    attended: 30,
    held: 33, // 89.7% -> 90% (<90%, bunks till 75%: 5 classes)
    room: 'Room 512'
  },
  {
    id: 'sub-ee',
    code: 'HU900F',
    courseId: 'B250908/HU900F',
    name: 'Engineering Economics (EE)',
    shortName: 'EE',
    faculty: 'Reshma S (RS)',
    color: '#ec4899',
    attended: 26,
    held: 28, // 91.7% -> 92% (Bunk till 90%: 0 classes - on edge!)
    room: 'Room 512'
  },
  {
    id: 'sub-amh',
    code: 'AMH',
    courseId: 'AMH',
    name: 'Academic Mentoring Hour',
    shortName: 'AMH',
    faculty: 'Faculty Mentor',
    color: '#6366f1',
    attended: 8,
    held: 8, // 100%
    room: 'Room 512'
  },
  {
    id: 'sub-adh',
    code: 'AD_H',
    courseId: 'AD_H',
    name: 'Department Hour',
    shortName: 'AD_H',
    faculty: 'CSE (AI) HOD & Staff',
    color: '#14b8a6',
    attended: 7,
    held: 7, // 100%
    room: 'Room 512'
  }
];

export const TIME_SLOTS = [
  { id: 'p1', time: '08:00 - 08:55', start: '08:00', end: '08:55', label: 'Period 1' },
  { id: 'rec1', isBreak: true, time: '08:55 - 09:15', label: 'Morning Recess (20m)' },
  { id: 'p2', time: '09:15 - 10:05', start: '09:15', end: '10:05', label: 'Period 2' },
  { id: 'p3', time: '10:05 - 10:55', start: '10:05', end: '10:55', label: 'Period 3' },
  { id: 'p4', time: '10:55 - 11:45', start: '10:55', end: '11:45', label: 'Period 4' },
  { id: 'rec2', isBreak: true, time: '11:45 - 12:00', label: 'Midday Recess (15m)' },
  { id: 'p5', time: '12:00 - 12:50', start: '12:00', end: '12:50', label: 'Period 5' },
  { id: 'p6', time: '12:50 - 13:40', start: '12:50', end: '13:40', label: 'Period 6' }
];

// Friday Schedule: Recess after Period 2 (20m), Period 5 lasts till 12:40 only
export const FRIDAY_TIME_SLOTS = [
  { id: 'p1', time: '08:00 - 08:55', start: '08:00', end: '08:55', label: 'Period 1' },
  { id: 'p2', time: '08:55 - 09:45', start: '08:55', end: '09:45', label: 'Period 2' },
  { id: 'rec_fri', isBreak: true, time: '09:45 - 10:05', label: 'Friday Recess (20m)' },
  { id: 'p3', time: '10:05 - 10:55', start: '10:05', end: '10:55', label: 'Period 3' },
  { id: 'p4', time: '10:55 - 11:45', start: '10:55', end: '11:45', label: 'Period 4' },
  { id: 'p5', time: '11:45 - 12:40', start: '11:45', end: '12:40', label: 'Period 5 (Final)' }
];

export const DAYS_OF_WEEK = [
  { id: 'mon', short: 'Mon', full: 'Monday' },
  { id: 'tue', short: 'Tue', full: 'Tuesday' },
  { id: 'wed', short: 'Wed', full: 'Wednesday' },
  { id: 'thu', short: 'Thu', full: 'Thursday' },
  { id: 'fri', short: 'Fri', full: 'Friday' }
];

export const DEFAULT_TIMETABLE = {
  mon: [
    { slotId: 'p1', subjectId: 'sub-fods', room: 'Room 512' },
    { slotId: 'p2', subjectId: 'sub-mis3', room: 'Room 512' },
    { slotId: 'p3', subjectId: 'sub-lsd', room: 'Room 512' },
    { slotId: 'p4', subjectId: 'sub-aoop', room: 'Room 512' },
    { slotId: 'p5', subjectId: 'sub-for', room: 'Room 512' },
    { slotId: 'p6', subjectId: 'sub-ee', room: 'Room 512' }
  ],
  tue: [
    { slotId: 'p1', subjectId: 'sub-lsd', room: 'Room 512' },
    { slotId: 'p2', subjectId: 'sub-fods', room: 'Room 512' },
    { slotId: 'p3', subjectId: 'sub-aoop', room: 'Room 512' },
    { slotId: 'p4', subjectId: 'sub-mis3', room: 'Room 512' },
    { slotId: 'p5', subjectId: 'sub-ee', room: 'Room 512' },
    { slotId: 'p6', subjectId: 'sub-for', room: 'Room 512' }
  ],
  wed: [
    { slotId: 'p1', subjectId: 'sub-fods', room: 'Room 512' },
    { slotId: 'p2', subjectId: 'sub-for', room: 'Room 512' },
    { slotId: 'p3', subjectId: 'sub-amh', room: 'Room 512' },
    { slotId: 'p4', subjectId: 'sub-aoop', room: 'Room 512 / Turing Lab' },
    { slotId: 'p5', subjectId: 'sub-aoop', room: 'Room 512 / Turing Lab' },
    { slotId: 'p6', subjectId: 'sub-aoop', room: 'Room 512 / Turing Lab' }
  ],
  thu: [
    { slotId: 'p1', subjectId: 'sub-aoop', room: 'Room 512' },
    { slotId: 'p2', subjectId: 'sub-fods', room: 'Room 512' },
    { slotId: 'p3', subjectId: 'sub-for', room: 'Room 512' },
    { slotId: 'p4', subjectId: 'sub-mis3', room: 'Room 512' },
    { slotId: 'p5', subjectId: 'sub-lsd', room: 'Room 512' },
    { slotId: 'p6', subjectId: 'sub-ee', room: 'Room 512' }
  ],
  fri: [
    { slotId: 'p1', subjectId: 'sub-lsd', room: 'Room 512' },
    { slotId: 'p2', subjectId: 'sub-mis3', room: 'Room 512' },
    { slotId: 'p3', subjectId: 'sub-fods', room: 'Room 512 / Lovelace Lab' },
    { slotId: 'p4', subjectId: 'sub-fods', room: 'Room 512 / Lovelace Lab' },
    { slotId: 'p5', subjectId: 'sub-fods', room: 'Room 512 / Lovelace Lab' }
  ]
};

export const ATTENDANCE_STORAGE_KEY = 'mits_s3_cs_ai_shawn_v1789911516';
export const TIMETABLE_STORAGE_KEY = 'mits_s3_timetable_cs_ai_v15';

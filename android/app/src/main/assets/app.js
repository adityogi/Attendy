/**
 * ClassTrack — Apple Calendar Attendance & CIE Manager
 * Complete Application Engine
 */

(function () {
  'use strict';

  // ==========================================
  // 1. STATE & STORAGE MANAGEMENT
  // ==========================================
  const STORAGE_KEY = 'classtrack_apple_cal_v1';

  // RV College of Engineering — CSE (AIML) Section CI-A Timetable (ACY 2026-27)
  const RVCE_TIMETABLE = [
    // MONDAY
    { id: 'mon-1', day: 'monday', subject: 'HS115YL - Health & Yoga Practice', startTime: '09:00', endTime: '11:00', type: 'Practical', room: 'AIML CR-001', faculty: 'Rajesh / Manasa' },
    { id: 'mon-2', day: 'monday', subject: 'CM211IA - Chemistry of Smart Materials', startTime: '11:30', endTime: '12:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Girisha kumar [GKS]' },
    { id: 'mon-3', day: 'monday', subject: 'MA211TC - Linear Algebra & Calculus', startTime: '12:30', endTime: '13:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Satish V.M.' },
    { id: 'mon-4', day: 'monday', subject: 'XX115XIX - Programming Language Lab', startTime: '14:30', endTime: '16:30', type: 'Lab', room: 'Computing Lab', faculty: 'Dept Faculty' },

    // TUESDAY
    { id: 'tue-1', day: 'tuesday', subject: 'XX113XTX - Engineering Science-1', startTime: '09:00', endTime: '10:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'ESC Faculty' },
    { id: 'tue-2', day: 'tuesday', subject: 'XX115XIX - Programming Language Course', startTime: '10:00', endTime: '11:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'PLC Faculty' },
    { id: 'tue-3', day: 'tuesday', subject: 'MA211TC - Linear Algebra & Calculus', startTime: '11:30', endTime: '12:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Satish V.M.' },
    { id: 'tue-4', day: 'tuesday', subject: 'HS112TC - Indian Constitution', startTime: '12:30', endTime: '13:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Vageesh Hp' },
    { id: 'tue-5', day: 'tuesday', subject: 'Experiential Learning', startTime: '14:30', endTime: '16:30', type: 'Practical', room: 'AIML CR-001', faculty: 'Dept Faculty' },

    // WEDNESDAY
    { id: 'wed-1', day: 'wednesday', subject: 'MA211TC - Linear Algebra & Calculus', startTime: '09:00', endTime: '10:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Satish V.M.' },
    { id: 'wed-2', day: 'wednesday', subject: 'CM211IA - Chemistry of Smart Materials', startTime: '10:00', endTime: '11:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Girisha kumar [GKS]' },
    { id: 'wed-3', day: 'wednesday', subject: 'XX113XTX - Engineering Science-1', startTime: '11:30', endTime: '12:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'ESC Faculty' },
    { id: 'wed-4', day: 'wednesday', subject: 'XX115XIX - Programming Language Course', startTime: '12:30', endTime: '13:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'PLC Faculty' },
    { id: 'wed-5', day: 'wednesday', subject: 'ME112GL - CAEG (Theory)', startTime: '14:30', endTime: '16:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Ramakrishna Hegde [RH]' },

    // THURSDAY
    { id: 'thu-1', day: 'thursday', subject: 'ME112GL - CAEG (Lab)', startTime: '09:00', endTime: '11:00', type: 'Lab', room: 'CCH2 Lab', faculty: 'Dr. Ramakrishna Hegde [RH]' },
    { id: 'thu-2', day: 'thursday', subject: 'XX113XTX - Engineering Science-1', startTime: '11:30', endTime: '12:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'ESC Faculty' },
    { id: 'thu-3', day: 'thursday', subject: 'Counselling', startTime: '12:30', endTime: '13:30', type: 'Tutorial', room: 'AIML CR-001', faculty: 'Faculty Counsellor' },
    { id: 'thu-4', day: 'thursday', subject: 'Experiential Learning', startTime: '14:30', endTime: '16:30', type: 'Practical', room: 'AIML CR-001', faculty: 'Dept Faculty' },

    // FRIDAY
    { id: 'fri-1', day: 'friday', subject: 'CM211IA - Chemistry of Smart Materials', startTime: '09:00', endTime: '10:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Girisha kumar [GKS]' },
    { id: 'fri-2', day: 'friday', subject: 'MA211TC - Linear Algebra & Calculus', startTime: '10:00', endTime: '11:00', type: 'Lecture', room: 'AIML CR-001', faculty: 'Dr. Satish V.M.' },
    { id: 'fri-3', day: 'friday', subject: 'HS111EL - Communicative English-1', startTime: '11:30', endTime: '13:30', type: 'Lecture', room: 'AIML CR-001', faculty: 'Prof. Ramthilak' },
    { id: 'fri-4', day: 'friday', subject: 'CM211IA - Chemistry Lab', startTime: '14:30', endTime: '16:30', type: 'Lab', room: 'Chem Lab 1-3', faculty: 'Dr. Girisha kumar [GKS]' }
  ];

  const PRESETS = {
    rvce: RVCE_TIMETABLE,
    cs: [
      { id: 'cs-1', day: 'monday', subject: 'Data Structures & Algorithms', startTime: '09:00', endTime: '10:00', type: 'Lecture', room: 'LH-101' },
      { id: 'cs-2', day: 'monday', subject: 'Operating Systems', startTime: '10:00', endTime: '11:00', type: 'Lecture', room: 'LH-102' },
      { id: 'cs-3', day: 'monday', subject: 'Computer Networks', startTime: '11:15', endTime: '12:15', type: 'Lecture', room: 'LH-101' },
      { id: 'cs-4', day: 'monday', subject: 'Data Structures Lab', startTime: '13:15', endTime: '15:15', type: 'Lab', room: 'Computing Lab 1' }
    ]
  };

  // Application State
  let state = {
    settings: {
      targetPercentage: 85,
      workingDays: 5,
      theme: 'light'
    },
    // Custom target percentages per course (RV Utility feature)
    courseTargets: {},
    // Past attendance baselines (Maths pre-loaded: 15 attended out of 18)
    baselines: {
      'MA211TC - Linear Algebra & Calculus': { attended: 15, total: 18 }
    },
    timetable: JSON.parse(JSON.stringify(RVCE_TIMETABLE)),
    attendance: [],
    extraClasses: []
  };

  // Calendar View State
  let currentDate = new Date(); // currently selected day
  let calendarMonthDate = new Date(); // month displayed in Month View (e.g. Sep 2026)
  let activeTab = 'day'; // 'day', 'month', 'cie', 'timetable', 'history'

  // Load from LocalStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = {
          ...state,
          ...parsed,
          settings: { ...state.settings, ...(parsed.settings || {}) },
          courseTargets: { ...(parsed.courseTargets || {}) },
          baselines: { ...state.baselines, ...(parsed.baselines || {}) }
        };
        // Sanitize: Attendance can only exist for today or past dates
        if (Array.isArray(state.attendance)) {
          state.attendance = state.attendance.filter(r => !isFutureDate(r.date));
        }
      } else {
        saveState();
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
  }

  // Save to LocalStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      showToast('Error saving data to browser storage', 'error');
    }
  }

  // ==========================================
  // 2. HELPER UTILITIES
  // ==========================================
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const DAY_DISPLAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isFutureDate(dateInput) {
    const todayStr = formatDateISO(new Date());
    const targetStr = (typeof dateInput === 'string') ? dateInput : formatDateISO(dateInput);
    return targetStr > todayStr;
  }

  function formatReadableDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Color generator for subject badges
  const SUBJECT_COLORS = [
    { bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
    { bg: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
    { bg: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-500', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
    { bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    { bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-500', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' }
  ];

  function getSubjectColor(subject) {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[idx];
  }

  // ==========================================
  // 3. CIE & BUNK CALCULATOR ENGINE (RV UTILITY POWERED)
  // ==========================================
  function calculateBunkStats(attended, total, targetPct = 85) {
    const target = targetPct / 100;
    const currentPct = total > 0 ? (attended / total) * 100 : 100;
    const roundedPct = total > 0 ? Math.round(currentPct * 10) / 10 : 100;

    let allowedAbsent = 0;
    let requiredPresent = 0;
    const isEligible = roundedPct >= targetPct;
    const status = isEligible ? 'safe' : (roundedPct >= targetPct - 10 ? 'warning' : 'danger');

    if (total === 0) {
      return {
        attended: 0,
        total: 0,
        percentage: 100,
        target: targetPct,
        isEligible: true,
        allowedAbsent: 0,
        requiredPresent: 0,
        canBunk: 0,
        needToAttend: 0,
        status: 'safe',
        statusText: 'No classes yet',
        advice: `Attend upcoming lectures to maintain 100% and stay above ${targetPct}% eligibility!`
      };
    }

    if (isEligible) {
      allowedAbsent = Math.floor((attended - target * total) / target);
      if (allowedAbsent < 0) allowedAbsent = 0;

      let advice = '';
      if (allowedAbsent === 0) {
        advice = `Borderline at ${roundedPct}%. You cannot miss the next class without falling below ${targetPct}%!`;
      } else if (allowedAbsent === 1) {
        advice = `CIE Eligible! You can safely miss 1 class and still maintain ≥ ${targetPct}%.`;
      } else {
        advice = `CIE Eligible! You can safely miss up to ${allowedAbsent} classes of this course.`;
      }

      return {
        attended,
        total,
        percentage: roundedPct,
        target: targetPct,
        isEligible: true,
        allowedAbsent,
        requiredPresent: 0,
        canBunk: allowedAbsent,
        needToAttend: 0,
        status: 'safe',
        statusText: allowedAbsent > 0 ? `Eligible (Can miss ${allowedAbsent})` : `Borderline (${roundedPct}%)`,
        advice
      };
    } else {
      requiredPresent = Math.ceil((target * total - attended) / (1 - target));
      if (requiredPresent < 1) requiredPresent = 1;

      const advice = `Attendance is below minimum requirement (${targetPct}%). Attend ${requiredPresent} more consecutive class${requiredPresent > 1 ? 'es' : ''} to recover eligibility.`;

      return {
        attended,
        total,
        percentage: roundedPct,
        target: targetPct,
        isEligible: false,
        allowedAbsent: 0,
        requiredPresent,
        canBunk: 0,
        needToAttend: requiredPresent,
        status,
        statusText: `CIE Shortage (Need ${requiredPresent} classes)`,
        advice
      };
    }
  }

  // Get list of all distinct subjects
  function getAllSubjects() {
    const set = new Set();
    state.timetable.forEach(slot => set.add(slot.subject.trim()));
    state.attendance.forEach(rec => set.add(rec.subject.trim()));
    state.extraClasses.forEach(c => set.add(c.subject.trim()));
    Object.keys(state.baselines || {}).forEach(s => set.add(s.trim()));
    return Array.from(set).filter(Boolean).sort();
  }

  // Get statistics for a subject combining past baseline + new logged classes
  function getSubjectStats(subjectName, overrideTarget = null) {
    const norm = subjectName.trim();

    // Check past baseline (e.g. Maths 15/18)
    let base = { attended: 0, total: 0 };
    if (state.baselines) {
      if (state.baselines[norm]) {
        base = state.baselines[norm];
      } else {
        const codePrefix = norm.split('-')[0].trim();
        for (const [key, val] of Object.entries(state.baselines)) {
          if (key.includes(codePrefix)) {
            base = val;
            break;
          }
        }
      }
    }

    const records = state.attendance.filter(r => {
      const rSubj = r.subject.trim();
      return rSubj.toLowerCase() === norm.toLowerCase() || rSubj.includes(norm.split('-')[0].trim());
    });

    let loggedAttended = 0;
    let loggedTotal = 0;
    let cancelled = 0;

    records.forEach(r => {
      if (r.status === 'present') {
        loggedAttended++;
        loggedTotal++;
      } else if (r.status === 'absent') {
        loggedTotal++;
      } else if (r.status === 'cancelled') {
        cancelled++;
      }
    });

    const totalAttended = (base.attended || 0) + loggedAttended;
    const totalConducted = (base.total || 0) + loggedTotal;

    const targetPct = overrideTarget || (state.courseTargets && state.courseTargets[norm]) || state.settings.targetPercentage || 85;

    const stats = calculateBunkStats(totalAttended, totalConducted, targetPct);
    stats.initialAttended = base.attended || 0;
    stats.initialTotal = base.total || 0;
    stats.loggedAttended = loggedAttended;
    stats.loggedTotal = loggedTotal;
    stats.cancelled = cancelled;
    return stats;
  }

  // RV Utility Inspired: Pending Unmarked Classes Detector
  function getPendingClasses() {
    const todayStr = formatDateISO(new Date());
    const pending = [];
    const now = new Date();

    // Check last 14 days up to today
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = formatDateISO(d);
      if (dateStr > todayStr) continue;
      const dayKey = DAY_NAMES[d.getDay()];

      const scheduled = state.timetable.filter(s => s.day === dayKey);
      const extras = state.extraClasses.filter(c => c.date === dateStr);
      const dayClasses = [
        ...scheduled.map(s => ({ ...s, isExtra: false })),
        ...extras.map(e => ({ ...e, isExtra: true }))
      ];

      dayClasses.forEach(item => {
        const record = state.attendance.find(r => r.date === dateStr && (r.slotId === item.id || (item.isExtra && r.id === item.id)));
        if (!record || record.status === 'unmarked') {
          pending.push({
            date: dateStr,
            dayKey,
            slotId: item.id,
            subject: item.subject,
            time: item.startTime ? `${item.startTime} - ${item.endTime}` : (item.time || 'Regular Slot'),
            isExtra: !!item.isExtra
          });
        }
      });
    }
    return pending;
  }

  // RV Utility Inspired: Global Attendance Analytics Aggregator
  function getOverallStats() {
    const subjects = getAllSubjects();
    let totalPresent = 0;
    let totalConducted = 0;

    subjects.forEach(subj => {
      const s = getSubjectStats(subj);
      totalPresent += s.attended;
      totalConducted += s.total;
    });

    const totalAbsent = Math.max(0, totalConducted - totalPresent);
    const pendingList = getPendingClasses();
    const overallPercentage = totalConducted > 0
      ? Math.round((totalPresent / totalConducted) * 1000) / 10
      : 100;

    return {
      totalPresent,
      totalAbsent,
      totalConducted,
      totalPending: pendingList.length,
      pendingList,
      overallPercentage
    };
  }

  // ==========================================
  // 4. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-emerald-600 text-white shadow-emerald-500/20',
      error: 'bg-rose-600 text-white shadow-rose-500/20',
      info: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20'
    }[type] || 'bg-slate-900 text-white';

    toast.className = `toast-animate flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold ${colorClasses} pointer-events-auto`;
    let iconName = type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info');

    toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  // ==========================================
  // 5. VIEW 1: APPLE CALENDAR DAY VIEW
  // ==========================================
  function renderDayView() {
    const dayIndex = currentDate.getDay();
    const dayKey = DAY_NAMES[dayIndex];
    const isToday = isSameDay(currentDate, new Date());
    const isFuture = isFutureDate(currentDate);
    const dateStr = formatDateISO(currentDate);

    // Update Header Date Labels
    const selectedDayNameEl = document.getElementById('selectedDayName');
    const isTodayBadgeEl = document.getElementById('isTodayBadge');
    const selectedDateFormattedEl = document.getElementById('selectedDateFormatted');
    const dayTodayJumpBtn = document.getElementById('dayTodayJumpBtn');

    if (selectedDayNameEl) selectedDayNameEl.textContent = DAY_DISPLAY[dayIndex];
    if (isTodayBadgeEl) {
      if (isToday) {
        isTodayBadgeEl.textContent = 'Today';
        isTodayBadgeEl.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
        isTodayBadgeEl.classList.remove('hidden');
      } else if (isFuture) {
        isTodayBadgeEl.textContent = 'Upcoming / Future';
        isTodayBadgeEl.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
        isTodayBadgeEl.classList.remove('hidden');
      } else {
        isTodayBadgeEl.textContent = 'Past Date';
        isTodayBadgeEl.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
        isTodayBadgeEl.classList.remove('hidden');
      }
    }
    if (selectedDateFormattedEl) selectedDateFormattedEl.textContent = formatReadableDate(currentDate);

    // Day Jump to Today Button
    if (dayTodayJumpBtn) {
      if (isToday) dayTodayJumpBtn.classList.add('hidden');
      else dayTodayJumpBtn.classList.remove('hidden');
    }

    // Mark All Present button handling in header:
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    if (markAllPresentBtn) {
      if (isFuture) {
        markAllPresentBtn.disabled = true;
        markAllPresentBtn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        markAllPresentBtn.title = 'Cannot mark attendance for future dates';
      } else {
        markAllPresentBtn.disabled = false;
        markAllPresentBtn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        markAllPresentBtn.title = 'Mark all scheduled classes for this date as Present';
      }
    }

    // Mark All Absent button handling in header:
    const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
    if (markAllAbsentBtn) {
      if (isFuture) {
        markAllAbsentBtn.disabled = true;
        markAllAbsentBtn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        markAllAbsentBtn.title = 'Cannot mark attendance for future dates';
      } else {
        markAllAbsentBtn.disabled = false;
        markAllAbsentBtn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        markAllAbsentBtn.title = 'Mark all scheduled classes for this date as Absent';
      }
    }

    // Pending Classes Alert Banner (RV Utility Feature)
    const pendingAlert = document.getElementById('pendingClassesAlert');
    const pendingText = document.getElementById('pendingClassesAlertText');
    if (pendingAlert) {
      const pendingList = getPendingClasses();
      if (pendingList.length > 0) {
        pendingAlert.classList.remove('hidden');
        if (pendingText) {
          pendingText.textContent = `You have ${pendingList.length} unmarked past class${pendingList.length > 1 ? 'es' : ''} to catch up on.`;
        }
      } else {
        pendingAlert.classList.add('hidden');
      }
    }

    // Render Apple Week Strip (7 days with Sunday to Saturday)
    renderAppleWeekStrip();

    // Scheduled classes for this day
    const scheduledSlots = state.timetable.filter(slot => slot.day === dayKey);
    const extrasForDate = state.extraClasses.filter(c => c.date === dateStr);
    const allClasses = [
      ...scheduledSlots.map(s => ({ ...s, isExtra: false })),
      ...extrasForDate.map(e => ({ ...e, isExtra: true }))
    ];

    allClasses.sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''));

    const container = document.getElementById('classesListContainer');
    const emptyState = document.getElementById('noClassesState');

    if (allClasses.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    let html = '';

    // If future date, show informative lock banner
    if (isFuture) {
      html += `
        <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 shadow-sm">
          <i data-lucide="lock" class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400"></i>
          <div>
            <span class="font-bold">Upcoming Schedule:</span> Attendance marking is disabled for future dates. You can preview classes, but attendance can only be marked on or after this day.
          </div>
        </div>
      `;
    }

    allClasses.forEach(item => {
      const subject = item.subject;
      const timeStr = item.startTime ? `${item.startTime} - ${item.endTime}` : (item.time || 'Time TBD');
      const room = item.room || 'AIML CR-001';
      const type = item.type || 'Lecture';
      const slotIdentifier = item.id;

      const record = state.attendance.find(r => r.date === dateStr && (r.slotId === slotIdentifier || (item.isExtra && r.id === slotIdentifier)));
      const currentStatus = record ? record.status : 'unmarked';

      const subjStats = getSubjectStats(subject);
      const color = getSubjectColor(subject);

      // Status Pill
      let statusBadge = '';
      if (isFuture) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><i data-lucide="clock" class="w-3 h-3"></i> Upcoming</span>`;
      } else if (currentStatus === 'present') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"><i data-lucide="check" class="w-3 h-3"></i> Present</span>`;
      } else if (currentStatus === 'absent') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"><i data-lucide="x" class="w-3 h-3"></i> Absent</span>`;
      } else if (currentStatus === 'cancelled') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"><i data-lucide="minus" class="w-3 h-3"></i> Cancelled</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Unmarked</span>`;
      }

      // Card border & background
      let cardBorderClass = 'border-slate-200 dark:border-slate-800';
      if (!isFuture) {
        if (currentStatus === 'present') cardBorderClass = 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/25 dark:bg-emerald-950/15';
        if (currentStatus === 'absent') cardBorderClass = 'border-rose-400 dark:border-rose-700 bg-rose-50/25 dark:bg-rose-950/15';
        if (currentStatus === 'cancelled') cardBorderClass = 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 opacity-75';
      }

      // CIE status badge on card
      let ciePill = '';
      if (subjStats.total === 0) {
        ciePill = `<span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">CIE: Not Started</span>`;
      } else if (subjStats.percentage >= state.settings.targetPercentage) {
        ciePill = `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"><i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i> CIE Eligible (${subjStats.canBunk} bunk safe)</span>`;
      } else {
        ciePill = `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse"><i data-lucide="shield-alert" class="w-3 h-3 text-rose-600"></i> CIE Shortage (Need ${subjStats.needToAttend} classes)</span>`;
      }

      // Subject Code and Name extraction
      const parts = subject.split(' - ');
      const subCode = parts.length > 1 ? parts[0].trim() : '';
      const subName = parts.length > 1 ? parts.slice(1).join(' - ').trim() : subject;

      html += `
        <div class="apple-event-card bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border ${cardBorderClass} shadow-xs transition" style="border-left-color: ${color.border.replace('border-', '')};">
          
          <!-- Card Header: Title & Status Badge -->
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-start gap-2.5 flex-1 min-w-0">
              <span class="w-3 h-3 rounded-full ${color.dot} shrink-0 mt-1"></span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${subCode ? `<span class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">${subCode}</span>` : ''}
                  ${item.isExtra ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold uppercase">Extra</span>' : ''}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">${type}</span>
                </div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug break-words">${subName}</h3>
              </div>
            </div>
            <div class="shrink-0">
              ${statusBadge}
            </div>
          </div>

          <!-- Schedule & Venue Chips -->
          <div class="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span class="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-blue-500"></i>
              ${timeStr}
            </span>
            <span class="inline-flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
              ${room}
            </span>
            ${item.faculty ? `
              <span class="inline-flex items-center gap-1 truncate max-w-[170px] sm:max-w-none">
                <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                ${item.faculty}
              </span>
            ` : ''}
          </div>

          <!-- Attendance & CIE Eligibility Bar -->
          <div class="mt-3 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Attendance:</span>
              <strong class="${subjStats.percentage >= state.settings.targetPercentage ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} font-bold">
                ${subjStats.percentage}%
              </strong>
              <span class="text-[11px] text-slate-400">(${subjStats.attended}/${subjStats.total})</span>
            </div>
            <div>
              ${ciePill}
            </div>
          </div>

          <!-- Touch-friendly Full-Width Action Buttons Row -->
          ${isFuture ? `
            <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-400 select-none">
              <i data-lucide="lock" class="w-3.5 h-3.5"></i>
              <span>Marking Locked (Future Date)</span>
            </div>
          ` : `
            <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                class="status-btn py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  currentStatus === 'present'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/50'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }"
                onclick="window.ClassTrack.markStatus('${slotIdentifier}', '${subject.replace(/'/g, "\\'")}', 'present', ${item.isExtra})">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Present</span>
              </button>

              <button 
                class="status-btn py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  currentStatus === 'absent'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/50'
                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }"
                onclick="window.ClassTrack.markStatus('${slotIdentifier}', '${subject.replace(/'/g, "\\'")}', 'absent', ${item.isExtra})">
                <i data-lucide="x" class="w-4 h-4"></i>
                <span>Absent</span>
              </button>

              <div class="flex items-center gap-1">
                <button 
                  class="status-btn flex-1 py-2 px-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition ${
                    currentStatus === 'cancelled'
                      ? 'bg-slate-700 text-white ring-2 ring-slate-500/50'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }"
                  title="Class Cancelled / Free Period"
                  onclick="window.ClassTrack.markStatus('${slotIdentifier}', '${subject.replace(/'/g, "\\'")}', 'cancelled', ${item.isExtra})">
                  <i data-lucide="slash" class="w-3.5 h-3.5"></i>
                  <span>Free</span>
                </button>

                ${currentStatus !== 'unmarked' ? `
                  <button 
                    class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0" 
                    title="Clear status" 
                    onclick="window.ClassTrack.markStatus('${slotIdentifier}', '${subject.replace(/'/g, "\\'")}', 'unmarked', ${item.isExtra})">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            ${(currentStatus === 'absent' || currentStatus === 'cancelled') && record ? `
              <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                ${record.reason ? `
                  <button 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition hover:bg-rose-100"
                    onclick="window.ClassTrack.openReasonModal('${record.id}', '${subject.replace(/'/g, "\\'")}')">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"></i>
                    <span>Reason: ${record.reason}</span>
                    <i data-lucide="edit-2" class="w-3 h-3 ml-0.5 opacity-60"></i>
                  </button>
                ` : `
                  <button 
                    class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    onclick="window.ClassTrack.openReasonModal('${record.id}', '${subject.replace(/'/g, "\\'")}')">
                    <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Add reason (Sick, Fest, OD...)</span>
                  </button>
                `}
              </div>
            ` : ''}
          `}

        </div>
      `;
    });

    if (container) container.innerHTML = html;
    lucide.createIcons();
  }

  // Render 7-day Apple week strip
  function renderAppleWeekStrip() {
    const strip = document.getElementById('appleWeekStrip');
    if (!strip) return;

    // Find start of week (Sunday)
    const curr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const day = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - day);
    const today = new Date();

    let html = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday = isSameDay(d, today);
      const isSelected = isSameDay(d, currentDate);
      const isFuture = isFutureDate(d);
      const dayName = DAY_NAMES[d.getDay()];
      const hasClasses = state.timetable.some(s => s.day === dayName);

      let circleClass = 'text-slate-700 dark:text-slate-300 font-semibold';
      if (isToday) circleClass = 'apple-today-circle';
      else if (isSelected) circleClass = 'apple-selected-circle';

      html += `
        <button 
          class="flex flex-col items-center py-2 px-1 rounded-xl transition ${
            isSelected && !isToday ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }"
          onclick="window.ClassTrack.selectDate('${formatDateISO(d)}')">
          <span class="text-[10px] font-bold ${isFuture ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'} uppercase">${DAY_INITIALS[i]}</span>
          <span class="my-1 text-xs ${circleClass}">${d.getDate()}</span>
          ${
            hasClasses 
              ? (isFuture 
                  ? '<span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" title="Upcoming"></span>' 
                  : '<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>') 
              : '<span class="w-1.5 h-1.5"></span>'
          }
        </button>
      `;
    }

    strip.innerHTML = html;
  }

  // ==========================================
  // 6. VIEW 2: APPLE CALENDAR MONTH VIEW
  // ==========================================
  function renderMonthView() {
    const grid = document.getElementById('calendarMonthGrid');
    const headerTitle = document.getElementById('calendarMonthHeader');
    if (!grid) return;

    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();

    if (headerTitle) {
      headerTitle.textContent = calendarMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Days in current month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = firstDay.getDay(); // 0 = Sunday

    // Days in prev month
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    let html = '';

    // Prev month padding cells
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      html += `
        <div class="calendar-cell other-month" onclick="window.ClassTrack.selectDateAndSwitchToDay('${formatDateISO(prevDate)}')">
          <span class="text-xs font-medium text-slate-400">${dayNum}</span>
        </div>
      `;
    }

    // Current month cells
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const isToday = isSameDay(thisDate, today);
      const isSelected = isSameDay(thisDate, currentDate);
      const isFuture = isFutureDate(thisDate);
      const dateStr = formatDateISO(thisDate);
      const dayName = DAY_NAMES[thisDate.getDay()];

      const scheduledCount = state.timetable.filter(s => s.day === dayName).length;
      const markedCount = state.attendance.filter(r => r.date === dateStr).length;

      let dateCircle = `<span class="text-xs font-semibold text-slate-800 dark:text-slate-200">${d}</span>`;
      if (isToday) {
        dateCircle = `<span class="apple-today-circle text-xs">${d}</span>`;
      } else if (isSelected) {
        dateCircle = `<span class="apple-selected-circle text-xs">${d}</span>`;
      }

      html += `
        <div class="calendar-cell ${isSelected ? 'selected-date' : ''} ${isFuture ? 'future-cell' : ''}" onclick="window.ClassTrack.selectDateAndRefreshMonth('${dateStr}')">
          <div class="flex items-center justify-between">
            ${dateCircle}
            ${
              isFuture
                ? `<span class="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-medium">Future</span>`
                : (markedCount > 0 ? `<span class="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">${markedCount} logged</span>` : '')
            }
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            ${
              scheduledCount > 0
                ? `<span class="text-[10px] text-slate-500 font-medium">${scheduledCount} class${scheduledCount > 1 ? 'es' : ''}</span>`
                : ''
            }
          </div>
        </div>
      `;
    }

    // Next month padding cells to complete 35 or 42 grid
    const totalCells = startDayIndex + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      const nextDate = new Date(year, month + 1, j);
      html += `
        <div class="calendar-cell other-month" onclick="window.ClassTrack.selectDateAndSwitchToDay('${formatDateISO(nextDate)}')">
          <span class="text-xs font-medium text-slate-400">${j}</span>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Render classes for selected date below the month grid
    renderMonthViewDayClasses();
  }

  function renderMonthViewDayClasses() {
    const titleEl = document.getElementById('monthViewSelectedDateTitle');
    const container = document.getElementById('monthViewDayClassesContainer');
    if (!container) return;

    const dayIndex = currentDate.getDay();
    const dayKey = DAY_NAMES[dayIndex];
    const dateStr = formatDateISO(currentDate);
    const isFuture = isFutureDate(currentDate);

    if (titleEl) {
      titleEl.textContent = `Classes for ${DAY_DISPLAY[dayIndex]}, ${formatReadableDate(currentDate)}${isFuture ? ' (Future Date - Locked)' : ''}`;
    }

    const scheduledSlots = state.timetable.filter(slot => slot.day === dayKey);
    const extrasForDate = state.extraClasses.filter(c => c.date === dateStr);
    const allClasses = [...scheduledSlots, ...extrasForDate];

    if (allClasses.length === 0) {
      container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">No classes scheduled on this day.</div>`;
      return;
    }

    let html = '';
    if (isFuture) {
      html += `
        <div class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 mb-2 shadow-sm">
          <i data-lucide="lock" class="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400"></i>
          <span><strong>Future Date:</strong> Attendance marking opens on or after this day.</span>
        </div>
      `;
    }

    allClasses.forEach(item => {
      const record = state.attendance.find(r => r.date === dateStr && r.slotId === item.id);
      const currentStatus = record ? record.status : 'unmarked';
      const subjStats = getSubjectStats(item.subject);

      html += `
        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${item.subject}</h4>
            <p class="text-[11px] text-slate-500">${item.startTime || ''} - ${item.endTime || ''} • ${item.room || 'AIML CR-001'}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold ${subjStats.percentage >= state.settings.targetPercentage ? 'text-emerald-600' : 'text-rose-600'} mr-2">
              ${subjStats.percentage}% (${subjStats.attended}/${subjStats.total})
            </span>
            ${isFuture ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 select-none">
                <i data-lucide="lock" class="w-3 h-3"></i> Locked
              </span>
            ` : `
              <button 
                class="px-2.5 py-1 text-xs rounded-lg font-semibold ${currentStatus === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
                onclick="window.ClassTrack.markStatus('${item.id}', '${item.subject.replace(/'/g, "\\'")}', 'present')">
                Present
              </button>
              <button 
                class="px-2.5 py-1 text-xs rounded-lg font-semibold ${currentStatus === 'absent' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}"
                onclick="window.ClassTrack.markStatus('${item.id}', '${item.subject.replace(/'/g, "\\'")}', 'absent')">
                Absent
              </button>
            `}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    lucide.createIcons();
  }

  // ==========================================
  // 7. VIEW 3: CIE ELIGIBILITY & SUBJECT-WISE CARDS (RV UTILITY DASHBOARD)
  // ==========================================
  function renderCieView() {
    const overallStats = getOverallStats();
    const subjects = getAllSubjects();
    const defaultTarget = state.settings.targetPercentage || 85;

    let eligibleCoursesCount = 0;
    let shortageCoursesCount = 0;

    subjects.forEach(s => {
      const st = getSubjectStats(s);
      if (st.total > 0) {
        if (st.isEligible) eligibleCoursesCount++;
        else shortageCoursesCount++;
      }
    });

    // Update RV Utility Attendance Analytics Hub
    const overallPercentPill = document.getElementById('overallPercentPill');
    const statTotalPresent = document.getElementById('statTotalPresent');
    const statTotalAbsent = document.getElementById('statTotalAbsent');
    const statTotalPending = document.getElementById('statTotalPending');
    const statTotalClasses = document.getElementById('statTotalClasses');
    const pillsContainer = document.getElementById('analyticsPillsContainer');

    if (overallPercentPill) {
      overallPercentPill.textContent = `${overallStats.overallPercentage}% overall`;
    }
    if (statTotalPresent) statTotalPresent.textContent = overallStats.totalPresent;
    if (statTotalAbsent) statTotalAbsent.textContent = overallStats.totalAbsent;
    if (statTotalPending) statTotalPending.textContent = overallStats.totalPending;
    if (statTotalClasses) statTotalClasses.textContent = overallStats.totalConducted;

    if (pillsContainer) {
      let pillsHtml = '';
      if (overallStats.totalPending > 0) {
        pillsHtml += `
          <span class="rv-badge-warning inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
            ${overallStats.totalPending} pending entries can affect final percentage
          </span>
        `;
      }

      if (shortageCoursesCount > 0) {
        pillsHtml += `
          <span class="rv-badge-danger inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
            ${shortageCoursesCount} course${shortageCoursesCount > 1 ? 's' : ''} below minimum CIE threshold (${defaultTarget}%)
          </span>
        `;
      } else if (eligibleCoursesCount > 0) {
        pillsHtml += `
          <span class="rv-badge-safe inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            All courses eligible for CIE exams (≥ ${defaultTarget}%)
          </span>
        `;
      } else {
        pillsHtml += `
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Ready for attendance marking
          </span>
        `;
      }
      pillsContainer.innerHTML = pillsHtml;
    }

    // Render Subject Cards
    const grid = document.getElementById('subjectCardsGrid');
    const filter = (document.getElementById('subjectFilterSelect')?.value || 'all');
    if (!grid) return;

    if (subjects.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">No subjects found in schedule.</div>`;
      return;
    }

    let cardsHtml = '';

    subjects.forEach(subject => {
      const subjTarget = (state.courseTargets && state.courseTargets[subject]) || defaultTarget;
      const stats = getSubjectStats(subject, subjTarget);

      if (filter === 'safe' && !stats.isEligible) return;
      if (filter === 'danger' && stats.isEligible) return;

      const color = getSubjectColor(subject);
      const isSafe = stats.isEligible;

      // Pending count for this specific course
      const coursePending = overallStats.pendingList.filter(p => p.subject.toLowerCase() === subject.toLowerCase() || p.subject.includes(subject.split('-')[0].trim())).length;

      // Badges
      let statusBadge = '';
      if (stats.total === 0) {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">Not Started</span>`;
      } else if (isSafe) {
        statusBadge = `<span class="rv-badge-safe inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"><i data-lucide="check" class="w-3 h-3"></i> Eligible</span>`;
      } else {
        statusBadge = `<span class="rv-badge-danger inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"><i data-lucide="x" class="w-3 h-3"></i> Not eligible</span>`;
      }

      // Course Code & Name
      const parts = subject.split(' - ');
      const subCode = parts.length > 1 ? parts[0].trim() : '';
      const subName = parts.length > 1 ? parts.slice(1).join(' - ').trim() : subject;

      cardsHtml += `
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border ${isSafe ? 'border-slate-200 dark:border-slate-800' : 'border-rose-300 dark:border-rose-900/60'} shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
          
          <div class="space-y-3.5">
            <!-- Header: Title, Code & Status Badges -->
            <div>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2 flex-1 min-w-0">
                  <span class="w-3 h-3 rounded-full ${color.dot} shrink-0 mt-1"></span>
                  <div class="min-w-0 flex-1">
                    ${subCode ? `<span class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase block">${subCode}</span>` : ''}
                    <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words mt-0.5">${subName}</h3>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  ${coursePending > 0 ? `<span class="rv-badge-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"><i data-lucide="clock" class="w-3 h-3"></i> ${coursePending} pending</span>` : ''}
                  ${statusBadge}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">${stats.percentage}%</span>
                </div>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Minimum target: <strong>${stats.target}%</strong></p>
            </div>

            <!-- RV Utility 6-Box Metric Grid -->
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-2.5">
                <i data-lucide="check" class="w-3.5 h-3.5 mx-auto text-emerald-600 dark:text-emerald-400"></i>
                <p class="mt-1 text-base font-bold text-slate-900 dark:text-white leading-none">${stats.attended}</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Present</p>
              </div>
              <div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-2.5">
                <i data-lucide="x" class="w-3.5 h-3.5 mx-auto text-rose-600 dark:text-rose-400"></i>
                <p class="mt-1 text-base font-bold text-slate-900 dark:text-white leading-none">${Math.max(0, stats.total - stats.attended)}</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Absent</p>
              </div>
              <div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-2.5">
                <i data-lucide="book-open" class="w-3.5 h-3.5 mx-auto text-blue-600 dark:text-blue-400"></i>
                <p class="mt-1 text-base font-bold text-slate-900 dark:text-white leading-none">${stats.total}</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Classes</p>
              </div>
              <div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-2.5">
                <i data-lucide="target" class="w-3.5 h-3.5 mx-auto text-violet-600 dark:text-violet-400"></i>
                <p class="mt-1 text-base font-bold text-slate-900 dark:text-white leading-none">${stats.target}%</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Required</p>
              </div>
              <div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-2.5">
                <i data-lucide="${stats.isEligible ? 'shield-check' : 'shield-alert'}" class="w-3.5 h-3.5 mx-auto ${stats.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}"></i>
                <p class="mt-1 text-base font-bold ${stats.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} leading-none">${stats.isEligible ? 'Yes' : 'No'}</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Eligible</p>
              </div>
              <div class="rounded-xl border ${stats.isEligible ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'} p-2 sm:p-2.5">
                <i data-lucide="${stats.isEligible ? 'coffee' : 'alert-circle'}" class="w-3.5 h-3.5 mx-auto ${stats.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}"></i>
                <p class="mt-1 text-base font-bold ${stats.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} leading-none">${stats.isEligible ? stats.allowedAbsent : stats.requiredPresent}</p>
                <p class="mt-1 text-[9px] uppercase tracking-wider ${stats.isEligible ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'} font-semibold">${stats.isEligible ? 'Allowed Absent' : 'Required Present'}</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-1">
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="${isSafe ? 'bg-emerald-500' : 'bg-rose-500'} h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(0, stats.percentage))}%"></div>
              </div>
              ${stats.initialTotal > 0 ? `
                <div class="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Starting Baseline: <strong>${stats.initialAttended}/${stats.initialTotal}</strong></span>
                  <span>Logged Daily: <strong>+${stats.loggedAttended}</strong></span>
                </div>
              ` : ''}
            </div>

            <!-- RV Utility Dynamic Guidance Box -->
            ${stats.total === 0 ? `
              <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                <span>No classes held yet. Attend upcoming lectures to maintain 100%!</span>
              </div>
            ` : isSafe ? `
              <div class="rv-badge-safe p-3 rounded-2xl text-xs flex items-start gap-2">
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"></i>
                <div>
                  <strong class="font-bold block">${stats.statusText}</strong>
                  <p class="text-[11px] mt-0.5">${stats.advice}</p>
                </div>
              </div>
            ` : `
              <div class="rv-badge-danger p-3 rounded-2xl text-xs flex items-start gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"></i>
                <div>
                  <strong class="font-bold block">${stats.statusText}</strong>
                  <p class="text-[11px] mt-0.5">${stats.advice}</p>
                </div>
              </div>
            `}

            <!-- RV Utility Feature: Custom Minimum Attendance Target Slider -->
            <div class="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Custom Minimum Target:</span>
                <span class="font-bold text-blue-600 dark:text-blue-400 text-xs">${stats.target}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                step="1" 
                value="${stats.target}" 
                oninput="this.previousElementSibling.lastElementChild.textContent = this.value + '%'"
                onchange="window.ClassTrack.setCourseTarget('${subject.replace(/'/g, "\\'")}', this.value)" 
                class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600" />
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>50%</span>
                <span>85% CIE Default</span>
                <span>100%</span>
              </div>
            </div>

          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <button 
              class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              onclick="window.ClassTrack.openBaselineModal()">
              <i data-lucide="edit-3" class="w-3 h-3"></i> Adjust Baseline
            </button>
            <div class="flex items-center gap-1.5">
              <button 
                class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold transition" 
                onclick="window.ClassTrack.quickLog('${subject.replace(/'/g, "\\'")}', 'present')">
                +1 Present
              </button>
              <button 
                class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold transition" 
                onclick="window.ClassTrack.quickLog('${subject.replace(/'/g, "\\'")}', 'absent')">
                +1 Absent
              </button>
            </div>
          </div>

        </div>
      `;
    });

    grid.innerHTML = cardsHtml;
    lucide.createIcons();
  }

  // ==========================================
  // 8. VIEW 4: WEEKLY TIMETABLE
  // ==========================================
  function renderTimetableView() {
    const grid = document.getElementById('weeklyTimetableGrid');
    if (!grid) return;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let html = '';

    days.forEach(day => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      const slots = state.timetable.filter(s => s.day === day);
      slots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      html += `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span class="font-bold text-xs text-slate-800 dark:text-slate-100">${dayName}</span>
            <span class="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">${slots.length} Classes</span>
          </div>

          <div class="space-y-2 flex-1">
            ${
              slots.length === 0
                ? `<div class="text-center py-6 text-xs text-slate-400">No classes</div>`
                : slots.map(slot => {
                    return `
                      <div class="group relative rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <div class="flex items-start justify-between gap-1">
                          <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">${slot.subject}</h4>
                          <div class="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                            <button class="p-0.5 rounded text-slate-400 hover:text-blue-600" onclick="window.ClassTrack.openEditSlotModal('${slot.id}')">
                              <i data-lucide="edit-2" class="w-3 h-3"></i>
                            </button>
                            <button class="p-0.5 rounded text-slate-400 hover:text-rose-600" onclick="window.ClassTrack.deleteSlot('${slot.id}')">
                              <i data-lucide="trash" class="w-3 h-3"></i>
                            </button>
                          </div>
                        </div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                          <span>${slot.startTime} - ${slot.endTime}</span>
                          <span class="px-1 py-0.2 rounded text-[9px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">${slot.type || 'Lecture'}</span>
                        </div>
                        ${slot.room ? `<div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${slot.room}</div>` : ''}
                        ${slot.faculty ? `<div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${slot.faculty}</div>` : ''}
                      </div>
                    `;
                  }).join('')
            }
          </div>

          <button 
            class="w-full py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-500 hover:text-blue-600 text-xs font-medium transition flex items-center justify-center gap-1"
            onclick="window.ClassTrack.openAddSlotModal('${day}')">
            <i data-lucide="plus" class="w-3 h-3"></i>
            <span>Add Class</span>
          </button>
        </div>
      `;
    });

    grid.innerHTML = html;
    lucide.createIcons();
  }

  // ==========================================
  // 9. VIEW 5: HISTORY & LOGS
  // ==========================================
  function renderHistoryView() {
    const tbody = document.getElementById('historyTableBody');
    const noHistoryMsg = document.getElementById('noHistoryMessage');
    const subjFilter = document.getElementById('historySubjectFilter')?.value || 'all';
    const statusFilter = document.getElementById('historyStatusFilter')?.value || 'all';

    const subjFilterSelect = document.getElementById('historySubjectFilter');
    if (subjFilterSelect) {
      const currentSelected = subjFilterSelect.value;
      const subjects = getAllSubjects();
      subjFilterSelect.innerHTML = `<option value="all">All Subjects</option>` +
        subjects.map(s => `<option value="${s}" ${currentSelected === s ? 'selected' : ''}>${s}</option>`).join('');
    }

    if (!tbody) return;

    let records = [...state.attendance];
    if (subjFilter !== 'all') records = records.filter(r => r.subject === subjFilter);
    if (statusFilter !== 'all') records = records.filter(r => r.status === statusFilter);
    records.sort((a, b) => b.date.localeCompare(a.date) || (b.timestamp || '').localeCompare(a.timestamp || ''));

    if (records.length === 0) {
      tbody.innerHTML = '';
      if (noHistoryMsg) noHistoryMsg.classList.remove('hidden');
      return;
    }

    if (noHistoryMsg) noHistoryMsg.classList.add('hidden');

    let html = '';
    records.forEach(r => {
      let statusBadge = '';
      if (r.status === 'present') statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Present</span>`;
      else if (r.status === 'absent') statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Absent</span>`;
      else statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Cancelled</span>`;

      html += `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
          <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">${r.date}</td>
          <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">${r.subject}</td>
          <td class="px-4 py-3 text-slate-500 dark:text-slate-400">${r.time || 'Regular Slot'}</td>
          <td class="px-4 py-3">${statusBadge}</td>
          <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
            ${r.reason ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <i data-lucide="file-text" class="w-3 h-3 text-slate-400"></i> ${r.reason}
              </span>
            ` : '<span class="text-slate-400 text-[11px]">—</span>'}
          </td>
          <td class="px-4 py-3 text-right">
            <button class="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition" onclick="window.ClassTrack.deleteHistoryRecord('${r.id}')">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    lucide.createIcons();
  }

  // ==========================================
  // 10. PAST BASELINE MODAL (MATHS 15/18)
  // ==========================================
  function openBaselineModal() {
    const container = document.getElementById('baselineInputsContainer');
    if (!container) return;

    const subjects = getAllSubjects();
    let html = '';

    subjects.forEach(subj => {
      const base = state.baselines && state.baselines[subj] ? state.baselines[subj] : { attended: 0, total: 0 };
      html += `
        <div class="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <span class="font-bold text-slate-900 dark:text-white block">${subj}</span>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] text-slate-500 mb-0.5">Classes Attended</label>
              <input type="number" min="0" data-subj="${subj}" data-field="attended" value="${base.attended}" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold" />
            </div>
            <div>
              <label class="block text-[11px] text-slate-500 mb-0.5">Total Conducted</label>
              <input type="number" min="0" data-subj="${subj}" data-field="total" value="${base.total}" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold" />
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    openModal('baselineModal');
  }

  function saveBaselines(e) {
    e.preventDefault();
    const inputs = document.querySelectorAll('#baselineInputsContainer input');
    state.baselines = state.baselines || {};

    inputs.forEach(inp => {
      const subj = inp.dataset.subj;
      const field = inp.dataset.field;
      const val = parseInt(inp.value, 10) || 0;

      if (!state.baselines[subj]) state.baselines[subj] = { attended: 0, total: 0 };
      state.baselines[subj][field] = val;
    });

    saveState();
    renderAllViews();
    closeModal(document.getElementById('baselineModal'));
    showToast('Starting attendance counts updated!', 'success');
  }

  // ==========================================
  // 11. ACTIONS & EVENT HANDLERS
  // ==========================================
  function markStatus(slotId, subject, newStatus, isExtra = false) {
    const dateStr = formatDateISO(currentDate);

    // Prevent marking attendance for future dates
    if (isFutureDate(dateStr)) {
      showToast('Attendance can only be marked for today or past dates', 'error');
      return;
    }

    state.attendance = state.attendance.filter(r => !(r.date === dateStr && r.slotId === slotId));

    if (newStatus !== 'unmarked') {
      state.attendance.push({
        id: generateId('att'),
        date: dateStr,
        slotId: slotId,
        subject: subject,
        status: newStatus,
        timestamp: new Date().toISOString()
      });
      const labels = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' };
      showToast(`Marked ${subject.split('-')[0]} as ${labels[newStatus]}`, newStatus === 'present' ? 'success' : 'info');
    } else {
      showToast(`Cleared record for ${subject.split('-')[0]}`);
    }

    saveState();
    renderAllViews();
  }

  function quickLog(subject, status) {
    const todayStr = formatDateISO(new Date());
    state.attendance.push({
      id: generateId('att'),
      date: todayStr,
      slotId: 'quick_' + Date.now(),
      subject: subject,
      status: status,
      timestamp: new Date().toISOString()
    });

    saveState();
    renderAllViews();
    showToast(`Logged +1 ${status === 'present' ? 'Present' : 'Absent'} for ${subject.split('-')[0]}`, status === 'present' ? 'success' : 'info');
  }

  function markAllPresentForCurrentDate() {
    const dayIndex = currentDate.getDay();
    const dayKey = DAY_NAMES[dayIndex];
    const dateStr = formatDateISO(currentDate);

    // Prevent marking attendance for future dates
    if (isFutureDate(dateStr)) {
      showToast('Cannot mark attendance for future dates', 'error');
      return;
    }

    const scheduledSlots = state.timetable.filter(slot => slot.day === dayKey);
    const extrasForDate = state.extraClasses.filter(c => c.date === dateStr);
    const allClasses = [...scheduledSlots, ...extrasForDate];

    if (allClasses.length === 0) {
      showToast('No classes to mark today!', 'info');
      return;
    }

    allClasses.forEach(item => {
      state.attendance = state.attendance.filter(r => !(r.date === dateStr && r.slotId === item.id));
      state.attendance.push({
        id: generateId('att'),
        date: dateStr,
        slotId: item.id,
        subject: item.subject,
        status: 'present',
        timestamp: new Date().toISOString()
      });
    });

    saveState();
    renderAllViews();
    showToast(`Marked all ${allClasses.length} classes as Present!`, 'success');
  }

  function markAllAbsentForCurrentDate() {
    const dayIndex = currentDate.getDay();
    const dayKey = DAY_NAMES[dayIndex];
    const dateStr = formatDateISO(currentDate);

    // Prevent marking attendance for future dates
    if (isFutureDate(dateStr)) {
      showToast('Cannot mark attendance for future dates', 'error');
      return;
    }

    const scheduledSlots = state.timetable.filter(slot => slot.day === dayKey);
    const extrasForDate = state.extraClasses.filter(c => c.date === dateStr);
    const allClasses = [...scheduledSlots, ...extrasForDate];

    if (allClasses.length === 0) {
      showToast('No classes to mark today!', 'info');
      return;
    }

    allClasses.forEach(item => {
      state.attendance = state.attendance.filter(r => !(r.date === dateStr && r.slotId === item.id));
      state.attendance.push({
        id: generateId('att'),
        date: dateStr,
        slotId: item.id,
        subject: item.subject,
        status: 'absent',
        timestamp: new Date().toISOString()
      });
    });

    saveState();
    renderAllViews();
    showToast(`Marked all ${allClasses.length} classes as Absent!`, 'info');
  }

  // RV Utility Feature: Reason Modal Methods
  function openReasonModal(recordId, subject) {
    const modal = document.getElementById('reasonModal');
    const recordIdInput = document.getElementById('reasonRecordId');
    const subtitleEl = document.getElementById('reasonModalSubtitle');
    const reasonInput = document.getElementById('reasonInput');

    if (!modal) return;

    const record = state.attendance.find(r => r.id === recordId);
    if (!record) {
      showToast('Attendance record not found', 'error');
      return;
    }

    if (recordIdInput) recordIdInput.value = recordId;
    if (subtitleEl) subtitleEl.textContent = `${subject} (${formatReadableDate(new Date(record.date + 'T12:00:00'))})`;
    if (reasonInput) reasonInput.value = record.reason || '';

    openModal('reasonModal');
    if (reasonInput) setTimeout(() => reasonInput.focus(), 100);
  }

  function saveReason() {
    const recordIdInput = document.getElementById('reasonRecordId');
    const reasonInput = document.getElementById('reasonInput');
    if (!recordIdInput || !reasonInput) return;

    const recordId = recordIdInput.value;
    const text = reasonInput.value.trim();

    const record = state.attendance.find(r => r.id === recordId);
    if (record) {
      if (text) {
        record.reason = text;
      } else {
        delete record.reason;
      }
      saveState();
      renderAllViews();
      closeModal(document.getElementById('reasonModal'));
      showToast('Reason note saved!', 'success');
    }
  }

  function deleteReason() {
    const recordIdInput = document.getElementById('reasonRecordId');
    if (!recordIdInput) return;

    const recordId = recordIdInput.value;
    const record = state.attendance.find(r => r.id === recordId);
    if (record) {
      delete record.reason;
      saveState();
      renderAllViews();
      closeModal(document.getElementById('reasonModal'));
      showToast('Reason note removed', 'info');
    }
  }

  function setCourseTarget(subject, value) {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 50 || val > 100) return;
    state.courseTargets = state.courseTargets || {};
    state.courseTargets[subject] = val;
    saveState();
    renderCieView();
    showToast(`Updated minimum target for ${subject.split('-')[0]} to ${val}%`, 'success');
  }

  function selectDate(dateStr) {
    const parts = dateStr.split('-');
    currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    renderDayView();
  }

  function selectDateAndRefreshMonth(dateStr) {
    selectDate(dateStr);
    renderMonthView();
  }

  function selectDateAndSwitchToDay(dateStr) {
    selectDate(dateStr);
    switchTab('day');
  }

  function deleteSlot(slotId) {
    if (!confirm('Remove this class slot from timetable?')) return;
    state.timetable = state.timetable.filter(s => s.id !== slotId);
    saveState();
    renderAllViews();
    showToast('Class slot removed');
  }

  function deleteHistoryRecord(id) {
    state.attendance = state.attendance.filter(r => r.id !== id);
    saveState();
    renderAllViews();
    showToast('Record deleted');
  }

  // Navigation Switch
  function switchTab(tabKey) {
    activeTab = tabKey;
    document.querySelectorAll('.apple-segmented-btn').forEach(btn => {
      if (btn.dataset.tab === tabKey) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabKey) {
        btn.classList.add('active', 'text-blue-600', 'dark:text-blue-400');
        btn.classList.remove('text-slate-500', 'dark:text-slate-400');
      } else {
        btn.classList.remove('active', 'text-blue-600', 'dark:text-blue-400');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    });

    document.querySelectorAll('.tab-content').forEach(c => {
      if (c.id === `tab-${tabKey}`) c.classList.remove('hidden');
      else c.classList.add('hidden');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabKey === 'day') renderDayView();
    if (tabKey === 'month') renderMonthView();
    if (tabKey === 'cie') renderCieView();
    if (tabKey === 'timetable') renderTimetableView();
    if (tabKey === 'history') renderHistoryView();
  }

  // Modals
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('hidden');
    requestAnimationFrame(() => m.classList.add('active'));
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove('active');
    setTimeout(() => m.classList.add('hidden'), 150);
  }

  function openAddSlotModal(defaultDay = 'monday') {
    document.getElementById('slotModalTitle').textContent = 'Add Timetable Slot';
    document.getElementById('slotId').value = '';
    document.getElementById('slotDay').value = defaultDay;
    document.getElementById('slotSubject').value = '';
    document.getElementById('slotStartTime').value = '09:00';
    document.getElementById('slotEndTime').value = '10:00';
    document.getElementById('slotType').value = 'Lecture';
    document.getElementById('slotRoom').value = 'AIML CR-001';
    openModal('slotModal');
  }

  function openEditSlotModal(slotId) {
    const slot = state.timetable.find(s => s.id === slotId);
    if (!slot) return;
    document.getElementById('slotModalTitle').textContent = 'Edit Timetable Slot';
    document.getElementById('slotId').value = slot.id;
    document.getElementById('slotDay').value = slot.day;
    document.getElementById('slotSubject').value = slot.subject;
    document.getElementById('slotStartTime').value = slot.startTime || '09:00';
    document.getElementById('slotEndTime').value = slot.endTime || '10:00';
    document.getElementById('slotType').value = slot.type || 'Lecture';
    document.getElementById('slotRoom').value = slot.room || 'AIML CR-001';
    openModal('slotModal');
  }

  function setupModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal-backdrop')));
    });

    // Baseline Modal Trigger
    const openBaseBtn = document.getElementById('openBaselineModalBtn');
    const openBaseCieBtn = document.getElementById('openBaselineModalFromCieBtn');
    if (openBaseBtn) openBaseBtn.addEventListener('click', openBaselineModal);
    if (openBaseCieBtn) openBaseCieBtn.addEventListener('click', openBaselineModal);

    const baselineForm = document.getElementById('baselineForm');
    if (baselineForm) baselineForm.addEventListener('submit', saveBaselines);

    // AI Timetable Modal
    const importTimetableBtn = document.getElementById('importTimetableBtn');
    const openAITimetableBtn = document.getElementById('openAITimetableBtn');
    [importTimetableBtn, openAITimetableBtn].forEach(b => {
      if (b) b.addEventListener('click', () => openModal('aiModal'));
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.dataset.preset;
        if (PRESETS[pKey]) {
          state.timetable = JSON.parse(JSON.stringify(PRESETS[pKey]));
          saveState();
          renderAllViews();
          closeModal(document.getElementById('aiModal'));
          showToast(`Loaded ${pKey.toUpperCase()} schedule!`, 'success');
        }
      });
    });

    // Add Timetable Slot
    const addSlotBtn = document.getElementById('addTimetableSlotBtn');
    if (addSlotBtn) addSlotBtn.addEventListener('click', () => openAddSlotModal('monday'));

    const slotForm = document.getElementById('slotForm');
    if (slotForm) {
      slotForm.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('slotId').value || generateId('slot');
        const day = document.getElementById('slotDay').value;
        const subject = document.getElementById('slotSubject').value.trim();
        const startTime = document.getElementById('slotStartTime').value;
        const endTime = document.getElementById('slotEndTime').value;
        const type = document.getElementById('slotType').value;
        const room = document.getElementById('slotRoom').value.trim();

        const newSlot = { id, day, subject, startTime, endTime, type, room };
        const idx = state.timetable.findIndex(s => s.id === id);
        if (idx >= 0) state.timetable[idx] = newSlot;
        else state.timetable.push(newSlot);

        saveState();
        renderAllViews();
        closeModal(document.getElementById('slotModal'));
        showToast(`Saved slot for ${subject}`, 'success');
      });
    }

    // Extra Class
    const addExtraBtn = document.getElementById('addExtraClassBtn');
    if (addExtraBtn) {
      addExtraBtn.addEventListener('click', () => {
        const dateVal = formatDateISO(currentDate);
        document.getElementById('extraClassDate').value = dateVal;
        document.getElementById('extraClassSubject').value = '';
        document.getElementById('extraClassTime').value = 'Extra Session';
        
        const isFuture = isFutureDate(dateVal);
        const statusSelect = document.getElementById('extraClassStatus');
        const futureWarn = document.getElementById('extraClassFutureWarning');
        if (isFuture) {
          statusSelect.value = 'unmarked';
          statusSelect.disabled = true;
          if (futureWarn) futureWarn.classList.remove('hidden');
        } else {
          statusSelect.value = 'present';
          statusSelect.disabled = false;
          if (futureWarn) futureWarn.classList.add('hidden');
        }
        openModal('extraClassModal');
      });
    }

    const extraDateInput = document.getElementById('extraClassDate');
    if (extraDateInput) {
      extraDateInput.addEventListener('change', () => {
        const isFuture = isFutureDate(extraDateInput.value);
        const statusSelect = document.getElementById('extraClassStatus');
        const futureWarn = document.getElementById('extraClassFutureWarning');
        if (isFuture) {
          statusSelect.value = 'unmarked';
          statusSelect.disabled = true;
          if (futureWarn) futureWarn.classList.remove('hidden');
        } else {
          statusSelect.disabled = false;
          if (futureWarn) futureWarn.classList.add('hidden');
        }
      });
    }

    const extraClassForm = document.getElementById('extraClassForm');
    if (extraClassForm) {
      extraClassForm.addEventListener('submit', e => {
        e.preventDefault();
        const date = document.getElementById('extraClassDate').value;
        const subject = document.getElementById('extraClassSubject').value.trim();
        const time = document.getElementById('extraClassTime').value.trim();
        let initialStatus = document.getElementById('extraClassStatus').value;
        const extraId = generateId('extra');

        if (isFutureDate(date) && initialStatus !== 'unmarked') {
          showToast('Cannot mark future attendance. Class added as Unmarked.', 'info');
          initialStatus = 'unmarked';
        }

        state.extraClasses.push({ id: extraId, date, subject, time, type: 'Extra' });
        if (initialStatus !== 'unmarked' && !isFutureDate(date)) {
          state.attendance.push({
            id: generateId('att'),
            date,
            slotId: extraId,
            subject,
            status: initialStatus,
            timestamp: new Date().toISOString()
          });
        }

        saveState();
        renderAllViews();
        closeModal(document.getElementById('extraClassModal'));
        showToast(`Added extra class for ${subject}`, 'success');
      });
    }

    // Settings
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        document.getElementById('targetPercentageSlider').value = state.settings.targetPercentage;
        document.getElementById('targetPercentSettingLabel').textContent = `${state.settings.targetPercentage}%`;
        openModal('settingsModal');
      });
    }

    const targetSlider = document.getElementById('targetPercentageSlider');
    if (targetSlider) {
      targetSlider.addEventListener('input', e => {
        const val = parseInt(e.target.value, 10);
        document.getElementById('targetPercentSettingLabel').textContent = `${val}%`;
        state.settings.targetPercentage = val;
        saveState();
        renderAllViews();
      });
    }

    // Backup & Restore
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `classtrack_backup_${formatDateISO(new Date())}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast('Backup downloaded successfully', 'success');
      });
    }

    const importBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const imported = JSON.parse(ev.target.result);
            state = { ...state, ...imported };
            saveState();
            renderAllViews();
            closeModal(document.getElementById('settingsModal'));
            showToast('Backup restored successfully!', 'success');
          } catch (err) {
            showToast('Invalid backup JSON file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    const resetAllBtn = document.getElementById('resetAllDataBtn');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        if (confirm('CAUTION: Reset all attendance logs? Your timetable and baseline will be kept.')) {
          state.attendance = [];
          state.extraClasses = [];
          saveState();
          renderAllViews();
          closeModal(document.getElementById('settingsModal'));
          showToast('Attendance records reset');
        }
      });
    }

    // Reason Modal Setup (RV Utility Feature)
    const saveReasonBtn = document.getElementById('saveReasonBtn');
    if (saveReasonBtn) saveReasonBtn.addEventListener('click', saveReason);

    const deleteReasonBtn = document.getElementById('deleteReasonBtn');
    if (deleteReasonBtn) deleteReasonBtn.addEventListener('click', deleteReason);

    document.querySelectorAll('.quick-reason-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('reasonInput');
        if (input) input.value = chip.textContent.trim();
      });
    });
  }

  // Controls & Navigation
  function setupNavigation() {
    // Segmented Buttons (Desktop) & Bottom Nav (Mobile)
    document.querySelectorAll('.apple-segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Today Jump Button
    const todayJumpBtn = document.getElementById('todayJumpBtn');
    if (todayJumpBtn) {
      todayJumpBtn.addEventListener('click', () => {
        currentDate = new Date();
        calendarMonthDate = new Date();
        renderAllViews();
        showToast('Jumped to Today!');
      });
    }

    // Day View Header Navigation (Prev, Next, Jump to Today)
    const dayPrevBtn = document.getElementById('dayPrevBtn');
    const dayNextBtn = document.getElementById('dayNextBtn');
    const dayTodayJumpBtn = document.getElementById('dayTodayJumpBtn');

    if (dayPrevBtn) {
      dayPrevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        renderDayView();
      });
    }

    if (dayNextBtn) {
      dayNextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDayView();
      });
    }

    if (dayTodayJumpBtn) {
      dayTodayJumpBtn.addEventListener('click', () => {
        currentDate = new Date();
        calendarMonthDate = new Date();
        renderDayView();
        showToast('Jumped to Today!');
      });
    }

    // Month Navigation Buttons
    const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    const calNextMonthBtn = document.getElementById('calNextMonthBtn');
    if (calPrevMonthBtn) {
      calPrevMonthBtn.addEventListener('click', () => {
        calendarMonthDate.setMonth(calendarMonthDate.getMonth() - 1);
        renderMonthView();
      });
    }
    if (calNextMonthBtn) {
      calNextMonthBtn.addEventListener('click', () => {
        calendarMonthDate.setMonth(calendarMonthDate.getMonth() + 1);
        renderMonthView();
      });
    }

    // Mark All Present & All Absent
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    if (markAllPresentBtn) markAllPresentBtn.addEventListener('click', markAllPresentForCurrentDate);

    const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
    if (markAllAbsentBtn) markAllAbsentBtn.addEventListener('click', markAllAbsentForCurrentDate);

    // Jump to Pending Unmarked Date (RV Utility Feature)
    const jumpToPendingBtn = document.getElementById('jumpToPendingBtn');
    if (jumpToPendingBtn) {
      jumpToPendingBtn.addEventListener('click', () => {
        const pending = getPendingClasses();
        if (pending.length > 0) {
          selectDate(pending[0].date);
          switchTab('day');
          showToast(`Jumped to pending date: ${formatReadableDate(new Date(pending[0].date + 'T12:00:00'))}`, 'info');
        }
      });
    }

    // Subject Filter
    const subjFilterSelect = document.getElementById('subjectFilterSelect');
    if (subjFilterSelect) subjFilterSelect.addEventListener('change', renderCieView);

    // History Filters
    const historySubjFilter = document.getElementById('historySubjectFilter');
    const historyStatusFilter = document.getElementById('historyStatusFilter');
    if (historySubjFilter) historySubjFilter.addEventListener('change', renderHistoryView);
    if (historyStatusFilter) historyStatusFilter.addEventListener('change', renderHistoryView);

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all attendance history?')) {
          state.attendance = [];
          saveState();
          renderAllViews();
          showToast('History cleared');
        }
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    function applyTheme(th) {
      if (th === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
      } else {
        document.documentElement.classList.remove('dark');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
      }
      lucide.createIcons();
    }
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.settings.theme);
        saveState();
      });
    }
    applyTheme(state.settings.theme);
  }

  // Master Render
  function renderAllViews() {
    renderDayView();
    renderMonthView();
    renderCieView();
    renderTimetableView();
    renderHistoryView();
    lucide.createIcons();
  }

  // Init
  function init() {
    loadState();
    setupModals();
    setupNavigation();
    renderAllViews();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    window.ClassTrack = {
      markStatus,
      quickLog,
      selectDate,
      selectDateAndRefreshMonth,
      selectDateAndSwitchToDay,
      openBaselineModal,
      openAddSlotModal,
      openEditSlotModal,
      openReasonModal,
      setCourseTarget,
      markAllPresentForCurrentDate,
      markAllAbsentForCurrentDate,
      getOverallStats,
      getPendingClasses,
      deleteSlot,
      deleteHistoryRecord,
      renderAllViews
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

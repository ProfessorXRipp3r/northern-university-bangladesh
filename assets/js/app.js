(function () {
  'use strict';

  const D = window.NUB_DATA;
  const SESSION_KEY = 'nubSession';
  const PROFILE_KEY = 'nubProfile';
  const CLEARANCE_KEY = 'nubClearances';
  const SNAPSHOT_NOW = new Date(2026, 9, 23);
  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  if (!D || !D.student) {
    return;
  }

  let session = null;
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch (err) {
    session = null;
  }

  if (!session || !session.id) {
    window.location.replace('index.html');
    return;
  }

  const ORIGINAL_STUDENT = JSON.parse(JSON.stringify(D.student));

  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      Object.keys(saved).forEach(function (key) {
        if (key !== 'id' && key !== 'name') {
          D.student[key] = saved[key];
        }
      });
    }
  } catch (err) {
    void err;
  }

  const student = D.student;
  const current = D.semesters.find(function (semester) { return semester.isCurrent; }) || D.semesters[D.semesters.length - 1];
  const completed = D.semesters.filter(function (semester) { return semester.resultPublished; });
  const schedule = D.schedules[0] || { dates: {} };
  const paidPercent = D.financeTotal.payable ? (D.financeTotal.paid / D.financeTotal.payable) * 100 : 0;

  const state = {
    route: '',
    scheduleIndex: 0,
    revealSensitive: false,
    paletteIndex: 0,
    paletteResults: []
  };

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12.5-1.5 8 5-3 5 3-1.5-8"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v12H5a2 2 0 0 1-2-2V5"/><path d="M16 13h4"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    pie: '<path d="M21 12a9 9 0 1 1-9-9v9Z"/><path d="M12 3a9 9 0 0 1 9 9h-9Z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.4 3.4-5 7-5s6.2 1.6 7 5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 17h12v4H6z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18"/><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.2M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
    external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    graduation: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
    sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
    banknote: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9h.01M18 15h.01"/>',
    receipt: '<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2Z"/><path d="M9 9h6M9 13h6"/>',
    calendarCheck: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    alertTriangle: '<path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.7-3 2.7-4.5 6-4.5s5.3 1.5 6 4.5"/><path d="M16 5.3a3 3 0 0 1 0 5.4M17 15c2 .5 3.3 2.1 4 5"/>',
    idCard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.4-1.4 1.4-2 3-2s2.6.6 3 2M15 10h3M15 14h3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
  };

  function icon(name, className) {
    return '<svg class="icon' + (className ? ' ' + className : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function money(amount) {
    const number = Number(amount) || 0;
    return (number < 0 ? '-' : '') + '৳' + Math.abs(number).toLocaleString('en-US');
  }

  function num(value, digits) {
    return Number(value || 0).toFixed(digits === undefined ? 2 : digits);
  }

  function parseDate(value) {
    if (!value) {
      return null;
    }
    const parts = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!parts) {
      return null;
    }
    return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
  }

  function displayDate(value, includeYear) {
    const date = value instanceof Date ? value : parseDate(value);
    if (!date || Number.isNaN(date.getTime())) {
      return 'Not published';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: includeYear === false ? undefined : 'numeric'
    });
  }

  function dateRange(start, end) {
    if (!start && !end) {
      return 'Not published';
    }
    return displayDate(start, false) + ' – ' + displayDate(end);
  }

  function daysUntil(value) {
    const date = parseDate(value);
    if (!date) {
      return null;
    }
    return Math.ceil((date.getTime() - SNAPSHOT_NOW.getTime()) / 86400000);
  }

  function shortSemester(name) {
    const parts = String(name || '').split(' ');
    return parts.length === 2 ? parts[0] + " '" + parts[1].slice(-2) : name;
  }

  function semesterByNumber(number) {
    return D.semesters.find(function (semester) { return semester.semesterNo === number; }) || D.semesters[0];
  }

  function gradeClass(grade) {
    const value = String(grade || '').toUpperCase();
    if (value === 'A+') return 'a-plus';
    if (value === 'A') return 'a';
    if (value === 'A-') return 'a-minus';
    if (value === 'B+') return 'b-plus';
    if (value === 'B') return 'b';
    if (value === 'B-') return 'b-minus';
    if (value === 'C+') return 'c-plus';
    if (value === 'C') return 'c';
    if (value === 'D') return 'd';
    if (value === 'F') return 'f';
    return 'b';
  }

  function courseClass(code) {
    const prefix = String(code || '').slice(0, 3).toLowerCase();
    return ['cse', 'eee', 'ce', 'me'].indexOf(prefix) > -1 ? 'blue' : (prefix === 'math' ? 'purple' : prefix);
  }

  function chip(text, tone) {
    return '<span class="chip ' + (tone ? 'chip-' + tone : '') + '">' + esc(text) + '</span>';
  }

  function pageHead(title, description, actions, eyebrow) {
    return '<div class="page-head">' +
      '<div class="page-head-copy">' +
        (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : '') +
        '<h1>' + esc(title) + '</h1>' +
        (description ? '<p>' + esc(description) + '</p>' : '') +
      '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') +
    '</div>';
  }

  function alertBox(tone, title, message, iconName) {
    return '<div class="alert ' + tone + '">' +
      '<span class="alert-icon">' + icon(iconName || (tone === 'success' ? 'checkCircle' : tone === 'danger' ? 'alertTriangle' : 'info')) + '</span>' +
      '<div><strong>' + esc(title) + '</strong><p>' + esc(message) + '</p></div>' +
    '</div>';
  }

  function emptyState(iconName, title, message, actions) {
    return '<div class="empty-state">' +
      '<div class="empty-illustration">' + icon(iconName) + '</div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p>' + esc(message) + '</p>' +
      (actions ? '<div class="empty-actions">' + actions + '</div>' : '') +
    '</div>';
  }

  function printHead(title, subtitle) {
    return '<div class="print-only print-head"><h1>' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div>';
  }

  function statCard(label, value, unit, sub, iconName, tone) {
    return '<article class="stat-card">' +
      '<div class="stat-top"><span class="stat-label">' + esc(label) + '</span><span class="stat-icon ' + (tone || '') + '">' + icon(iconName) + '</span></div>' +
      '<div class="stat-value">' + esc(value) + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div>' +
      '<div class="stat-sub">' + sub + '</div>' +
    '</article>';
  }

  const ROUTES = {
    dashboard: { title: 'Dashboard', nav: 'Dashboard', eyebrow: 'Overview', icon: 'grid', keywords: 'home overview summary' },
    notifications: { title: 'Notifications', nav: 'Notifications', eyebrow: 'Overview', icon: 'bell', keywords: 'alerts notices inbox' },
    schedule: { title: 'Semester Schedule', nav: 'Semester Schedule', eyebrow: 'Academics', icon: 'calendar', keywords: 'dates calendar deadlines exams' },
    registration: { title: 'Semester Registration', nav: 'Semester Registration', eyebrow: 'Academics', icon: 'clipboard', keywords: 'courses advising advisor registration' },
    routine: { title: 'Class Routine', nav: 'Class Routine', eyebrow: 'Academics', icon: 'clock', keywords: 'classes timetable routine' },
    ter: { title: 'TER Fill Up', nav: 'TER Fill Up', eyebrow: 'Academics', icon: 'file', keywords: 'teacher evaluation ter' },
    clearance: { title: 'Clearance for Assessment', nav: 'Clearance for Assessment', eyebrow: 'Academics', icon: 'shield', keywords: 'accounts clearance assessment exam' },
    results: { title: 'Result', nav: 'Result', eyebrow: 'Academics', icon: 'award', keywords: 'grades cgpa transcript result' },
    credentials: { title: 'Request Academic Credential', nav: 'Academic Credential', eyebrow: 'Academics', icon: 'graduation', keywords: 'certificate transcript request credential' },
    'course-structure': { title: 'Course Structure', nav: 'Course Structure', eyebrow: 'Academics', icon: 'layers', keywords: 'curriculum syllabus structure' },
    waiver: { title: 'Waiver Info', nav: 'Waiver Info', eyebrow: 'Finance', icon: 'percent', keywords: 'discount scholarship waiver' },
    'cost-package': { title: 'Cost Package', nav: 'Cost Package', eyebrow: 'Finance', icon: 'layers', keywords: 'fees package tuition rates' },
    payable: { title: 'Payable List', nav: 'Payable List', eyebrow: 'Finance', icon: 'wallet', keywords: 'due dues installment payment payable' },
    payments: { title: 'Payment Information', nav: 'Payment Information', eyebrow: 'Finance', icon: 'receipt', keywords: 'receipts paid history payments' },
    'finance-summary': { title: 'Financial Summary', nav: 'Financial Summary', eyebrow: 'Finance', icon: 'pie', keywords: 'finance summary dues paid' },
    'finance-details': { title: 'Financial Details', nav: 'Financial Details', eyebrow: 'Finance', icon: 'list', keywords: 'ledger cost heads finance detail' },
    profile: { title: 'My Profile', nav: 'My Profile', eyebrow: 'Account', icon: 'user', keywords: 'student personal information profile' },
    'profile-edit': { title: 'Edit Profile', nav: 'Edit Profile', eyebrow: 'Account', icon: 'edit', keywords: 'update contact address edit' },
    password: { title: 'Change Password', nav: 'Change Password', eyebrow: 'Account', icon: 'lock', keywords: 'security password account' },
    notfound: { title: 'Page not found', nav: 'Not found', eyebrow: 'Portal', icon: 'alert', keywords: '404 missing' }
  };

  const NAV_GROUPS = [
    { label: 'Overview', items: ['dashboard', 'notifications'] },
    { label: 'Academics', items: ['schedule', 'registration', 'routine', 'ter', 'clearance', 'results', 'credentials', 'course-structure'] },
    { label: 'Finance', items: ['waiver', 'cost-package', 'payable', 'payments', 'finance-summary', 'finance-details'] },
    { label: 'Account', items: ['profile', 'profile-edit', 'password'] }
  ];

  function routeId() {
    let raw = (window.location.hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
    if (!raw) {
      raw = 'dashboard';
    }
    if (raw === 'profile/edit') {
      raw = 'profile-edit';
    }
    return ROUTES[raw] ? raw : 'notfound';
  }

  function routeHref(id) {
    return '#/' + (id === 'profile-edit' ? 'profile/edit' : id);
  }

  function renderSidebar(active) {
    const nav = $('#sidebarNav');
    if (!nav) return;
    nav.innerHTML = NAV_GROUPS.map(function (group) {
      return '<div class="nav-group"><div class="nav-label">' + esc(group.label) + '</div>' +
        group.items.map(function (id) {
          const item = ROUTES[id];
          const badge = id === 'payable' && D.financeTotal.dues > 0 ? '<span class="nav-badge">Due</span>' : (id === 'results' && !current.resultPublished ? '<span class="nav-badge">Fall</span>' : '');
          return '<a class="nav-item' + (active === id ? ' active' : '') + '" href="' + routeHref(id) + '">' +
            icon(item.icon) + '<span>' + esc(item.nav) + '</span>' + badge +
          '</a>';
        }).join('') +
      '</div>';
    }).join('');

    const mini = $('#miniSemester');
    if (mini) {
      mini.innerHTML = '<span class="mini-label">Current semester</span>' +
        '<strong>' + esc(current.name) + '</strong>' +
        '<div class="mini-row"><span>Semester ' + esc(current.semesterNo) + '</span><span>' + esc(current.totalCreditTaken || current.registeredCourses.reduce(function (sum, course) { return sum + Number(course.credit || 0); }, 0)) + ' credits</span></div>' +
        '<div class="mini-row"><span>' + esc(current.registeredCourses.length) + ' courses</span><span>CGPA ' + num(D.overall.cgpa, 3) + '</span></div>' +
        '<small>' + (current.advisorApproved === 'Yes' ? 'Advisor approved' : 'Advisor review pending') + '</small>';
    }
  }

  function renderTop(active) {
    const route = ROUTES[active];
    const pageTitle = $('#pageTitle');
    if (pageTitle) pageTitle.textContent = route.title;
    const topName = $('#topName');
    const topId = $('#topId');
    const dropName = $('#dropName');
    const dropId = $('#dropId');
    if (topName) topName.textContent = student.name;
    if (topId) topId.textContent = student.id;
    if (dropName) dropName.textContent = student.name;
    if (dropId) dropId.textContent = student.id + ' · ' + current.name;
    document.title = route.title + ' · NUB Student Portal';
  }

  function closeSidebar() {
    const shell = $('#appShell');
    if (shell) shell.classList.remove('sidebar-open');
  }

  function openSidebar() {
    const shell = $('#appShell');
    if (shell) shell.classList.add('sidebar-open');
  }

  function closeDropdowns() {
    $$('.dropdown.open').forEach(function (dropdown) { dropdown.classList.remove('open'); });
    $$('[aria-expanded="true"]').forEach(function (button) { button.setAttribute('aria-expanded', 'false'); });
  }

  function toggleDropdown(dropdownId, button) {
    const dropdown = $('#' + dropdownId);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');
    closeDropdowns();
    if (!isOpen) {
      dropdown.classList.add('open');
      if (button) button.setAttribute('aria-expanded', 'true');
    }
  }

  function showToast(title, message, tone) {
    const stack = $('#toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (tone || 'info');
    toast.innerHTML = '<span class="toast-icon">' + icon(tone === 'error' ? 'alert' : tone === 'warning' ? 'alertTriangle' : 'info') + '</span><div><strong></strong><p></p></div>';
    toast.querySelector('strong').textContent = title;
    toast.querySelector('p').textContent = message || '';
    stack.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add('removing');
      window.setTimeout(function () { toast.remove(); }, 220);
    }, 3800);
  }

  function openModal(options) {
    const root = $('#modalRoot');
    if (!root) return;
    root.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal-head"><div><h2 id="modalTitle">' + esc(options.title) + '</h2>' + (options.subtitle ? '<p>' + esc(options.subtitle) + '</p>' : '') + '</div><button class="modal-close" type="button" data-modal-close aria-label="Close">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + (options.body || '') + '</div>' +
      (options.footer ? '<div class="modal-foot">' + options.footer + '</div>' : '') +
    '</div>';
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    const focusTarget = root.querySelector('input, select, textarea, button:not([data-modal-close])');
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    const root = $('#modalRoot');
    if (!root) return;
    root.hidden = true;
    root.innerHTML = '';
    document.body.style.overflow = '';
  }

  function copyText(text) {
    const value = String(text || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast('Copied', 'The detail is on your clipboard.', 'info');
      }).catch(function () {
        showToast('Copy failed', 'Select the text and copy it manually.', 'warning');
      });
      return;
    }
    showToast('Copy unavailable', 'Select the text and copy it manually.', 'warning');
  }

  const PALETTE = Object.keys(ROUTES).filter(function (id) { return id !== 'notfound'; }).map(function (id) {
    const route = ROUTES[id];
    return { id: id, title: route.title, eyebrow: route.eyebrow, icon: route.icon, keywords: (route.title + ' ' + route.eyebrow + ' ' + route.keywords).toLowerCase() };
  });

  function renderPaletteResults(query) {
    const list = $('#paletteResults');
    if (!list) return;
    const term = String(query || '').trim().toLowerCase();
    state.paletteResults = PALETTE.filter(function (item) { return !term || item.keywords.indexOf(term) > -1; });
    state.paletteIndex = 0;
    if (!state.paletteResults.length) {
      list.innerHTML = '<div class="palette-empty">No pages match “' + esc(query) + '”.</div>';
      return;
    }
    list.innerHTML = '<div class="palette-group-label">Pages</div>' + state.paletteResults.map(function (item, index) {
      return '<a class="palette-item' + (index === 0 ? ' active' : '') + '" href="' + routeHref(item.id) + '" data-palette-index="' + index + '">' +
        icon(item.icon) + '<span>' + esc(item.title) + '</span><small>' + esc(item.eyebrow) + '</small>' + icon('arrowRight') +
      '</a>';
    }).join('');
  }

  function openPalette() {
    const overlay = $('#palette');
    const input = $('#paletteInput');
    if (!overlay || !input) return;
    overlay.hidden = false;
    input.value = '';
    renderPaletteResults('');
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () { input.focus(); }, 20);
    closeDropdowns();
    closeSidebar();
  }

  function closePalette() {
    const overlay = $('#palette');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function movePalette(direction) {
    const items = $$('.palette-item');
    if (!items.length) return;
    state.paletteIndex = (state.paletteIndex + direction + items.length) % items.length;
    items.forEach(function (item, index) { item.classList.toggle('active', index === state.paletteIndex); });
    items[state.paletteIndex].scrollIntoView({ block: 'nearest' });
  }

  function cgpaChart(extraId) {
    if (!completed.length) {
      return '<div class="empty-state"><p>No published results yet.</p></div>';
    }
    const width = 680;
    const height = 214;
    const left = 36;
    const right = 18;
    const top = 20;
    const bottom = 30;
    const values = completed.map(function (semester) { return Number(semester.cgpa); });
    const min = Math.min.apply(null, values) - 0.12;
    const max = Math.max.apply(null, values) + 0.12;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    function x(index) { return left + (completed.length === 1 ? plotW / 2 : (plotW * index) / (completed.length - 1)); }
    function y(value) { return top + ((max - value) / (max - min)) * plotH; }
    const points = values.map(function (value, index) { return x(index).toFixed(1) + ',' + y(value).toFixed(1); }).join(' ');
    const area = 'M ' + x(0).toFixed(1) + ' ' + (height - bottom) + ' L ' + points.split(' ').join(' L ') + ' L ' + x(values.length - 1).toFixed(1) + ' ' + (height - bottom) + ' Z';
    const ticks = [min + (max - min) * 0.15, min + (max - min) * 0.5, min + (max - min) * 0.85];
    const gradientId = 'cgpaFill' + (extraId || '');
    return '<svg class="line-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="CGPA trend across published semesters">' +
      '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#12a66a" stop-opacity="0.22"/><stop offset="100%" stop-color="#12a66a" stop-opacity="0"/></linearGradient></defs>' +
      ticks.map(function (tick) {
        return '<line x1="' + left + '" y1="' + y(tick).toFixed(1) + '" x2="' + (width - right) + '" y2="' + y(tick).toFixed(1) + '" stroke="#edf1f7" stroke-width="1"/>' +
          '<text x="0" y="' + (y(tick) + 3).toFixed(1) + '" fill="#94a3b8" font-size="9">' + tick.toFixed(1) + '</text>';
      }).join('') +
      '<path d="' + area + '" fill="url(#' + gradientId + ')"/>' +
      '<polyline points="' + points + '" fill="none" stroke="#12a66a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      values.map(function (value, index) {
        return '<circle cx="' + x(index).toFixed(1) + '" cy="' + y(value).toFixed(1) + '" r="3.8" fill="#fff" stroke="#12a66a" stroke-width="2"><title>' + esc(completed[index].name + ': ' + value.toFixed(3) + ' CGPA') + '</title></circle>';
      }).join('') +
    '</svg>' +
    '<div class="chart-labels">' + completed.map(function (semester) { return '<span>' + esc(shortSemester(semester.name)) + '</span>'; }).join('') + '</div>';
  }

  function dueInstallments() {
    return [
      { label: 'First installment', short: '40%', amount: current.payable.installments.first, date: '20/10/2026' },
      { label: 'Second installment', short: '30%', amount: current.payable.installments.second, date: '28/10/2026' },
      { label: 'Third installment', short: '30%', amount: current.payable.installments.third, date: '15/12/2026' }
    ];
  }

  function installmentState(date) {
    const days = daysUntil(date);
    if (days === null) return { card: '', label: 'Not published', tone: 'gray' };
    if (days < 0) return { card: 'overdue', label: Math.abs(days) + ' days overdue', tone: 'red' };
    if (days === 0) return { card: 'due-soon', label: 'Due today', tone: 'amber' };
    if (days <= 14) return { card: 'due-soon', label: 'Due in ' + days + ' days', tone: 'amber' };
    return { card: '', label: 'Due in ' + days + ' days', tone: 'gray' };
  }

  function milestones() {
    const dates = schedule.dates;
    return [
      { label: 'Registration', start: dates['Registration Start Date'], end: dates['Registration End Date'], icon: 'clipboard' },
      { label: 'Classes', start: dates['Class Start Date'], end: dates['Class End Date'], icon: 'bookOpen' },
      { label: 'Mid-term exams', start: dates['Mid Term Start Date'], end: dates['Mid Term End Date'], icon: 'file' },
      { label: 'Final exams', start: dates['Final Exam Start Date'], end: dates['Final Exam End Date'], icon: 'award' },
      { label: 'TER fill-up', start: dates['Ter Fill Up Start Date'], end: dates['Ter Fill Up End Date'], icon: 'checkCircle' }
    ];
  }

  function nextMilestone() {
    const list = milestones().filter(function (item) { return item.start && item.end; });
    const upcoming = list.filter(function (item) { return parseDate(item.start) >= SNAPSHOT_NOW; }).sort(function (a, b) { return parseDate(a.start) - parseDate(b.start); });
    if (upcoming.length) return upcoming[0];
    const active = list.find(function (item) { return parseDate(item.start) <= SNAPSHOT_NOW && parseDate(item.end) >= SNAPSHOT_NOW; });
    return active || list[list.length - 1];
  }

  function dashboardView() {
    const firstName = (student.name.split(' ')[1] || student.name.split(' ')[0]).replace(/[.]/g, '');
    const next = nextMilestone();
    const nextDays = next ? daysUntil(next.start) : null;
    const nextLabel = next ? next.label : 'Semester calendar';
    const nextDate = next ? dateRange(next.start, next.end) : 'Dates not published';
    const nextSmall = nextDays === null ? 'Awaiting schedule' : nextDays > 0 ? 'In ' + nextDays + ' days' : nextDays === 0 ? 'Starts today' : 'In progress';
    const best = completed.reduce(function (top, semester) { return !top || Number(semester.cgpa) > Number(top.cgpa) ? semester : top; }, null);

    return '<div class="view">' +
      '<section class="hero">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">' + esc(current.name) + ' · Semester ' + esc(current.semesterNo) + '</p>' +
          '<h1>Welcome back, ' + esc(firstName) + '.</h1>' +
          '<p>Your semester is ' + (current.advisorApproved === 'Yes' ? 'approved and underway' : 'being reviewed') + '. Here is everything that needs your attention, without the noise.</p>' +
          '<div class="hero-chips">' +
            chip('CSE', 'green') + chip(current.totalCreditTaken + ' credits', 'blue') + chip(current.advisorApproved === 'Yes' ? 'Advisor approved' : 'Advisor pending', current.advisorApproved === 'Yes' ? 'green' : 'amber') + chip(D.financeTotal.dues > 0 ? money(D.financeTotal.dues) + ' due' : 'No dues', D.financeTotal.dues > 0 ? 'amber' : 'green') +
          '</div>' +
          '<div class="hero-actions">' +
            '<a class="btn btn-accent" href="#/results">' + icon('award') + 'View results</a>' +
            '<a class="btn btn-ghost-light" href="#/payable">' + icon('wallet') + 'Review dues</a>' +
          '</div>' +
        '</div>' +
        '<div class="hero-side">' +
          '<div class="hero-photo"><img src="' + esc(student.photo) + '" alt="' + esc(student.name) + '"></div>' +
          '<div class="hero-next"><span>Next on the calendar</span><strong>' + esc(nextLabel) + '</strong><small>' + icon('calendar') + esc(nextDate) + '</small><small>' + icon('clock') + esc(nextSmall) + '</small></div>' +
        '</div>' +
      '</section>' +

      '<div class="stats-grid section-gap">' +
        statCard('Current CGPA', num(D.overall.cgpa, 3), '/ 4.00', 'Best <span class="up">' + num(best ? best.cgpa : 0, 3) + '</span> · ' + esc(best ? best.name : ''), 'award', 'blue') +
        statCard('Credits completed', String(D.overall.totalCredit), 'credits', '<span class="up">' + completed.length + '</span> semesters published', 'graduation', 'purple') +
        statCard('Current dues', money(D.financeTotal.dues), '', '<span class="warn">First installment overdue</span>', 'wallet', 'red') +
        statCard('Semester load', String(current.totalCreditTaken), 'credits', current.registeredCourses.length + ' courses · ' + esc(current.registrationType), 'bookOpen', 'amber') +
      '</div>' +

      (current.accountsClearance !== 'Yes' ? '<div class="section-gap">' + alertBox('warning', 'Accounts clearance is pending', 'The portal marks accounts clearance as “' + current.accountsClearance + '” for ' + current.name + '. Review the outstanding balance and the clearance page before assessment.', 'shield') + '</div>' : '') +

      '<div class="grid grid-main section-gap">' +
        '<section class="card chart-card">' +
          '<div class="card-head"><div><h2>CGPA trend</h2><p>Published semester results</p></div><span class="chip chip-green">' + num(D.overall.cgpa, 3) + ' current</span></div>' +
          '<div class="card-body">' + cgpaChart('Dashboard') + '</div>' +
          '<div class="chart-meta"><span class="chart-meta-item"><span class="legend-dot"></span>CGPA</span><span class="chart-meta-item"><strong>' + completed.length + '</strong> published semesters</span><span class="chart-meta-item"><strong>' + num(D.overall.totalTGP, 1) + '</strong> total TGP</span></div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Fee progress</h2><p>Across your programme</p></div><a class="link" href="#/finance-summary">Details</a></div>' +
          '<div class="card-body">' +
            '<div class="donut-wrap">' +
              '<div class="donut" style="--pct:' + paidPercent.toFixed(1) + '%"><div class="donut-center"><strong>' + paidPercent.toFixed(1) + '%</strong><span>fees paid</span></div></div>' +
              '<div class="donut-legend">' +
                '<div class="donut-legend-row"><span class="legend-dot"></span>Paid<strong>' + money(D.financeTotal.paid) + '</strong></div>' +
                '<div class="donut-legend-row"><span class="legend-dot dues"></span>Remaining<strong>' + money(D.financeTotal.dues) + '</strong></div>' +
                '<div class="donut-legend-row"><span class="legend-dot blue"></span>Total payable<strong>' + money(D.financeTotal.payable) + '</strong></div>' +
              '</div>' +
            '</div>' +
            '<div class="installment-mini">' + dueInstallments().map(function (item) {
              const status = installmentState(item.date);
              return '<div class="installment-mini-row"><span>' + esc(item.short) + ' · ' + esc(displayDate(item.date)) + '</span><strong class="' + (status.card === 'overdue' ? 'money negative' : '') + '">' + money(item.amount) + '</strong></div>';
            }).join('') + '</div>' +
            '<a class="btn btn-soft btn-sm btn-block mt-3" href="#/payable">' + icon('arrowRight') + 'View payment schedule</a>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="grid grid-main-wide section-gap">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Current courses</h2><p>' + esc(current.name) + ' · ' + current.registeredCourses.length + ' registered</p></div><a class="link" href="#/registration">Registration</a></div>' +
          '<div class="card-body"><div class="course-list">' + current.registeredCourses.map(function (course) {
            return '<div class="course-row"><span class="course-code ' + courseClass(course.code) + '">' + esc(course.code) + '</span><div class="course-main"><span class="course-title">' + esc(course.title) + '</span><span class="course-meta">Section ' + esc(course.section) + ' · TER ' + esc(course.terStatus) + '</span></div><span class="course-credit">' + num(course.credit, 1) + ' cr</span>' + chip(course.resultStatus || 'Pending', 'gray') + '</div>';
          }).join('') + '</div></div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Semester timeline</h2><p>Key dates for ' + esc(current.name) + '</p></div><a class="link" href="#/schedule">Schedule</a></div>' +
          '<div class="card-body"><div class="timeline">' +
            '<div class="timeline-item done"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>Registration</strong><span>' + esc(dateRange(schedule.dates['Registration Start Date'], schedule.dates['Registration End Date'])) + '</span></div></div>' +
            '<div class="timeline-item ' + (SNAPSHOT_NOW >= parseDate(schedule.dates['Class Start Date']) && SNAPSHOT_NOW <= parseDate(schedule.dates['Class End Date']) ? 'next' : '') + '"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>Classes in progress</strong><span>' + esc(dateRange(schedule.dates['Class Start Date'], schedule.dates['Class End Date'])) + '</span></div></div>' +
            '<div class="timeline-item overdue"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>First installment</strong><span>' + esc(displayDate('20/10/2026')) + ' · ' + money(current.payable.installments.first) + '</span>' + chip('Overdue', 'red') + '</div></div>' +
            '<div class="timeline-item"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>Mid-term exams</strong><span>' + esc(dateRange(schedule.dates['Mid Term Start Date'], schedule.dates['Mid Term End Date'])) + '</span></div></div>' +
            '<div class="timeline-item"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>Final exams</strong><span>' + esc(dateRange(schedule.dates['Final Exam Start Date'], schedule.dates['Final Exam End Date'])) + '</span></div></div>' +
          '</div></div>' +
        '</section>' +
      '</div>' +

      '<section class="section-gap">' +
        '<div class="quick-grid">' +
          '<a class="quick-link" href="#/results"><span class="quick-icon blue">' + icon('award') + '</span><span><strong>Results</strong><small>' + completed.length + ' semesters published</small></span>' + icon('chevronRight') + '</a>' +
          '<a class="quick-link" href="#/payable"><span class="quick-icon amber">' + icon('wallet') + '</span><span><strong>Payable list</strong><small>' + money(D.financeTotal.dues) + ' outstanding</small></span>' + icon('chevronRight') + '</a>' +
          '<a class="quick-link" href="#/schedule"><span class="quick-icon purple">' + icon('calendar') + '</span><span><strong>Semester schedule</strong><small>Classes, mid-terms and finals</small></span>' + icon('chevronRight') + '</a>' +
          '<a class="quick-link" href="#/clearance"><span class="quick-icon">' + icon('shield') + '</span><span><strong>Assessment clearance</strong><small>' + (current.accountsClearance === 'Yes' ? 'Cleared' : 'Accounts pending') + '</small></span>' + icon('chevronRight') + '</a>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function notificationsView() {
    const reminders = milestones().filter(function (item) {
      return item.start && item.end && parseDate(item.end) >= SNAPSHOT_NOW;
    }).slice(0, 5);
    return '<div class="view">' +
      printHead('Notification history', 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Notifications', 'Portal notices and the deadlines worth keeping an eye on.', '<a class="btn btn-ghost" href="#/schedule">' + icon('calendar') + 'Semester schedule</a>', 'Overview') +
      '<div class="grid grid-main-wide">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Notification history</h2><p>Activity from the live portal</p></div>' + chip('0 records', 'gray') + '</div>' +
          '<div class="card-body">' + emptyState('bell', 'You’re all caught up', 'The live portal returned no notification records for this account. Registration, results and payment notices will appear here when the official portal publishes them.', '<a class="btn btn-soft btn-sm" href="#/dashboard">' + icon('grid') + 'Back to dashboard</a>') + '</div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Upcoming dates</h2><p>Pulled from the published semester schedule</p></div><a class="link" href="#/schedule">View all</a></div>' +
          '<div class="card-body">' +
            (reminders.length ? '<div class="timeline">' + reminders.map(function (item) {
              const days = daysUntil(item.start);
              const itemClass = days !== null && days < 0 ? 'done' : 'next';
              return '<div class="timeline-item ' + itemClass + '"><div class="timeline-marker"><span class="timeline-dot"></span></div><div class="timeline-body"><strong>' + esc(item.label) + '</strong><span>' + esc(dateRange(item.start, item.end)) + '</span>' + chip(days !== null && days < 0 ? 'Passed' : days === 0 ? 'Today' : 'In ' + days + ' days', days !== null && days < 0 ? 'gray' : 'amber') + '</div></div>';
            }).join('') + '</div>' : '<p class="muted small">No upcoming dates published.</p>') +
            '<div class="mini-note">' + icon('info') + '<span>Reminders are derived from the semester schedule, not from portal notifications.</span></div>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  function phaseClass(start, end) {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!startDate || !endDate) return '';
    if (endDate < SNAPSHOT_NOW) return 'past';
    if (startDate <= SNAPSHOT_NOW && endDate >= SNAPSHOT_NOW) return 'active';
    return '';
  }

  function scheduleView() {
    const selected = D.schedules[state.scheduleIndex] || D.schedules[0];
    const dates = selected.dates;
    const phases = [
      { label: 'Registration', start: dates['Registration Start Date'], end: dates['Registration End Date'] },
      { label: 'Classes', start: dates['Class Start Date'], end: dates['Class End Date'] },
      { label: 'Mid-terms', start: dates['Mid Term Start Date'], end: dates['Mid Term End Date'] },
      { label: 'Final exams', start: dates['Final Exam Start Date'], end: dates['Final Exam End Date'] },
      { label: 'TER fill-up', start: dates['Ter Fill Up Start Date'], end: dates['Ter Fill Up End Date'] }
    ];
    const rows = [
      ['Registration window', dateRange(dates['Registration Start Date'], dates['Registration End Date'])],
      ['Classes', dateRange(dates['Class Start Date'], dates['Class End Date'])],
      ['Add / drop', dateRange(dates['Add Drop Start Date'], dates['Add Drop End Date'])],
      ['Mid-term exams', dateRange(dates['Mid Term Start Date'], dates['Mid Term End Date'])],
      ['Final exams', dateRange(dates['Final Exam Start Date'], dates['Final Exam End Date'])],
      ['First installment (40%)', displayDate(dates['First Installment (40%) Payment Last Date'])],
      ['Second installment (30%)', displayDate(dates['Second Installment (30%) Payment Last Date'])],
      ['Third installment (30%)', displayDate(dates['Third Installment (30%) Payment Last Date'])],
      ['Semester drop deadline', displayDate(dates['Semester Drop Last Date'])],
      ['TER fill-up window', dateRange(dates['Ter Fill Up Start Date'], dates['Ter Fill Up End Date'])]
    ];
    return '<div class="view">' +
      printHead('Semester schedule · ' + selected.semester, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Semester Schedule', 'The official dates for registration, classes, assessments and payments.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button>', 'Academics') +
      '<div class="flex-between flex-wrap section-gap">' +
        '<div class="semester-switch"><label class="small muted" for="semesterSelect">Semester</label><select class="select" id="semesterSelect">' + D.schedules.map(function (item, index) {
          return '<option value="' + index + '"' + (index === state.scheduleIndex ? ' selected' : '') + '>' + esc(item.semester) + '</option>';
        }).join('') + '</select></div>' +
        chip(selected.semester === current.name ? 'Current semester' : 'Previous semester', selected.semester === current.name ? 'green' : 'gray') +
      '</div>' +
      '<section class="schedule-hero section-gap">' +
        '<div class="schedule-hero-top"><div><p class="eyebrow">' + esc(selected.semester) + '</p><h2>' + esc(selected.semester) + ' at a glance</h2><p>' + esc(dateRange(dates['Class Start Date'], dates['Class End Date'])) + ' · ' + (selected.semester === current.name ? 'Current semester' : 'Archived schedule') + '</p></div>' + chip(selected.semester === current.name ? 'In progress' : 'Completed', selected.semester === current.name ? 'green' : 'gray') + '</div>' +
        '<div class="schedule-phases">' + phases.map(function (phase) {
          const phaseStatus = phaseClass(phase.start, phase.end);
          return '<div class="phase ' + phaseStatus + '"><span class="phase-label">' + esc(phase.label) + '</span><strong>' + (phase.start ? esc(displayDate(phase.start, false)) : 'Not published') + '</strong><small>' + (phase.end ? 'to ' + esc(displayDate(phase.end)) : 'No window published') + '</small></div>';
        }).join('') + '</div>' +
      '</section>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Dates and deadlines</h2><p>Every published date for ' + esc(selected.semester) + '</p></div>' + chip('Official snapshot', 'blue') + '</div>' +
          '<div class="card-body"><div class="date-grid">' + rows.map(function (row) {
            return '<div class="date-row"><span>' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong></div>';
          }).join('') + '</div></div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>What this means</h2><p>Use these dates to plan your semester</p></div></div>' +
          '<div class="card-body">' +
            alertBox('info', 'Dates come from the portal snapshot', 'This concept uses the schedule returned by the live portal on 23 Oct 2026. Always confirm changes in the official portal.', 'info') +
            '<div class="info-list mt-4">' +
              '<div class="info-row"><dt>Registration</dt><dd>' + esc(dateRange(dates['Registration Start Date'], dates['Registration End Date'])) + '</dd></div>' +
              '<div class="info-row"><dt>Add / drop</dt><dd>' + esc(dateRange(dates['Add Drop Start Date'], dates['Add Drop End Date'])) + '</dd></div>' +
              '<div class="info-row"><dt>Final exams</dt><dd>' + esc(dateRange(dates['Final Exam Start Date'], dates['Final Exam End Date'])) + '</dd></div>' +
              '<div class="info-row"><dt>TER window</dt><dd>' + esc(dateRange(dates['Ter Fill Up Start Date'], dates['Ter Fill Up End Date'])) + '</dd></div>' +
            '</div>' +
            '<div class="mini-note">' + icon('help') + '<span>Need the current semester courses? Open semester registration or the payable list.</span></div>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  function registrationView() {
    const courses = current.registeredCourses;
    const totalCredit = courses.reduce(function (sum, course) { return sum + Number(course.credit || 0); }, 0);
    return '<div class="view">' +
      printHead('Semester registration · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Semester Registration', 'Your approved course load and registration record for ' + current.name + '.', '<a class="btn btn-ghost" href="#/schedule">' + icon('calendar') + 'Schedule</a><a class="btn btn-primary" href="#/payable">' + icon('wallet') + 'Payment</a>', 'Academics') +
      '<div class="stats-grid">' +
        statCard('Registration ID', current.registrationId, '', 'Semester ' + current.semesterNo + ' · ' + current.registrationType, 'clipboard', 'blue') +
        statCard('Registered credits', String(totalCredit), 'credits', courses.length + ' courses this semester', 'bookOpen', 'purple') +
        statCard('Advisor approval', current.advisorApproved, '', current.advisorApproved === 'Yes' ? 'Course load approved' : 'Review pending', 'checkCircle', current.advisorApproved === 'Yes' ? '' : 'amber') +
        statCard('Accounts clearance', current.accountsClearance, '', current.accountsClearance === 'Yes' ? 'No outstanding hold' : money(current.payable.presentDues) + ' currently due', 'shield', current.accountsClearance === 'Yes' ? '' : 'red') +
      '</div>' +
      (current.accountsClearance === 'Yes' ? '<div class="section-gap">' + alertBox('success', 'Registration is in good standing', 'Advisor approval and accounts clearance are both recorded as complete in the snapshot.', 'checkCircle') + '</div>' : '<div class="section-gap">' + alertBox('warning', 'Accounts clearance is still pending', 'The snapshot records accounts clearance as “' + current.accountsClearance + '”. Review the payable list to see the outstanding ' + money(current.payable.presentDues) + '.', 'wallet') + '</div>') +
      '<section class="card section-gap">' +
        '<div class="card-head"><div><h2>Registered courses</h2><p>' + esc(current.name) + ' · ' + esc(current.registrationType) + ' registration</p></div>' + chip(courses.length + ' courses', 'green') + '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Course</th><th>Title</th><th>Section</th><th class="num">Credit</th><th>TER</th><th>Result</th></tr></thead><tbody>' + courses.map(function (course) {
          return '<tr><td>' + course.serial + '</td><td><span class="course-code ' + courseClass(course.code) + '">' + esc(course.code) + '</span></td><td class="title-cell strong">' + esc(course.title) + '</td><td>' + esc(course.section) + '</td><td class="num">' + num(course.credit, 1) + '</td><td>' + chip(course.terStatus, course.terStatus === 'Done' ? 'green' : 'amber') + '</td><td>' + chip(course.resultStatus || 'Pending', 'gray') + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="4">Total registered</td><td class="num">' + num(totalCredit, 1) + '</td><td colspan="2">' + chip(current.advisorApproved === 'Yes' ? 'Advisor approved' : 'Advisor pending', current.advisorApproved === 'Yes' ? 'green' : 'amber') + '</td></tr></tfoot></table></div>' +
      '</section>' +
      '<div class="grid grid-2 section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Registration window</h2><p>From the published semester schedule</p></div><a class="link" href="#/schedule">Details</a></div><div class="card-body"><div class="date-grid">' +
          '<div class="date-row"><span>Registration opens</span><strong>' + esc(displayDate(schedule.dates['Registration Start Date'])) + '</strong></div>' +
          '<div class="date-row"><span>Registration closes</span><strong>' + esc(displayDate(schedule.dates['Registration End Date'])) + '</strong></div>' +
          '<div class="date-row"><span>Add / drop opens</span><strong>' + esc(displayDate(schedule.dates['Add Drop Start Date'])) + '</strong></div>' +
          '<div class="date-row"><span>Add / drop closes</span><strong>' + esc(displayDate(schedule.dates['Add Drop End Date'])) + '</strong></div>' +
        '</div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>New registration</h2><p>Registration for a future semester</p></div>' + chip('Closed', 'gray') + '</div><div class="card-body">' + emptyState('clipboard', 'New registration is closed', 'The live portal returned no open registration window beyond ' + current.name + '. This page will become actionable when the next advising window opens.', '<a class="btn btn-soft btn-sm" href="#/schedule">' + icon('calendar') + 'Check schedule</a>') + '</div></section>' +
      '</div>' +
    '</div>';
  }

  function routineView() {
    return '<div class="view">' +
      printHead('Class routine · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Class Routine', 'Your weekly class timetable for ' + current.name + '.', '<a class="btn btn-ghost" href="#/registration">' + icon('clipboard') + 'Registered courses</a><a class="btn btn-primary" href="#/schedule">' + icon('calendar') + 'Semester dates</a>', 'Academics') +
      '<div class="grid grid-main">' +
        '<section class="card"><div class="card-head"><div><h2>Weekly timetable</h2><p>' + esc(current.name) + ' · Semester ' + esc(current.semesterNo) + '</p></div>' + chip('Not published', 'amber') + '</div><div class="card-body">' + emptyState('clock', 'The routine is not published yet', 'The live portal returned no class routine rows for ' + current.name + '. Your registered courses are still available, so you can confirm the course load while the timetable is being prepared.', '<a class="btn btn-soft btn-sm" href="#/registration">' + icon('bookOpen') + 'View registered courses</a>') + '</div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Registration snapshot</h2><p>What is known about this semester</p></div></div><div class="card-body"><div class="info-list">' +
          '<div class="info-row"><dt>Semester</dt><dd>' + esc(current.name) + '</dd></div>' +
          '<div class="info-row"><dt>Courses</dt><dd>' + current.registeredCourses.length + ' registered</dd></div>' +
          '<div class="info-row"><dt>Credits</dt><dd>' + current.totalCreditTaken + ' credits</dd></div>' +
          '<div class="info-row"><dt>Advisor</dt><dd>' + esc(current.advisorApproved) + '</dd></div>' +
          '<div class="info-row"><dt>Routine status</dt><dd><span class="muted">Not published</span></dd></div>' +
        '</div>' + '<div class="mini-note">' + icon('info') + '<span>The class routine page in the live portal was empty on 23 Oct 2026.</span></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function courseStructureView() {
    return '<div class="view">' +
      pageHead('Course Structure', 'The programme curriculum and course sequence.', '<a class="btn btn-ghost" href="#/registration">' + icon('clipboard') + 'Registered courses</a>', 'Academics') +
      '<section class="card">' +
        '<div class="card-head"><div><h2>Programme structure</h2><p>' + esc(student.program) + '</p></div>' + chip('Feature unavailable', 'gray') + '</div>' +
        '<div class="card-body">' + emptyState('layers', 'Course structure is not available in this snapshot', 'The live portal returns a “feature being developed” page at this address. The official course structure will appear here once NUB publishes it.', '<a class="btn btn-soft btn-sm" href="#/results">' + icon('award') + 'Browse completed courses</a>') + '</div>' +
      '</section>' +
      '<section class="card section-gap"><div class="card-head"><div><h2>Programme details</h2><p>From your student record</p></div></div><div class="card-body"><div class="grid grid-2"><div class="info-list">' +
        '<div class="info-row"><dt>Programme</dt><dd>' + esc(student.program) + '</dd></div>' +
        '<div class="info-row"><dt>Programme type</dt><dd>' + esc(student.programType) + '</dd></div>' +
        '<div class="info-row"><dt>Campus</dt><dd>' + esc(student.campus) + '</dd></div>' +
      '</div><div class="info-list">' +
        '<div class="info-row"><dt>Admission</dt><dd>' + esc(student.admissionSemester) + '</dd></div>' +
        '<div class="info-row"><dt>Completed credits</dt><dd>' + D.overall.totalCredit + '</dd></div>' +
        '<div class="info-row"><dt>Academic status</dt><dd>' + esc(student.academicStatus) + '</dd></div>' +
      '</div></div></div></section>' +
    '</div>';
  }

  function terView() {
    return '<div class="view">' +
      printHead('TER status · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('TER Fill Up', 'Teacher evaluation records for your current semester.', '<a class="btn btn-ghost" href="#/registration">' + icon('clipboard') + 'Course list</a>', 'Academics') +
      '<div class="stats-grid">' +
        statCard('TER window', 'Closed', '', 'No fill-up dates published', 'calendar', 'red') +
        statCard('Current load', String(current.totalCreditTaken), 'credits', current.registeredCourses.length + ' courses', 'bookOpen', 'blue') +
        statCard('Completed TER', '0', 'courses', 'All records show Not Done Yet', 'checkCircle', 'amber') +
        statCard('Semester', current.name, '', 'Semester ' + current.semesterNo, 'calendarCheck', 'purple') +
      '</div>' +
      '<div class="section-gap">' + alertBox('warning', 'TER is not open for ' + current.name, 'The live portal returned no TER start or end date, and every registered course shows “Not Done Yet”. This page is read-only until the university opens the evaluation window.', 'alertTriangle') + '</div>' +
      '<section class="card section-gap">' +
        '<div class="card-head"><div><h2>Course-wise status</h2><p>Teacher evaluation requirements</p></div>' + chip('0 completed', 'amber') + '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Course</th><th>Title</th><th>Section</th><th class="num">Credit</th><th>TER status</th></tr></thead><tbody>' + current.registeredCourses.map(function (course) {
          return '<tr><td>' + course.serial + '</td><td><span class="course-code ' + courseClass(course.code) + '">' + esc(course.code) + '</span></td><td class="title-cell strong">' + esc(course.title) + '</td><td>' + esc(course.section) + '</td><td class="num">' + num(course.credit, 1) + '</td><td>' + chip(course.terStatus, 'amber') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '</section>' +
    '</div>';
  }

  function clearanceRequests() {
    try {
      const value = JSON.parse(localStorage.getItem(CLEARANCE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (err) {
      return {};
    }
  }

  function clearanceView() {
    const requests = clearanceRequests();
    const request = requests[current.name];
    return '<div class="view">' +
      printHead('Assessment clearance · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Clearance for Assessment', 'The accounts and advising checks that sit before semester assessment.', '<a class="btn btn-ghost" href="#/payable">' + icon('wallet') + 'Payable list</a><button class="btn btn-accent" type="button" data-action="open-clearance">' + icon('send') + 'Clearance request</button>', 'Academics') +
      (current.accountsClearance === 'Yes' ? alertBox('success', 'Accounts clearance is complete', 'The snapshot records accounts clearance as Yes. Keep the receipt for your records.', 'checkCircle') : alertBox('warning', 'Accounts clearance is pending', 'The snapshot records accounts clearance as No for ' + current.name + '. The outstanding amount is ' + money(current.payable.presentDues) + '.', 'shield')) +
      (request ? '<div class="section-gap">' + alertBox('info', 'Clearance request saved locally', 'A  clearance request was saved on this device on ' + new Date(request.at).toLocaleString('en-GB') + '. It has not been sent to NUB. Reset it below if you want to restore the empty state.', 'info') + '</div>' : '') +
      '<div class="stats-grid section-gap">' +
        statCard('Accounts clearance', current.accountsClearance, '', current.accountsClearance === 'Yes' ? 'Cleared for assessment' : 'Outstanding balance', 'shield', current.accountsClearance === 'Yes' ? '' : 'red') +
        statCard('Advisor approval', current.advisorApproved, '', 'Recorded for ' + current.name, 'checkCircle', current.advisorApproved === 'Yes' ? '' : 'amber') +
        statCard('Outstanding', money(current.payable.presentDues), '', 'Current semester dues', 'wallet', 'amber') +
        statCard('Clearance request', request ? 'Saved' : 'None', '', request ? 'Stored only in this browser' : 'Not submitted', 'file', request ? 'blue' : 'gray') +
      '</div>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Clearance snapshot</h2><p>What the live portal exposes for this account</p></div>' + chip(request ? 'Clearance request saved' : current.accountsClearance === 'Yes' ? 'Clear' : 'Action needed', request ? 'blue' : current.accountsClearance === 'Yes' ? 'green' : 'amber') + '</div>' +
          '<div class="card-body"><div class="info-list">' +
            '<div class="info-row"><dt>Semester</dt><dd>' + esc(current.name) + ' · Semester ' + esc(current.semesterNo) + '</dd></div>' +
            '<div class="info-row"><dt>Registration</dt><dd>' + esc(current.registrationId) + ' · ' + esc(current.registrationType) + '</dd></div>' +
            '<div class="info-row"><dt>Advisor approval</dt><dd>' + esc(current.advisorApproved) + '</dd></div>' +
            '<div class="info-row"><dt>Accounts clearance</dt><dd>' + esc(current.accountsClearance) + '</dd></div>' +
            '<div class="info-row"><dt>Outstanding balance</dt><dd>' + money(current.payable.presentDues) + '</dd></div>' +
            '<div class="info-row"><dt>Clearance request</dt><dd>' + (request ? 'Saved locally · ' + esc(new Date(request.at).toLocaleDateString('en-GB')) : '<span class="muted">Not requested in this </span>') + '</dd></div>' +
          '</div>' +
          (request ? '<div class="form-actions"><button class="btn btn-ghost btn-sm" type="button" data-action="reset-clearance">' + icon('refresh') + 'Reset  request</button><a class="btn btn-soft btn-sm" href="#/payable">' + icon('wallet') + 'Review balance</a></div>' : '<div class="form-actions"><button class="btn btn-accent btn-sm" type="button" data-action="open-clearance">' + icon('send') + 'Start  request</button></div>') +
          '</div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Scope of this page</h2><p>Honest boundaries for the concept build</p></div></div>' +
          '<div class="card-body">' +
            alertBox('info', 'The portal exposes one clearance flag', 'The live page records only the accounts clearance value and outstanding balance. Detailed requirement checklists are not present in the captured data, so this redesign does not invent them.', 'info') +
            '<div class="mini-note">' + icon('shield') + '<span>Official clearance must be issued by the university accounts office. The request action is a local  and sends no data anywhere.</span></div>' +
            '<div class="divider"></div>' +
            '<p class="small muted">What you can do here</p>' +
            '<ul class="security-list mt-2"><li>' + icon('check') + '<span>Review the recorded clearance status and dues.</span></li><li>' + icon('check') + '<span>Open the payable list to see installment deadlines.</span></li><li>' + icon('check') + '<span>Save a local  request to preview the interaction.</span></li></ul>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  function resultsView() {
    const best = completed.reduce(function (top, semester) { return !top || Number(semester.cgpa) > Number(top.cgpa) ? semester : top; }, null);
    const latest = completed[completed.length - 1];
    const reversed = completed.slice().reverse();
    return '<div class="view">' +
      printHead('Academic result · ' + student.name, 'NUB Student Portal · ' + student.id + ' · ' + student.program) +
      pageHead('Result', 'Published semester results, grades and the CGPA story behind them.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print transcript</button>', 'Academics') +
      '<div class="stats-grid">' +
        statCard('Cumulative CGPA', num(D.overall.cgpa, 3), '/ 4.00', 'Across ' + completed.length + ' published semesters', 'award', 'blue') +
        statCard('Best CGPA', num(best ? best.cgpa : 0, 3), '', esc(best ? best.name : 'Not available'), 'sparkles', 'purple') +
        statCard('Total credits', String(D.overall.totalCredit), 'credits', D.transcript.length + ' completed courses', 'graduation', '') +
        statCard('Latest published', latest ? num(latest.cgpa, 3) : '—', '', latest ? latest.name : 'No results', 'chart', 'amber') +
      '</div>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card chart-card"><div class="card-head"><div><h2>CGPA by semester</h2><p>Published results, oldest to newest</p></div>' + chip('Current ' + num(D.overall.cgpa, 3), 'green') + '</div><div class="card-body">' + cgpaChart('Results') + '</div></section>' +
        '<section class="card"><div class="card-head"><div><h2>' + esc(current.name) + '</h2><p>Current semester result status</p></div>' + chip('Not published', 'amber') + '</div><div class="card-body">' + emptyState('clock', 'Results are not published yet', 'The current semester has ' + current.registeredCourses.length + ' registered courses and ' + current.totalCreditTaken + ' credits. Grades will appear after the final assessment is published.', '<a class="btn btn-soft btn-sm" href="#/registration">' + icon('bookOpen') + 'View current courses</a>') + '</div></section>' +
      '</div>' +
      '<section class="section-gap">' +
        '<div class="flex-between flex-wrap section-gap"><div><h2 class="profile-section-title">' + icon('list') + 'Semester results</h2></div>' + chip(completed.length + ' published', 'green') + '</div>' +
        reversed.map(function (semester, index) {
          const courses = semester.resultCourses || [];
          const credits = courses.reduce(function (sum, course) { return sum + Number(course.credit || 0); }, 0);
          return '<details class="details"' + (index === 0 ? ' open' : '') + '><summary><div class="semester-summary"><span class="semester-badge' + (semester.isCurrent ? ' current' : '') + '">S' + semester.semesterNo + '</span><div class="semester-summary-main"><strong>' + esc(semester.name) + '</strong><span>' + esc(semester.registrationId) + ' · ' + esc(semester.registrationType) + ' · ' + num(credits, 1) + ' credits</span></div></div><div class="semester-summary-stats">' + chip('CGPA ' + num(semester.cgpa, 3), 'green') + chip('TGP ' + num(semester.cumulativeTGP, 1), 'blue') + '</div></summary><div class="details-body">' +
            (courses.length ? '<div class="table-wrap flush"><table class="data-table"><thead><tr><th>#</th><th>Course</th><th>Title</th><th class="num">Credit</th><th>Grade</th><th class="num">GP</th><th class="num">TGP</th></tr></thead><tbody>' + courses.map(function (course, courseIndex) {
              return '<tr><td>' + (courseIndex + 1) + '</td><td><span class="course-code ' + courseClass(course.code) + '">' + esc(course.code) + '</span></td><td class="title-cell strong">' + esc(course.title) + '</td><td class="num">' + num(course.credit, 1) + '</td><td><span class="grade ' + gradeClass(course.grade) + '">' + esc(course.grade) + '</span></td><td class="num">' + num(course.gp, 2) + '</td><td class="num">' + num(course.tgp, 2) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '<p class="muted small">No course-level result rows returned.</p>') +
            '<div class="details-grid mt-3"><div><div class="details-label">Cumulative credit</div><div class="details-value">' + num(semester.cumulativeCredit, 0) + '</div></div><div><div class="details-label">Cumulative TGP</div><div class="details-value">' + num(semester.cumulativeTGP, 1) + '</div></div><div><div class="details-label">Semester CGPA</div><div class="details-value">' + num(semester.cgpa, 3) + '</div></div><div><div class="details-label">Published</div><div class="details-value">' + (semester.resultPublished ? 'Yes' : 'No') + '</div></div></div>' +
          '</div></details>';
        }).join('') +
      '</section>' +
    '</div>';
  }

  function credentialsView() {
    return '<div class="view">' +
      pageHead('Request Academic Credential', 'Official letters, transcripts and certificates from the university.', '<a class="btn btn-ghost" href="#/results">' + icon('award') + 'View results</a>', 'Academics') +
      '<section class="card">' +
        '<div class="card-head"><div><h2>Credential requests</h2><p>Document printing requisition</p></div>' + chip('Feature unavailable', 'gray') + '</div>' +
        '<div class="card-body">' + emptyState('graduation', 'Online credential requests are not available here', 'The live portal returns a “feature being developed” page for document printing requisitions. This redesign keeps that boundary visible instead of inventing a request flow.', '<a class="btn btn-soft btn-sm" href="#/results">' + icon('file') + 'View academic transcript</a>') + '</div>' +
      '</section>' +
      '<div class="grid grid-2 section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Available now</h2><p>What you can verify in this portal</p></div></div><div class="card-body"><ul class="security-list"><li>' + icon('check') + '<span>Semester-wise results and grades</span></li><li>' + icon('check') + '<span>Full completed-course transcript</span></li><li>' + icon('check') + '<span>CGPA, credit and TGP totals</span></li><li>' + icon('check') + '<span>Print-friendly transcript view</span></li></ul><a class="btn btn-soft btn-sm mt-3" href="#/results">' + icon('arrowRight') + 'Open results</a></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Official requests</h2><p>How to get a sealed document</p></div>' + chip('Feature unavailable', 'gray') + '</div><div class="card-body">' + alertBox('info', 'Contact the registrar or ICT office', 'Credential issuance, seals and delivery are handled outside this concept build. Use the official NUB portal or your campus office for a binding request.', 'building') + '<div class="mini-note">' + icon('info') + '<span>No credential request is submitted from this portal.</span></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function waiverView() {
    const courseFee = Number(current.payable.costHeads[0] ? current.payable.costHeads[0].costAmount : 54000);
    const discountHead = current.payable.costHeads.find(function (head) { return head.head === 'F/Asst.'; });
    const discount = Number(discountHead ? discountHead.deductiveAmount : 0);
    return '<div class="view">' +
      printHead('Waiver information · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Waiver Info', 'The tuition waiver records returned by the university portal.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button>', 'Finance') +
      '<div class="stats-grid">' +
        statCard('Waiver records', String(D.waivers.length), 'active', 'Returned by the live portal', 'percent', 'purple') +
        statCard('Applied this term', current.payable.waiver + '%', '', 'On the tuition component', 'checkCircle', '') +
        statCard('Discount value', money(discount), '', current.name + ' course fee', 'banknote', 'blue') +
        statCard('Package', current.payable.package, '', 'Cost package ' + current.payable.package, 'layers', 'amber') +
      '</div>' +
      '<div class="rate-grid section-gap">' + D.waivers.map(function (waiver) {
        const isApplied = Number(waiver.percentage) === Number(current.payable.waiver);
        return '<article class="rate-card"><div class="rate-head"><span class="rate-icon">' + icon('percent') + '</span>' + chip(isApplied ? 'Applied now' : 'Active record', isApplied ? 'green' : 'blue') + '</div><strong>' + esc(waiver.percentage) + '% tuition waiver</strong><p>' + esc(waiver.name) + '</p><div class="rate-meta"><span>' + esc(waiver.code) + '</span><span>Active · ' + esc(waiver.active) + '</span></div></article>';
      }).join('') + '</div>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>How the waiver is applied</h2><p>' + esc(current.name) + ' fee calculation</p></div>' + chip(current.payable.waiver + '% waiver', 'green') + '</div><div class="card-body"><div class="fee-calc">' +
          '<div class="fee-calc-row"><span>Tuition · ' + current.totalCreditTaken + ' credits × ' + money(current.payable.perCreditFee) + '</span><strong>' + money(courseFee) + '</strong></div>' +
          '<div class="fee-calc-row discount"><span>Waiver discount · ' + current.payable.waiver + '%</span><strong>−' + money(discount) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Semester fee</span><strong>' + money(5000) + '</strong></div>' +
          '<div class="fee-calc-row total"><span>Payable this semester</span><strong>' + money(current.payable.charge) + '</strong></div>' +
        '</div><div class="mini-note">' + icon('info') + '<span>The portal returns both a 70% and a 40% waiver record. Only the 70% waiver is reflected in the Fall 2026 cost calculation; this  does not assume the records stack.</span></div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Waiver records</h2><p>Copy a code or reference</p></div></div><div class="card-body"><div class="info-list">' +
          D.waivers.map(function (waiver) {
            return '<div class="info-row"><dt>' + esc(waiver.percentage) + '% waiver</dt><dd>' + esc(waiver.code) + '<button class="copy-btn" type="button" data-action="copy" data-copy="' + esc(waiver.code) + '" aria-label="Copy ' + esc(waiver.code) + '">' + icon('copy') + '</button></dd></div>';
          }).join('') +
          '<div class="info-row"><dt>Applied in fee calculation</dt><dd>' + esc(current.payable.waiver) + '%</dd></div>' +
          '<div class="info-row"><dt>Current payable</dt><dd>' + money(25200) + '</dd></div>' +
        '</div><div class="form-actions"><a class="btn btn-soft btn-sm" href="#/cost-package">' + icon('layers') + 'Cost package</a><a class="btn btn-ghost btn-sm" href="#/payable">' + icon('wallet') + 'Payable list</a></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function costPackageView() {
    const courseFee = Number(current.payable.costHeads[0] ? current.payable.costHeads[0].costAmount : 54000);
    const discountHead = current.payable.costHeads.find(function (head) { return head.head === 'F/Asst.'; });
    const discount = Number(discountHead ? discountHead.deductiveAmount : 0);
    return '<div class="view">' +
      printHead('Cost package · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Cost Package', 'The tuition package and rates attached to your student record.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button><a class="btn btn-primary" href="#/payable">' + icon('wallet') + 'Payable list</a>', 'Finance') +
      '<div class="stats-grid">' +
        statCard('Package code', D.costPackage['Package Code'], '', 'Active · ' + D.costPackage.Currency, 'layers', 'blue') +
        statCard('Per-credit fee', money(current.payable.perCreditFee), '', current.totalCreditTaken + ' credits this semester', 'banknote', '') +
        statCard('Semester fee', money(5000), '', 'Charged each semester', 'calendar', 'amber') +
        statCard('Current payable', money(25200), '', current.payable.waiver + '% waiver applied', 'wallet', 'purple') +
      '</div>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Package rates</h2><p>Fee heads returned by the portal</p></div>' + chip('Package ' + D.costPackage['Serial Number'], 'green') + '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Fee head</th><th>Frequency</th><th class="num">Amount</th></tr></thead><tbody>' + D.costPackage.rates.map(function (rate) {
          return '<tr><td class="strong">' + esc(rate.head) + '</td><td>' + esc(rate.frequency) + '</td><td class="num">' + money(rate.amount) + '</td></tr>';
        }).join('') + '</tbody></table></div><div class="card-body"><div class="mini-note">' + icon('info') + '<span>One-time charges from the package are not added again to the current semester ledger.</span></div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>' + esc(current.name) + ' estimate</h2><p>Based on your registered credits</p></div></div><div class="card-body"><div class="fee-calc">' +
          '<div class="fee-calc-row"><span>Tuition · ' + current.totalCreditTaken + ' × ' + money(current.payable.perCreditFee) + '</span><strong>' + money(courseFee) + '</strong></div>' +
          '<div class="fee-calc-row discount"><span>Waiver · ' + current.payable.waiver + '%</span><strong>−' + money(discount) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Semester fee</span><strong>' + money(5000) + '</strong></div>' +
          '<div class="fee-calc-row total"><span>Total payable</span><strong>' + money(current.payable.charge) + '</strong></div>' +
        '</div><div class="form-actions"><a class="btn btn-soft btn-sm" href="#/waiver">' + icon('percent') + 'Waiver details</a><a class="btn btn-ghost btn-sm" href="#/payments">' + icon('receipt') + 'Payments</a></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function payableView() {
    return '<div class="view">' +
      printHead('Payable list · ' + current.name, 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Payable List', 'What is due now, how it splits into installments and when each date lands.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button><a class="btn btn-primary" href="#/payments">' + icon('receipt') + 'Payment history</a>', 'Finance') +
      (current.payable.presentDues > 0 ? alertBox('danger', 'First installment is overdue', 'The ' + money(current.payable.installments.first) + ' first installment was due on 20 Oct 2026. The remaining balance is ' + money(current.payable.presentDues) + '.', 'alertTriangle') : alertBox('success', 'No outstanding balance', 'The current semester ledger shows no dues.', 'checkCircle')) +
      '<div class="stats-grid section-gap">' +
        statCard('Total payable', money(current.payable.charge), '', 'Before any payments', 'file', 'blue') +
        statCard('Received', money(current.payable.received), '', 'Current semester', 'checkCircle', '') +
        statCard('Present dues', money(current.payable.presentDues), '', 'Includes previous balance ' + money(current.payable.previousDues), 'wallet', 'red') +
        statCard('Installments', '3', 'parts', '40% · 30% · 30%', 'calendar', 'amber') +
      '</div>' +
      '<section class="card section-gap"><div class="card-head"><div><h2>Installment schedule</h2><p>' + esc(current.name) + ' payment plan</p></div>' + chip('Accounts pending', 'amber') + '</div><div class="card-body"><div class="installment-grid">' + dueInstallments().map(function (item) {
        const status = installmentState(item.date);
        return '<article class="installment-card ' + status.card + '"><div class="inst-top"><span>' + esc(item.label) + '</span>' + chip(status.label, status.tone) + '</div><strong>' + money(item.amount) + '</strong><small>' + icon('calendar') + 'Due ' + esc(displayDate(item.date)) + '</small><div class="progress ' + (status.card === 'overdue' ? 'amber' : '') + '"><i style="width:' + (status.card === 'overdue' ? '100' : '0') + '%"></i></div></article>';
      }).join('') + '</div><div class="mini-note">' + icon('info') + '<span>Installment status is evaluated against 23 Oct 2026, the date of the portal data snapshot.</span></div></div></section>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Fee breakdown</h2><p>Current semester cost heads</p></div>' + chip('Waiver ' + current.payable.waiver + '%', 'green') + '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Cost head</th><th class="num">Credits</th><th class="num">Cost</th><th class="num">Deduction</th><th class="num">Net</th></tr></thead><tbody>' + current.payable.costHeads.map(function (head) {
          return '<tr><td class="strong">' + esc(head.head) + '</td><td class="num">' + esc(head.creditTaken) + '</td><td class="num">' + money(head.costAmount) + '</td><td class="num">' + money(head.deductiveAmount) + '</td><td class="num strong">' + money(Number(head.costAmount) - Number(head.deductiveAmount)) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="4">Total payable</td><td class="num">' + money(current.payable.charge) + '</td></tr></tfoot></table></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Payment snapshot</h2><p>Recorded by the university</p></div></div><div class="card-body"><div class="fee-calc">' +
          '<div class="fee-calc-row"><span>Current semester</span><strong>' + esc(current.name) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Total paid this term</span><strong>' + money(current.payable.received) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Previous dues</span><strong>' + money(current.payable.previousDues) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Lifetime paid</span><strong>' + money(D.financeTotal.paid) + '</strong></div>' +
          '<div class="fee-calc-row total"><span>Present dues</span><strong>' + money(current.payable.presentDues) + '</strong></div>' +
        '</div><div class="form-actions"><a class="btn btn-soft btn-sm" href="#/finance-details">' + icon('list') + 'Ledger details</a><a class="btn btn-ghost btn-sm" href="#/clearance">' + icon('shield') + 'Clearance</a></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function paymentsView() {
    const latest = D.payments[D.payments.length - 1];
    const uniqueSemesters = new Set(D.payments.map(function (payment) { return payment.semester; })).size;
    const sorted = D.payments.slice().reverse();
    return '<div class="view">' +
      printHead('Payment history', 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Payment Information', 'Receipts, dates and every payment recorded on your account.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button><a class="btn btn-primary" href="#/payable">' + icon('wallet') + 'Payable list</a>', 'Finance') +
      '<div class="stats-grid">' +
        statCard('Lifetime paid', money(D.financeTotal.paid), '', D.payments.length + ' receipts', 'banknote', '') +
        statCard('Payments recorded', String(D.payments.length), 'receipts', uniqueSemesters + ' semesters covered', 'receipt', 'blue') +
        statCard('Latest payment', latest ? money(latest.amount) : '—', '', latest ? displayDate(latest.date) + ' · ' + latest.semester : 'No payments', 'calendarCheck', 'purple') +
        statCard('Current dues', money(D.financeTotal.dues), '', 'No payment for ' + current.name, 'wallet', 'red') +
      '</div>' +
      (current.payable.received === 0 ? '<div class="section-gap">' + alertBox('warning', 'No payment received for ' + current.name, 'The current semester ledger shows ' + money(current.payable.presentDues) + ' outstanding. The first installment date has already passed.', 'alertTriangle') + '</div>' : '') +
      '<section class="card section-gap">' +
        '<div class="card-head"><div><h2>Payment history</h2><p>Newest first · all amounts in Taka</p></div>' + chip('Total ' + money(D.financeTotal.paid), 'green') + '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Semester</th><th>Date</th><th>Receipt</th><th class="num">Amount</th><th>Currency</th></tr></thead><tbody>' + sorted.map(function (payment) {
          return '<tr><td>' + payment.serial + '</td><td class="strong">' + esc(payment.semester) + '</td><td>' + esc(displayDate(payment.date)) + '</td><td>' + esc(payment.receipt) + '<button class="copy-btn" type="button" data-action="copy" data-copy="' + esc(payment.receipt) + '" aria-label="Copy receipt ' + esc(payment.receipt) + '">' + icon('copy') + '</button></td><td class="num strong">' + money(payment.amount) + '</td><td>' + esc(payment.currency) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="4">Total recorded</td><td class="num">' + money(D.financeTotal.paid) + '</td><td></td></tr></tfoot></table></div>' +
      '</section>' +
      '<div class="grid grid-2 section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>' + esc(current.name) + '</h2><p>Current payment status</p></div>' + chip('Unpaid', 'red') + '</div><div class="card-body"><div class="fee-calc">' +
          '<div class="fee-calc-row"><span>Total payable</span><strong>' + money(current.payable.charge) + '</strong></div>' +
          '<div class="fee-calc-row"><span>Received</span><strong>' + money(current.payable.received) + '</strong></div>' +
          '<div class="fee-calc-row total"><span>Present dues</span><strong>' + money(current.payable.presentDues) + '</strong></div>' +
        '</div><a class="btn btn-soft btn-sm mt-3" href="#/payable">' + icon('calendar') + 'View installments</a></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Payment note</h2><p>Payment boundary</p></div></div><div class="card-body">' + alertBox('info', 'No online payment in this concept', 'This build displays the university’s recorded payments only. It does not connect to a payment gateway or store card details.', 'shield') + '<div class="mini-note">' + icon('receipt') + '<span>Receipt numbers are preserved exactly as returned by the source portal.</span></div></div></section>' +
      '</div>' +
    '</div>';
  }

  function financeBarChart() {
    const max = Math.max.apply(null, D.financeSummary.map(function (item) { return Math.max(Number(item.paid), Number(item.payable)); }).concat([1]));
    return '<div class="bar-chart">' + D.financeSummary.map(function (item) {
      const paid = Math.max(0, Number(item.paid));
      const dues = Math.max(0, Number(item.dues));
      const paidHeight = (paid / max) * 100;
      const duesHeight = (dues / max) * 100;
      return '<div class="bar-item" title="' + esc(item.semester + ' · paid ' + money(item.paid) + ' · dues ' + money(item.dues)) + '"><div class="bar-track"><i class="bar-fill paid" style="height:' + paidHeight.toFixed(1) + '%"></i><i class="bar-fill due" style="height:' + duesHeight.toFixed(1) + '%"></i></div><span>' + esc(shortSemester(item.semester)) + '</span></div>';
    }).join('') + '</div>' +
    '<div class="chart-meta"><span class="chart-meta-item"><span class="legend-dot green"></span>Paid</span><span class="chart-meta-item"><span class="legend-dot red"></span>Dues</span><span class="chart-meta-item"><strong>' + money(D.financeTotal.paid) + '</strong> total collected</span></div>';
  }

  function financeSummaryView() {
    return '<div class="view">' +
      printHead('Financial summary', 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Financial Summary', 'A semester-by-semester view of what was billed and what was paid.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button><a class="btn btn-primary" href="#/finance-details">' + icon('list') + 'Ledger details</a>', 'Finance') +
      '<div class="stats-grid">' +
        statCard('Total payable', money(D.grandTotal.cost), '', D.financeSummary.length + ' semesters', 'file', 'blue') +
        statCard('Total paid', money(D.grandTotal.paid), '', 'Lifetime receipts', 'banknote', '') +
        statCard('Outstanding', money(D.grandTotal.dues), '', 'As of 23 Oct 2026', 'wallet', 'red') +
        statCard('Collection rate', (D.grandTotal.cost ? (D.grandTotal.paid / D.grandTotal.cost) * 100 : 0).toFixed(1) + '%', '', 'Across all semesters', 'pie', 'purple') +
      '</div>' +
      '<section class="card section-gap"><div class="card-head"><div><h2>Paid vs billed</h2><p>Every semester, from Fall 2023 to Fall 2026</p></div>' + chip('All semesters', 'gray') + '</div><div class="card-body">' + financeBarChart() + '</div></section>' +
      '<section class="card section-gap"><div class="card-head"><div><h2>Semester ledger</h2><p>Payable, paid and cumulative dues</p></div>' + chip('Snapshot', 'blue') + '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Semester</th><th class="num">Payable</th><th class="num">Paid</th><th class="num">Dues</th><th class="num">Cumulative</th><th>Status</th></tr></thead><tbody>' + D.financeSummary.map(function (item) {
        const status = Number(item.dues) > 0 ? 'Due' : Number(item.dues) < 0 ? 'Credit' : 'Settled';
        const tone = status === 'Due' ? 'red' : status === 'Credit' ? 'blue' : 'green';
        return '<tr><td class="strong">' + esc(item.semester) + '</td><td class="num">' + money(item.payable) + '</td><td class="num">' + money(item.paid) + '</td><td class="num">' + money(item.dues) + '</td><td class="num">' + money(item.cumulativeDues) + '</td><td>' + chip(status, tone) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>Total</td><td class="num">' + money(D.financeTotal.payable) + '</td><td class="num">' + money(D.financeTotal.paid) + '</td><td class="num">' + money(D.financeTotal.dues) + '</td><td></td><td></td></tr></tfoot></table></div></section>' +
    '</div>';
  }

  function financeDetailsView() {
    const semesters = D.semesters.slice().reverse();
    return '<div class="view">' +
      printHead('Financial details', 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      pageHead('Financial Details', 'The full ledger: cost heads, deductions, payments and receipts.', '<button class="btn btn-ghost" type="button" data-action="print">' + icon('printer') + 'Print</button><a class="btn btn-primary" href="#/payments">' + icon('receipt') + 'Payments</a>', 'Finance') +
      '<div class="stats-grid">' +
        statCard('Total cost', money(D.financeTotal.payable), '', 'All semesters', 'file', 'blue') +
        statCard('Total paid', money(D.financeTotal.paid), '', D.payments.length + ' receipts', 'banknote', '') +
        statCard('Total dues', money(D.financeTotal.dues), '', 'Current outstanding', 'wallet', 'red') +
        statCard('Semesters', String(D.semesters.length), 'records', 'Fall 2023 to Fall 2026', 'calendar', 'purple') +
      '</div>' +
      '<section class="section-gap">' + semesters.map(function (semester, index) {
        const detail = semester.financeDetail || { rows: [], payments: [] };
        const open = index === 0 ? ' open' : '';
        return '<details class="details"' + open + '><summary><div class="semester-summary"><span class="semester-badge' + (semester.isCurrent ? ' current' : '') + '">S' + semester.semesterNo + '</span><div class="semester-summary-main"><strong>' + esc(semester.name) + '</strong><span>' + esc(semester.registrationId) + ' · ' + esc(semester.registrationType) + '</span></div></div><div class="semester-summary-stats">' + chip('Paid ' + money(detail.totalPaid), 'green') + chip(Number(detail.dues) > 0 ? 'Due ' + money(detail.dues) : 'Settled', Number(detail.dues) > 0 ? 'red' : 'green') + '</div></summary><div class="details-body">' +
          '<div class="table-wrap flush"><table class="data-table"><thead><tr><th>Cost head</th><th class="num">Cost</th><th class="num">Deduction</th><th class="num">Payable</th><th>Payment date</th><th>Receipt</th><th class="num">Paid</th></tr></thead><tbody>' + (detail.rows.length ? detail.rows.map(function (row) {
            return '<tr><td class="strong">' + esc(row.head) + '</td><td class="num">' + money(row.cost) + '</td><td class="num">' + money(row.deduction) + '</td><td class="num">' + money(row.payable) + '</td><td>' + (row.paymentDate ? esc(displayDate(row.paymentDate)) : '<span class="muted">—</span>') + '</td><td>' + (row.receipt ? esc(row.receipt) : '<span class="muted">—</span>') + '</td><td class="num">' + (row.paid === null ? '<span class="muted">—</span>' : money(row.paid)) + '</td></tr>';
          }).join('') : '<tr><td colspan="7" class="muted">No ledger rows returned.</td></tr>') + '</tbody></table></div>' +
          '<div class="details-grid mt-3"><div><div class="details-label">Total cost</div><div class="details-value">' + money(detail.totalCost) + '</div></div><div><div class="details-label">Total paid</div><div class="details-value">' + money(detail.totalPaid) + '</div></div><div><div class="details-label">Dues</div><div class="details-value">' + money(detail.dues) + '</div></div><div><div class="details-label">Payments</div><div class="details-value">' + detail.payments.length + ' receipt' + (detail.payments.length === 1 ? '' : 's') + '</div></div></div>' +
          (detail.payments.length ? '<div class="divider"></div><p class="details-label">Receipts</p><div class="info-list">' + detail.payments.map(function (payment) {
            return '<div class="info-row"><dt>' + esc(displayDate(payment.date)) + ' · ' + esc(payment.receipt) + '</dt><dd>' + money(payment.amount) + '</dd></div>';
          }).join('') + '</div>' : '') +
        '</div></details>';
      }).join('') + '</section>' +
    '</div>';
  }

  function sensitiveValue(value) {
    if (!value) return '<span class="muted">Not provided</span>';
    if (state.revealSensitive) return esc(value);
    const compact = String(value).replace(/\s+/g, '');
    return '•••••• ' + esc(compact.slice(-4));
  }

  function addressLine(parts) {
    return parts.filter(Boolean).map(esc).join(', ');
  }

  function profileView() {
    const present = addressLine([student.presentAddress, student.presentThana, student.presentDistrict, student.presentDivision, student.presentCountry]);
    const permanent = addressLine([student.permanentAddress, student.permanentThana, student.permanentDistrict, student.permanentDivision, student.permanentCountry]);
    return '<div class="view">' +
      printHead('Student profile', 'NUB Student Portal · ' + student.name + ' · ' + student.id) +
      '<section class="profile-hero">' +
        '<div class="profile-cover"></div>' +
        '<div class="profile-body">' +
          '<div class="profile-avatar"><img src="' + esc(student.photo) + '" alt="' + esc(student.name) + '"></div>' +
          '<div class="profile-title-row"><div><h1>' + esc(student.name) + '</h1><p>' + esc(student.program) + '</p><div class="profile-chips">' + chip(student.id, 'blue') + chip(student.academicStatus, student.academicStatus === 'Running' ? 'green' : 'amber') + chip(current.name + ' · Semester ' + current.semesterNo, 'gray') + chip(student.campus, 'purple') + '</div></div>' +
            '<div class="page-actions"><button class="btn btn-ghost btn-sm" type="button" data-action="reveal-sensitive">' + icon(state.revealSensitive ? 'eyeOff' : 'eye') + (state.revealSensitive ? 'Hide sensitive' : 'Reveal sensitive') + '</button><a class="btn btn-ghost btn-sm" href="#/profile/edit">' + icon('edit') + 'Edit profile</a><button class="btn btn-soft btn-sm" type="button" data-action="print">' + icon('printer') + 'Print</button></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="grid grid-2 section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Personal information</h2><p>Official student record</p></div>' + chip(student.gender, 'gray') + '</div><div class="card-body"><div class="info-list">' +
          '<div class="info-row"><dt>Student ID</dt><dd>' + esc(student.id) + '</dd></div>' +
          '<div class="info-row"><dt>Date of birth</dt><dd>' + esc(student.dob || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Gender</dt><dd>' + esc(student.gender || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Religion</dt><dd>' + esc(student.religion || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Phone</dt><dd>' + sensitiveValue(student.phone) + '</dd></div>' +
          '<div class="info-row"><dt>Email</dt><dd>' + esc(student.email) + ' ' + (student.emailVerified ? chip('Verified', 'green') : chip('Unverified', 'amber')) + '</dd></div>' +
          '<div class="info-row"><dt>National ID</dt><dd>' + sensitiveValue(student.nationalId) + '</dd></div>' +
          '<div class="info-row"><dt>Birth certificate</dt><dd>' + sensitiveValue(student.birthCertificate) + '</dd></div>' +
          '<div class="info-row"><dt>Passport</dt><dd>' + sensitiveValue(student.passportNo) + '</dd></div>' +
        '</div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Contact &amp; address</h2><p>How the university reaches you</p></div></div><div class="card-body"><div class="info-list">' +
          '<div class="info-row"><dt>Present address</dt><dd>' + (present || '<span class="muted">Not provided</span>') + '</dd></div>' +
          '<div class="info-row"><dt>Permanent address</dt><dd>' + (permanent || '<span class="muted">Not provided</span>') + '</dd></div>' +
          '<div class="info-row"><dt>Present district</dt><dd>' + esc(student.presentDistrict || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Permanent district</dt><dd>' + esc(student.permanentDistrict || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Present division</dt><dd>' + esc(student.presentDivision || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Permanent division</dt><dd>' + esc(student.permanentDivision || 'Not provided') + '</dd></div>' +
        '</div><div class="mini-note">' + icon('shield') + '<span>Phone and birth certificate are masked by default. Use “Reveal sensitive” to show them on this device.</span></div></div></section>' +
      '</div>' +
      '<div class="grid grid-main section-gap">' +
        '<section class="card"><div class="card-head"><div><h2>Academic record</h2><p>Programme and standing</p></div><a class="link" href="#/results">Results</a></div><div class="card-body"><div class="grid grid-2"><div class="info-list">' +
          '<div class="info-row"><dt>Programme</dt><dd>' + esc(student.program) + '</dd></div>' +
          '<div class="info-row"><dt>Programme type</dt><dd>' + esc(student.programType) + '</dd></div>' +
          '<div class="info-row"><dt>Campus</dt><dd>' + esc(student.campus) + '</dd></div>' +
          '<div class="info-row"><dt>Admission semester</dt><dd>' + esc(student.admissionSemester) + '</dd></div>' +
        '</div><div class="info-list">' +
          '<div class="info-row"><dt>Academic status</dt><dd>' + esc(student.academicStatus) + '</dd></div>' +
          '<div class="info-row"><dt>Cumulative CGPA</dt><dd>' + num(D.overall.cgpa, 3) + '</dd></div>' +
          '<div class="info-row"><dt>Credits completed</dt><dd>' + D.overall.totalCredit + '</dd></div>' +
          '<div class="info-row"><dt>Credit transferred</dt><dd>' + esc(student.creditTransferred || 'No') + '</dd></div>' +
        '</div></div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Family</h2><p>Guardian details on record</p></div></div><div class="card-body"><div class="info-list">' +
          '<div class="info-row"><dt>Father</dt><dd>' + esc(student.father || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Mother</dt><dd>' + esc(student.mother || 'Not provided') + '</dd></div>' +
          '<div class="info-row"><dt>Email verified</dt><dd>' + (student.emailVerified ? 'Yes' : 'No') + '</dd></div>' +
        '</div><div class="form-actions"><a class="btn btn-soft btn-sm" href="#/profile/edit">' + icon('edit') + 'Update contact details</a></div></div></section>' +
      '</div>' +
      '<section class="card section-gap"><div class="card-head"><div><h2>Education</h2><p>Previous academic record</p></div>' + chip(student.education.length + ' records', 'gray') + '</div><div class="card-body"><div class="grid grid-2">' + student.education.map(function (education) {
        return '<article class="edu-card"><div class="edu-top"><span class="edu-degree">' + esc(education.level) + ' · ' + esc(education.concentration) + '</span>' + chip('Result ' + education.result, Number(education.result) >= 4 ? 'green' : 'blue') + '</div><p class="edu-institute">' + esc(education.institute) + '</p><div class="edu-meta"><span><strong>Board</strong> ' + esc(education.board) + '</span><span><strong>Passing year</strong> ' + esc(education.passingYear) + '</span><span><strong>Exam</strong> ' + esc(education.exam) + '</span></div></article>';
      }).join('') + '</div></div></section>' +
    '</div>';
  }

  function profileEditView() {
    return '<div class="view">' +
      pageHead('Edit Profile', 'Update the contact details that the university uses to reach you.', '<a class="btn btn-ghost" href="#/profile">' + icon('arrowLeft') + 'Back to profile</a>', 'Account') +
      '<div class="password-layout">' +
        '<section class="card password-card"><h2>Contact and address</h2><p>Changes are stored locally in this concept build.</p>' +
          '<form id="profileForm" class="mt-3" novalidate><div class="form-grid">' +
            '<div class="form-field"><label for="editPhone">Phone <span class="req">*</span></label><input id="editPhone" name="phone" type="tel" value="' + esc(student.phone) + '" required></div>' +
            '<div class="form-field"><label for="editEmail">Email <span class="req">*</span></label><input id="editEmail" name="email" type="email" value="' + esc(student.email) + '" required></div>' +
            '<div class="form-field full"><label for="editPresentAddress">Present address</label><input id="editPresentAddress" name="presentAddress" type="text" value="' + esc(student.presentAddress) + '"></div>' +
            '<div class="form-field"><label for="editPresentThana">Present thana</label><input id="editPresentThana" name="presentThana" type="text" value="' + esc(student.presentThana) + '"></div>' +
            '<div class="form-field"><label for="editPresentDistrict">Present district</label><input id="editPresentDistrict" name="presentDistrict" type="text" value="' + esc(student.presentDistrict) + '"></div>' +
            '<div class="form-field full"><label for="editPermanentAddress">Permanent address</label><input id="editPermanentAddress" name="permanentAddress" type="text" value="' + esc(student.permanentAddress) + '"></div>' +
            '<div class="form-field"><label for="editPermanentThana">Permanent thana</label><input id="editPermanentThana" name="permanentThana" type="text" value="' + esc(student.permanentThana) + '"></div>' +
            '<div class="form-field"><label for="editPermanentDistrict">Permanent district</label><input id="editPermanentDistrict" name="permanentDistrict" type="text" value="' + esc(student.permanentDistrict) + '"></div>' +
          '</div><p class="form-error" id="profileError" hidden>' + icon('alert') + '<span></span></p><div class="form-actions"><button class="btn btn-accent" type="submit">' + icon('check') + 'Save local changes</button><button class="btn btn-ghost" type="button" data-action="reset-profile">' + icon('refresh') + 'Reset saved changes</button></div></form>' +
          '<div class="mini-note">' + icon('info') + '<span> Changes are saved in this browser only and are not transmitted to NUB.</span></div>' +
        '</section>' +
        '<section class="card password-card"><h2>Official record</h2><p>Locked fields come from the university portal.</p><div class="info-list mt-3">' +
          '<div class="info-row"><dt>Student ID</dt><dd>' + esc(student.id) + '</dd></div>' +
          '<div class="info-row"><dt>Name</dt><dd>' + esc(student.name) + '</dd></div>' +
          '<div class="info-row"><dt>Programme</dt><dd>' + esc(student.program) + '</dd></div>' +
          '<div class="info-row"><dt>Campus</dt><dd>' + esc(student.campus) + '</dd></div>' +
          '<div class="info-row"><dt>Date of birth</dt><dd>' + esc(student.dob) + '</dd></div>' +
          '<div class="info-row"><dt>Admission</dt><dd>' + esc(student.admissionSemester) + '</dd></div>' +
        '</div>' + alertBox('info', 'Name and programme changes need the registrar', 'Those fields are locked here because the official portal does not expose them for self-service editing.', 'building') + '</section>' +
      '</div>' +
    '</div>';
  }

  function passwordView() {
    return '<div class="view">' +
      pageHead('Change Password', 'Keep your student account secure with a strong, unique password.', '<a class="btn btn-ghost" href="#/profile">' + icon('user') + 'Back to profile</a>', 'Account') +
      '<div class="password-layout">' +
        '<section class="card password-card"><h2>Update your password</h2><p>This concept nstrates the interaction only — nothing is changed.</p>' +
          '<form id="passwordForm" class="mt-3" novalidate><div class="form-grid">' +
            '<div class="form-field full"><label for="currentPassword">Current password <span class="req">*</span></label><input id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" required></div>' +
            '<div class="form-field full"><label for="newPassword">New password <span class="req">*</span></label><input id="newPassword" name="newPassword" type="password" autocomplete="new-password" required><div class="strength"><div class="strength-bar" id="strengthBar"><i></i><i></i><i></i><i></i></div><span class="strength-text" id="strengthText">Use at least 8 characters with a mix of letters, numbers and symbols.</span></div></div>' +
            '<div class="form-field full"><label for="confirmPassword">Confirm new password <span class="req">*</span></label><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required></div>' +
          '</div><p class="form-error" id="passwordError" hidden>' + icon('alert') + '<span></span></p><div class="form-actions"><button class="btn btn-accent" type="submit">' + icon('lock') + 'Update password</button></div></form>' +
          alertBox('info', 'Concept only', 'The real portal password is never requested or stored by this build.', 'shield') +
        '</section>' +
        '<section class="card password-card"><h2>Security checklist</h2><p>Habits that protect your account.</p><ul class="security-list mt-3"><li>' + icon('check') + '<span>Use a unique password that you do not use on other sites.</span></li><li>' + icon('check') + '<span>Aim for at least 8 characters with upper and lowercase letters.</span></li><li>' + icon('check') + '<span>Add a number and a symbol for extra strength.</span></li><li>' + icon('check') + '<span>Never share your password or an OTP with anyone.</span></li><li>' + icon('check') + '<span>Sign out on shared computers.</span></li></ul>' +
          '<div class="divider"></div><p class="small muted">Need help?</p><p class="small muted mt-2">Contact your campus ICT office if you cannot access your account.</p></section>' +
      '</div>' +
    '</div>';
  }

  function notFoundView() {
    return '<div class="view">' +
      pageHead('Page not found', 'That page is not part of the portal map.', '<a class="btn btn-primary" href="#/dashboard">' + icon('grid') + 'Back to dashboard</a>', 'Portal') +
      '<section class="card">' + emptyState('alert', 'This page does not exist', 'The link may be outdated, or the section is not available in this concept build. Use search to jump to any page in the portal.', '<button class="btn btn-soft btn-sm" type="button" data-action="open-search">' + icon('search') + 'Search pages</button><a class="btn btn-ghost btn-sm" href="#/dashboard">' + icon('grid') + 'Dashboard</a>') + '</section>' +
    '</div>';
  }

  function openClearanceModal() {
    openModal({
      title: 'Clearance request',
      subtitle: current.name + ' · ' + student.id,
      body: '<form id="clearanceForm" novalidate>' +
        alertBox('info', 'Local preview only', 'This does not send anything to NUB. It saves a  request in this browser so you can see the completed state.', 'shield') +
        '<div class="form-field mt-3"><label for="clearanceReason">Reason</label><select id="clearanceReason" name="reason"><option>Reviewing outstanding dues</option><option>Clarifying my clearance status</option><option>Assessment preparation</option><option>Other</option></select></div>' +
        '<div class="form-field mt-3"><label for="clearanceNote">Note (optional)</label><textarea id="clearanceNote" name="note" placeholder="Add a short note for this  request"></textarea></div>' +
        '<div class="mini-note">' + icon('info') + '<span>The official accounts clearance remains “' + esc(current.accountsClearance) + '” until the university updates it.</span></div>' +
      '</form>',
      footer: '<button class="btn btn-ghost" type="button" data-modal-close>Cancel</button><button class="btn btn-accent" type="submit" form="clearanceForm">' + icon('send') + 'Save  request</button>'
    });
  }

  function updateStrength(value) {
    const bars = $$('#strengthBar i');
    const text = $('#strengthText');
    if (!bars.length || !text) return;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const level = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
    const labels = {
      weak: 'Weak password. Add length, mixed case, a number or a symbol.',
      fair: 'Fair password. A few more character types would help.',
      good: 'Good password. Keep going for a stronger result.',
      strong: 'Strong password. This pattern is hard to guess.'
    };
    bars.forEach(function (bar, index) {
      bar.className = index < score ? 'on ' + level : '';
    });
    text.textContent = value ? labels[level] : 'Use at least 8 characters with a mix of letters, numbers and symbols.';
  }

  function showFormError(id, message) {
    const box = $('#' + id);
    if (!box) return;
    const text = box.querySelector('span');
    if (text) text.textContent = message;
    box.hidden = false;
  }

  function hideFormError(id) {
    const box = $('#' + id);
    if (box) box.hidden = true;
  }

  function saveClearanceRequest(data) {
    try {
      const requests = clearanceRequests();
      requests[current.name] = data;
      localStorage.setItem(CLEARANCE_KEY, JSON.stringify(requests));
    } catch (err) {
      showToast('Could not save', 'Browser storage is unavailable.', 'warning');
    }
  }

  function resetClearanceRequest() {
    try {
      const requests = clearanceRequests();
      delete requests[current.name];
      localStorage.setItem(CLEARANCE_KEY, JSON.stringify(requests));
    } catch (err) {
      void err;
    }
    showToast('Clearance request cleared', 'The official clearance status is unchanged.', 'info');
    render();
  }

  function resetProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (err) {
      void err;
    }
    Object.keys(ORIGINAL_STUDENT).forEach(function (key) {
      student[key] = ORIGINAL_STUDENT[key];
    });
    showToast('Profile changes reset', 'The contact details now match the original portal record.', 'info');
    render();
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      void err;
    }
    window.location.replace('index.html');
  }

  const VIEWS = {
    dashboard: dashboardView,
    notifications: notificationsView,
    schedule: scheduleView,
    registration: registrationView,
    routine: routineView,
    ter: terView,
    clearance: clearanceView,
    results: resultsView,
    credentials: credentialsView,
    'course-structure': courseStructureView,
    waiver: waiverView,
    'cost-package': costPackageView,
    payable: payableView,
    payments: paymentsView,
    'finance-summary': financeSummaryView,
    'finance-details': financeDetailsView,
    profile: profileView,
    'profile-edit': profileEditView,
    password: passwordView,
    notfound: notFoundView
  };

  function render() {
    state.route = routeId();
    renderSidebar(state.route);
    renderTop(state.route);
    let html = '';
    try {
      html = (VIEWS[state.route] || notFoundView)();
    } catch (err) {
      console.error(err);
      html = '<div class="view">' + pageHead('Something went wrong', 'This page could not be rendered.', '<a class="btn btn-primary" href="#/dashboard">Back to dashboard</a>', 'Portal') + '<section class="card"><div class="card-body">' + alertBox('danger', 'Render error', 'A page component failed to load. Try the dashboard or reload the portal.', 'alertTriangle') + '</div></section></div>';
    }
    const target = $('#view');
    if (target) target.innerHTML = html;
    closeDropdowns();
    closeSidebar();
    window.scrollTo(0, 0);
  }

  $('#menuBtn').addEventListener('click', openSidebar);
  $('#sidebarClose').addEventListener('click', closeSidebar);
  $('#scrim').addEventListener('click', closeSidebar);
  $('#searchTrigger').addEventListener('click', openPalette);
  $('#notifBtn').addEventListener('click', function () { toggleDropdown('notifDropdown', this); });
  $('#profileBtn').addEventListener('click', function () { toggleDropdown('profileDropdown', this); });
  $('#logoutBtn').addEventListener('click', logout);

  document.addEventListener('click', function (event) {
    const close = event.target.closest('[data-modal-close]');
    if (close) {
      closeModal();
      return;
    }
    if (event.target.id === 'modalRoot') {
      closeModal();
      return;
    }
    if (event.target.id === 'palette') {
      closePalette();
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-action');
      if (action === 'print') {
        event.preventDefault();
        window.print();
      } else if (action === 'copy') {
        event.preventDefault();
        copyText(actionEl.getAttribute('data-copy'));
      } else if (action === 'open-clearance') {
        event.preventDefault();
        openClearanceModal();
      } else if (action === 'reset-clearance') {
        event.preventDefault();
        resetClearanceRequest();
      } else if (action === 'reveal-sensitive') {
        event.preventDefault();
        state.revealSensitive = !state.revealSensitive;
        render();
      } else if (action === 'logout') {
        event.preventDefault();
        logout();
      } else if (action === 'reset-profile') {
        event.preventDefault();
        resetProfile();
      } else if (action === 'open-search') {
        event.preventDefault();
        openPalette();
      }
    }

    const paletteItem = event.target.closest('.palette-item');
    if (paletteItem) {
      closePalette();
    }

    if (!event.target.closest('.notif-wrap') && !event.target.closest('.profile-wrap')) {
      closeDropdowns();
    }

    const navLink = event.target.closest('.nav-item');
    if (navLink) {
      closeSidebar();
    }
  });

  $('#notifDropdown').addEventListener('click', function (event) {
    if (event.target.closest('a')) closeDropdowns();
  });
  $('#profileDropdown').addEventListener('click', function (event) {
    if (event.target.closest('a')) closeDropdowns();
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (form.id === 'clearanceForm') {
      event.preventDefault();
      const data = new FormData(form);
      saveClearanceRequest({
        at: new Date().toISOString(),
        reason: String(data.get('reason') || ''),
        note: String(data.get('note') || '')
      });
      closeModal();
      showToast('Clearance request saved', 'The request is stored in this browser only. Official clearance is still ' + current.accountsClearance + '.', 'info');
      render();
      return;
    }

    if (form.id === 'profileForm') {
      event.preventDefault();
      hideFormError('profileError');
      const data = new FormData(form);
      const phone = String(data.get('phone') || '').trim();
      const email = String(data.get('email') || '').trim();
      if (!phone) {
        showFormError('profileError', 'Phone number is required.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormError('profileError', 'Enter a valid email address.');
        return;
      }
      const fields = ['phone', 'email', 'presentAddress', 'presentThana', 'presentDistrict', 'permanentAddress', 'permanentThana', 'permanentDistrict'];
      const saved = {};
      fields.forEach(function (key) {
        const value = String(data.get(key) || '').trim();
        student[key] = value;
        saved[key] = value;
      });
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(saved));
      } catch (err) {
        showToast('Saved for this view only', 'Browser storage is unavailable, so changes will reset on reload.', 'warning');
      }
      showToast('Profile updated', 'Your contact details were saved locally.', 'success');
      window.location.hash = '#/profile';
      return;
    }

    if (form.id === 'passwordForm') {
      event.preventDefault();
      hideFormError('passwordError');
      const data = new FormData(form);
      const currentPassword = String(data.get('currentPassword') || '');
      const newPassword = String(data.get('newPassword') || '');
      const confirmPassword = String(data.get('confirmPassword') || '');
      if (!currentPassword) {
        showFormError('passwordError', 'Enter your current password.');
        return;
      }
      if (newPassword.length < 8) {
        showFormError('passwordError', 'The new password must be at least 8 characters.');
        return;
      }
      if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        showFormError('passwordError', 'Use at least one letter and one number in the new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        showFormError('passwordError', 'The new passwords do not match.');
        return;
      }
      form.reset();
      updateStrength('');
      showToast('Password flow complete', 'No real password was changed by this concept build.', 'success');
    }
  });

  document.addEventListener('input', function (event) {
    if (event.target.id === 'newPassword') {
      updateStrength(event.target.value);
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target.id === 'semesterSelect') {
      state.scheduleIndex = Number(event.target.value) || 0;
      render();
    }
  });

  $('#paletteInput').addEventListener('input', function () {
    renderPaletteResults(this.value);
  });

  $('#paletteInput').addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      movePalette(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = $('.palette-item.active');
      if (active) {
        window.location.hash = active.getAttribute('href');
        closePalette();
      }
    }
  });

  $('#paletteResults').addEventListener('mouseover', function (event) {
    const item = event.target.closest('.palette-item');
    if (!item) return;
    state.paletteIndex = Number(item.getAttribute('data-palette-index'));
    $$('.palette-item').forEach(function (entry, index) {
      entry.classList.toggle('active', index === state.paletteIndex);
    });
  });

  document.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openPalette();
      return;
    }
    if (event.key === 'Escape') {
      closePalette();
      closeDropdowns();
      closeModal();
      closeSidebar();
      return;
    }
    const tag = (event.target.tagName || '').toLowerCase();
    if (event.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      event.preventDefault();
      openPalette();
    }
  });

  window.addEventListener('hashchange', function () {
    render();
    closePalette();
    closeDropdowns();
    closeSidebar();
  });

  window.addEventListener('popstate', function () {
    closePalette();
    closeModal();
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  const bellDot = $('.bell-dot');
  if (bellDot) bellDot.hidden = true;
  if (!window.location.hash) {
    window.history.replaceState(null, '', '#/dashboard');
  }
  render();
})();

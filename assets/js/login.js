(function () {
  'use strict';

  const D = window.NUB_DATA;
  const SESSION_KEY = 'nubSession';
  const $ = (sel, root) => (root || document).querySelector(sel);

  const form = $('#loginForm');
  const studentId = $('#studentId');
  const password = $('#password');
  const remember = $('#remember');
  const errorBox = $('#loginError');
  const errorText = $('#loginErrorText');
  const button = $('#loginButton');
  const buttonText = $('#loginButtonText');
  const pwToggle = $('#pwToggle');
  const card = $('#loginCard');
  const toastStack = $('#toastStack');

  function existingSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  if (existingSession()) {
    window.location.replace('app.html#/dashboard');
    return;
  }

  function toast(title, message) {
    const el = document.createElement('div');
    el.className = 'toast info';
    el.innerHTML = `
      <span class="toast-icon">
        <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
      </span>
      <div><strong></strong><p></p></div>`;
    el.querySelector('strong').textContent = title;
    el.querySelector('p').textContent = message;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 220);
    }, 3800);
  }

  function showError(message) {
    errorText.textContent = message;
    errorBox.hidden = false;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }

  function clearError() {
    errorBox.hidden = true;
  }

  function setLoading(loading) {
    button.disabled = loading;
    buttonText.textContent = loading ? 'Signing in…' : 'Sign in';
  }

  studentId.addEventListener('input', clearError);
  password.addEventListener('input', clearError);

  pwToggle.addEventListener('click', function () {
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    pwToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    pwToggle.setAttribute('aria-pressed', String(!showing));
    pwToggle.innerHTML = showing
      ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.2M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  });

  $('#forgotLink').addEventListener('click', function (event) {
    event.preventDefault();
    toast('Password recovery', 'The recovery flow is not connected in this concept build.');
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearError();

    const id = studentId.value.trim();
    const pass = password.value;

    if (!id) {
      showError('Please enter your Student ID.');
      studentId.focus();
      return;
    }

    if (!pass) {
      showError('Please enter your password.');
      password.focus();
      return;
    }

    if (id !== D.student.id) {
      showError('This portal is linked to Student ID ' + D.student.id + '. Use that ID to continue.');
      studentId.focus();
      return;
    }

    setLoading(true);

    const session = {
      id: D.student.id,
      name: D.student.name,
      signedInAt: new Date().toISOString()
    };

    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      const store = remember.checked ? localStorage : sessionStorage;
      store.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      /* Storage can be unavailable in private modes; storage can be unavailable in private modes. */
    }

    setTimeout(function () {
      window.location.href = 'app.html#/dashboard';
    }, 550);
  });

  studentId.focus();
  studentId.setSelectionRange(studentId.value.length, studentId.value.length);
})();

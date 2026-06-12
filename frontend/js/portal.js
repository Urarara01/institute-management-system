'use strict';

/* ────────────────────────────────────────────────────────────────
   portal.js — Lógica del Portal del Estudiante
   Depende de: js/auth.js (debe cargarse primero)
──────────────────────────────────────────────────────────────── */

(function () {

  /* ── Guard: redirigir si no está autenticado ─────────────────── */
  if (!Auth.isLoggedIn()) {
    window.location.replace('index.html');
    return;
  }

  /* ── Estado ──────────────────────────────────────────────────── */
  var enrolledCourseIds = new Set();
  var allCourses        = [];

  /* ── Init ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('page-loaded');
    wireLogout();
    wireTabs();
    loadAll();
  });

  /* ── Logout ──────────────────────────────────────────────────── */
  function wireLogout() {
    ['logoutBtn', 'footerLogout'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', function (e) {
        e.preventDefault();
        Auth.logout().then(function () {
          window.location.href = 'index.html';
        });
      });
    });
  }

  /* ── Tabs ────────────────────────────────────────────────────── */
  function wireTabs() {
    var tabs = document.querySelectorAll('.portal-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        document.querySelectorAll('.portal-panel').forEach(function (p) {
          p.classList.remove('is-active');
        });
        var target = document.getElementById('panel-' + tab.getAttribute('data-tab'));
        if (target) target.classList.add('is-active');
      });
    });
  }

  /* ── Carga inicial paralela ──────────────────────────────────── */
  async function loadAll() {
    try {
      var me = await Auth.get('/auth/me/');
      renderProfile(me);
    } catch (e) {
      // Token inválido → logout
      Auth.clear();
      window.location.replace('index.html');
      return;
    }

    // En paralelo: matrículas y catálogo
    loadEnrollments();
    loadCourses();
  }

  /* ── Perfil ──────────────────────────────────────────────────── */
  function renderProfile(me) {
    var u = me.user || {};
    var p = me.student_profile || {};
    var fullName = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.email || 'Alumno';

    setText('profileName',  fullName);
    setText('profileEmail', u.email || '—');
    setText('profileId',    p.student_id || '—');
    setText('profileCareer',p.career || '—');
    setText('profilePhone', p.phone  || '—');
    setText('headerStudentName', fullName);
    setText('pageTitle', 'Bienvenido, ' + (u.first_name || 'Alumno'));

    // Iniciales en avatar
    var av = document.getElementById('profileAvatar');
    if (av) {
      var parts = fullName.split(' ');
      av.textContent = (parts[0][0] || '') + (parts[1] ? parts[1][0] : '');
    }
  }

  /* ── Mis matrículas ──────────────────────────────────────────── */
  async function loadEnrollments() {
    var container = document.getElementById('enrollmentsContainer');
    setLoading(container, 'Cargando tus matrículas…');

    try {
      var list = await Auth.get('/enrollments/');
      var enrollments = Array.isArray(list) ? list : (list.results || []);

      enrolledCourseIds = new Set(enrollments.map(function (e) {
        return e.course && e.course.id;
      }));

      if (enrollments.length === 0) {
        container.innerHTML = emptyState('📖', 'No tienes cursos matriculados aún.',
          'Ve al <strong>Catálogo de cursos</strong> para matricularte.');
        return;
      }

      container.innerHTML = '';
      var grid = document.createElement('div');
      grid.style.cssText = 'display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));';

      enrollments.forEach(function (enr) {
        grid.appendChild(buildEnrollmentCard(enr));
      });
      container.appendChild(grid);

    } catch (e) {
      container.innerHTML = errorState('No se pudieron cargar tus matrículas. ' + Auth.firstError(e));
    }
  }

  function buildEnrollmentCard(enr) {
    var course = enr.course || {};
    var grades = enr.grades || [];
    var schedules = (course.schedules || []);

    var card = el('div', 'enr-card');

    /* Head */
    var head = el('div', 'enr-card__head');

    var titleWrap = el('div', '');
    var title = el('h3', 'enr-card__title');
    title.textContent = course.name || '—';
    var sub = el('div', 'enr-card__sub');
    sub.textContent = '[' + (course.code || '—') + ']  ·  Periodo ' + (course.period || '—')
      + '  ·  ' + (course.credits || '?') + ' créditos';
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);
    head.appendChild(titleWrap);

    var statusClass = { ACTIVE: 'status-badge--active', DROPPED: 'status-badge--dropped', COMPLETED: 'status-badge--completed' };
    var badge = el('span', 'status-badge ' + (statusClass[enr.status] || 'status-badge--active'));
    badge.textContent = enr.status_display || enr.status;
    head.appendChild(badge);
    card.appendChild(head);

    /* Body */
    var body = el('div', 'enr-card__body');

    // Docente
    if (course.teacher && course.teacher.full_name) {
      var teacherP = el('p', '');
      teacherP.style.cssText = 'font-size:13px;color:#b9c3de;margin:0 0 10px 0;';
      teacherP.innerHTML = '👨‍🏫 <strong style="color:#eaf0ff;">' + course.teacher.full_name + '</strong>'
        + (course.teacher.department ? ' — ' + course.teacher.department : '');
      body.appendChild(teacherP);
    }

    // Horarios
    if (schedules.length > 0) {
      var schedLabel = el('p', '');
      schedLabel.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#b9c3de;margin:0 0 4px 0;font-weight:600;';
      schedLabel.textContent = 'Horarios';
      body.appendChild(schedLabel);

      var schedList = el('div', 'schedule-list');
      schedules.forEach(function (s) {
        var item = el('div', 'schedule-item');
        item.innerHTML = '<span class="schedule-dot"></span>'
          + (s.day_display || s.day) + ' '
          + (s.start_time || '').slice(0, 5) + '–' + (s.end_time || '').slice(0, 5)
          + ' · Aula ' + (s.classroom || '—');
        schedList.appendChild(item);
      });
      body.appendChild(schedList);
    }

    // Promedio
    if (enr.average_grade !== null && enr.average_grade !== undefined) {
      var avg = parseFloat(enr.average_grade);
      var cls = avg >= 14 ? 'avg-badge--good' : avg >= 11 ? 'avg-badge--mid' : 'avg-badge--low';
      var avgB = el('span', 'avg-badge ' + cls);
      avgB.style.marginTop = '12px';
      avgB.textContent = '⭐ Promedio: ' + enr.average_grade;
      body.appendChild(avgB);
    }

    // Notas colapsables
    if (grades.length > 0) {
      var toggle = el('button', 'grades-toggle');
      toggle.type = 'button';
      toggle.textContent = '📋 Ver notas (' + grades.length + ')';
      toggle.style.marginTop = '12px';

      var collapse = el('div', 'grades-collapse');
      var table = el('table', 'grades-table');
      var thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Evaluación</th><th>Nota</th><th>Máximo</th><th>Fecha</th></tr>';
      var tbody = document.createElement('tbody');
      grades.forEach(function (g) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + esc(g.name) + '</td>'
          + '<td>' + (g.score !== null && g.score !== undefined ? g.score : '—') + '</td>'
          + '<td>' + (g.max_score || 20) + '</td>'
          + '<td>' + (g.date || '—') + '</td>';
        tbody.appendChild(tr);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      collapse.appendChild(table);

      toggle.addEventListener('click', function () {
        collapse.classList.toggle('is-open');
        toggle.textContent = collapse.classList.contains('is-open')
          ? '🔼 Ocultar notas' : '📋 Ver notas (' + grades.length + ')';
      });

      body.appendChild(toggle);
      body.appendChild(collapse);
    } else {
      var noGrades = el('p', '');
      noGrades.style.cssText = 'font-size:12px;color:#b9c3de;margin:10px 0 0 0;';
      noGrades.textContent = 'Aún no hay notas registradas.';
      body.appendChild(noGrades);
    }

    card.appendChild(body);

    /* Footer — acción retiro */
    if (enr.status === 'ACTIVE') {
      var footer = el('div', 'enr-card__footer');
      var dropBtn = el('button', 'btn btn--ghost btn--small');
      dropBtn.type = 'button';
      dropBtn.textContent = 'Retirar curso';
      dropBtn.style.color = '#fb7185';
      dropBtn.style.borderColor = 'rgba(251,113,133,0.25)';

      dropBtn.addEventListener('click', function () {
        if (!confirm('¿Estás seguro de retirar el curso "' + (course.name || '') + '"?')) return;
        dropBtn.disabled = true;
        dropBtn.textContent = 'Procesando…';
        Auth.del('/enrollments/' + enr.id + '/').then(function () {
          loadEnrollments();
          // Recargar catálogo para actualizar cupos
          loadCourses();
        }).catch(function (err) {
          dropBtn.disabled = false;
          dropBtn.textContent = 'Retirar curso';
          alert(Auth.firstError(err));
        });
      });

      footer.appendChild(dropBtn);
      card.appendChild(footer);
    }

    return card;
  }

  /* ── Catálogo de cursos ──────────────────────────────────────── */
  async function loadCourses(search) {
    var container = document.getElementById('coursesContainer');
    setLoading(container, 'Cargando catálogo…', true);

    var path = '/courses/';
    if (search) path += '?search=' + encodeURIComponent(search);

    try {
      var list = await Auth.get(path);
      allCourses = Array.isArray(list) ? list : (list.results || []);
      renderCourses(allCourses);
    } catch (e) {
      container.innerHTML = errorState('No se pudo cargar el catálogo. ' + Auth.firstError(e));
    }
  }

  function renderCourses(courses) {
    var container = document.getElementById('coursesContainer');
    container.innerHTML = '';

    if (courses.length === 0) {
      container.innerHTML = emptyState('🔍', 'No se encontraron cursos.', 'Prueba con otro término de búsqueda.');
      return;
    }

    courses.forEach(function (course) {
      container.appendChild(buildCourseCard(course));
    });
  }

  function buildCourseCard(course) {
    var isEnrolled = enrolledCourseIds.has(course.id);
    var isFull = (course.available_slots !== undefined && course.available_slots <= 0);

    var card = el('div', 'cat-card' + (isEnrolled ? ' is-enrolled' : ''));

    /* Título y código */
    var titleRow = el('div', '');
    titleRow.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;';
    var title = el('h3', 'cat-card__title');
    title.textContent = course.name;
    titleRow.appendChild(title);
    card.appendChild(titleRow);

    /* Pills */
    var meta = el('div', 'cat-card__meta');
    meta.appendChild(pill('[' + course.code + ']'));
    meta.appendChild(pill('Periodo ' + course.period));
    meta.appendChild(pill(course.credits + ' créditos'));
    if (isEnrolled) {
      var enrPill = pill('✓ Matriculado');
      enrPill.style.cssText += ';background:rgba(74,222,128,0.12);border-color:rgba(74,222,128,0.25);color:#4ade80;';
      meta.appendChild(enrPill);
    } else if (isFull) {
      var fullPill = pill('Cupo lleno');
      fullPill.style.cssText += ';background:rgba(251,113,133,0.10);border-color:rgba(251,113,133,0.20);color:#fb7185;';
      meta.appendChild(fullPill);
    } else {
      var slotPill = pill((course.available_slots || 0) + ' cupos disponibles');
      slotPill.style.cssText += ';background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.18);color:#4ade80;';
      meta.appendChild(slotPill);
    }
    card.appendChild(meta);

    /* Docente */
    if (course.teacher && course.teacher.full_name) {
      var tch = el('p', 'cat-card__desc');
      tch.style.cssText = 'font-size:12px;color:#b9c3de;margin:0;';
      tch.textContent = '👨‍🏫 ' + course.teacher.full_name;
      card.appendChild(tch);
    }

    /* Descripción */
    if (course.description) {
      var desc = el('p', 'cat-card__desc');
      desc.textContent = course.description;
      card.appendChild(desc);
    }

    /* Horarios */
    if (course.schedules && course.schedules.length > 0) {
      var schedWrap = el('div', 'schedule-list');
      course.schedules.forEach(function (s) {
        var item = el('div', 'schedule-item');
        item.innerHTML = '<span class="schedule-dot"></span>'
          + (s.day_display || s.day) + ' '
          + (s.start_time || '').slice(0, 5) + '–' + (s.end_time || '').slice(0, 5)
          + ' · ' + (s.classroom || '—');
        schedWrap.appendChild(item);
      });
      card.appendChild(schedWrap);
    }

    /* Botón matricular */
    var actions = el('div', 'cat-card__actions');
    var enrollBtn = el('button', 'btn btn--primary btn--small');
    enrollBtn.type = 'button';

    if (isEnrolled) {
      enrollBtn.textContent = '✓ Ya matriculado';
      enrollBtn.disabled = true;
      enrollBtn.classList.replace('btn--primary', 'btn--ghost');
    } else if (isFull) {
      enrollBtn.textContent = 'Sin cupos';
      enrollBtn.disabled = true;
      enrollBtn.classList.replace('btn--primary', 'btn--ghost');
    } else {
      enrollBtn.textContent = 'Matricularse';
      enrollBtn.addEventListener('click', function () {
        enrollBtn.disabled = true;
        enrollBtn.textContent = 'Procesando…';
        Auth.post('/enrollments/', { course_id: course.id }).then(function () {
          enrolledCourseIds.add(course.id);
          loadEnrollments();
          loadCourses();
        }).catch(function (err) {
          enrollBtn.disabled = false;
          enrollBtn.textContent = 'Matricularse';
          alert(Auth.firstError(err));
        });
      });
    }

    actions.appendChild(enrollBtn);
    card.appendChild(actions);

    return card;
  }

  /* ── Búsqueda con debounce ───────────────────────────────────── */
  var searchTimer = null;
  document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.getElementById('courseSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        var q = searchInput.value.trim();
        searchTimer = setTimeout(function () { loadCourses(q || ''); }, 350);
      });
    }
  });

  /* ── Helpers DOM ─────────────────────────────────────────────── */
  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function pill(text) {
    var span = el('span', 'pill');
    span.textContent = text;
    return span;
  }

  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function setLoading(container, msg, useGrid) {
    container.innerHTML = '<div class="state-msg"' + (useGrid ? ' style="grid-column:1/-1;"' : '') + '>'
      + '<span class="state-msg__icon">⏳</span>' + esc(msg) + '</div>';
  }

  function emptyState(icon, title, sub) {
    return '<div class="state-msg"><span class="state-msg__icon">' + icon + '</span>'
      + '<strong>' + title + '</strong>'
      + (sub ? '<br><span style="font-size:13px;">' + sub + '</span>' : '')
      + '</div>';
  }

  function errorState(msg) {
    return '<div class="state-msg" style="color:#fb7185;">'
      + '<span class="state-msg__icon">⚠️</span>' + esc(msg) + '</div>';
  }

})();

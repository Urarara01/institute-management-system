(function () {
  // Page fade-in
  window.addEventListener("load", function () {
    document.body.classList.add("page-loaded");
  });

  // =========================
  // Base modal (simple)
  // =========================
  function openModalBase(titleText) {
    var overlay = document.createElement("div");
    overlay.className = "modalOverlay";

    var modal = document.createElement("div");
    modal.className = "modal";

    var head = document.createElement("div");
    head.className = "modal__head";

    var title = document.createElement("h3");
    title.className = "modal__title";
    title.textContent = titleText;

    var closeBtn = document.createElement("button");
    closeBtn.className = "modal__close";
    closeBtn.type = "button";
    closeBtn.textContent = "Cerrar";

    head.appendChild(title);
    head.appendChild(closeBtn);

    var body = document.createElement("div");
    body.className = "modal__body";

    modal.appendChild(head);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    function close() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        document.body.classList.remove("modal-open");
      }
      document.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", onKey);

    return { overlay: overlay, modal: modal, body: body, close: close };
  }


  function showNotice(container, text) {
    if (!container) return;
    var n = document.createElement("div");
    n.className = "notice notice--success";
    n.textContent = text || "Listo.";
    container.appendChild(n);
    setTimeout(function () {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    }, 2400);
  }

  function makeField(labelText, type, name, placeholder) {
    var label = document.createElement("label");
    label.className = "field";

    var span = document.createElement("span");
    span.className = "field__label";
    span.textContent = labelText;

    var input = document.createElement("input");
    input.className = "field__input";
    input.type = type;
    input.name = name;
    input.placeholder = placeholder;

    label.appendChild(span);
    label.appendChild(input);
    return label;
  }

  function makeSelect(labelText, name, options) {
    var label = document.createElement("label");
    label.className = "field";

    var span = document.createElement("span");
    span.className = "field__label";
    span.textContent = labelText;

    var select = document.createElement("select");
    select.className = "field__input";
    select.name = name;

    for (var i = 0; i < options.length; i++) {
      var opt = document.createElement("option");
      opt.value = options[i].value;
      opt.textContent = options[i].text;
      select.appendChild(opt);
    }

    label.appendChild(span);
    label.appendChild(select);
    return label;
  }

  // =========================
  // Modal: Portal — LOGIN REAL
  // =========================
  function openPortalModal() {
    var ui = openModalBase("Portal EDU+ Corp — Iniciar sesión");

    var hint = document.createElement("p");
    hint.className = "modal__hint";
    hint.textContent = "Ingresa con tu correo y contraseña de alumno.";

    var form = document.createElement("form");
    form.className = "form";

    form.appendChild(makeField("Correo", "email", "email", "tu@email.com"));
    form.appendChild(makeField("Contraseña", "password", "password", "••••••••"));

    var notice = document.createElement("div");
    notice.className = "hidden";
    notice.style.marginTop = "10px";

    var actions = document.createElement("div");
    actions.className = "form__actions";

    var submit = document.createElement("button");
    submit.className = "btn btn--primary";
    submit.type = "submit";
    submit.textContent = "Entrar";

    var cancel = document.createElement("button");
    cancel.className = "btn btn--ghost";
    cancel.type = "button";
    cancel.textContent = "Cancelar";

    actions.appendChild(submit);
    actions.appendChild(cancel);
    form.appendChild(actions);
    form.appendChild(notice);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email    = (form.querySelector('[name="email"]').value    || "").trim();
      var password = (form.querySelector('[name="password"]').value || "");

      if (!email || !password) {
        notice.className = "notice notice--bad";
        notice.textContent = "Completa todos los campos.";
        notice.classList.remove("hidden");
        return;
      }

      submit.disabled = true;
      submit.textContent = "Ingresando…";
      notice.classList.add("hidden");

      // Llamada real a la API
      if (typeof Auth !== 'undefined') {
        Auth.login(email, password).then(function () {
          window.location.href = "portal.html";
        }).catch(function (err) {
          submit.disabled = false;
          submit.textContent = "Entrar";
          notice.className = "notice notice--bad";
          notice.textContent = "❌ " + (Auth.firstError(err) || "Credenciales inválidas.");
          notice.classList.remove("hidden");
        });
      } else {
        // Fallback si auth.js no cargó
        submit.disabled = false;
        submit.textContent = "Entrar";
        notice.className = "notice notice--bad";
        notice.textContent = "Error: módulo de autenticación no disponible.";
        notice.classList.remove("hidden");
      }
    });

    cancel.addEventListener("click", function () { ui.close(); });

    ui.body.appendChild(hint);
    ui.body.appendChild(form);
  }

  // =========================
  // Modal: Cómo funciona (demo)
  // =========================
  function openDemoModal() {
    var ui = openModalBase("Cómo funciona el sitio");

    var hint = document.createElement("p");
    hint.className = "modal__hint";
    hint.textContent = "Recorrido típico para conocer servicios y contactar (demo).";

    var steps = document.createElement("div");
    steps.className = "panel";

    var t = document.createElement("h3");
    t.className = "panel__title";
    t.textContent = "Pasos";

    var ul = document.createElement("ul");
    ul.className = "list";

    var items = [
      "1) Revisa la sección Nosotros para entender la propuesta.",
      "2) Explora Servicios y elige lo que necesitas.",
      "3) Usa el botón “Solicitar” para dejar tu requerimiento.",
      "4) Te contactamos para coordinar (modo demo).",
      "5) El sitio queda listo para crecer (contenido/SEO)."
    ];

    for (var i = 0; i < items.length; i++) {
      var li = document.createElement("li");
      li.textContent = items[i];
      ul.appendChild(li);
    }

    var actions = document.createElement("div");
    actions.className = "panel__actions";

    var goRequest = document.createElement("button");
    goRequest.className = "btn btn--primary btn--small";
    goRequest.type = "button";
    goRequest.textContent = "Solicitar info";

    var goServices = document.createElement("a");
    goServices.className = "btn btn--secondary btn--small";
    goServices.href = "servicios.html";
    goServices.textContent = "Ver servicios";

    actions.appendChild(goRequest);
    actions.appendChild(goServices);

    steps.appendChild(t);
    steps.appendChild(ul);
    steps.appendChild(actions);

    ui.body.appendChild(hint);
    ui.body.appendChild(steps);

    goRequest.addEventListener("click", function () {
      ui.close();
      openRequestModal();
    });
  }

  // =========================
  // Modal: Solicitud / Cotización (demo)
  // =========================
  function openRequestModal() {
    var ui = openModalBase("Solicitud de información (demo)");

    var hint = document.createElement("p");
    hint.className = "modal__hint";
    hint.textContent = "Completa los datos y simula el envío de una solicitud.";

    var form = document.createElement("form");
    form.className = "form";

    form.appendChild(
      makeSelect("Servicio", "servicio", [
        { value: "web", text: "Programación Web" },
        { value: "ofimatica", text: "Ofimática" },
        { value: "asesoria", text: "Asesorías Académicas" },
        { value: "ingles", text: "Inglés Académico" },
        { value: "preu", text: "Preparación Pre-Universitaria" },
        { value: "cv", text: "Taller CV y Entrevista" }
      ])
    );

    form.appendChild(
      makeSelect("Modalidad", "modalidad", [
        { value: "online", text: "Online" },
        { value: "presencial", text: "Presencial" },
        { value: "hibrido", text: "Híbrido" }
      ])
    );

    form.appendChild(makeField("Nombre", "text", "nombre", "Tu nombre"));
    form.appendChild(makeField("Correo", "email", "correo", "tu@email.com"));

    var note = document.createElement("p");
    note.className = "modal__hint";
    note.textContent = "Al confirmar, se simula el registro del requerimiento (demo).";

    var actions = document.createElement("div");
    actions.className = "form__actions";

    var submit = document.createElement("button");
    submit.className = "btn btn--primary";
    submit.type = "submit";
    submit.textContent = "Enviar solicitud";

    var cancel = document.createElement("button");
    cancel.className = "btn btn--ghost";
    cancel.type = "button";
    cancel.textContent = "Cancelar";

    actions.appendChild(submit);
    actions.appendChild(cancel);

    form.appendChild(actions);

    cancel.addEventListener("click", function () {
      ui.close();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var servicio = form.querySelector('select[name="servicio"]').value;
      var modalidad = form.querySelector('select[name="modalidad"]').value;

      showNotice(ui.body, "✅ Solicitud enviada (demo)");

      var info = document.createElement("p");
      info.className = "modal__hint";
      info.textContent = "Servicio: " + servicio + " • Modalidad: " + modalidad + " (demo)";
      ui.body.appendChild(info);

      setTimeout(function () { ui.close(); }, 900);
    });

    ui.body.appendChild(hint);
    ui.body.appendChild(form);
    ui.body.appendChild(note);
  }

  // Alias por compatibilidad (si alguna página antigua lo llama)
  function openEnrollModal() {
    openRequestModal();
  }

  // =========================
  // Portafolio: mini modal desde data-*
  // =========================
  function openPortfolioInfo(titleText, descText) {
    var ui = openModalBase(titleText || "Detalle");
    var p = document.createElement("p");
    p.className = "modal__hint";
    p.textContent = descText || "Información de ejemplo.";
    ui.body.appendChild(p);
  }

  // =========================
  // Guardados (localStorage)
  // =========================
  function getSaved() {
    try {
      var raw = localStorage.getItem("eduplus_saved");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function setSaved(obj) {
    try {
      localStorage.setItem("eduplus_saved", JSON.stringify(obj));
    } catch (e) {}
  }

  function updateSavedUI() {
    var el = document.getElementById("savedCount");
    if (!el) return;

    var saved = getSaved();
    var count = 0;
    for (var k in saved) if (saved[k]) count++;

    el.textContent = String(count);
  }

  // =========================
  // Contacto: validación simple
  // =========================
  function isEmail(s) {
    return s.indexOf("@") !== -1 && s.indexOf(".") !== -1;
  }

  function setErr(form, key, msg) {
    var node = form.querySelector('[data-error="' + key + '"]');
    if (node) node.textContent = msg || "";
  }

  function wireContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var notice = document.getElementById("contactNotice");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nombre = (form.querySelector('input[name="nombre"]').value || "").trim();
      var correo = (form.querySelector('input[name="correo"]').value || "").trim();
      var asunto = (form.querySelector('input[name="asunto"]').value || "").trim();
      var mensaje = (form.querySelector('textarea[name="mensaje"]').value || "").trim();

      // limpiar
      setErr(form, "nombre", "");
      setErr(form, "correo", "");
      setErr(form, "asunto", "");
      setErr(form, "mensaje", "");

      var ok = true;

      if (nombre.length < 3) { setErr(form, "nombre", "Mínimo 3 caracteres."); ok = false; }
      if (!isEmail(correo)) { setErr(form, "correo", "Correo no válido."); ok = false; }
      if (asunto.length < 4) { setErr(form, "asunto", "Mínimo 4 caracteres."); ok = false; }
      if (mensaje.length < 10) { setErr(form, "mensaje", "Mínimo 10 caracteres."); ok = false; }

      if (!notice) return;

      notice.classList.remove("hidden");
      if (ok) {
        notice.className = "notice notice--ok";
        notice.textContent = "✅ Mensaje enviado correctamente (demo). En un sitio real, aquí se enviaría al servidor.";
        form.reset();
      } else {
        notice.className = "notice notice--bad";
        notice.textContent = "❌ Revisa los campos marcados.";
      }
    });
  }

  // =========================
  // Enlaces/botones
  // =========================
  function textHas(el, word) {
    var t = (el.textContent || "").toLowerCase();
    return t.indexOf(word.toLowerCase()) !== -1;
  }

  // Portal (por href) — redirigir si ya está logueado
  var loginLink = document.querySelector('a[href="#login"]');
  if (loginLink) {
    // Si ya hay sesión, ir directo al portal
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      loginLink.textContent = 'Mi Portal';
      loginLink.href = 'portal.html';
    } else {
      loginLink.addEventListener('click', function (e) {
        e.preventDefault();
        openPortalModal();
      });
    }
  }

  // #registro: solicitud
  var registerLinks = document.querySelectorAll('a[href="#registro"]');
  for (var i = 0; i < registerLinks.length; i++) {
    (function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openRequestModal();
      });
    })(registerLinks[i]);
  }

  // #demo
  var demoLinks = document.querySelectorAll('a[href="#demo"]');
  for (var j = 0; j < demoLinks.length; j++) {
    (function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openDemoModal();
      });
    })(demoLinks[j]);
  }

  // data-action shortcuts
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t) return;

    // si hacen click en <i> o <span> dentro de un botón
    if (t && t.closest) {
      var btn = t.closest("[data-action]");
      if (!btn) return;

      var action = btn.getAttribute("data-action");

      if (action === "open-demo") {
        e.preventDefault();
        openDemoModal();
      }

      if (action === "open-request") {
        e.preventDefault();
        openRequestModal();
      }

      if (action === "open-portfolio") {
        e.preventDefault();
        openPortfolioInfo(btn.getAttribute("data-title"), btn.getAttribute("data-desc"));
      }

      if (action === "save-item") {
        e.preventDefault();
        var key = btn.getAttribute("data-key") || "item";
        var saved = getSaved();
        saved[key] = true;
        setSaved(saved);
        updateSavedUI();
        showNotice(document.body, "✅ Guardado (demo)");
      }
    }
  });

  // =========================
  // Animaciones: reveal on scroll
  // =========================
  (function () {
    var items = document.querySelectorAll('.reveal');
    if (!items || items.length === 0) return;

    // Si el navegador no soporta IntersectionObserver, mostrar todo
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (el) { observer.observe(el); });
  })();



  // Nav active link (auto)
  (function () {
    var links = document.querySelectorAll(".nav__link");
    if (!links || links.length === 0) return;

    var current = window.location.pathname.split("/").pop() || "index.html";

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      if (href === current) {
        links[i].classList.add("nav__link--active");
      }
    }
  })();


  
  // ===== Reveal on scroll (basic) =====
  (function () {
    var items = document.querySelectorAll('.reveal');
    if (!items || items.length === 0) return;
  
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-visible');
      return;
    }
  
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
  
    for (var j = 0; j < items.length; j++) observer.observe(items[j]);
  })();
  
  
  // init
  updateSavedUI();
  wireContactForm();
})();

// =========================
// Formulario de Registro (Hero - index.html) — API REAL
// =========================
(function () {
  var form = document.getElementById('registerForm');
  if (!form) return;

  var notice  = document.getElementById('registerNotice');
  var submitBtn = form.querySelector('[type="submit"]');

  function setErr(key, msg) {
    var el = form.querySelector('[data-err="' + key + '"]');
    if (el) el.textContent = msg || '';
  }

  function clearErrs() {
    var errs = form.querySelectorAll('[data-err]');
    for (var i = 0; i < errs.length; i++) errs[i].textContent = '';
  }

  function isEmail(s) {
    return s.indexOf('@') !== -1 && s.indexOf('.') !== -1;
  }

  function showNoticeEl(cls, msg) {
    if (!notice) return;
    notice.className = 'notice ' + cls;
    notice.textContent = msg;
    notice.classList.remove('hidden');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrs();

    var nombres    = (form.querySelector('[name="nombres"]').value    || '').trim();
    var apPat      = (form.querySelector('[name="apellido_paterno"]').value || '').trim();
    var apMat      = (form.querySelector('[name="apellido_materno"]').value || '').trim();
    var dni        = (form.querySelector('[name="dni"]').value         || '').trim();
    var carrera    = (form.querySelector('[name="carrera"]').value     || '').trim();
    var telefono   = (form.querySelector('[name="telefono"]').value    || '').trim();
    var correo     = (form.querySelector('[name="correo_reg"]').value  || '').trim();
    var password   = (form.querySelector('[name="password"]')         ? (form.querySelector('[name="password"]').value || '') : '');
    var privacidad = form.querySelector('[name="privacidad"]').checked;

    var ok = true;

    if (nombres.length < 2)        { setErr('nombres', 'Ingresa tu nombre.'); ok = false; }
    if (apPat.length < 2)          { setErr('apellido_paterno', 'Ingresa apellido paterno.'); ok = false; }
    if (apMat.length < 2)          { setErr('apellido_materno', 'Ingresa apellido materno.'); ok = false; }
    if (!/^\d{8}$/.test(dni))      { setErr('dni', 'DNI debe tener 8 digitos.'); ok = false; }
    if (!carrera)                   { setErr('carrera', 'Selecciona una carrera.'); ok = false; }
    if (telefono.length < 7)       { setErr('telefono', 'Telefono no valido.'); ok = false; }
    if (!isEmail(correo))          { setErr('correo_reg', 'Correo no valido.'); ok = false; }
    if (password.length < 8)       { setErr('password', 'Minimo 8 caracteres.'); ok = false; }
    if (!privacidad)               { setErr('privacidad', 'Debes aceptar las politicas.'); ok = false; }

    if (!ok) {
      showNoticeEl('notice--bad', '❌ Revisa los campos marcados.');
      setTimeout(function () { notice.classList.add('hidden'); }, 3000);
      return;
    }

    // Deshabilitar botón mientras se procesa
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Registrando…'; }

    var payload = {
      email      : correo,
      password   : password,
      first_name : nombres,
      last_name  : (apPat + ' ' + apMat).trim(),
      student_id : dni,
      phone      : telefono,
      career     : carrera
    };

    if (typeof Auth !== 'undefined') {
      Auth.register(payload).then(function () {
        // Auto-login tras registro
        return Auth.login(correo, password);
      }).then(function () {
        showNoticeEl('notice--ok', '✅ ¡Registro exitoso! Redirigiendo al portal…');
        form.reset();
        setTimeout(function () { window.location.href = 'portal.html'; }, 1500);
      }).catch(function (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar'; }
        var msg = (typeof Auth !== 'undefined') ? Auth.firstError(err) : 'Error al registrarse.';
        showNoticeEl('notice--bad', '❌ ' + msg);
        setTimeout(function () { notice.classList.add('hidden'); }, 5000);
      });
    } else {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar'; }
      showNoticeEl('notice--bad', 'Error: módulo de autenticación no disponible.');
    }
  });
})();

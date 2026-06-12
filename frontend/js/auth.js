'use strict';

var API_BASE = '/api';

var Auth = (function () {

  /* ── Almacenamiento ───────────────────────────────────────── */
  function getToken()   { return localStorage.getItem('eduplus_access')  || ''; }
  function getRefresh() { return localStorage.getItem('eduplus_refresh') || ''; }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('eduplus_user')) || null; }
    catch (e) { return null; }
  }
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('eduplus_profile')) || null; }
    catch (e) { return null; }
  }
  function isLoggedIn() { return !!getToken(); }

  function save(data) {
    if (data.access)  localStorage.setItem('eduplus_access',  data.access);
    if (data.refresh) localStorage.setItem('eduplus_refresh', data.refresh);
    if (data.user)    localStorage.setItem('eduplus_user',    JSON.stringify(data.user));
    if (data.student_profile)
      localStorage.setItem('eduplus_profile', JSON.stringify(data.student_profile));
  }

  function clear() {
    ['eduplus_access', 'eduplus_refresh', 'eduplus_user', 'eduplus_profile']
      .forEach(function (k) { localStorage.removeItem(k); });
  }

  /* ── Refresh del token ─────────────────────────────────────── */
  async function refreshToken() {
    var refresh = getRefresh();
    if (!refresh) return false;
    try {
      var res = await fetch(API_BASE + '/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh })
      });
      if (!res.ok) { clear(); return false; }
      var data = await res.json();
      localStorage.setItem('eduplus_access', data.access);
      if (data.refresh) localStorage.setItem('eduplus_refresh', data.refresh);
      return true;
    } catch (e) { clear(); return false; }
  }

  /* ── Fetch autenticado (con reintentos en 401) ─────────────── */
  async function apiFetch(method, path, body) {
    var token = getToken();
    var opts = { method: method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    var res = await fetch(API_BASE + path, opts);

    if (res.status === 401) {
      var ok = await refreshToken();
      if (!ok) throw { error: 'Sesión expirada. Inicia sesión nuevamente.' };
      opts.headers['Authorization'] = 'Bearer ' + getToken();
      res = await fetch(API_BASE + path, opts);
    }

    if (res.status === 204) return {};
    var data;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) throw data;
    return data;
  }

  /* ── Auth endpoints públicos ───────────────────────────────── */
  async function login(email, password) {
    var res = await fetch(API_BASE + '/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw data;
    save(data);
    return data;
  }

  async function register(payload) {
    var res = await fetch(API_BASE + '/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (!res.ok) throw data;
    return data;
  }

  async function logout() {
    var refresh = getRefresh();
    if (refresh) {
      try { await apiFetch('POST', '/auth/logout/', { refresh: refresh }); }
      catch (e) { /* silencioso */ }
    }
    clear();
  }

  /* ── Helpers de primer error legible ───────────────────────── */
  function firstError(err) {
    if (!err) return 'Error desconocido.';
    if (typeof err === 'string') return err;
    if (err.error) return err.error;
    if (err.detail) return err.detail;
    // DRF field errors: { field: ["msg", ...] }
    var keys = Object.keys(err);
    if (keys.length > 0) {
      var v = err[keys[0]];
      return (Array.isArray(v) ? v[0] : String(v));
    }
    return 'Error al procesar la solicitud.';
  }

  /* ── API pública ──────────────────────────────────────────── */
  return {
    isLoggedIn : isLoggedIn,
    getToken   : getToken,
    getRefresh : getRefresh,
    getUser    : getUser,
    getProfile : getProfile,
    save       : save,
    clear      : clear,
    login      : login,
    register   : register,
    logout     : logout,
    firstError : firstError,
    get  : function (path)       { return apiFetch('GET',    path, undefined); },
    post : function (path, body) { return apiFetch('POST',   path, body);      },
    del  : function (path)       { return apiFetch('DELETE', path, undefined); }
  };
})();

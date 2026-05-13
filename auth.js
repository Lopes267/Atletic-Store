const _SESSION_KEY = 'atleticstore_session';

function _setSession(data) {
  localStorage.setItem(_SESSION_KEY, JSON.stringify(data));
}

function _uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function authDefaultDest(session) {
  if (!session) return 'login.html';
  return session.role === 'vendedor' ? 'dashboard-vendedor.html' : 'dashboard-cliente.html';
}

async function authRegister(name, email, password, role, storeName) {
  role      = role || 'cliente';
  storeName = (storeName || '').trim();

  const user = {
    id:        _uid(),
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    password,
    role,
    storeName,
    createdAt: new Date().toISOString()
  };

  try {
    const res  = await fetch('/api/users/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(user)
    });
    const data = await res.json();
    if (!data.ok) return data;

    _setSession({ id: user.id, name: user.name, email: user.email, role: user.role, storeName: user.storeName });
    return { ok: true, user: authGetSession() };
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor.' };
  }
}

async function authLogin(email, password) {
  try {
    const res  = await fetch('/api/users/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.toLowerCase().trim(), password })
    });
    const data = await res.json();
    if (!data.ok) return data;
    _setSession(data.user);
    return { ok: true, user: authGetSession() };
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor.' };
  }
}

function authLogout() {
  localStorage.removeItem(_SESSION_KEY);
  sessionStorage.removeItem('atletic_redirect');
  window.location.href = 'login.html';
}

function authGetSession() {
  try { return JSON.parse(localStorage.getItem(_SESSION_KEY) || 'null'); }
  catch { return null; }
}

function authIsLoggedIn() {
  return !!authGetSession();
}

document.addEventListener('DOMContentLoaded', () => {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  const session = authGetSession();
  const wrap    = document.createElement('div');
  wrap.className = 'auth-wrap';

  if (session) {
    const isVendedor  = session.role === 'vendedor';
    const dashLink    = isVendedor ? 'dashboard-vendedor.html' : 'dashboard-cliente.html';
    const roleLabel   = isVendedor ? 'Vendedor' : 'Cliente';
    const dashLabel   = isVendedor ? 'Meu Painel' : 'Minha Conta';
    const displayName = (isVendedor && session.storeName) ? session.storeName : session.name.split(' ')[0];

    wrap.innerHTML = `
      <div class="user-menu" id="userMenu">
        <button class="user-btn" onclick="document.getElementById('userMenu').classList.toggle('open')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          ${displayName}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div class="user-dropdown">
          <a href="${dashLink}" class="user-nav-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            ${dashLabel}
          </a>
          <div class="user-dropdown-divider"></div>
          <button class="user-logout-btn" onclick="authLogout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </div>`;
  } else {
    wrap.innerHTML = `
      <a href="cadastro.html" class="register-btn-header">Cadastrar</a>
      <a href="login.html" class="login-btn-header"
         onclick="sessionStorage.setItem('atletic_redirect', window.location.href)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        Entrar
      </a>`;
  }

  actions.prepend(wrap);

  document.addEventListener('click', e => {
    const menu = document.getElementById('userMenu');
    if (menu && !menu.contains(e.target)) menu.classList.remove('open');
  });
});

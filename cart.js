// Cart functionality for Atletic Store

// Use a per-account cart key in localStorage. If no user is logged in, use a guest key.
const BASE_CART_KEY = 'atleticstore_cart';
const SESSION_KEY = 'atleticstore_session';
const DARK_KEY = 'atleticstore_darkmode';

function getCartKey() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session && session.id) return `${BASE_CART_KEY}_${session.id}`;
  } catch {
    // ignore
  }
  // fallback guest cart (shared only on this browser)
  return `${BASE_CART_KEY}_guest`;
}

function loadCart() {
  const key = getCartKey();
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  const key = getCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
}

function addProductToCart(productId) {
  const cart = loadCart();
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;

  const existing = cart.find(item => String(item.id) === String(productId));
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image || '', quantity: 1 });
  }
  saveCart(cart);
  updateCartCount();
}

function removeFromCart(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartCount();
  showCart(); // Refresh the cart display
}

function updateCartCount() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
  }
}

function showCart() {
  let modal = document.querySelector('.cart-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'cart-modal';
    document.body.appendChild(modal);
  }
  const cart = loadCart();
  modal.innerHTML = `
    <div class="cart-overlay" onclick="closeCart()"></div>
    <div class="cart-content">
      <div class="cart-header">
        <h3>Seu Carrinho</h3>
        <button class="cart-close" onclick="closeCart()">×</button>
      </div>
      <div class="cart-items">
        ${cart.length === 0 ? '<p class="empty-cart">Carrinho vazio</p>' : cart.map((item, index) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">${item.price}</div>
              <div class="cart-item-quantity">Quantidade: ${item.quantity}</div>
            </div>
            <button class="cart-remove" onclick="removeFromCart(${index})">Remover</button>
          </div>
        `).join('')}
      </div>
      ${cart.length > 0 ? `
        <div class="cart-footer">
          <div class="cart-total">
            Total: R$ ${cart.reduce((sum, item) => sum + (parseFloat(item.price.replace('R$ ', '').replace(',', '.')) * item.quantity), 0).toFixed(2).replace('.', ',')}
          </div>
          <button class="checkout-btn" onclick="proceedToCheckout()">Finalizar Compra</button>
        </div>
      ` : ''}
    </div>
  `;
}

function proceedToCheckout() {
  const cart = loadCart();
  if (!cart || cart.length === 0) {
    alert('Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.');
    return;
  }
  // Ensure cart is saved (already handled by add/remove functions), then redirect
  saveCart(cart);
  closeCart();
  window.location.href = 'checkout.html';
}

function closeCart() {
  const modal = document.querySelector('.cart-modal');
  if (modal) {
    modal.remove();
  }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
  // If user just logged in and there is a guest cart, merge it into the user's cart
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session && session.id) {
      const guestKey = `${BASE_CART_KEY}_guest`;
      const guestCart = JSON.parse(localStorage.getItem(guestKey) || '[]');
      const userKey = `${BASE_CART_KEY}_${session.id}`;
      const userCart = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (guestCart.length > 0) {
        // merge guestCart into userCart (sum quantities for same product id)
        guestCart.forEach(gItem => {
          const existing = userCart.find(u => String(u.id) === String(gItem.id));
          if (existing) existing.quantity += gItem.quantity;
          else userCart.push(gItem);
        });
        localStorage.setItem(userKey, JSON.stringify(userCart));
        localStorage.removeItem(guestKey);
      }
    }
  } catch (e) {
    // ignore merge errors
  }

  updateCartCount();
  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', showCart);
  }

  // Dark mode: insert toggle next to search and apply saved preference
  try {
    const searchWrap = document.querySelector('.search-wrap');
    if (searchWrap && !document.querySelector('.dark-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'dark-toggle';
      toggle.setAttribute('aria-label', 'Alternar modo escuro');
      toggle.setAttribute('title', 'Modo escuro');
      // include sun and moon icons; visibility toggled via updateDarkToggleIcon()
      toggle.innerHTML = `
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      `;
      function updateDarkToggleIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        const sun = toggle.querySelector('.icon-sun');
        const moon = toggle.querySelector('.icon-moon');
        if (sun) sun.style.display = isDark ? 'none' : 'block';
        if (moon) moon.style.display = isDark ? 'block' : 'none';
      }
      toggle.updateIcon = updateDarkToggleIcon;
      toggle.addEventListener('click', () => {
        const enabled = !document.documentElement.classList.contains('dark');
        applyDarkMode(enabled);
        toggle.updateIcon();
      });
      toggle.addEventListener('click', () => {
        const enabled = !document.documentElement.classList.contains('dark');
        applyDarkMode(enabled);
      });
      searchWrap.appendChild(toggle);
    }

    // apply saved preference
    const saved = localStorage.getItem(DARK_KEY);
    if (saved !== null) {
      const enabled = (saved === '1' || saved === 'true');
      applyDarkMode(enabled);
    }
    // update icon state
    const dt = document.querySelector('.dark-toggle');
    if (dt && typeof dt.updateIcon === 'function') dt.updateIcon();

    // Setup per-image toggle buttons for PNGs
    setupImageToggles();
  } catch (e) {
    // ignore
  }
});

function applyDarkMode(enable) {
  if (enable) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  try { localStorage.setItem(DARK_KEY, enable ? '1' : '0'); } catch {}
}

// Add a small toggle to PNG images to switch to a *_dark.png variant if present,
// otherwise apply a CSS filter as a fallback. The toggle persists only visually.
function setupImageToggles() {
  const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src && i.src.toLowerCase().includes('.png'));
  imgs.forEach(img => {
    // avoid duplicates
    if (img.dataset.hasImgToggle) return;
    img.dataset.hasImgToggle = '1';

    const btn = document.createElement('button');
    btn.className = 'img-toggle-btn';
    btn.setAttribute('aria-label', 'Alternar imagem escura');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v1"/><path d="M12 20v1"/><path d="M4.22 4.22l.7.7"/><path d="M18.36 18.36l.7.7"/><circle cx="12" cy="12" r="5"/></svg>`;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleImageDark(img, btn);
    });

    // ensure parent is positioned
    const parent = img.closest('.product-img') || img.parentElement;
    if (parent) {
      parent.style.position = parent.style.position || getComputedStyle(parent).position === 'static' ? 'relative' : getComputedStyle(parent).position;
      parent.appendChild(btn);
    }
  });
}

function toggleImageDark(img, btn) {
  const orig = img.dataset.origSrc || img.src;
  const isDark = img.dataset.darkApplied === '1';
  if (isDark) {
    // revert
    img.src = orig;
    img.dataset.darkApplied = '0';
    img.classList.remove('img-dark-filter');
    return;
  }

  // try dark variant: insert _dark before file extension
  try {
    const url = new URL(orig, location.href);
    const parts = url.pathname.split('/');
    const file = parts.pop();
    const m = file.match(/(.+)\.(png)(\?.*)?$/i);
    if (!m) {
      // fallback filter
      img.classList.add('img-dark-filter');
      img.dataset.darkApplied = '1';
      img.dataset.origSrc = orig;
      return;
    }
    const darkFile = m[1] + '_dark.' + m[2];
    parts.push(darkFile);
    const darkUrl = url.origin + parts.join('/');
    const test = new Image();
    test.onload = function() {
      img.dataset.origSrc = orig;
      img.src = darkUrl;
      img.dataset.darkApplied = '1';
      img.classList.remove('img-dark-filter');
    };
    test.onerror = function() {
      // no dark variant; apply filter fallback
      img.dataset.origSrc = orig;
      img.classList.add('img-dark-filter');
      img.dataset.darkApplied = '1';
    };
    test.src = darkUrl;
  } catch (e) {
    img.classList.add('img-dark-filter');
    img.dataset.darkApplied = '1';
  }
}
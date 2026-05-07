// Cart functionality for Atletic Store

const CART_KEY = 'atleticstore_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
          <button class="checkout-btn">Finalizar Compra</button>
        </div>
      ` : ''}
    </div>
  `;
}

function closeCart() {
  const modal = document.querySelector('.cart-modal');
  if (modal) {
    modal.remove();
  }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', showCart);
  }
});
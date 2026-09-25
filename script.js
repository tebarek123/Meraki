const CART_KEY = 'meraki_cart';
const ORDER_HISTORY_KEY = 'meraki_order_history';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value, storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to save data:', error);
  }
}

function getCart() {
  return readStorage(CART_KEY, []);
}

function saveCart(cart) {
  writeStorage(CART_KEY, cart, sessionStorage);
}

function getOrderHistory() {
  return readStorage(ORDER_HISTORY_KEY, []);
}

function saveOrderHistory(history) {
  writeStorage(ORDER_HISTORY_KEY, history, localStorage);
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('#cart-count');
  if (badge) badge.textContent = totalItems;

  const summaryBadge = document.querySelector('#cart-summary-badge');
  if (summaryBadge) summaryBadge.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
}

function parsePriceValue(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const text = String(value).trim();
  const matches = text.match(/-?\d+(?:\.\d+)?/g);

  if (!matches) {
    return 0;
  }

  const parsed = Number(matches[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(amount)} ETB`;
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);
  const normalizedPrice = parsePriceValue(product.price);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      price: normalizedPrice,
      quantity: 1,
      category: product.category || 'General'
    });
  }

  saveCart(cart);
  updateCartBadge();

  if (document.body.classList.contains('cart-page')) {
    renderCart();
  }
}

function updateCartItemQuantity(id, change) {
  const cart = getCart();
  const target = cart.find((item) => item.id === id);

  if (!target) return;

  target.quantity += change;

  if (target.quantity <= 0) {
    const filtered = cart.filter((item) => item.id !== id);
    saveCart(filtered);
  } else {
    saveCart(cart);
  }

  renderCart();
  updateCartBadge();
}

function removeFromCart(id) {
  const filtered = getCart().filter((item) => item.id !== id);
  saveCart(filtered);
  renderCart();
  updateCartBadge();
}

function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCart() {
  const cart = getCart();
  const cartItems = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');
  const shippingEl = document.getElementById('shipping');
  const cartPill = document.getElementById('cart-pill');
  const itemCountEl = document.getElementById('items-count');

  if (!cartItems) return;

  const subtotal = getCartSubtotal();
  const shipping = cart.length ? 18 : 0;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
  if (totalEl) totalEl.textContent = formatMoney(total);
  if (itemCountEl) itemCountEl.textContent = totalItems;
  if (cartPill) cartPill.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
  if (shippingEl) shippingEl.textContent = formatMoney(shipping);

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add oils from the product list to start your order.</p>
        <a href="index.html" class="btn btn-secondary">Continue shopping</a>
      </div>
    `;
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.disabled = false;

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item-info">
            <div class="cart-item-header">
              <div>
                <h3>${item.name}</h3>
                <p>${item.category}</p>
              </div>
              <button class="remove-btn" data-id="${item.id}" type="button">Remove</button>
            </div>
            <div class="cart-item-footer">
              <div class="qty-control" aria-label="Quantity controls">
                <button class="qty-btn" data-action="decrease" data-id="${item.id}" type="button">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-action="increase" data-id="${item.id}" type="button">+</button>
              </div>
              <strong>${formatMoney(item.price * item.quantity)}</strong>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  cartItems.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { id, action } = button.dataset;
      updateCartItemQuantity(id, action === 'increase' ? 1 : -1);
    });
  });

  cartItems.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(button.dataset.id));
  });
}

function renderOrderHistory() {
  const history = getOrderHistory();
  const historyContainer = document.getElementById('order-history');
  const historyPill = document.getElementById('history-pill');

  if (historyPill) {
    historyPill.textContent = `${history.length} order${history.length === 1 ? '' : 's'}`;
  }
  if (!historyContainer) return;

  if (!history.length) {
    historyContainer.innerHTML = `
      <div class="empty-state history-empty">
        <h3>No order history yet</h3>
        <p>Your completed purchases will show up here after checkout.</p>
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = history
    .map(
      (order) => `
        <article class="history-card">
          <div class="history-header">
            <div>
              <h3>Order #${order.id.toString().slice(-6)}</h3>
              <p>${new Date(order.date).toLocaleDateString()}</p>
            </div>
            <span class="status-pill">${order.status}</span>
          </div>
          <div class="history-items">
            ${order.items
              .map(
                (item) => `
                  <div class="history-item-row">
                    <span>${item.name} × ${item.quantity}</span>
                    <strong>${formatMoney(item.price * item.quantity)}</strong>
                  </div>
                `
              )
              .join('')}
          </div>
          <div class="history-total">
            <span>Total</span>
            <strong>${formatMoney(order.total)}</strong>
          </div>
        </article>
      `
    )
    .join('');
}

function placeOrder() {
  const cart = getCart();

  if (!cart.length) {
    return;
  }

  const transactionInput = document.getElementById('transaction-number');
  const proofInput = document.getElementById('payment-proof');
  const preview = document.getElementById('proof-preview');

  const transactionNumber = transactionInput ? transactionInput.value.trim() : '';
  const proofFile = proofInput && proofInput.files && proofInput.files[0] ? proofInput.files[0] : null;

  if (!transactionNumber || !proofFile) {
    showToast('Please add a transfer number and payment screenshot.');
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = function () {
    const history = getOrderHistory();
    const placedOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'Confirmed',
      total: getCartSubtotal() + 18,
      transactionNumber,
      paymentProof: fileReader.result,
      items: cart.map((item) => ({ ...item }))
    };

    history.unshift(placedOrder);
    saveOrderHistory(history);
    saveCart([]);
    renderCart();
    renderOrderHistory();
    updateCartBadge();

    if (transactionInput) transactionInput.value = '';
    if (proofInput) proofInput.value = '';
    if (preview) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
    }

    showToast('Order placed successfully!');
  };

  fileReader.readAsDataURL(proofFile);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function triggerAddToCartAnimation(button) {
  const cartIcon = document.querySelector('.header-cart');
  const productCard = button.closest('.product-card');
  const productImage = productCard ? productCard.querySelector('img') : null;

  button.classList.add('is-adding');
  setTimeout(() => button.classList.remove('is-adding'), 500);

  if (!productImage || !cartIcon) return;

  const imageClone = productImage.cloneNode(true);
  const startRect = productImage.getBoundingClientRect();
  const endRect = cartIcon.getBoundingClientRect();

  imageClone.classList.add('cart-fly-item');
  imageClone.style.left = `${startRect.left}px`;
  imageClone.style.top = `${startRect.top}px`;
  imageClone.style.width = `${startRect.width}px`;
  imageClone.style.height = `${startRect.height}px`;

  document.body.appendChild(imageClone);

  requestAnimationFrame(() => {
    const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

    imageClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
    imageClone.style.opacity = '0.2';
  });

  setTimeout(() => {
    cartIcon.classList.add('cart-pop');
    setTimeout(() => cartIcon.classList.remove('cart-pop'), 400);
    imageClone.remove();
  }, 420);
}

function bindProductVariantOptions() {
  document.querySelectorAll('.variant-option').forEach((option) => {
    option.addEventListener('click', () => {
      const variantGroup = option.closest('.product-choices');
      if (!variantGroup) return;

      variantGroup.querySelectorAll('.variant-option').forEach((button) => {
        button.classList.toggle('is-selected', button === option);
      });

      const productCard = option.closest('.product-card');
      if (!productCard) return;

      const addButton = productCard.querySelector('.add-to-cart');
      if (addButton) {
        addButton.dataset.price = option.dataset.price || addButton.dataset.price;
      }
    });
  });
}

function bindAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedVariant = button.closest('.product-card')?.querySelector('.variant-option.is-selected');
      const product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: parsePriceValue(selectedVariant ? selectedVariant.dataset.price : button.dataset.price),
        image: button.dataset.image,
        category: button.dataset.category || 'Wellness'
      };

      triggerAddToCartAnimation(button);
      addToCart(product);
      showToast(`${product.name} (${formatMoney(product.price)}) added to cart`);
    });
  });
}

function bindProofPreview() {
  const proofInput = document.getElementById('payment-proof');
  const preview = document.getElementById('proof-preview');

  if (!proofInput || !preview) return;

  proofInput.addEventListener('change', () => {
    const file = proofInput.files && proofInput.files[0];
    if (!file) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      preview.classList.remove('hidden');
      preview.innerHTML = `<img src="${reader.result}" alt="Payment proof preview" />`;
    };
    reader.readAsDataURL(file);
  });
}

function bindCheckoutButton() {
  const checkoutButton = document.getElementById('checkout-btn');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', placeOrder);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  bindProductVariantOptions();
  bindAddToCartButtons();
  bindCheckoutButton();
  bindProofPreview();

  if (document.body.classList.contains('cart-page')) {
    renderCart();
    renderOrderHistory();
  }
});

import { apiFetch } from "@/config/httpConfig";

// Utilitários para cache local do carrinho
const CART_CACHE_KEY = 'cart_items_cache';

function saveCartToCache(items) {
  localStorage.setItem(CART_CACHE_KEY, JSON.stringify(items));
}

function getCartFromCache() {
  const data = localStorage.getItem(CART_CACHE_KEY);
  return data ? JSON.parse(data) : [];
}

function clearCartCache() {
  localStorage.removeItem(CART_CACHE_KEY);
}

// Busca os itens do carrinho do cache do navegador
export function getCartItemsFromCache() {
  return getCartFromCache();
}

// Adiciona um item ao carrinho no cache do navegador
export function addProductToCartCache(product, quantity = 1) {
  const items = getCartFromCache();
  const idx = items.findIndex(i => i.product_id === product.id);
  if (idx !== -1) {
    // Garante que a quantidade seja sempre um número válido
    const currentQty = Number(items[idx].quantity) || 0;
    items[idx].quantity = currentQty + (Number(quantity) || 1);
    // Atualiza outros dados do produto caso tenham mudado
    items[idx].name = product.name;
    items[idx].unit_price = Number(product.unit_price || product.price || 0);
    items[idx].image_path = product.image_path || '';
  } else {
    items.push({
      product_id: product.id,
      name: product.name,
      unit_price: Number(product.unit_price || product.price || 0),
      image_path: product.image_path || '',
      quantity: Number(quantity) || 1
    });
  }
  saveCartToCache(items); // <-- Salva sempre após alteração
  return items;
}

// Atualiza a quantidade de um item no cache
export function updateCartItemCache(productId, quantity) {
  const items = getCartFromCache();
  const idx = items.findIndex(i => i.product_id === productId);
  if (idx !== -1) {
    items[idx].quantity = quantity;
    if (items[idx].quantity <= 0) items.splice(idx, 1);
    saveCartToCache(items);
  }
  return items;
}

// Remove um item do carrinho no cache
export function removeProductFromCartCache(productId) {
  const items = getCartFromCache().filter(i => i.product_id !== productId);
  saveCartToCache(items);
  return items;
}

// Limpa o carrinho do cache
export function clearCartCacheItems() {
  clearCartCache();
}

// Busca o carrinho do usuário autenticado (usando o endpoint correto /cart/)
export async function getUserCart(token) {
  const headers = { accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await apiFetch('/cart/', { headers });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error('Erro ao buscar carrinho do usuário');
}

// Cria um novo carrinho para o usuário autenticado
export async function createUserCart() {
  const response = await apiFetch('/jsonar', {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error('Erro ao criar carrinho do usuário');
}

// Garante que o usuário tenha um carrinho (chame após criar conta)
export async function ensureUserCart() {
  try {
    const cart = await getUserCart();
    if (!cart || !cart.id) {
      return await createUserCart();
    }
    return cart;
  } catch {
    return await createUserCart();
  }
}

// Busca os itens do carrinho do usuário autenticado
export async function getCartItems() {
  const token = localStorage.getItem('access_token');
  const response = await apiFetch("/cart/items", {
    method: "GET",
    headers: {
      "accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error("Erro ao buscar itens do carrinho");
}

// Adiciona um item ao carrinho do usuário autenticado
export async function addProductToCart(productId, quantity = 1, unit_price = 0) {
  const response = await apiFetch('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity, unit_price })
  });
  if (response.status === 204) {
    return true;
  }
  throw new Error('Erro ao adicionar produto ao carrinho');
}

// Atualiza a quantidade de um item no carrinho do usuário autenticado
export async function updateCartItem(productId, quantity) {
  const response = await apiFetch('/items', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity })
  });
  if (response.status === 204) {
    return true;
  }
  throw new Error('Erro ao atualizar item do carrinho');
}

export async function addItemToCart({ product_id, quantity, unit_price }) {
  const token = localStorage.getItem('access_token');
  return apiFetch("/cart/items", {
    method: "POST",
    headers: {
      "accept": "*/*",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ product_id, quantity, unit_price })
  });
}

export async function updateCartItemQuantity(product_id, quantity) {
  const token = localStorage.getItem('access_token');
  const response = await apiFetch("/cart/items", {
    method: "PUT",
    headers: {
      "accept": "application/json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ product_id, quantity })
  });
  if (response.status === 204) {
    return true;
  }
  if (response.status === 422) {
    const data = await response.json();
    throw new Error(data.detail?.[0]?.msg || "Erro de validação.");
  }
  throw new Error("Erro ao atualizar item do carrinho");
}

export async function removeItemFromCart(product_id) {
  const token = localStorage.getItem('access_token');
  const response = await apiFetch("/cart/items", {
    method: "DELETE",
    headers: {
      "accept": "application/json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ product_id })
  });
  if (response.status === 204) {
    return true;
  }
  if (response.status === 422) {
    const data = await response.json();
    throw new Error(data.detail?.[0]?.msg || "Erro de validação.");
  }
  throw new Error("Erro ao remover item do carrinho");
}

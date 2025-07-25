<script setup>
import { ref, onMounted } from 'vue';
import { getCartItems, updateCartItemQuantity, removeItemFromCart } from '@/api/cart';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { useRouter } from 'vue-router';

const cart = ref(null);
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// Busca o estoque real do produto
async function getProductStock(product_id) {
  const response = await fetch(`http://35.196.79.227:8000/products/${product_id}`, {
    headers: { accept: "application/json" }
  });
  if (response.status === 200) {
    const data = await response.json();
    return Number(data.stock);
  }
  return 0;
}

// Carrega carrinho e atualiza o estoque real de cada item
async function fetchCart() {
  loading.value = true;
  try {
    const cartData = await getCartItems();
    // Para cada item, busca o estoque real
    if (cartData.items && cartData.items.length > 0) {
      const promises = cartData.items.map(async (item) => {
        item.real_stock = await getProductStock(item.product_id);
        return item;
      });
      cartData.items = await Promise.all(promises);
    }
    cart.value = cartData;
    error.value = null;
  } catch (err) {
    error.value = 'Erro ao buscar itens do carrinho';
  } finally {
    loading.value = false;
  }
}

function handleRemoveItem(product_id) {
  removeItemFromCart(product_id)
    .then((ok) => {
      if (ok) {
        toast.success('Item removido do carrinho!');
        fetchCart();
      }
    });
}

// Atualiza quantidade, sempre respeitando o estoque real
async function handleUpdateQuantity(product_id, quantity, currentQuantity, realStock) {
  if (quantity > currentQuantity) {
    if (currentQuantity >= realStock || quantity > realStock) {
      toast.info('Quantidade máxima no estoque atingida!');
      return;
    }
  }
  if (quantity < 1) return;
  const ok = await updateCartItemQuantity(product_id, Number(quantity));
  if (ok) {
    toast.success('Quantidade atualizada!');
    await fetchCart();
  }
}

function handleCheckout() {
  router.push('/checkout');
}

onMounted(() => {
  fetchCart();
});
</script>

<template>
  <section class="cart-bg">
    <div class="cart-card">
      <h2 class="cart-title">Meu Carrinho</h2>
      <div v-if="loading" class="text-center py-4">Carregando...</div>
      <div v-else-if="error" class="text-center text-danger">{{ error }}</div>
      <div v-else>
        <div v-if="!cart || !cart.items || cart.items.length === 0" class="text-center">Carrinho vazio.</div>
        <div v-else>
          <ul class="cart-list">
            <li v-for="item in cart.items" :key="item.id" class="cart-item">
              <img v-if="item.image_path" :src="`http://35.196.79.227:8000${item.image_path}`" alt="Imagem do produto" class="cart-img" />
              <div class="cart-info">
                <strong class="cart-prod-name">{{ item.name }}</strong><br />
                <span>
                  Quantidade:
                  <div class="qty-control">
                    <button
                      class="qty-btn"
                      :disabled="item.quantity <= 1"
                      @click="handleUpdateQuantity(item.product_id, item.quantity - 1, item.quantity, item.real_stock)"
                    >-</button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button
                      class="qty-btn"
                      :disabled="item.quantity >= item.real_stock"
                      @click="handleUpdateQuantity(item.product_id, item.quantity + 1, item.quantity, item.real_stock)"
                    >+</button>
                  </div>
                  <span class="estoque-info">(Estoque: {{ item.real_stock }})</span>
                </span><br />
                <span class="cart-prod-price">Preço: R$ {{ item.unit_price }}</span>
              </div>
              <button class="btn-remove" @click="handleRemoveItem(item.product_id)">Remover</button>
            </li>
          </ul>
          <div class="cart-total">
            <strong>Total: R$ {{ cart.total_amount }}</strong>
          </div>
          <button
            class="btn-primary w-100 mt-3"
            @click="handleCheckout"
            v-if="cart && cart.items && cart.items.length > 0"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cart-bg {
  min-height: 80vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}
.cart-card {
  background: #fff;
  border-radius: 1.2rem;
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  box-shadow: 0 2px 16px #ffb34722;
  padding: 2.2rem 2vw 1.2rem 2vw;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cart-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #FF4D33;
  text-align: center;
  margin-bottom: 8px;
}
.cart-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #fff7f0;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 12px 18px;
  box-shadow: 0 1px 8px rgba(255,77,51,0.07);
  border: 1.5px solid #eee;
}
.cart-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 10px;
  background: #f8fafc;
  box-shadow: 0 1px 8px #ffb34733;
}
.cart-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cart-prod-name {
  font-size: 1.1em;
  color: #FF4D33;
  font-weight: bold;
}
.cart-prod-price {
  color: #FF4D33;
  font-weight: bold;
}
.qty-control {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
  border-radius: 24px;
  background: #fff;
  padding: 2px 8px;
  min-width: 90px;
  gap: 8px;
  margin: 6px 0;
}
.qty-btn {
  background: none;
  border: none;
  color: #444;
  font-size: 1.3em;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
  background: #f3f3f3;
}
.qty-btn:not(:disabled):hover {
  background: #ffe3e3;
}
.qty-value {
  font-size: 1.1em;
  font-weight: bold;
  width: 32px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.estoque-info {
  font-size: 0.95em;
  color: #888;
  margin-left: 8px;
  font-style: italic;
}
.btn-remove {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: box-shadow 0.2s;
}
.btn-remove:hover {
  box-shadow: 0 2px 12px #ffb34744;
  background: #ffb347;
  color: #fff;
}
.cart-total {
  margin-top: 12px;
  font-size: 1.2em;
  color: #FF4D33;
  text-align: right;
  background: #fff7f0;
  border-radius: 8px;
  padding: 10px 18px;
  box-shadow: 0 1px 8px #ffb34733;
}
.btn-primary {
  background: linear-gradient(90deg, #4CAF50, #81C784);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}
.btn-primary:hover {
  background: #66BB6A;
  transform: translateY(-2px);
}
@media (max-width: 700px) {
  .cart-card {
    max-width: 98vw;
    padding: 1.2rem 2vw 0.8rem 2vw;
  }
  .cart-img {
    width: 50px;
    height: 50px;
  }
  .cart-item {
    padding: 8px 8px;
    gap: 10px;
  }
}
</style>

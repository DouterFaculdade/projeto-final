<template>
  <div class="detail-bg">
    <div class="detail-card" v-if="product">
      <img v-if="product.image_path" :src="`http://35.196.79.227:8000${product.image_path}`" :alt="product.name" class="detail-img" />
      <div class="detail-info">
        <h1>{{ product.name }}</h1>
        <p class="desc">{{ product.description }}</p>
        <div class="preco">Preço: <strong>R$ {{ product.price }}</strong></div>
        <div class="estoque">Estoque: {{ product.stock }}</div>
        <template v-if="product.stock > 0">
          <button class="btn-primary" @click="addToCart">Adicionar ao Carrinho</button>
        </template>
        <template v-else>
          <div class="produto-esgotado">Esgotado</div>
        </template>
      </div>
    </div>
    <div v-else class="text-center py-4">Carregando...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProductById } from '@/api/products';
import { addItemToCart } from '@/api/cart';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const route = useRoute();
const product = ref(null);

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    product.value = await getProductById(id);
  }
});

async function addToCart() {
  if (!product.value) return;
  try {
    const res = await addItemToCart({
      product_id: product.value.id,
      quantity: 1,
      unit_price: product.value.price
    });
    if (res.status === 204) {
      toast.success('Produto adicionado ao carrinho!');
    } else {
      toast.error('Erro ao adicionar ao carrinho!');
    }
  } catch {
    toast.error('Erro ao conectar com o servidor!');
  }
}
</script>

<style scoped>
.detail-bg {
  min-height: 80vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}
.detail-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 16px #ffb34722;
  padding: 32px 24px;
  display: flex;
  gap: 32px;
  align-items: center;
  max-width: 800px;
  width: 100%;
}
.detail-img {
  width: 220px;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 1px 8px #ffb34733;
}
.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preco {
  color: #FF4D33;
  font-size: 1.3em;
  font-weight: bold;
}
.desc {
  color: #444;
  font-size: 1.1em;
}
.estoque, .categoria {
  color: #888;
  font-size: 1em;
}
.btn-primary {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 18px;
  transition: box-shadow 0.2s;
}
.btn-primary:hover {
  box-shadow: 0 2px 12px #ffb34744;
}
.produto-esgotado {
  background: #ffe3e3;
  color: #FF4D33;
  font-weight: bold;
  border-radius: 8px;
  padding: 12px 0;
  width: 100%;
  text-align: center;
  margin-top: 18px;
  font-size: 1.1em;
  letter-spacing: 1px;
}
@media (max-width: 700px) {
  .detail-card {
    flex-direction: column;
    gap: 18px;
    padding: 18px 4vw;
  }
  .detail-img {
    width: 98vw;
    height: 180px;
    max-width: 98vw;
  }
}
</style>

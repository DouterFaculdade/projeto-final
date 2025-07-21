<template>
  <div class="produto-card" @click="goToDetail">
    <img v-if="product.image_path" :src="`http://35.196.79.227:8000${product.image_path}`" :alt="product.name" class="produto-img" />
    <div class="produto-info">
      <h3 class="produto-nome">{{ product.name }}</h3>
      <span class="preco">R$ {{ product.price }}</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const props = defineProps({ product: Object });
const router = useRouter();
function goToDetail() {
  router.push({ name: 'ProductDetail', params: { id: props.product.id } });
}
</script>

<style scoped>
.produto-card {
  background: #fff;
  border-radius: 18px;
  padding: 28px 18px 18px 18px;
  box-shadow: 0 1px 12px rgba(255,77,51,0.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid #eee;
  width: 320px;
  height: 380px;
  min-width: 320px;
  max-width: 320px;
  min-height: 380px;
  max-height: 380px;
  cursor: pointer;
  transition: box-shadow 0.2s, border 0.2s;
  justify-content: center;
}
.produto-card:hover {
  box-shadow: 0 4px 16px #ffb34733;
  border: 1.5px solid #FF4D33;
}
.produto-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 24px;
  background: #f8fafc;
}
.produto-info {
  text-align: center;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 18px;
}
.produto-nome {
  font-size: 1.18em;
  font-weight: 600;
  color: #222;
  margin: 0;
  max-width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preco {
  color: #FF4D33;
  font-weight: bold;
  font-size: 1.25em;
  margin-top: 6px;
}
</style>

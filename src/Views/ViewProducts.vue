<template>
  <div class="products-container">
    <h2 class="mb-4 text-center">Produtos da Categoria</h2>
    <div v-if="loading" class="text-center">Carregando produtos...</div>
    <div v-else-if="error" class="text-center text-danger">{{ error }}</div>
    <div v-else>
      <div v-if="products.length === 0" class="text-center">Nenhum produto encontrado nesta categoria.</div>
      <div v-else class="produtos-list">
        <div v-for="prod in products" :key="prod.id" class="produto-card">
          <img
            v-if="prod.image_path"
            :src="`http://35.196.79.227:8000${prod.image_path}`"
            alt="Imagem do produto"
            class="produto-img"
          />
          <h3>{{ prod.name }}</h3>
          <p>{{ prod.description }}</p>
          <div class="produto-info">
            <span>Preço: <strong>R$ {{ prod.price }}</strong></span><br />
            <span>Estoque: {{ prod.stock }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProductsByCategory } from '@/api/products';

const route = useRoute();
const products = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  const categoryId = route.params.id;
  if (!categoryId) {
    error.value = 'Categoria não especificada.';
    return;
  }
  loading.value = true;
  try {
    const result = await getProductsByCategory(categoryId);
    products.value = Array.isArray(result) ? result : [];
    console.log(`[Produtos] Sucesso: ${products.value.length} produtos carregados para a categoria ${categoryId}`);
  } catch (err) {
    error.value = 'Erro ao carregar produtos.';
    console.error('[Produtos] Erro ao buscar produtos da categoria:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.products-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 8px;
}
.produtos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}
.produto-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  min-width: 200px;
  max-width: 240px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}
.produto-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 10px;
}
.produto-info {
  margin-top: 8px;
  font-size: 1em;
  color: #333;
}
@media (max-width: 700px) {
  .produtos-list {
    flex-direction: column;
    align-items: center;
  }
  .produto-card {
    min-width: 90vw;
    max-width: 98vw;
  }
}
</style>
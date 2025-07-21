<script setup>
import { ref, onMounted } from 'vue';
import { getCategoriesByAdmin } from '@/api/categories';
import { getUserRole } from '@/api/auth';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { getProductsByCategory } from '@/api/products';

const router = useRouter();
const userId = ref(localStorage.getItem('user_id'));
const categories = ref([]);
const loading = ref(false);
const error = ref(null);
const showProducts = ref({}); // controla exibição dos produtos por categoria

onMounted(async () => {
  if (getUserRole() !== 'ADMIN') {
    toast.error('Acesso negado!');
    router.push('/');
    return;
  }
  loading.value = true;
  try {
    categories.value = await getCategoriesByAdmin(userId.value);
  } catch (err) {
    error.value = 'Erro ao buscar categorias do admin';
  } finally {
    loading.value = false;
  }
});

async function toggleVisibility(cat) {
  cat.visible = !cat.visible;
  // Aqui você faria uma chamada PUT/PATCH para atualizar a visibilidade no backend
  // Exemplo:
  // await fetch(`http://35.196.79.227:8000/categories/${cat.id}/visibility`, { method: 'PATCH', ... })
  toast.success(`Categoria "${cat.name}" agora está ${cat.visible ? 'visível' : 'oculta'} para clientes.`);
}

async function fetchProducts(catId) {
  if (!showProducts.value[catId]) {
    showProducts.value[catId] = { loading: true, items: [] };
    try {
      const result = await getProductsByCategory(catId);
      // Garante que o resultado é um array
      showProducts.value[catId].items = Array.isArray(result) ? result : [];
    } catch {
      showProducts.value[catId].items = [];
    } finally {
      showProducts.value[catId].loading = false;
    }
  } else {
    showProducts.value[catId] = null;
  }
}
</script>

<template>
  <section class="container py-5">
    <div class="card p-4 shadow" style="max-width: 900px; margin: 0 auto; border-radius: 1rem;">
      <h2 class="mb-4 text-center">Categorias criadas por você (Admin)</h2>
      <div v-if="loading" class="text-center mb-3">Carregando...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else>
        <div v-if="categories.length === 0">Nenhuma categoria encontrada.</div>
        <div v-else class="categorias-list">
          <div v-for="cat in categories" :key="cat.id" class="categoria-card">
            <img v-if="cat.image_path" :src="cat.image_path" alt="Imagem da categoria" class="categoria-img" />
            <h3>{{ cat.name }}</h3>
            <p>{{ cat.description }}</p>
            <small>ID: {{ cat.id }}</small>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-sm" :class="cat.visible ? 'btn-success' : 'btn-outline-secondary'" @click="toggleVisibility(cat)">
                {{ cat.visible ? 'Visível para clientes' : 'Oculta para clientes' }}
              </button>
              <button class="btn btn-sm btn-info" @click="fetchProducts(cat.id)">
                {{ showProducts[cat.id] ? 'Ocultar itens' : 'Ver itens' }}
              </button>
            </div>
            <div v-if="showProducts[cat.id]">
              <div v-if="showProducts[cat.id].loading">Carregando itens...</div>
              <div v-else>
                <div v-if="showProducts[cat.id].items.length === 0">Nenhum item cadastrado nesta categoria.</div>
                <ul>
                  <li v-for="prod in showProducts[cat.id].items" :key="prod.id" class="produto-item">
                    <img v-if="prod.image_path" :src="prod.image_path" alt="Imagem do produto" class="produto-img" />
                    <div>
                      <strong>{{ prod.name }}</strong> <br />
                      <span>Preço: R$ {{ prod.price }}</span> <br />
                      <span>Estoque: {{ prod.stock }}</span> <br />
                      <span>{{ prod.description }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: #fff;
}
.categorias-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: flex-start;
}
.categoria-card {
  background: #f8f8f8;
  border-radius: 16px;
  padding: 16px;
  min-width: 220px;
  max-width: 260px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}
.categoria-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 8px;
}
.btn-info {
  background: #17a2b8;
  color: #fff;
}
.btn-info:hover {
  background: #138496;
}
ul {
  margin-top: 8px;
  padding-left: 0;
  list-style: none;
}
li {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 4px;
  padding: 6px 10px;
  font-size: 0.95em;
}
.produto-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
}
.produto-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
</style>

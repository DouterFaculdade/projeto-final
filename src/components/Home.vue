<script setup>
import { ref, onMounted, computed } from 'vue'
import { getCategoriesByAdmin } from "@/api/categories";
import { getProducts, getProductsByCategory } from "@/api/products";
import { useRouter } from 'vue-router'

const router = useRouter()
const categories = ref([])
const products = ref([])
const loading = ref(false)
const error = ref(null)
const selectedCategory = ref(null)
const search = ref('')

onMounted(async () => {
  loading.value = true
  try {
    categories.value = await getCategoriesByAdmin(231)
    products.value = await getProducts()
  } catch (err) {
    error.value = 'Erro ao carregar dados'
  } finally {
    loading.value = false
  }
})

async function handleCategoryClick(cat) {
  selectedCategory.value = cat
  loading.value = true
  try {
    products.value = await getProductsByCategory(cat.id)
  } catch (err) {
    error.value = 'Erro ao carregar produtos'
  } finally {
    loading.value = false
  }
}

function handleAllProducts() {
  selectedCategory.value = null
  loading.value = true
  getProducts().then(res => {
    products.value = res
    loading.value = false
  })
}

const filteredProducts = computed(() => {
  if (!search.value) return products.value
  return products.value.filter(prod =>
    prod.name.toLowerCase().includes(search.value.toLowerCase()) ||
    (prod.description && prod.description.toLowerCase().includes(search.value.toLowerCase()))
  )
})
</script>

<template>
  <div class="home-bg">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">Encontre os Melhores <span class="gradient-text">Produtos</span> Aqui</h1>
        <p class="hero-desc">Descubra uma curadoria especial dos melhores produtos com qualidade garantida e preços incríveis.</p>
        <div class="hero-actions">
          <button class="btn-primary" @click="router.push('/login')">Começar Agora</button>
          <button class="btn-outline" @click="handleAllProducts">Ver Produtos</button>
        </div>
        <div class="hero-stats">
          <div>
            <div class="stat-value">1K+</div>
            <div class="stat-label">Produtos</div>
          </div>
          <div>
            <div class="stat-value">10K+</div>
            <div class="stat-label">Clientes</div>
          </div>
          <div>
            <div class="stat-value">4.9</div>
            <div class="stat-label">Avaliação</div>
          </div>
          <div>
            <div class="stat-value">24h</div>
            <div class="stat-label">Entrega</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Produtos Section -->
    <section class="products-section">
      <div class="products-header">
        <h2 class="products-title">Produtos em Destaque</h2>
        <div class="products-search">
          <input v-model="search" type="text" class="search-bar" placeholder="Buscar produtos..." />
        </div>
      </div>
      <div class="products-main">
        <aside class="sidebar">
          <h3 class="sidebar-title">Categorias</h3>
          <ul class="sidebar-list">
            <li :class="{selected: !selectedCategory}" @click="handleAllProducts">Todos</li>
            <li
              v-for="cat in categories"
              :key="cat.id"
              :class="{selected: selectedCategory && selectedCategory.id === cat.id}"
              @click="handleCategoryClick(cat)"
            >
              <span>{{ cat.name }}</span>
            </li>
          </ul>
        </aside>
        <main class="main-content">
          <div v-if="loading" class="text-center py-4">Carregando...</div>
          <div v-else-if="error" class="text-center text-danger">{{ error }}</div>
          <div v-else>
            <div v-if="filteredProducts.length === 0" class="text-center">Nenhum produto encontrado.</div>
            <div v-else class="produtos-grid">
              <div v-for="prod in filteredProducts" :key="prod.id" class="produto-card">
                <img
                  v-if="prod.image_path"
                  :src="`http://35.196.79.227:8000${prod.image_path}`"
                  :alt="prod.name"
                  class="produto-img"
                />
                <div class="produto-info">
                  <h3>{{ prod.name }}</h3>
                  <p>{{ prod.description }}</p>
                  <span class="preco">R$ {{ prod.price }}</span>
                </div>
                <button class="btn-add" @click="$emit('add-to-cart', prod)">Adicionar ao Carrinho</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-bg {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}
.hero-section {
  position: relative;
  background: linear-gradient(120deg, #ffecd2 0%, #fcb69f 100%);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0 32px 0;
  overflow: hidden;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
  opacity: 0.18;
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}
.hero-title {
  font-size: 2.2em;
  font-weight: bold;
  margin-bottom: 12px;
}
.gradient-text {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}
.hero-desc {
  font-size: 1.1em;
  color: #444;
  margin-bottom: 18px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}
.btn-primary {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.btn-primary:hover {
  box-shadow: 0 2px 12px #ffb34744;
}
.btn-outline {
  background: #fff;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-outline:hover {
  background: #FF4D33;
  color: #fff;
}
.hero-stats {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}
.stat-value {
  font-size: 1.3em;
  font-weight: bold;
  color: #FF4D33;
}
.stat-label {
  font-size: 0.95em;
  color: #444;
}
.products-section {
  width: 100%;
  background: #f8fafc;
  padding: 32px 0 24px 0;
}
.products-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 1200px;
  margin: 0 auto 18px auto;
  padding: 0 2vw;
}
.products-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #FF4D33;
}
.products-search {
  margin-top: 8px;
}
.search-bar {
  width: 240px;
  max-width: 80vw;
  padding: 8px 16px;
  border-radius: 24px;
  border: 1px solid #eee;
  font-size: 1em;
  background: #fff;
}
.products-main {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 18px;
  padding: 0 2vw;
}
.sidebar {
  width: 160px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 16px 8px;
  min-width: 120px;
  max-height: 420px;
  overflow-y: auto;
}
.sidebar-title {
  font-size: 1.1em;
  font-weight: bold;
  color: #FF4D33;
  margin-bottom: 10px;
}
.sidebar-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar-list li {
  padding: 7px 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 2px;
  transition: background 0.15s;
}
.sidebar-list li.selected,
.sidebar-list li:hover {
  background: #ffe3e3;
}
.main-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.produtos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  width: 100%;
}
.produto-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #eee;
  min-width: 160px;
  max-width: 220px;
}
.produto-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}
.produto-info {
  text-align: center;
}
.preco {
  color: #FF4D33;
  font-weight: bold;
  font-size: 1.1em;
}
.btn-add {
  margin-top: 10px;
  background: #FF4D33;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 18px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add:hover {
  background: #ffb347;
  color: #fff;
}
@media (max-width: 900px) {
  .products-main {
    flex-direction: column;
    gap: 8px;
  }
  .sidebar {
    width: 100vw;
    min-width: 100vw;
    border-radius: 0;
    border-bottom: 1px solid #eee;
    border-right: none;
    margin-bottom: 8px;
    max-height: 80px;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .sidebar-list {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  .sidebar-list li {
    min-width: 80px;
    font-size: 0.95em;
    text-align: center;
  }
}
@media (max-width: 600px) {
  .hero-title {
    font-size: 1.2em;
  }
  .products-header {
    padding: 0 1vw;
  }
  .products-main {
    padding: 0 1vw;
  }
  .produtos-grid {
    gap: 8px;
  }
  .produto-card {
    min-width: 98vw;
    max-width: 98vw;
    padding: 8px 2vw;
  }
  .produto-img {
    width: 60px;
    height: 60px;
  }
}
</style>

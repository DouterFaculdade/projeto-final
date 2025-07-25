<script setup>
import { ref, onMounted, computed } from 'vue'
import { getCategoriesByAdmin } from "@/api/categories";
import { getProductsByAdminUser231, getProductsByCategory } from "@/api/products";
import { addItemToCart, getCartItems, updateCartItemQuantity } from "@/api/cart";
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { getToken } from '@/api/auth';

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
    products.value = await getProductsByAdminUser231()
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
    // Filtra produtos da categoria apenas entre os criados pelo admin 231
    const allAdminProducts = await getProductsByAdminUser231()
    products.value = allAdminProducts.filter(prod => prod.category_id === cat.id)
  } catch (err) {
    error.value = 'Erro ao carregar produtos'
  } finally {
    loading.value = false
  }
}

function handleAllProducts() {
  selectedCategory.value = null
  loading.value = true
  getProductsByAdminUser231().then(res => {
    products.value = res
    loading.value = false
  })
}

function goToProduct(prod) {
  router.push(`/product/${prod.id}`);
}

async function handleAddToCart(prod) {
  if (!getToken()) {
    toast.info('Você precisa estar logado para usar o carrinho!');
    return;
  }
  try {
    const cart = await getCartItems();
    const existing = cart.items?.find(item => item.product_id === prod.id);
    if (existing) {
      // Só permite aumentar até o estoque máximo
      if (existing.quantity >= prod.stock) {
        // Removido toast de quantidade máxima
        return;
      }
      const newQty = existing.quantity + 1;
      await updateCartItemQuantity(prod.id, newQty);
      toast.success('Quantidade atualizada no carrinho!');
    } else {
      // Só adiciona se houver estoque
      if (prod.stock < 1) {
        // Removido toast de produto esgotado
        return;
      }
      const res = await addItemToCart({
        product_id: prod.id,
        quantity: 1,
        unit_price: prod.price
      });
      if (res.status === 204) {
        toast.success('Produto adicionado ao carrinho!');
      }
      // Removido toast de erro ao adicionar ao carrinho
    }
  } catch (err) {
    toast.error(err.message || 'Erro ao conectar com o servidor!');
  }
}

const filteredProducts = computed(() => {
  let arr = !search.value
    ? products.value
    : products.value.filter(prod =>
        prod.name.toLowerCase().includes(search.value.toLowerCase()) ||
        (prod.description && prod.description.toLowerCase().includes(search.value.toLowerCase()))
      );
  // Produtos com estoque > 0 primeiro, esgotados por último
  return [
    ...arr.filter(prod => prod.stock > 0),
    ...arr.filter(prod => prod.stock <= 0)
  ];
})
</script>

<template>
  <div class="home-bg">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">Encontre as Melhores <span class="gradient-text">Roupas</span> Aqui</h1>
        <p class="hero-desc">Descubra seu novo estilo de roupa favorita e encontre as melhores opções de roupas.</p>
        <div class="hero-actions">
          <button class="btn-primary" @click="router.push('/login')">Fazer Login</button>
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
      
        <div class="products-search">
          <input v-model="search" type="text" class="search-bar" placeholder="Buscar produtos..." />
        </div>
      </div>
      <div class="products-main">
        <aside class="sidebar">
          <h3 class="sidebar-title gradient-text">CATEGORIAS</h3>
          <div class="sidebar-list">
            <div
              class="sidebar-cat"
              :class="{selected: !selectedCategory}"
              @click="handleAllProducts"
            >Todos</div>
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="sidebar-cat"
              :class="{selected: selectedCategory && selectedCategory.id === cat.id}"
              @click="handleCategoryClick(cat)"
            >
              {{ cat.name }}
            </div>
          </div>
        </aside>
        <main class="main-content">
          <div v-if="loading" class="text-center py-4">Carregando...</div>
          <div v-else-if="error" class="text-center text-danger">{{ error }}</div>
          <div v-else>
            <div v-if="filteredProducts.length === 0" class="text-center">Nenhum produto encontrado.</div>
            <div v-else class="produtos-grid">
              <div
                v-for="prod in filteredProducts"
                :key="prod.id"
                class="produto-card"
                @click="goToProduct(prod)"
                style="cursor:pointer;"
              >
                <img
                  v-if="prod.image_path"
                  :src="`http://35.196.79.227:8000${prod.image_path}`"
                  alt="Imagem do produto"
                  class="produto-img"
                />
                <h3>{{ prod.name }}</h3>
                
                <div class="produto-info">
                  <span class="gradient-text">R$ {{ prod.price }}</span> 
                  <span> <strong></strong></span><br />
              
                </div>
                <template v-if="prod.stock > 0">
                  <button class="btn-primary" @click.stop="handleAddToCart(prod)">Adicionar ao Carrinho</button>
                </template>
                <template v-else>
                  <div class="produto-esgotado">Esgotado</div>
                </template>
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
  max-width: 1920px;
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
  max-width: 1920px;
  margin: 0 auto;
  gap: 18px;
  padding: 0 2vw;
  flex-wrap: wrap;
  align-items: flex-start;
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
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 10px;
  /* Removido color fixa, usa gradiente-text */
}
.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0;
}
.sidebar-cat {
  padding: 7px 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 2px;
  transition: background 0.15s, color 0.15s;
  text-align: left;
  background: none;
  color: #444;
  border: none;
  outline: none;
  font-weight: 500;
}
.sidebar-cat.selected,
.sidebar-cat:hover {
  background: #ffe3e3;
  color: #FF4D33;
}
.main-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.produtos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 32px;
  width: 100%;
  justify-items: stretch;
  margin: 0;


}
@media (max-width: 1200px) {
  .products-main {
    max-width: 300px;
    padding: 0 1vw;
    gap: 12px;
  }
  .produtos-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 300fr));
    gap: 18px;
  }
}
@media (max-width: 900px) {
  .products-main {
    
    gap: 8px;
    max-width: 100vw;
    padding: 0 1vw;
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
  .produtos-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 300fr));
    gap: 12px;
    width: 100%;
    
  }
  .produto-card {
    min-width: 160px;
    max-width: 98vw;
    padding: 10px 2vw;
    box-sizing: border-box;
  }
  .produto-img {
    width: 70px;
    height: 70px;
  }
}
@media (max-width: 600px) {
  .products-header {
    padding: 0 1vw;
  }
  .products-main {
    padding: 0 1vw;
    gap: 4px;
  }
  .produtos-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    width: 100%;
  }
  .produto-card {
    min-width: 98vw;
    max-width: 98vw;
    padding: 8px 2vw;
    box-sizing: border-box;
  }
  .produto-img {
    width: 60px;
    height: 60px;
  }
}
.produto-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px 12px;
  box-shadow: 0 1px 8px rgba(255,77,51,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid #eee;
  min-width: 0;
  max-width: 100%;
  cursor: pointer;
  transition: box-shadow 0.18s, border 0.18s, transform 0.12s;
  box-sizing: border-box;
}
.produto-card:hover {
  box-shadow: 0 4px 18px #ffb34733;
  border: 1.5px solid #FF4D33;
  transform: translateY(-2px) scale(1.03);
}
.produto-img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}
.produto-info {
  text-align: center;
  width: 100%;
}
.produto-info h3 {
  font-size: 1.1em;
  color: #FF4D33;
  margin-bottom: 4px;
  font-weight: bold;
}
.produto-desc {
  font-size: 0.98em;
  color: #444;
  margin-bottom: 6px;
  min-height: 36px;
  max-height: 36px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preco {
  color: #FF4D33;
  font-weight: bold;
  font-size: 1.15em;
}
.produto-esgotado {
  background: #ffe3e3;
  color: #FF4D33;
  font-weight: bold;
  border-radius: 8px;
  padding: 10px 0;
  width: 100%;
  text-align: center;
  margin-top: 8px;
  font-size: 1em;
  letter-spacing: 1px;
}
</style>

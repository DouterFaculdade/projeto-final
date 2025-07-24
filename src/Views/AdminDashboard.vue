<script setup>
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { getUserRole, logout, getToken } from '@/api/auth';
import { useRouter } from 'vue-router';
import { getCategoriesByAdmin231 } from '@/api/categories';
import { getProductsByCategory } from '@/api/products';
import ProductForm from '@/components/ProductForm.vue';

const router = useRouter();
const userRole = ref(localStorage.getItem('user_role') || '');
const activeTab = ref('categories');
const allOrders = ref([]);
const loadingAllOrders = ref(false);
const errorAllOrders = ref(null);
const allOrdersAddressesMap = ref({});

// Categorias
const categories = ref([]);
const loadingCategories = ref(false);
const errorCategories = ref(null);

// Produtos
const selectedCategory = ref(null);
const products = ref([]);
const loadingProducts = ref(false);
const errorProducts = ref(null);

// Formulário de categoria
const newCategory = ref({ name: '', description: '', image: null });
const loadingAddCategory = ref(false);

// Formulário de produto
const newProduct = ref({ name: '', price: '', stock: '', category_id: '', image: null, description: '', discount: '' });
const loadingAddProduct = ref(false);

const showProductForm = ref(false);
const isEditProduct = ref(false);
const editingProduct = ref(null);

const showDeleteModal = ref(false);
const productToDelete = ref(null);

onMounted(() => {
  if (userRole.value !== 'ADMIN') {
    toast.error('Acesso restrito!');
    router.push('/');
  } else {
    fetchCategories();
    fetchAllOrdersAddressesMap();
    fetchAllOrders();
  }
});

function handleLogout() {
  logout();
  toast.success('Logout realizado!');
  router.push('/login');
}

async function fetchCategories() {
  loadingCategories.value = true;
  try {
    categories.value = await getCategoriesByAdmin231();
  } catch (err) {
    errorCategories.value = 'Erro ao buscar categorias';
  } finally {
    loadingCategories.value = false;
  }
}

async function fetchAllOrders() {
  loadingAllOrders.value = true;
  try {
    const res = await fetch('http://35.196.79.227:8000/orders/all/231', {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      allOrders.value = Array.isArray(data) ? data : [];
      errorAllOrders.value = null;
    } else {
      errorAllOrders.value = 'Erro ao buscar pedidos!';
      allOrders.value = [];
    }
  } catch {
    errorAllOrders.value = 'Erro ao conectar com o servidor!';
    allOrders.value = [];
  } finally {
    loadingAllOrders.value = false;
  }
}

async function fetchAllOrdersAddressesMap() {
  try {
    const res = await fetch('http://35.196.79.227:8000/addresses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.ok) {
      const arr = await res.json();
      allOrdersAddressesMap.value = {};
      arr.forEach(addr => {
        allOrdersAddressesMap.value[addr.id] = addr;
      });
    }
  } catch {
    allOrdersAddressesMap.value = {};
  }
}

async function handleCategoryClick(cat) {
  selectedCategory.value = cat;
  loadingProducts.value = true;
  errorProducts.value = null;
  // Preenche o campo category_id do formulário de produto com a categoria selecionada
  newProduct.value.category_id = cat.id;
  try {
    products.value = await getProductsByCategory(cat.id);
  } catch (err) {
    errorProducts.value = 'Erro ao buscar produtos';
    products.value = [];
  } finally {
    loadingProducts.value = false;
  }
}

function openAddProduct() {
  isEditProduct.value = false;
  editingProduct.value = null;
  showProductForm.value = true;
  // Se estiver em uma categoria, já preenche o category_id
  if (selectedCategory.value) {
    newProduct.value.category_id = selectedCategory.value.id;
  }
}

function handleEditProduct(prod) {
  isEditProduct.value = true;
  // Preenche todos os campos do formulário com os dados atuais do produto
  editingProduct.value = {
    id: prod.id,
    name: prod.name,
    price: prod.price,
    stock: prod.stock,
    category_id: prod.category_id || (prod.category && prod.category.id),
    description: prod.description,
    discount: prod.discount || '',
    image: null // Não edita imagem via PUT
  };
  showProductForm.value = true;
}

function handleProductFormSave(data) {
  loadingAddProduct.value = true;
  let url = 'http://35.196.79.227:8000/products';
  let method = 'POST';
  let body;
  let headers = { 'Authorization': `Bearer ${getToken()}` };

  if (isEditProduct.value && editingProduct.value && editingProduct.value.id) {
    // Atualiza dados gerais do produto
    url = `http://35.196.79.227:8000/products/${editingProduct.value.id}`;
    method = 'PUT';
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      name: data.name,
      price: Number(data.price),
      category_id: Number(data.category_id),
      description: data.description
    });

    // Primeiro atualiza dados gerais
    fetch(url, {
      method,
      headers,
      body,
    })
      .then(async response => {
        if (response.ok) {
          // Agora atualiza o estoque se mudou
          if (typeof data.stock !== 'undefined' && data.stock !== editingProduct.value.stock) {
            fetch(`http://35.196.79.227:8000/products/${editingProduct.value.id}/stock`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
              },
              body: JSON.stringify({ stock: Number(data.stock) })
            })
              .then(res => {
                if (!res.ok) {
                  toast.error('Erro ao atualizar estoque!');
                }
              })
              .catch(() => toast.error('Erro ao conectar com o servidor!'));
          }
          const updatedProduct = await response.json();
          toast.success('Produto editado com sucesso!');
          showProductForm.value = false;
          editingProduct.value = null;
          // Atualiza a lista de produtos da categoria correta
          if (updatedProduct.category_id) {
            products.value = await getProductsByCategory(updatedProduct.category_id);
            if (selectedCategory.value && selectedCategory.value.id !== updatedProduct.category_id) {
              selectedCategory.value = categories.value.find(cat => cat.id === updatedProduct.category_id) || selectedCategory.value;
            }
          } else if (selectedCategory.value) {
            products.value = await getProductsByCategory(selectedCategory.value.id);
          }
        } else {
          let msg = 'Erro ao salvar produto!';
          if (response.status === 422) {
            const data = await response.json();
            msg = data.detail?.[0]?.msg || msg;
          }
          toast.error(msg);
        }
      })
      .catch(() => toast.error('Erro ao conectar com o servidor!'))
      .finally(() => loadingAddProduct.value = false);
    return;
  }
  // POST: envia FormData (para imagem)
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('price', data.price);
  formData.append('stock', data.stock);
  formData.append('category_id', data.category_id || (selectedCategory.value && selectedCategory.value.id));
  formData.append('description', data.description);
  if (data.image) formData.append('image', data.image);
  if (data.discount) formData.append('discount', data.discount);
  body = formData;

  fetch(url, {
    method,
    headers,
    body,
  })
    .then(async response => {
      if (response.ok) {
        const updatedProduct = await response.json();
        toast.success(isEditProduct.value ? 'Produto editado com sucesso!' : 'Produto cadastrado com sucesso!');
        showProductForm.value = false;
        editingProduct.value = null;
        // Atualiza a lista de produtos da categoria correta
        if (isEditProduct.value && updatedProduct.category_id) {
          products.value = await getProductsByCategory(updatedProduct.category_id);
          if (selectedCategory.value && selectedCategory.value.id !== updatedProduct.category_id) {
            selectedCategory.value = categories.value.find(cat => cat.id === updatedProduct.category_id) || selectedCategory.value;
          }
        } else if (selectedCategory.value) {
          products.value = await getProductsByCategory(selectedCategory.value.id);
        }
      } else {
        let msg = 'Erro ao salvar produto!';
        if (response.status === 422) {
          const data = await response.json();
          msg = data.detail?.[0]?.msg || msg;
        }
        toast.error(msg);
      }
    })
    .catch(() => toast.error('Erro ao conectar com o servidor!'))
    .finally(() => loadingAddProduct.value = false);
}

function openDeleteModal(prod) {
  productToDelete.value = prod;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  productToDelete.value = null;
}

async function confirmDeleteProduct() {
  if (!productToDelete.value) return;
  try {
    const res = await fetch(`http://35.196.79.227:8000/products/${productToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.status === 204) {
      toast.success('Produto excluído com sucesso!');
      if (selectedCategory.value) {
        products.value = await getProductsByCategory(selectedCategory.value.id);
      }
    } else {
      let msg = 'Erro ao excluir produto!';
      if (res.status === 422) {
        const data = await res.json();
        msg = data.detail?.[0]?.msg || msg;
      }
      toast.error(msg);
    }
  } catch {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    closeDeleteModal();
  }
}

function handleProductFormCancel() {
  showProductForm.value = false;
  editingProduct.value = null;
  isEditProduct.value = false;
}

async function handleAddCategory(e) {
  e.preventDefault();
  loadingAddCategory.value = true;
  try {
    const formData = new FormData();
    formData.append('name', newCategory.value.name);
    formData.append('description', newCategory.value.description);
    if (newCategory.value.image) formData.append('image', newCategory.value.image);
    formData.append('admin_id', '231'); // Adiciona o id do admin

    const response = await fetch('http://35.196.79.227:8000/categories', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    if (response.status === 201) {
      toast.success('Categoria criada com sucesso!');
      newCategory.value = { name: '', description: '', image: null };
      fetchCategories();
    } else {
      toast.error('Erro ao criar categoria!');
    }
  } catch (err) {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    loadingAddCategory.value = false;
  }
}
</script>

<template>
  <section class="admin-bg">
    <div class="admin-card">
      <h2 class="admin-title">Painel do Administrador</h2>
      <div class="admin-tabs">
        <button class="tab-btn" :class="{active: activeTab==='categories'}" @click="activeTab='categories'">Categorias</button>
        <button class="tab-btn" :class="{active: activeTab==='addCategory'}" @click="activeTab='addCategory'">Adicionar Categoria</button>
        <button class="tab-btn" :class="{active: activeTab==='allOrders'}" @click="activeTab='allOrders'">Todos os Pedidos</button>
      </div>
      <div v-if="activeTab==='categories'">
        <div class="admin-section">
          <h4 class="section-title">Categorias do Admin</h4>
          <button class="btn-primary" @click="openAddProduct">Adicionar Produto</button>
        </div>
        <div v-if="loadingCategories" class="text-center py-4">Carregando...</div>
        <div v-else-if="errorCategories" class="text-center text-danger">{{ errorCategories }}</div>
        <div v-else>
          <div v-if="categories.length === 0" class="text-center">Nenhuma categoria cadastrada.</div>
          <div class="categorias-list">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="categoria-card"
              :class="{selected: selectedCategory && selectedCategory.id === cat.id}"
              @click="handleCategoryClick(cat)"
            >
              <img
                v-if="cat.image_path"
                :src="`http://35.196.79.227:8000${cat.image_path}`"
                alt="Imagem da categoria"
                class="categoria-img"
              />
              <h3>{{ cat.name }}</h3>
              <p>{{ cat.description }}</p>
              <span v-if="selectedCategory && selectedCategory.id === cat.id" class="badge-selected">Selecionada</span>
            </div>
          </div>
        </div>
        <hr v-if="selectedCategory" class="my-4" />
        <div v-if="selectedCategory">
          <h4 class="section-title">Produtos da Categoria: <span class="text-primary">{{ selectedCategory.name }}</span></h4>
          <div v-if="loadingProducts" class="text-center py-4">Carregando produtos...</div>
          <div v-else-if="errorProducts" class="text-center text-danger">{{ errorProducts }}</div>
          <div v-else>
            <div v-if="products.length === 0" class="text-center">Nenhum produto cadastrado nesta categoria.</div>
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
                <div class="d-flex gap-2 mt-2">
                  <button class="btn-outline" @click="handleEditProduct(prod)">Editar</button>
                  <button class="btn-delete" @click="openDeleteModal(prod)">Excluir</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductForm
          v-if="showProductForm"
          :show="showProductForm"
          :isEdit="isEditProduct"
          :product="editingProduct"
          :categories="categories"
          :loading="loadingAddProduct"
          @save="handleProductFormSave"
          @cancel="handleProductFormCancel"
        />

        <!-- Modal de confirmação de exclusão -->
        <div v-if="showDeleteModal" class="modal-bg" @click.self="closeDeleteModal">
          <div class="modal-content modal-orange">
            <h4 class="mb-3" style="color:#FF4D33;">Confirmar Exclusão</h4>
            <p class="mb-2" style="color:#444;">
              Tem certeza que deseja excluir o produto <strong>{{ productToDelete?.name }}</strong>?
            </p>
            <div class="d-flex gap-2 mt-3">
              <button class="btn-delete w-100" @click="confirmDeleteProduct">Excluir</button>
              <button class="btn-cancel w-100" @click="closeDeleteModal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab==='addCategory'">
        <div class="admin-section">
          <h4 class="section-title">Adicionar Nova Categoria</h4>
          <form @submit="handleAddCategory" enctype="multipart/form-data" class="admin-form">
            <div class="form-group">
              <label>Nome</label>
              <input v-model="newCategory.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Descrição</label>
              <textarea v-model="newCategory.description" class="form-input" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Imagem</label>
              <input type="file" class="form-input" @change="e => newCategory.image = e.target.files[0]" accept="image/*" />
            </div>
            <button class="btn-primary w-100" type="submit" :disabled="loadingAddCategory">
              {{ loadingAddCategory ? 'Adicionando...' : 'Adicionar Categoria' }}
            </button>
          </form>
        </div>
      </div>
      <div v-else-if="activeTab==='allOrders'">
        <h3 class="mb-3" style="color:#FF4D33;">Todos os Pedidos</h3>
        <div v-if="loadingAllOrders" class="text-center py-4">Carregando pedidos...</div>
        <div v-else-if="errorAllOrders" class="text-danger text-center">{{ errorAllOrders }}</div>
        <div v-else>
          <div v-if="allOrders.length === 0" class="text-center">Nenhum pedido encontrado.</div>
          <div v-else>
            <div v-for="order in allOrders" :key="order.id" class="order-card">
              <div class="order-header">
                <span><strong>Pedido #{{ order.id }}</strong></span>
                <span>Status: <strong>{{ order.status }}</strong></span>
                <span>Data: {{ new Date(order.order_date).toLocaleString() }}</span>
                <span><strong>Usuário ID:</strong> {{ order.user_id }}</span>
              </div>
              <div class="order-address">
                <template v-if="allOrdersAddressesMap[order.address_id]">
                  <span>
                    <strong>Endereço:</strong>
                    {{ allOrdersAddressesMap[order.address_id].street }},
                    {{ allOrdersAddressesMap[order.address_id].number }} -
                    {{ allOrdersAddressesMap[order.address_id].city }} ({{ allOrdersAddressesMap[order.address_id].state }})
                    - {{ allOrdersAddressesMap[order.address_id].zip }},
                    {{ allOrdersAddressesMap[order.address_id].country }}
                  </span>
                </template>
                <template v-else>
                  <span><strong>Endereço ID:</strong> {{ order.address_id }}</span>
                </template>
              </div>
              <div class="order-total" style="margin-bottom:8px;">
                <strong>Total do Pedido:</strong>
                R$
                {{
                  order.products && order.products.length
                    ? order.products.reduce((sum, prod) => sum + Number(prod.price || 0), 0).toFixed(2)
                    : '0.00'
                }}
              </div>
              <div class="order-products">
                <h5>Produtos:</h5>
                <ul>
                  <li v-for="prod in order.products" :key="prod.name + prod.price" class="order-prod-item">
                    <img v-if="prod.image_path" :src="`http://35.196.79.227:8000${prod.image_path}`" alt="Imagem do produto" class="order-prod-img" />
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
      <div class="admin-footer">
        <router-link class="btn-outline" to="/">Voltar para Home</router-link>
        <button class="btn-logout" @click="handleLogout">Logout</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-bg {
  min-height: 90vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-card {
  background: #fff;
  border-radius: 1.2rem;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  box-shadow: 0 2px 16px rgba(255,77,51,0.08);
  padding: 2.2rem 2vw 1.2rem 2vw;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.admin-title {
  font-size: 2em;
  font-weight: bold;
  color: #FF4D33;
  text-align: center;
  margin-bottom: 8px;
}
.admin-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
}
.tab-btn {
  background: #f8fafc;
  border: none;
  border-radius: 8px 8px 0 0;
  padding: 8px 18px;
  font-size: 1em;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.tab-btn.active, .tab-btn:hover {
  background: #FF4D33;
  color: #fff;
}
.admin-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.section-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #FF4D33;
}
.categorias-list, .produtos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-start;
  margin-bottom: 12px;
}
.categoria-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  width: 100%;
  max-width: 220px;
  min-width: 140px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border 0.2s, box-shadow 0.2s;
}
.categoria-card.selected {
  border: 2px solid #FF4D33;
}
.categoria-img, .produto-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.produto-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  width: 100%;
  max-width: 220px;
  min-width: 140px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  border: 1.5px solid #eee;
}
.produto-info {
  margin-top: 6px;
  font-size: 0.95em;
  color: #333;
  text-align: center;
}
.text-primary {
  color: #FF4D33;
  font-weight: bold;
}
.badge-selected {
  background: #FF4D33;
  color: #fff;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 0.95em;
  margin-top: 4px;
}
.btn-primary {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
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
  padding: 8px 18px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-left: 8px;
}
.btn-outline:hover {
  background: #FF4D33;
  color: #fff;
}
.btn-logout {
  background: #FF4D33;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;
}
.btn-logout:hover {
  background: #ffb347;
  color: #fff;
}
.btn-delete {
  background: #fff;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s, color 0.2s;
}
.btn-delete:hover {
  background: #FF4D33;
  color: #fff;
}
.btn-cancel {
  background: #fff;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-cancel:hover {
  background: #FF4D33;
  color: #fff;
}
.modal-bg {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 1rem;
  padding: 32px 24px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 2px 16px rgba(255,77,51,0.12);
}
.modal-orange {
  border: 2px solid #FF4D33;
}
.order-card {
  background: #fff7f0;
  border-radius: 12px;
  padding: 18px 14px;
  margin-bottom: 18px;
  box-shadow: 0 1px 8px #ffb34733;
}
.order-header {
  display: flex;
  gap: 18px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 1em;
  color: #444;
}
.order-address {
  font-size: 0.98em;
  color: #888;
  margin-bottom: 8px;
  display: flex;
  gap: 18px;
}
.order-products h5 {
  color: #FF4D33;
  margin-bottom: 6px;
}
.order-products ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.order-prod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
}
.order-prod-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
@media (max-width: 900px) {
  .admin-card {
    padding: 1.2rem 1vw 0.8rem 1vw;
  }
  .categorias-list, .produtos-list {
    gap: 8px;
  }
  .categoria-card, .produto-card {
    max-width: 48vw;
    min-width: 140px;
    padding: 8px 4px;
  }
}
@media (max-width: 600px) {
  .admin-card {
    padding: 0.5rem 0.5vw 0.5rem 0.5vw;
  }
  .categorias-list, .produtos-list {
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .categoria-card, .produto-card {
    max-width: 98vw;
    min-width: 98vw;
    padding: 8px 2vw;
  }
  .admin-form {
    padding: 8px 2vw;
  }
  .categoria-img, .produto-img {
    width: 60px;
    height: 60px;
  }
}
</style>

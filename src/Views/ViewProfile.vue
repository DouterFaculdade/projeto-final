<script setup>
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { useRouter } from 'vue-router';
import { getToken } from '@/api/auth';

const router = useRouter();
const loading = ref(false);
const editing = ref(false);
const user = ref({ name: '', email: '', id: '', role: '', image_path: '' });
const originalUser = ref({});
const newPassword = ref("");
const showPasswordModal = ref(false);
const passwordLoading = ref(false);
const passwordError = ref("");
const newPasswordValue = ref("");
const imageUploadLoading = ref(false);
const imageUploadError = ref("");
const imagePreview = ref("");
const imageFile = ref(null);
const addresses = ref([])
const showAddressForm = ref(false)
const editingAddress = ref(null)
const addressForm = ref({ street: '', number: '', zip: '', city: '', state: '', country: '' })
const addressLoading = ref(false)
const selectedAddressId = ref(null)
const activeTab = ref('info');
const orders = ref([]);
const loadingOrders = ref(false);
const errorOrders = ref(null);
const addressesMap = ref({});
const GUTS_AVATAR = 'https://live.staticflickr.com/2038/2837357312_5582526df6_m.jpg';

// Busca todos os endereços do usuário e monta um mapa id->endereço
async function fetchAddressesMap() {
  try {
    const res = await fetch('http://35.196.79.227:8000/addresses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.ok) {
      const arr = await res.json();
      addressesMap.value = {};
      arr.forEach(addr => {
        addressesMap.value[addr.id] = addr;
      });
    }
  } catch {
    addressesMap.value = {};
  }
}

async function fetchProfile() {
  loading.value = true;
  try {
    const response = await fetch('http://35.196.79.227:8000/users/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        'accept': 'application/json',
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      user.value = { ...data };
      originalUser.value = { ...data };
    } else {
      toast.error('Erro ao carregar perfil!');
    }
  } catch (err) {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    loading.value = false;
  }
}

async function fetchAddresses() {
  try {
    const res = await fetch('http://35.196.79.227:8000/addresses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (res.ok) addresses.value = await res.json()
    else addresses.value = []
  } catch {
    addresses.value = []
  }
}

async function fetchOrders() {
  loadingOrders.value = true;
  try {
    const res = await fetch('http://35.196.79.227:8000/orders/', {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      orders.value = Array.isArray(data) ? data : [];
      errorOrders.value = null;
    } else {
      errorOrders.value = 'Erro ao buscar pedidos!';
      orders.value = [];
    }
  } catch {
    errorOrders.value = 'Erro ao conectar com o servidor!';
    orders.value = [];
  } finally {
    loadingOrders.value = false;
  }
}

function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

async function uploadProfileImage() {
  if (!imageFile.value) return true;
  imageUploadLoading.value = true;
  imageUploadError.value = "";
  try {
    const formData = new FormData();
    formData.append('image', imageFile.value);
    // Tenta endpoint /users/image (mais comum em FastAPI)
    let response = await fetch('http://35.196.79.227:8000/users/image', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'accept': 'application/json',
      },
      body: formData,
    });
    // Se não existir, tenta /users/me/image
    if (response.status === 404) {
      response = await fetch('http://35.196.79.227:8000/users/me/image', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'accept': 'application/json',
        },
        body: formData,
      });
    }
    if (response.status === 200) {
      const data = await response.json();
      user.value.image_path = data.image_path;
      toast.success('Imagem de perfil atualizada!');
      imagePreview.value = "";
      imageFile.value = null;
      return true;
    } else if (response.status === 422) {
      const data = await response.json();
      const msg = data.detail?.[0]?.msg || "Erro de validação.";
      imageUploadError.value = msg;
    } else {
      imageUploadError.value = 'Erro ao atualizar imagem!';
    }
  } catch (err) {
    imageUploadError.value = 'Erro ao conectar com o servidor!';
  } finally {
    imageUploadLoading.value = false;
  }
  return false;
}

async function saveProfile() {
  loading.value = true;
  let imageOk = true;
  if (imageFile.value) {
    imageOk = await uploadProfileImage();
  }
  if (!imageOk) {
    loading.value = false;
    return;
  }
  try {
    const body = {
      name: user.value.name,
      email: user.value.email,
    };
    const response = await fetch('http://35.196.79.227:8000/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        'accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.status === 200) {
      toast.success('Perfil atualizado com sucesso!');
      editing.value = false;
      originalUser.value = { ...user.value };
    } else if (response.status === 422) {
      const data = await response.json();
      const msg = data.detail?.[0]?.msg || "Erro de validação.";
      toast.error(msg, { autoClose: 3000 });
    } else {
      toast.error('Erro ao atualizar perfil!');
    }
  } catch (err) {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    loading.value = false;
  }
}

function cancelEdit() {
  user.value = { ...originalUser.value };
  editing.value = false;
}

async function handleChangePassword() {
  passwordError.value = "";
  if (!newPasswordValue.value || newPasswordValue.value.length < 6) {
    passwordError.value = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }
  passwordLoading.value = true;
  try {
    const response = await fetch('http://35.196.79.227:8000/users/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        'accept': 'application/json',
      },
      body: JSON.stringify({ password: newPasswordValue.value }),
    });
    if (response.status === 200) {
      toast.success('Senha alterada com sucesso!');
      showPasswordModal.value = false;
      newPasswordValue.value = "";
    } else if (response.status === 422) {
      const data = await response.json();
      const msg = data.detail?.[0]?.msg || "Erro de validação.";
      passwordError.value = msg;
    } else {
      passwordError.value = 'Erro ao alterar senha!';
    }
  } catch (err) {
    passwordError.value = 'Erro ao conectar com o servidor!';
  } finally {
    passwordLoading.value = false;
  }
}

async function saveAddress() {
  addressLoading.value = true
  try {
    const method = editingAddress.value ? 'PUT' : 'POST'
    const url = editingAddress.value ? `http://35.196.79.227:8000/addresses/${editingAddress.value.id}` : 'http://35.196.79.227:8000/addresses'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(addressForm.value)
    })
    if (res.ok || res.status === 201) {
      toast.success(editingAddress.value ? 'Endereço atualizado!' : 'Endereço cadastrado!')
      showAddressForm.value = false
      fetchAddresses()
    } else {
      toast.error('Erro ao salvar endereço!')
    }
  } catch {
    toast.error('Erro ao conectar com o servidor!')
  } finally {
    addressLoading.value = false
  }
}

function openNewAddress() {
  editingAddress.value = null
  addressForm.value = { street: '', number: '', zip: '', city: '', state: '', country: '' }
  showAddressForm.value = true
}

function openEditAddress(addr) {
  editingAddress.value = addr
  addressForm.value = { ...addr }
  showAddressForm.value = true
}

function selectAddress(addr) {
  selectedAddressId.value = addr.id
}

onMounted(() => {
  fetchProfile();
  fetchAddresses();
  fetchAddressesMap();
  fetchOrders();
});
</script>

<template>
  <section class="profile-bg">
    <div class="profile-dashboard">
      <!-- Lado esquerdo: Meus Pedidos -->
      <div class="profile-orders-panel">
        <h3 class="mb-3" style="color:#FF4D33;">Meus Pedidos</h3>
        <div v-if="loadingOrders" class="text-center py-4">Carregando pedidos...</div>
        <div v-else-if="errorOrders" class="text-danger text-center">{{ errorOrders }}</div>
        <div v-else>
          <div v-if="orders.length === 0" class="text-center">Nenhum pedido realizado.</div>
          <div v-else>
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="order-header">
                <span><strong>Pedido #{{ order.id }}</strong></span>
                <span>Status: <strong>{{ order.status }}</strong></span>
                <span>Data: {{ new Date(order.order_date).toLocaleString() }}</span>
              </div>
              <div class="order-address">
                <template v-if="addressesMap[order.address_id]">
                  <span>
                    <strong>Endereço:</strong>
                    {{ addressesMap[order.address_id].street }},
                    {{ addressesMap[order.address_id].number }} -
                    {{ addressesMap[order.address_id].city }} ({{ addressesMap[order.address_id].state }})
                    - {{ addressesMap[order.address_id].zip }},
                    {{ addressesMap[order.address_id].country }}
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
      <!-- Lado direito: Perfil -->
      <div class="profile-card shadow">
        <div class="profile-avatar-wrap">
          <label class="profile-avatar-label" :title="editing ? 'Alterar imagem' : ''">
            <input type="file" accept="image/*" class="d-none" @change="handleImageChange" :disabled="!editing || imageUploadLoading" />
            <img
              :src="imagePreview || (user.image_path ? `http://35.196.79.227:8000${user.image_path}` : GUTS_AVATAR)"
              alt="Avatar"
              class="profile-avatar"
              :class="{ uploading: imageUploadLoading }"
            />
            <span v-if="editing" class="avatar-edit-icon"><i class="fas fa-camera"></i></span>
          </label>
        </div>
        <div v-if="imageUploadError" class="text-danger text-center mb-2">{{ imageUploadError }}</div>
        <div class="profile-info">
          <h2 class="profile-title">{{user.name}}</h2>
          <div class="profile-field">
            <span class="profile-label">Nome</span>
            <input v-model="user.name" :readonly="!editing" class="profile-input" required />
          </div>
          <div class="profile-field">
            <span class="profile-label">Email</span>
            <input v-model="user.email" :readonly="!editing" class="profile-input" required />
          </div>
          <div class="profile-access">
            <span v-if="user.role === 'ADMIN'" class="role-badge-inline">ADMIN</span>
            <span v-else class="role-badge-inline client">CLIENTE</span>
          </div>
          <div class="profile-actions">
            <button v-if="!editing" class="btn-orange" type="button" @click="editing = true">Editar</button>
            <button v-if="editing" class="btn-orange" type="button" @click="saveProfile" :disabled="loading || imageUploadLoading">Salvar</button>
            <button v-if="editing" class="btn btn-secondary" type="button" @click="cancelEdit">Cancelar</button>
          </div>
          <div class="profile-field">
            <h4 class="profile-label" style="margin-top:2rem;">Endereços</h4>
            <div v-if="addresses.length === 0" class="text-muted mb-2">Nenhum endereço cadastrado.</div>
            <ul v-else style="padding-left:0; list-style:none;">
              <li v-for="addr in addresses" :key="addr.id" style="margin-bottom:8px;">
                <span>{{ addr.street }}, {{ addr.number }} - {{ addr.city }} ({{ addr.state }})</span>
                <button class="btn-orange-outline btn-sm ms-2" @click="openEditAddress(addr)">Editar</button>
              </li>
            </ul>
            <button class="btn-orange mt-2" @click="openNewAddress">Adicionar Endereço</button>
          </div>
        </div>
        <!-- ...modals de senha/endereço... -->
       
        <div v-if="showAddressForm" class="modal-bg" @click.self="showAddressForm = false">
          <div class="modal-content modal-orange">
            <h5 class="mb-3">{{ editingAddress ? 'Editar Endereço' : 'Novo Endereço' }}</h5>
            <input v-model="addressForm.street" class="form-control mb-2" placeholder="Rua" />
            <input v-model="addressForm.number" class="form-control mb-2" placeholder="Número" />
            <input v-model="addressForm.zip" class="form-control mb-2" placeholder="CEP" />
            <input v-model="addressForm.city" class="form-control mb-2" placeholder="Cidade" />
            <input v-model="addressForm.state" class="form-control mb-2" placeholder="Estado" />
            <input v-model="addressForm.country" class="form-control mb-2" placeholder="País" />
            <div class="d-flex gap-2 mt-2">
              <button class="btn-orange w-100" :disabled="addressLoading" @click="saveAddress">Salvar</button>
              <button class="btn btn-secondary w-100" type="button" @click="showAddressForm = false">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-bg {
  min-height: 90vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-dashboard {
  display: flex;
  gap: 32px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  align-items: flex-start;
}
.profile-orders-panel {
  flex: 1.2;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px #ffb34722;
  padding: 2.2rem 2vw 1.2rem 2vw;
  min-width: 340px;
  max-width: 520px;
  margin-right: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.profile-card {
  flex: 1.5;
  background: #fff;
  border-radius: 1.5rem;
  max-width: 520px;
  min-width: 340px;
  margin: 0 auto;
  padding: 2.5rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 16px #ffb34722;
  position: relative;
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
.profile-avatar-wrap {
  position: relative;
  margin-bottom: 1.2rem;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-avatar-label {
  cursor: pointer;
  display: block;
  position: relative;
}
.profile-avatar {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #FF4D33;
  box-shadow: 0 2px 12px #ffb34733;
  background: #f8fafc;
  transition: opacity 0.2s;
}
.profile-avatar.uploading {
  opacity: 0.5;
  filter: grayscale(0.7);
}
.avatar-edit-icon {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #FF4D33;
  color: #fff;
  border-radius: 50%;
  padding: 6px;
  font-size: 1.1em;
  box-shadow: 0 1px 4px #ffb34733;
  border: 2px solid #fff;
  z-index: 2;
  pointer-events: none;
}
.role-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  background: #fff7f0;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 4px 16px;
  font-weight: bold;
  font-size: 1em;
  letter-spacing: 1px;
  z-index: 2;
  box-shadow: 0 1px 4px #ffb34733;
}
.profile-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #FF4D33;
  margin-bottom: 1.2rem;
  text-align: center;
}
.profile-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.profile-field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.profile-label {
  font-size: 1em;
  color: #FF4D33;
  margin-bottom: 2px;
  font-weight: 600;
}
.profile-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid #FF4D33;
  font-size: 1em;
  background: #fff7f0;
  color: #222;
}
.profile-input:read-only {
  background: #f8fafc;
  color: #888;
}
.profile-access {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.2rem;
}
.role-badge-inline {
  background: #fff7f0;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 2px 12px;
  font-weight: bold;
  font-size: 1em;
  letter-spacing: 1px;
}
.role-badge-inline.client {
  background: #f8fafc;
  color: #ffb347;
  border: 2px solid #ffb347;
}
.profile-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 0.5rem;
}
.btn-orange {
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
.btn-orange:hover {
  box-shadow: 0 2px 12px #ffb34744;
}
.btn-orange-outline {
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
.btn-orange-outline:hover {
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
.profile-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
}
.profile-tabs button {
  background: #f8fafc;
  border: none;
  border-radius: 8px 8px 0 0;
  padding: 8px 18px;
  font-size: 1em;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.profile-tabs button.active, .profile-tabs button:hover {
  background: #FF4D33;
  color: #fff;
}
@media (max-width: 600px) {
  .profile-card {
    padding: 1.2rem 0.5rem;
    max-width: 98vw;
  }
  .profile-avatar, .profile-avatar_wrap {
    width: 80px;
    height: 80px;
  }
}
@media (max-width: 900px) {
  .profile-dashboard {
    flex-direction: column;
    gap: 18px;
    max-width: 98vw;
    align-items: stretch;
  }
  .profile-orders-panel, .profile-card {
    max-width: 98vw;
    min-width: 98vw;
    padding: 1.2rem 1vw;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getToken } from '@/api/auth';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { getCartItems, clearCartCacheItems } from '@/api/cart';

const router = useRouter();
const address = ref(null);
const addresses = ref([]);
const selectedAddressId = ref(null);
const paymentMethod = ref('');
const loading = ref(false);
const showEditAddressForm = ref(false);
const editingAddress = ref(null);
const addressForm = ref({ street: '', number: '', zip: '', city: '', state: '', country: '' });
const addressLoading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await fetch('http://35.196.79.227:8000/addresses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.ok) {
      addresses.value = await res.json();
      if (addresses.value.length > 0) {
        address.value = addresses.value[0];
        selectedAddressId.value = address.value.id;
      }
    }
  } catch {
    toast.error('Erro ao buscar endereços!');
  } finally {
    loading.value = false;
  }
});

function handleSelectAddress(addr) {
  address.value = addr;
  selectedAddressId.value = addr.id;
}

function openEditAddress(addr) {
  editingAddress.value = addr;
  addressForm.value = { ...addr };
  showEditAddressForm.value = true;
}

async function saveAddress() {
  addressLoading.value = true;
  try {
    const method = editingAddress.value ? 'PUT' : 'POST';
    const url = editingAddress.value
      ? `http://35.196.79.227:8000/addresses/${editingAddress.value.id}`
      : 'http://35.196.79.227:8000/addresses';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(addressForm.value)
    });
    if (res.ok || res.status === 201) {
      toast.success(editingAddress.value ? 'Endereço atualizado!' : 'Endereço cadastrado!');
      showEditAddressForm.value = false;
      // Atualiza lista de endereços
      const res2 = await fetch('http://35.196.79.227:8000/addresses', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res2.ok) {
        addresses.value = await res2.json();
        if (addresses.value.length > 0) {
          address.value = addresses.value[0];
          selectedAddressId.value = address.value.id;
        }
      }
    } else {
      toast.error('Erro ao salvar endereço!');
    }
  } catch {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    addressLoading.value = false;
  }
}

async function handleFinishOrder() {
  if (!address.value || !paymentMethod.value) {
    toast.error('Selecione endereço e método de pagamento!');
    return;
  }
  try {
    // Busca itens do carrinho
    const cart = await getCartItems();
    const items = cart.items || [];
    if (items.length === 0) {
      // Removido toast de carrinho vazio
      return;
    }
    // Monta o corpo do pedido
    const orderBody = {
      address_id: address.value.id,
      payment_method: paymentMethod.value,
      total_amount: cart.total_amount,
      order_date: new Date().toISOString(),
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };
    const res = await fetch('http://35.196.79.227:8000/orders/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(orderBody)
    });
    if (res.status === 201) {
      toast.success('Pedido finalizado com sucesso!');
      clearCartCacheItems();
      setTimeout(() => router.push('/'), 1500);
    } else {
      let msg = 'Erro ao finalizar pedido!';
      if (res.status === 422) {
        const data = await res.json();
        msg = data.detail?.[0]?.msg || msg;
      }
      toast.error(msg);
    }
  } catch {
    toast.error('Erro ao conectar com o servidor!');
  }
}

function handleCancelEditAddress() {
  showEditAddressForm.value = false;
  editingAddress.value = null;
  toast.info('Edição de endereço cancelada.');
}
</script>

<template>
  <section class="checkout-bg">
    <div class="checkout-card">
      <h2 class="checkout-title">Finalizar Pedido</h2>
      <div v-if="loading" class="text-center py-4">Carregando...</div>
      <div v-else>
        <div class="mb-3">
          <h4 class="mb-2">Endereço de Entrega</h4>
          <div v-if="addresses.length === 0" class="text-muted">Nenhum endereço cadastrado. Cadastre um endereço no perfil.</div>
          <div v-else>
            <div class="address-box">
              <span>{{ address.street }}, {{ address.number }} - {{ address.city }} ({{ address.state }})</span>
              
              <button class="btn-outline ms-2" @click="openEditAddress(address)">Editar Endereço</button>
            </div>
            <div v-if="addresses.length > 1" class="mt-2">
              <label>Escolher outro endereço:</label>
              <ul style="list-style:none; padding-left:0;">
                <li v-for="addr in addresses" :key="addr.id" style="margin-bottom:6px;">
                  <button
                    class="btn-outline"
                    :class="{selected: selectedAddressId === addr.id}"
                    @click="handleSelectAddress(addr)"
                  >
                    {{ addr.street }}, {{ addr.number }} - {{ addr.city }} ({{ addr.state }})
                  </button>
                  <button class="btn-outline ms-2" @click.stop="openEditAddress(addr)">Editar</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-if="showEditAddressForm" class="modal-bg" @click.self="showEditAddressForm = false">
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
              <button class="btn-cancel w-100" type="button" @click="handleCancelEditAddress">Cancelar</button>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <h4 class="mb-2">Pagamento</h4>
          <select v-model="paymentMethod" class="form-select">
            <option value="" disabled>Selecione o método</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão de Crédito</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>
        <button
          class="btn-primary w-100 mt-3"
          :disabled="!address || !paymentMethod"
          @click="handleFinishOrder"
        >
          Confirmar Pedido
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.checkout-bg {
  min-height: 80vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}
.checkout-card {
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
.checkout-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #FF4D33;
  text-align: center;
  margin-bottom: 8px;
}
.address-box {
  background: #fff7f0;
  border-radius: 8px;
  padding: 10px 18px;
  margin-bottom: 6px;
  color: #444;
  font-size: 1em;
  box-shadow: 0 1px 8px #ffb34733;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}
.badge-selected {
  background: #FF4D33;
  color: #fff;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 0.95em;
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
.btn-orange:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-orange:hover:not(:disabled) {
  box-shadow: 0 2px 12px #ffb34744;
  background: #ffb347;
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
.btn-outline {
  background: #fff;
  color: #FF4D33;
  border: 2px solid #FF4D33;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.98em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-right: 6px;
}
.btn-outline.selected,
.btn-outline:hover {
  background: #FF4D33;
  color: #fff;
}
.form-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  font-size: 1em;
  background: #f8fafc;
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
</style>

<template>
  <div class="modal-bg" @click.self="onCancel">
    <div class="modal-content">
      <h4 class="mb-3 text-center">{{ isEdit ? 'Editar Produto' : 'Adicionar Produto' }}</h4>
      <form @submit.prevent="onSubmit" enctype="multipart/form-data" class="admin-form">
        <div class="mb-3">
          <label class="form-label">Nome</label>
          <input v-model="form.name" type="text" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Preço</label>
          <input v-model="form.price" type="number" step="0.01" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Estoque</label>
          <input v-model="form.stock" type="number" class="form-control" required />
        </div>
        <div class="mb-3" v-if="categories && categories.length">
          <label class="form-label">Categoria</label>
          <select v-model="form.category_id" class="form-control" required>
            <option value="" disabled>Selecione</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Imagem</label>
          <input type="file" class="form-control" @change="e => form.image = e.target.files[0]" accept="image/*" />
        </div>
        <div class="mb-3">
          <label class="form-label">Descrição</label>
          <textarea v-model="form.description" class="form-control" rows="2"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Desconto (%)</label>
          <input v-model="form.discount" type="number" min="0" max="100" class="form-control" />
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-success w-100" type="submit" :disabled="loading">
            {{ loading ? (isEdit ? 'Salvando...' : 'Cadastrando...') : (isEdit ? 'Salvar' : 'Cadastrar Produto') }}
          </button>
          <button class="btn btn-secondary w-100" type="button" @click="onCancel">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, toRefs } from 'vue';

const props = defineProps({
  show: Boolean,
  isEdit: Boolean,
  product: Object,
  categories: Array,
  loading: Boolean
});
const emit = defineEmits(['save', 'cancel']);

const form = ref({
  name: '',
  price: '',
  stock: '',
  category_id: '',
  image: null,
  description: '',
  discount: ''
});

watch(() => props.product, (val) => {
  if (val) {
    form.value = { ...val, image: null };
  } else {
    form.value = {
      name: '',
      price: '',
      stock: '',
      category_id: '',
      image: null,
      description: '',
      discount: ''
    };
  }
}, { immediate: true });

function onSubmit() {
  emit('save', { ...form.value });
}
function onCancel() {
  emit('cancel');
}
</script>

<style scoped>
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
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
}
</style>

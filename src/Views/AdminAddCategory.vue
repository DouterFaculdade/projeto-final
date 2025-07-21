<script setup>
import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { getToken, getUserRole } from '@/api/auth';
import { useRouter } from 'vue-router';

const name = ref('');
const description = ref('');
const loading = ref(false);
const router = useRouter();

if (getUserRole() !== 'ADMIN') {
  toast.error('Acesso negado! Apenas administradores podem adicionar categorias.');
  router.push('/');
}

async function handleSubmit(e) {
  e.preventDefault();
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('name', name.value);
    formData.append('description', description.value);
    // Não envia imagem por enquanto
    const response = await fetch('http://35.196.79.227:8000/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    });
    if (response.status === 201) {
      toast.success('Categoria criada com sucesso!');
      name.value = '';
      description.value = '';
    } else if (response.status === 401 || response.status === 403) {
      toast.error('Acesso negado! Apenas administradores podem adicionar categorias.');
    } else if (response.status === 422) {
      const data = await response.json();
      const msg = data.detail?.[0]?.msg || 'Erro de validação.';
      toast.error(msg, { autoClose: 3000 });
    } else {
      toast.error('Erro ao criar categoria!');
    }
  } catch (err) {
    toast.error('Erro ao conectar com o servidor!');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container py-5">
    <div class="card p-4 shadow" style="max-width: 500px; margin: 0 auto; border-radius: 1rem;">
      <h2 class="mb-4 text-center">Adicionar Nova Categoria</h2>
      <form @submit="handleSubmit" enctype="multipart/form-data">
        <div class="mb-3">
          <label class="form-label">Nome *</label>
          <input v-model="name" type="text" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Descrição</label>
          <textarea v-model="description" class="form-control" rows="2"></textarea>
        </div>
        <button class="btn btn-primary w-100" type="submit" :disabled="loading">
          {{ loading ? 'Adicionando...' : 'Adicionar Categoria' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: #fff;
}
</style>

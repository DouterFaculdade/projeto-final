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

async function saveProfile() {
  loading.value = true;
  try {
    const body = {
      name: user.value.name,
      email: user.value.email,
    };
    if (newPassword.value) {
      body.password = newPassword.value;
    }
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
      newPassword.value = "";
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

onMounted(fetchProfile);
</script>

<template>
  <section class="container py-5">
    <div class="card p-4 shadow" style="max-width: 500px; margin: 0 auto; border-radius: 1rem;">
      <h2 class="mb-4 text-center">Meu Perfil</h2>
      <div v-if="loading" class="text-center mb-3">Carregando...</div>
      <form v-else @submit.prevent="saveProfile">
        <div class="mb-3 text-center">
          <img v-if="user.image_path" :src="user.image_path" alt="Avatar" style="max-width: 120px; border-radius: 50%;" />
        </div>
        <div class="mb-3">
          <label class="form-label">Nome</label>
          <input v-model="user.name" :readonly="!editing" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="user.email" :readonly="!editing" class="form-control" required />
        </div>
        <div v-if="editing" class="mb-3">
          <label class="form-label">Nova senha</label>
          <input v-model="newPassword" type="password" class="form-control" placeholder="Deixe em branco para não alterar" />
        </div>
        <div class="mb-3">
          <label class="form-label">ID</label>
          <input :value="user.id" class="form-control" readonly />
        </div>
        <div class="mb-3">
          <label class="form-label">Nível de acesso</label>
          <input :value="user.role" class="form-control" readonly />
        </div>
        <div class="d-flex gap-2 mt-4">
          <button v-if="!editing" class="btn btn-primary w-100" type="button" @click="editing = true">Editar</button>
          <button v-if="editing" class="btn btn-success w-100" type="submit" :disabled="loading">Salvar</button>
          <button v-if="editing" class="btn btn-secondary w-100" type="button" @click="cancelEdit">Cancelar</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: #fff;
}
</style>

<template>
  <div class="register-container">
    <form class="register-form" @submit="handleRegister">
      <div class="text-center mb-4">
        <img :src="logo" alt="Logo" class="logo-img mb-2" />
        <h2 class="fw-bold">Cadastro</h2>
      </div>
      <div class="mb-3">
        <label for="registerName" class="form-label">Nome</label>
        <input v-model="name" type="text" id="registerName" class="form-control" required />
      </div>
      <div class="mb-3">
        <label for="registerEmail" class="form-label">Email</label>
        <input v-model="email" type="email" id="registerEmail" class="form-control" required />
      </div>
      <div class="mb-3">
        <label for="registerPassword" class="form-label">Senha</label>
        <input v-model="password" type="password" id="registerPassword" class="form-control" required />
      </div>
      <button class="btn btn-dark w-100 mb-3" type="submit" :disabled="loading">
        {{ loading ? "Cadastrando..." : "Cadastrar" }}
      </button>
      <div class="text-center">
        <router-link to="/login" class="small" style="color: #393f81">Já tem uma conta? Faça login</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import logo from "@/assets/logo.svg";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { useRouter } from 'vue-router';

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const router = useRouter();

async function handleRegister(e) {
  e.preventDefault();
  loading.value = true;

  // Validação simples
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim();
  const trimmedPassword = password.value.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    toast.error("Preencha todos os campos corretamente.", { autoClose: 2000 });
    loading.value = false;
    return;
  }

  try {
    const response = await fetch("http://35.196.79.227:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      }),
    });
    if (response.status === 201) {
      const data = await response.json();
      toast.success(`Cadastro realizado!\nBem-vindo, ${data.name}`, { autoClose: 2000 });
      setTimeout(() => router.push("/login"), 1000);
    } else if (response.status === 422) {
      const data = await response.json();
      const msg = data.detail?.[0]?.msg || "Erro de validação.";
      toast.error(msg, { autoClose: 3000 });
    } else {
      const data = await response.json();
      toast.error(data.detail || "Erro ao registrar usuário!", { autoClose: 2000 });
    }
  } catch (err) {
    toast.error("Erro ao conectar com o servidor!", { autoClose: 2000 });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-form {
  background: #fff;
  padding: 2rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 370px;
}
.logo-img {
  width: 48px;
  height: 48px;
}
@media (max-width: 480px) {
  .register-form {
    padding: 1.2rem 0.5rem;
    max-width: 98vw;
  }
}
</style>
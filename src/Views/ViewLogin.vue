<script setup>
import { ref } from "vue";
import logo from "@/assets/logo.svg";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { useRouter } from 'vue-router';
import { login, createCartIfNotExists } from "@/api/auth";

const email = ref("fe.gereiteste@hotmail.com");
const password = ref("teste");
const loading = ref(false);
const router = useRouter();

async function handleLogin(e) {
  e.preventDefault();
  loading.value = true;
  try {
    const response = await login({ email: email.value, password: password.value });
    if (response.status === 200) {
      toast.success("Login realizado com sucesso!", { autoClose: 2000 });
      window.dispatchEvent(new Event('user-auth-changed'));
      // Cria carrinho se não existir
      const cartResult = await createCartIfNotExists(localStorage.getItem('access_token'));
      // Removido toast que mostra o id do carrinho
      if (cartResult.status === 'created') {
        // toast.success("Carrinho criado!", { autoClose: 2000 });
      } else if (cartResult.status === 'exists') {
        // toast.info("Carrinho já existe", { autoClose: 2000 });
      } else {
        toast.error("Erro ao criar carrinho!", { autoClose: 2000 });
      }
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      toast.error("Email ou senha inválidos!", { autoClose: 2000 });
    }
  } catch (err) {
    toast.error("Erro ao conectar com o servidor!", { autoClose: 2000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-bg">
    <form class="login-form" @submit="handleLogin">
      <div class="login-logo">
        <img :src="logo" alt="Logo" />
      </div>
      <h2 class="login-title">Entrar</h2>
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" class="form-input" required />
      </div>
      <div class="form-group">
        <label>Senha</label>
        <input v-model="password" type="password" class="form-input" required />
      </div>
      <button class="btn-primary w-100" type="submit" :disabled="loading">
        {{ loading ? "Entrando..." : "Login" }}
      </button>
      <div class="login-links">
        <router-link to="/register">Não tem uma conta? Cadastre-se</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-bg {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.login-form {
  background: #fff;
  padding: 2.2rem 1.5rem;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(255,77,51,0.08);
  width: 100%;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.login-logo img {
  width: 54px;
  height: 54px;
  margin-bottom: 8px;
}
.login-title {
  font-size: 1.4em;
  font-weight: bold;
  color: #FF4D33;
  margin-bottom: 8px;
}
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  font-size: 1em;
  background: #f8fafc;
}
.btn-primary {
  background: linear-gradient(90deg, #FF4D33, #ffb347);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: box-shadow 0.2s;
}
.btn-primary:hover {
  box-shadow: 0 2px 12px #ffb34744;
}
.login-links {
  margin-top: 8px;
  font-size: 0.98em;
}
.login-links a {
  color: #FF4D33;
  text-decoration: underline;
}
</style>

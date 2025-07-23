<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '@/api/auth';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const userRole = ref(localStorage.getItem('user_role'));
const router = useRouter();

function handleLogout() {
  logout();
  userRole.value = null;
  window.dispatchEvent(new Event('user-auth-changed'));
  toast.success('Deslogado com sucesso!', { autoClose: 2000 });
  router.push('/');
}

function updateUserRole() {
  userRole.value = localStorage.getItem('user_role');
}

onMounted(() => {
  window.addEventListener('storage', updateUserRole);
  window.addEventListener('user-auth-changed', updateUserRole);
});
</script>

<template>
  <header class="main-header">
    <div class="header-content">
      <router-link to="/" class="header-logo">Emporium</router-link>
      <nav class="header-nav">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/cart" class="nav-link">Cart</router-link>

        <router-link v-if="userRole === 'ADMIN'" to="/admin" class="nav-link">Admin</router-link>
        <router-link v-if="userRole" to="/profile" class="nav-link">Perfil</router-link>
        <router-link v-if="!userRole" to="/login" class="nav-link">Entrar</router-link>
        <router-link v-if="!userRole" to="/register" class="nav-link">Cadastrar</router-link>
        <button v-if="userRole" @click="handleLogout" class="btn-logout">Sair</button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  width: 100%;
  background: #fff;
  border-bottom: 1.5px solid #ffe3e3;
  box-shadow: 0 2px 8px rgba(255,77,51,0.04);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 2vw;
}
.header-logo {
  font-size: 1.7em;
  font-weight: bold;
  color: #FF4D33;
  text-decoration: none;
  letter-spacing: 1px;
}
.header-nav {
  display: flex;
  gap: 18px;
  align-items: center;
}
.nav-link {
  color: #333;
  font-size: 1em;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover {
  background: #ffe3e3;
  color: #FF4D33;
}
.btn-logout {
  background: #FF4D33;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-logout:hover {
  background: #ffb347;
  color: #fff;
}
@media (max-width: 700px) {
  .header-content {
    flex-direction: column;
    gap: 8px;
    padding: 8px 2vw;
  }
  .header-logo {
    font-size: 1.2em;
  }
  .header-nav {
    gap: 10px;
    flex-wrap: wrap;
  }
}
</style>

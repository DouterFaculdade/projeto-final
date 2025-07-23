import { apiFetch } from "@/config/httpConfig";

// Função de login
export async function login({ email, password }) {
  const response = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.status === 200) {
    const data = await response.json();
    // Espera-se que a resposta tenha { token, user: { role, ... } }
    if (data.token && data.user && data.user.role) {
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user_name', data.user.name || '');
      localStorage.setItem('user_email', data.user.email || '');
      localStorage.setItem('user_id', data.user.id || '');
      localStorage.setItem('user_image', data.user.image_path || '');
    }
    // Retorna o objeto data para uso no componente
    return { status: 200, data };
  }
  return response;
}

// Função para obter o token salvo
export function getToken() {
  return localStorage.getItem('access_token');
}

// Função para obter o nível de acesso do usuário
export function getUserRole() {
  return localStorage.getItem('user_role');
}

// Função para logout
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_image');
}

// Cria o carrinho do usuário se não existir
export async function createCartIfNotExists(token) {
  // Se já existe carrinho, ignora
  if (localStorage.getItem('cart_id')) return { status: 'exists', cart_id: localStorage.getItem('cart_id') };
  try {
    const response = await apiFetch("/cart/", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: "",
    });
    if (response.status === 200) {
      const data = await response.json();
      localStorage.setItem('cart_id', data.id);
      return { status: 'created', cart_id: data.id };
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

// Exemplo para register futuramente
// export async function register(data) { ... }

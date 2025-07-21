import { apiFetch } from "@/config/httpConfig";

export async function getCategories() {
  const response = await apiFetch("/jsoner", {
    headers: { accept: "application/json" },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error("Erro ao buscar categorias");
}

export async function getCategoriesByAdmin(userId) {
  const response = await apiFetch(`/categories/user/${userId}`, {
    headers: { accept: "application/json" },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error("Erro ao buscar categorias do admin");
}

export async function getCategoriesByAdmin231() {
  const response = await apiFetch(`/categories/user/231`, {
    headers: { accept: "application/json" },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error("Erro ao buscar categorias do admin 231");
}

export async function getAllCategories() {
  const response = await apiFetch('/categories/', {
    headers: { accept: 'application/json' },
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error('Erro ao buscar todas as categorias');
}

import { apiFetch } from "@/config/httpConfig";

export async function getProducts() {
  return apiFetch("/products").then(r => r.json());
}

export async function getProductById(id) {
  return apiFetch(`/products/${id}`).then(r => r.json());
}

export async function getProductsByCategory(categoryId) {
  return apiFetch(`/products/category/${categoryId}`, {
    headers: { accept: "application/json" },
  }).then(r => r.json());
}

export async function getProductsByAdminUser231() {
  return apiFetch("/products/user/231", {
    headers: { accept: "application/json" },
  }).then(r => r.json());
}

// Adicione funções para criar, editar, deletar produtos conforme necessário
export async function getProductsFromAdminCategories(categories) {
  // Recebe um array de categorias e busca todos os produtos dessas categorias
  const allProducts = [];
  for (const cat of categories) {
    const products = await getProductsByCategory(cat.id);
    allProducts.push(...products);
  }
  return allProducts;
}
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Home.vue'
import ViewLogin from '@/Views/ViewLogin.vue'
import ViewRegister from '@/Views/ViewRegister.vue'
import AdminDashboard from '@/Views/AdminDashboard.vue'
import ViewProfile from '@/Views/ViewProfile.vue'
import AdminAddCategory from '@/Views/AdminAddCategory.vue'
import AdminCategories from '@/Views/AdminCategories.vue'
import ViewProducts from '@/Views/ViewProducts.vue'
import ProductDetail from '@/Views/ProductDetail.vue'
import Cart from '@/Views/Cart.vue'
import Checkout from '@/Views/Checkout.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/category/:id', name: 'CategoryProducts', component: ViewProducts },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetail },
  { path: '/login', name: 'Login', component: ViewLogin },
  { path: '/register', name: 'Register', component: ViewRegister },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/profile', name: 'Profile', component: ViewProfile },
  { path: '/admin/add-category', name: 'AdminAddCategory', component: AdminAddCategory },
  { path: '/admin/my-categories', name: 'AdminCategories', component: AdminCategories },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/checkout', name: 'Checkout', component: Checkout },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
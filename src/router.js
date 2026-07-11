import { createRouter, createWebHashHistory } from "vue-router";
import Calculator from "./views/Calculator.vue";
import Admin from "./views/Admin.vue";

const routes = [
  { path: "/", name: "calculator", component: Calculator },
  { path: "/admin", name: "admin", component: Admin },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

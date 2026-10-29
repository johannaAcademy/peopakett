import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './styles/app.css';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
void useAuthStore(pinia).initialize();
app.use(router);
app.mount('#app');

/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { useAuthStore } from '@/stores/auth';
import { mask } from "vue-the-mask";

// Components
import App from './App.vue'

// Composables
import { createApp, type Directive } from 'vue'

import "./styles/main.css";

const app = createApp(App)
app.directive("mask", mask as Directive);

registerPlugins(app)

const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app')

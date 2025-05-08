/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { useAuthStore } from '@/stores/auth';

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import "./styles/main.css";

const app = createApp(App)

registerPlugins(app)

const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app')

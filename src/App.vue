<template>
  <v-app>
    <router-view /> <AppSnackbar />

    <ChatManager 
      v-if="isUserAuthenticated" 
      @messageReceived="handleGlobalChatMessage"
      @connectionChanged="handleGlobalChatConnection"
    />
    </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Importe o authStore
import AppSnackbar from '@/components/AppSnackbar.vue';
import ChatManager from '@/components/chat/ChatManager.vue'; // 1. Importe o ChatManager

export default defineComponent({
  name: 'App',
  components: {
    AppSnackbar,
    ChatManager, // 2. Registre o ChatManager
  },
  setup() {
    const authStore = useAuthStore();

    // Crie uma computada para verificar se o usuário está autenticado
    const isUserAuthenticated = computed(() => authStore.isAuthenticated);

    // Handlers opcionais para eventos do chat no nível global (App.vue)
    const handleGlobalChatMessage = ({ message, mentoria }: any) => {
      // console.log('App.vue: Nova mensagem recebida globalmente:', message, 'na mentoria:', mentoria);
      // Lógica global, se necessária. O chatStore e os componentes internos do chat já cuidam da exibição.
    };

    const handleGlobalChatConnection = (connected: boolean) => {
      // console.log('App.vue: Status de conexão global do chat:', connected ? 'Conectado' : 'Desconectado');
      // Lógica global, se necessária. O ChatManager já exibe seu próprio indicador.
    };

    return {
      isUserAuthenticated,
      handleGlobalChatMessage,
      handleGlobalChatConnection,
    };
  },
});
</script>

<style>
/* Seus estilos globais, se houver */
</style>
<template>
  <div class="chat-manager">
    <!-- Botão flutuante para abrir o chat -->
    <v-btn
      v-if="!chatStore.chatListOpen && chatStore.hasActiveChats"
      fab
      fixed
      rounded
      bottom
      right
      color="primary"
      size="large"
      @click="chatStore.toggleChatList"
      class="chat-fab"
      elevation="8"
    >
      <v-badge
        :content="chatStore.totalUnreadCount"
        :model-value="chatStore.totalUnreadCount > 0"
        color="error"
        overlap
        :offset-x="8"
        :offset-y="8"
      >
        <v-icon size="28">mdi-message-text</v-icon>
      </v-badge>
    </v-btn>

    <!-- Lista de Conversas -->
    <ChatList
      v-model="chatStore.chatListOpen"
      @close="chatStore.toggleChatList"
    />

    <!-- Notificações de mensagens -->
    <v-snackbar
      v-model="chatStore.showNotification"
      :timeout="4000"
      location="top right"
      color="primary"
      class="message-notification"
    >
      <div class="notification-content">
        <v-avatar size="32" class="mr-3">
          <v-img :src="chatStore.lastNotification?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="notification-text">
          <div class="notification-title">{{ chatStore.lastNotification?.title }}</div>
          <div class="notification-message">{{ chatStore.lastNotification?.message }}</div>
        </div>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="openNotificationChat"
          size="small"
        >
          Responder
        </v-btn>
        <v-btn
          icon
          @click="chatStore.showNotification = false"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Indicador de conexão -->
    <v-snackbar
      v-model="showConnectionStatus"
      :color="connectionStatus.color"
      :timeout="connectionStatus.timeout"
      location="bottom"
    >
      <v-icon class="mr-2">{{ connectionStatus.icon }}</v-icon>
      {{ connectionStatus.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import ChatList from './ChatList.vue';

const props = defineProps({
  autoConnect: {
    type: Boolean,
    default: true
  },
  showConnectionIndicator: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['ready', 'error', 'message', 'connection-changed']);

const chatStore = useChatStore();
const authStore = useAuthStore();

// Estado local
const showConnectionStatus = ref(false);
const connectionStatus = ref({
  color: 'success',
  message: 'Conectado ao chat',
  icon: 'mdi-wifi',
  timeout: 3000
});

// Métodos
const openNotificationChat = async () => {
  if (chatStore.lastNotification) {
    const chat = chatStore.allChats.find(c => c.id === chatStore.lastNotification.chatId);
    if (chat) {
      await chatStore.selectChat(chat);
      chatStore.toggleChatList();
    }
    chatStore.showNotification = false;
  }
};

const initializeChat = async () => {
  if (!authStore.isAuthenticated) {
    console.warn('Usuário não autenticado');
    emit('error', 'Usuário não autenticado');
    return;
  }

  try {
    const success = await chatStore.initialize(authStore.userId);
    
    if (success) {
      emit('ready');
    } else {
      emit('error', 'Falha ao inicializar chat');
    }
  } catch (error) {
    console.error('Erro ao inicializar chat:', error);
    emit('error', error.message || 'Erro ao inicializar chat');
  }
};

// Watchers
watch(() => chatStore.isConnected, (connected) => {
  if (props.showConnectionIndicator) {
    connectionStatus.value = {
      color: connected ? 'success' : 'error',
      message: connected ? 'Conectado ao chat' : 'Desconectado. Tentando reconectar...',
      icon: connected ? 'mdi-wifi' : 'mdi-wifi-off',
      timeout: connected ? 3000 : 0
    };
    showConnectionStatus.value = true;
  }
  emit('connection-changed', connected);
});

// Emitir eventos de mensagem
watch(() => chatStore.messages, () => {
  // Pegar a última mensagem adicionada
  const allMessages = Array.from(chatStore.messages.values()).flat();
  if (allMessages.length > 0) {
    const lastMessage = allMessages[allMessages.length - 1];
    emit('message', lastMessage);
  }
}, { deep: true });

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated && props.autoConnect) {
    initializeChat();
  } else if (!authenticated) {
    chatStore.clearAll();
  }
});

// Lifecycle
onMounted(() => {
  if (props.autoConnect && authStore.isAuthenticated) {
    initializeChat();
  }
});

onUnmounted(() => {
  // Não desconectar aqui, pois o chat pode ser usado em outras páginas
  // chatStore.disconnect();
});

// Expor métodos para uso externo
defineExpose({
  initializeChat,
  disconnect: () => chatStore.disconnect(),
  reconnect: () => chatStore.reconnect(),
  sendMessage: (message, chatId, tutoringId) => chatStore.sendMessage(message, chatId, tutoringId),
  selectChat: (chat) => chatStore.selectChat(chat),
  isConnected: computed(() => chatStore.isConnected),
  totalUnreadCount: computed(() => chatStore.totalUnreadCount),
  hasActiveChats: computed(() => chatStore.hasActiveChats)
});
</script>

<style scoped>
.chat-manager {
  position: relative;
  z-index: 1000;
}

.chat-fab {
  position: fixed !important;
  left: 16px;             
  bottom: 16px;            
  margin: 0 !important;      
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  width: 56px !important;
  height: 56px !important;
  min-width: 56px !important;
  border-radius: 50% !important;
}

.chat-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.message-notification {
  z-index: 1002;
}

.notification-content {
  display: flex;
  align-items: center;
  min-width: 300px;
}

.notification-text {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 2px;
}

.notification-message {
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

@media (max-width: 600px) {
  .chat-fab {
    margin: 12px;
  }
  
  .notification-content {
    min-width: 250px;
  }
  
  .notification-message {
    max-width: 150px;
  }
}
</style>
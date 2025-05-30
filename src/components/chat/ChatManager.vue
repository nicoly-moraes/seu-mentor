<template>
  <div class="chat-manager">
    <!-- Botão flutuante para abrir o chat -->
    <v-btn
      v-if="!chatOpen && hasActiveChats"
      fab
      fixed
      bottom
      right
      color="primary"
      size="large"
      @click="openChatList"
      class="chat-fab"
      elevation="8"
    >
      <v-badge
        :content="totalUnreadCount"
        :model-value="totalUnreadCount > 0"
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
      v-model="chatListOpen"
      :mentorias="allMentoriaChats"
      @close="closeChatList"
    />

    <!-- Notificações de mensagens -->
    <v-snackbar
      v-model="showNotification"
      :timeout="4000"
      location="top right"
      color="primary"
      class="message-notification"
    >
      <div class="notification-content">
        <v-avatar size="32" class="mr-3">
          <v-img :src="lastNotification?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="notification-text">
          <div class="notification-title">{{ lastNotification?.title }}</div>
          <div class="notification-message">{{ lastNotification?.message }}</div>
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
          @click="showNotification = false"
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
import ChatList from './chatList.vue';
import MentorChatClient from '@/services/chatClient';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  // Mentorias onde você é MENTOR
  mentoriasMentor: {
    type: Array,
    default: () => []
  },
  // Mentorias onde você é MENTORADO
  mentoriasMentorado: {
    type: Array,
    default: () => []
  },
  autoConnect: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['messageReceived', 'connectionChanged']);

const authStore = useAuthStore();

// Estado
const chatListOpen = ref(false);
const chatOpen = computed(() => chatListOpen.value);
const showNotification = ref(false);
const showConnectionStatus = ref(false);
const lastNotification = ref(null);
const connectionStatus = ref({
  color: 'success',
  message: 'Conectado ao chat',
  icon: 'mdi-wifi',
  timeout: 3000
});

// Cliente de chat global
const globalChatClient = ref(null);
const isConnected = ref(false);
const unreadMessages = ref(new Map());

// Computed - Combinar todas as mentorias em um formato unificado
const allMentoriaChats = computed(() => {
  const chats = [];
  
  // Adicionar mentorias onde sou MENTOR
  props.mentoriasMentor.forEach(mentoria => {
    if (mentoria.isChatEnable) {
      chats.push({
        ...mentoria,
        id: `mentor_${mentoria.id}`, // Prefixo para evitar conflitos
        originalId: mentoria.id,
        role: 'mentor', // Meu papel nesta mentoria
        title: mentoria.disciplineName,
        subtitle: `Você é mentor • ${mentoria.participants?.length || 0} participante(s)`,
        avatar: mentoria.participants?.[0]?.userAvatar || '/placeholder-user.jpg', // Avatar do mentorado
        otherUserName: mentoria.participants?.[0]?.userName || 'Mentorado',
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: unreadMessages.value.get(`mentor_${mentoria.id}`) || 0
      });
    }
  });
  
  // Adicionar mentorias onde sou MENTORADO
  props.mentoriasMentorado.forEach(mentoria => {
    if (mentoria.isChatEnable) {
      chats.push({
        ...mentoria,
        id: `mentorado_${mentoria.id}`, // Prefixo para evitar conflitos
        originalId: mentoria.id,
        role: 'mentorado', // Meu papel nesta mentoria
        title: mentoria.disciplineName,
        subtitle: `Mentor: ${mentoria.mentorName}`,
        avatar: mentoria.mentorAvatar || '/placeholder-user.jpg', // Avatar do mentor
        otherUserName: mentoria.mentorName,
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: unreadMessages.value.get(`mentorado_${mentoria.id}`) || 0
      });
    }
  });
  
  return chats.sort((a, b) => {
    // Ordenar por última mensagem ou data da mentoria
    const timeA = new Date(a.lastMessageTime || a.tutoringDate);
    const timeB = new Date(b.lastMessageTime || b.tutoringDate);
    return timeB - timeA;
  });
});

const hasActiveChats = computed(() => {
  return allMentoriaChats.value.length > 0;
});

const totalUnreadCount = computed(() => {
  let total = 0;
  unreadMessages.value.forEach(count => {
    total += count;
  });
  return total > 99 ? '99+' : total;
});

// Métodos
const initializeGlobalChat = async () => {
  if (!authStore.isAuthenticated) {
    console.warn('Usuário não autenticado, não é possível inicializar o chat');
    return;
  }

  try {
    globalChatClient.value = new MentorChatClient({
      debug: false
    });

    // Configurar handlers globais
    globalChatClient.value.onConnect(() => {
      isConnected.value = true;
      connectionStatus.value = {
        color: 'success',
        message: 'Conectado ao chat',
        icon: 'mdi-wifi',
        timeout: 3000
      };
      showConnectionStatus.value = true;
      emit('connectionChanged', true);
      
      // Inscrever-se em todas as mentorias ativas
      subscribeToAllMentorias();
    });

    globalChatClient.value.onDisconnect(() => {
      isConnected.value = false;
      connectionStatus.value = {
        color: 'error',
        message: 'Desconectado. Tentando reconectar...',
        icon: 'mdi-wifi-off',
        timeout: 0
      };
      showConnectionStatus.value = true;
      emit('connectionChanged', false);
    });

    globalChatClient.value.onError((error) => {
      console.error('Erro no chat global:', error);
      connectionStatus.value = {
        color: 'error',
        message: 'Erro de conexão',
        icon: 'mdi-alert',
        timeout: 5000
      };
      showConnectionStatus.value = true;
    });

    // Handler global de mensagens
    globalChatClient.value.onMessage('general', (message) => {
      handleGlobalMessage(message);
    });

    // Conectar
    await globalChatClient.value.initialize();
    
  } catch (error) {
    console.error('Erro ao inicializar chat global:', error);
    connectionStatus.value = {
      color: 'error',
      message: 'Falha ao conectar',
      icon: 'mdi-wifi-off',
      timeout: 5000
    };
    showConnectionStatus.value = true;
  }
};

const subscribeToAllMentorias = () => {
  if (!globalChatClient.value || !isConnected.value) return;

  // Inscrever em mentorias como mentor
  props.mentoriasMentor.forEach(mentoria => {
    if (mentoria.isChatEnable) {
      globalChatClient.value.subscribeTutoring(mentoria.id, {
        subscribeGeneral: true
      });
    }
  });

  // Inscrever em mentorias como mentorado
  props.mentoriasMentorado.forEach(mentoria => {
    if (mentoria.isChatEnable) {
      globalChatClient.value.subscribeTutoring(mentoria.id, {
        subscribeGeneral: true
      });
    }
  });
};

const handleGlobalMessage = (message) => {
  // Encontrar a mentoria correspondente (pode ser como mentor ou mentorado)
  let mentoriaChat = null;
  let chatId = null;

  // Procurar nas mentorias como mentor
  const mentorMentoria = props.mentoriasMentor.find(m => m.id === message.tutoringId);
  if (mentorMentoria) {
    chatId = `mentor_${mentorMentoria.id}`;
    mentoriaChat = allMentoriaChats.value.find(c => c.id === chatId);
  }

  // Se não encontrou, procurar nas mentorias como mentorado
  if (!mentoriaChat) {
    const mentoradoMentoria = props.mentoriasMentorado.find(m => m.id === message.tutoringId);
    if (mentoradoMentoria) {
      chatId = `mentorado_${mentoradoMentoria.id}`;
      mentoriaChat = allMentoriaChats.value.find(c => c.id === chatId);
    }
  }

  if (!mentoriaChat) return;

  // Incrementar contador de não lidas se não for nossa mensagem
  const currentUserId = authStore.getCurrentUserId;
  if (String(message.senderId) !== String(currentUserId)) {
    const currentCount = unreadMessages.value.get(chatId) || 0;
    unreadMessages.value.set(chatId, currentCount + 1);

    // Mostrar notificação se o chat não estiver aberto
    if (!chatOpen.value) {
      showMessageNotification(message, mentoriaChat);
    }
  }

  emit('messageReceived', { message, mentoria: mentoriaChat });
};

const showMessageNotification = (message, mentoriaChat) => {
  lastNotification.value = {
    id: message.id,
    tutoringId: mentoriaChat.originalId,
    chatId: mentoriaChat.id,
    title: mentoriaChat.title,
    message: message.message,
    avatar: mentoriaChat.avatar,
    senderName: message.senderName
  };
  
  showNotification.value = true;

  // Reproduzir som de notificação (opcional)
  playNotificationSound();
};

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignorar erro se não conseguir reproduzir
    });
  } catch (error) {
    // Ignorar erro de áudio
  }
};

const openChatList = () => {
  chatListOpen.value = true;
};

const closeChatList = () => {
  chatListOpen.value = false;
};

const openNotificationChat = () => {
  if (lastNotification.value) {
    // Marcar como lida
    unreadMessages.value.set(lastNotification.value.chatId, 0);
    
    // Abrir chat
    openChatList();
    
    // Fechar notificação
    showNotification.value = false;
  }
};

const markMentoriaAsRead = (chatId) => {
  unreadMessages.value.set(chatId, 0);
};

const disconnect = () => {
  if (globalChatClient.value) {
    globalChatClient.value.disconnect();
    globalChatClient.value = null;
  }
  isConnected.value = false;
};

const reconnect = async () => {
  disconnect();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await initializeGlobalChat();
};

// Expor métodos para uso externo
defineExpose({
  initializeGlobalChat,
  disconnect,
  reconnect,
  markMentoriaAsRead,
  isConnected: computed(() => isConnected.value),
  totalUnreadCount
});

// Lifecycle
onMounted(() => {
  if (props.autoConnect && authStore.isAuthenticated) {
    initializeGlobalChat();
  }
});

onUnmounted(() => {
  disconnect();
});

// Watchers
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated && props.autoConnect) {
    initializeGlobalChat();
  } else if (!authenticated) {
    disconnect();
  }
});

watch(() => [props.mentoriasMentor, props.mentoriasMentorado], () => {
  if (isConnected.value) {
    subscribeToAllMentorias();
  }
}, { deep: true });
</script>

<style scoped>
.chat-manager {
  position: relative;
  z-index: 1000;
}

.chat-fab {
  z-index: 1001;
  margin: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
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

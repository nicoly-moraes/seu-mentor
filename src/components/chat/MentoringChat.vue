<template>
  <div class="mentoring-chat-container">
    <!-- Header do Chat -->
    <div class="chat-header">
      <v-btn 
        icon 
        variant="text" 
        @click="$emit('back')"
        class="back-button"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      
      <div class="chat-header-info">
        <v-avatar size="40" class="mr-3">
          <v-img :src="mentoria?.mentorAvatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="header-text">
          <div class="chat-title">{{ mentoria?.disciplineName }}</div>
          <div class="chat-subtitle">
            {{ mentoria?.mentorName }} • {{ getStatusText() }}
          </div>
        </div>
      </div>

      <div class="chat-actions">
        <v-btn icon variant="text" @click="toggleInfo">
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="clearChat">
              <v-list-item-title>Limpar conversa</v-list-item-title>
            </v-list-item>
            <v-list-item @click="toggleNotifications">
              <v-list-item-title>
                {{ notifications ? 'Silenciar' : 'Ativar' }} notificações
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Área de Mensagens -->
    <div 
      ref="messagesContainer" 
      class="messages-area"
      @scroll="handleScroll"
    >
      <!-- Loading inicial -->
      <div v-if="loading" class="loading-container">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <span class="ml-3">Carregando mensagens...</span>
      </div>

      <!-- Estado vazio -->
      <div v-else-if="messages.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-2">mdi-message-text-outline</v-icon>
        <h3 class="text-h6 mt-4 text-grey">Nenhuma mensagem ainda</h3>
        <p class="text-body-2 text-grey mt-2">
          Envie uma mensagem para começar a conversa sobre {{ mentoria?.disciplineName }}
        </p>
      </div>

      <!-- Lista de Mensagens -->
      <div v-else class="messages-list">
        <template v-for="(group, groupIndex) in groupedMessages" :key="groupIndex">
          <!-- Separador de data -->
          <div class="date-separator">
            <v-chip size="small" variant="tonal" color="grey">
              {{ formatDateSeparator(group.date) }}
            </v-chip>
          </div>

          <!-- Mensagens do dia -->
          <div
            v-for="message in group.messages"
            :key="message.id"
            class="message-container"
            :class="{ 'own-message': isOwnMessage(message) }"
          >
            <div class="message-bubble" :class="getMessageBubbleClass(message)">
              <!-- Nome do remetente (apenas para mensagens de outros) -->
              <div 
                v-if="!isOwnMessage(message)" 
                class="sender-name"
              >
                {{ message.senderName }}
              </div>

              <!-- Conteúdo da mensagem -->
              <div class="message-content">
                {{ message.message }}
              </div>

              <!-- Informações da mensagem (hora e status) -->
              <div class="message-info">
                <span class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </span>
                <div v-if="isOwnMessage(message)" class="message-status">
                  <v-icon 
                    :size="16" 
                    :color="getStatusIconColor(message.status)"
                    class="status-icon"
                  >
                    {{ getStatusIcon(message.status) }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Indicador de digitação -->
        <div v-if="someoneTyping" class="typing-indicator">
          <div class="typing-bubble">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <span class="typing-text">{{ typingUser }} está digitando...</span>
        </div>
      </div>

      <!-- Botão para rolar para baixo -->
      <v-fab
        v-if="showScrollButton"
        class="scroll-to-bottom-btn"
        size="small"
        color="primary"
        @click="scrollToBottom"
      >
        <v-icon>mdi-chevron-down</v-icon>
        <v-badge
          v-if="unreadCount > 0"
          :content="unreadCount"
          color="error"
          overlap
        ></v-badge>
      </v-fab>
    </div>

    <!-- Área de Input -->
    <div class="input-area">
      <div class="input-container">
        <!-- Botão de emoji -->
        <v-btn
          icon
          variant="text"
          size="small"
          @click="toggleEmojiPicker"
          class="emoji-button"
        >
          <v-icon>mdi-emoticon-outline</v-icon>
        </v-btn>

        <!-- Campo de texto -->
        <v-text-field
          v-model="newMessage"
          :placeholder="getInputPlaceholder()"
          variant="outlined"
          density="compact"
          hide-details
          single-line
          :disabled="!isConnected || sending"
          @keydown.enter.prevent="sendMessage"
          @input="handleTyping"
          @focus="markAsRead"
          class="message-input"
          rows="1"
          auto-grow
          max-rows="4"
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="attachFile"
              class="attach-button"
            >
              <v-icon>mdi-paperclip</v-icon>
            </v-btn>
          </template>
        </v-text-field>

        <!-- Botão de enviar -->
        <v-btn
          icon
          color="primary"
          :loading="sending"
          :disabled="!canSendMessage"
          @click="sendMessage"
          class="send-button"
        >
          <v-icon>{{ newMessage.trim() ? 'mdi-send' : 'mdi-microphone' }}</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Snackbar de conexão -->
    <v-snackbar
      v-model="connectionSnackbar"
      :color="isConnected ? 'success' : 'error'"
      :timeout="3000"
      location="top"
    >
      <v-icon class="mr-2">
        {{ isConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}
      </v-icon>
      {{ isConnected ? 'Conectado' : 'Desconectado. Tentando reconectar...' }}
    </v-snackbar>

    <!-- Dialog de informações da mentoria -->
    <v-dialog v-model="showInfo" max-width="500">
      <v-card>
        <v-card-title>Informações da Mentoria</v-card-title>
        <v-card-text>
          <div class="info-item">
            <strong>Disciplina:</strong> {{ mentoria?.disciplineName }}
          </div>
          <div class="info-item">
            <strong>Mentor:</strong> {{ mentoria?.mentorName }}
          </div>
          <div class="info-item">
            <strong>Tipo:</strong> {{ mentoria?.tutoringClassType }}
          </div>
          <div class="info-item">
            <strong>Data:</strong> {{ formatDate(mentoria?.tutoringDate) }}
          </div>
          <div class="info-item">
            <strong>Status:</strong> {{ getStatusText() }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showInfo = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import MentorChatClient from '@/services/chatClient';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  mentoria: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['back', 'messageReceived']);

const authStore = useAuthStore();

// Estado do componente
const chatClient = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(true);
const sending = ref(false);
const isConnected = ref(false);
const connectionSnackbar = ref(false);
const messagesContainer = ref(null);
const showScrollButton = ref(false);
const unreadCount = ref(0);
const someoneTyping = ref(false);
const typingUser = ref('');
const typingTimeout = ref(null);
const showEmojiPicker = ref(false);
const notifications = ref(true);
const showInfo = ref(false);

// Computed
const currentUserId = computed(() => authStore.getCurrentUserId);

const groupedMessages = computed(() => {
  const groups = [];
  let currentGroup = null;

  messages.value.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const dateKey = messageDate.toDateString();

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        messages: []
      };
      groups.push(currentGroup);
    }

    currentGroup.messages.push(message);
  });

  return groups;
});

const canSendMessage = computed(() => {
  return isConnected.value && newMessage.value.trim() && !sending.value;
});

// Métodos
const isOwnMessage = (message) => {
  return String(message.senderId) === String(currentUserId.value);
};

const getMessageBubbleClass = (message) => {
  return {
    'own-bubble': isOwnMessage(message),
    'other-bubble': !isOwnMessage(message)
  };
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent': return 'mdi-check';
    case 'delivered': return 'mdi-check-all';
    case 'read': return 'mdi-check-all';
    default: return 'mdi-clock-outline';
  }
};

const getStatusIconColor = (status) => {
  switch (status) {
    case 'read': return 'blue';
    case 'delivered': return 'grey';
    case 'sent': return 'grey';
    default: return 'grey-lighten-1';
  }
};

const getStatusText = () => {
  if (!props.mentoria) return '';
  
  switch (props.mentoria.status) {
    case 'EM_ANDAMENTO': return 'Online';
    case 'AGENDADA': return 'Agendada';
    case 'FINALIZADA': return 'Finalizada';
    case 'CANCELADA': return 'Cancelada';
    default: return 'Offline';
  }
};

const getInputPlaceholder = () => {
  if (!isConnected.value) return 'Conectando...';
  if (props.mentoria?.status === 'FINALIZADA') return 'Mentoria finalizada';
  if (props.mentoria?.status === 'CANCELADA') return 'Mentoria cancelada';
  return 'Digite uma mensagem...';
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const initializeChat = async () => {
  try {
    loading.value = true;
    
    chatClient.value = new MentorChatClient({
      debug: false
    });

    // Configurar handlers
    chatClient.value.onConnect(() => {
      isConnected.value = true;
      connectionSnackbar.value = true;
      subscribeToMentoria();
    });

    chatClient.value.onDisconnect(() => {
      isConnected.value = false;
      connectionSnackbar.value = true;
    });

    chatClient.value.onError((error) => {
      console.error('Erro no chat:', error);
      isConnected.value = false;
    });

    // Handler de mensagens
    chatClient.value.onMessage('general', (message) => {
      addMessage(message);
      emit('messageReceived', message);
    });

    // Conectar
    await chatClient.value.initialize();
    
  } catch (error) {
    console.error('Erro ao inicializar chat:', error);
  } finally {
    loading.value = false;
  }
};

const subscribeToMentoria = () => {
  if (!props.mentoria || !chatClient.value) return;

  chatClient.value.setCurrentTutoring(props.mentoria.id);
  chatClient.value.subscribeTutoring(props.mentoria.id, {
    subscribeGeneral: true
  });

  // Carregar mensagens anteriores
  loadPreviousMessages();
};

const loadPreviousMessages = () => {
  // Aqui você faria uma chamada à API para buscar mensagens anteriores
  // Por enquanto, vamos apenas limpar as mensagens
  messages.value = [];
};

const addMessage = (message) => {
  const formattedMessage = {
    ...message,
    id: message.id || Date.now() + Math.random(),
    timestamp: message.timestamp || new Date(),
    status: message.senderId === currentUserId.value ? 'sent' : 'received'
  };

  messages.value.push(formattedMessage);
  
  // Atualizar contador de não lidas se não for nossa mensagem
  if (!isOwnMessage(formattedMessage)) {
    unreadCount.value++;
  }

  // Scroll automático se estiver próximo do final
  nextTick(() => {
    if (shouldAutoScroll()) {
      scrollToBottom();
      markAsRead();
    }
  });
};

const sendMessage = async () => {
  if (!canSendMessage.value) return;

  sending.value = true;
  const messageText = newMessage.value.trim();
  newMessage.value = '';

  try {
    const success = chatClient.value.sendGeneralMessage(messageText);
    
    if (success) {
      // Adicionar mensagem localmente para feedback imediato
      addMessage({
        id: Date.now(),
        message: messageText,
        senderId: currentUserId.value,
        senderName: 'Você',
        timestamp: new Date(),
        status: 'sending'
      });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    newMessage.value = messageText; // Restaurar mensagem
  } finally {
    sending.value = false;
  }
};

const handleScroll = () => {
  if (!messagesContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  showScrollButton.value = distanceFromBottom > 100;
  
  // Marcar como lida se estiver no final
  if (distanceFromBottom < 50) {
    markAsRead();
  }
};

const shouldAutoScroll = () => {
  if (!messagesContainer.value) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  return distanceFromBottom < 100;
};

const scrollToBottom = () => {
  if (!messagesContainer.value) return;
  
  nextTick(() => {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  });
};

const markAsRead = () => {
  unreadCount.value = 0;
};

const handleTyping = () => {
  // Implementar indicador de digitação
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  
  typingTimeout.value = setTimeout(() => {
    // Parar indicador de digitação
  }, 1000);
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const attachFile = () => {
  // Implementar anexo de arquivos
  alert('Funcionalidade de anexar arquivos em desenvolvimento');
};

const clearChat = () => {
  if (confirm('Tem certeza que deseja limpar todas as mensagens?')) {
    messages.value = [];
  }
};

const toggleNotifications = () => {
  notifications.value = !notifications.value;
};

const toggleInfo = () => {
  showInfo.value = !showInfo.value;
};

// Lifecycle
onMounted(() => {
  initializeChat();
});

onUnmounted(() => {
  if (chatClient.value) {
    chatClient.value.disconnect();
  }
});

// Watchers
watch(() => props.mentoria, (newMentoria) => {
  if (newMentoria && chatClient.value && isConnected.value) {
    subscribeToMentoria();
  }
});
</script>

<style scoped>
.mentoring-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #075e54;
  color: white;
  min-height: 64px;
}

.back-button {
  margin-right: 8px;
  color: white !important;
}

.chat-header-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-text {
  flex: 1;
}

.chat-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
}

.chat-subtitle {
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.2;
}

.chat-actions {
  display: flex;
  gap: 4px;
}

.chat-actions .v-btn {
  color: white !important;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  position: relative;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #667781;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  height: 100%;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-separator {
  display: flex;
  justify-content: center;
  margin: 16px 0 8px 0;
}

.message-container {
  display: flex;
  margin-bottom: 2px;
}

.message-container.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
}

.own-bubble {
  background-color: #d9fdd3;
  border-bottom-right-radius: 2px;
}

.other-bubble {
  background-color: white;
  border-bottom-left-radius: 2px;
}

.sender-name {
  font-size: 12px;
  color: #06cf9c;
  font-weight: 500;
  margin-bottom: 2px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  color: #303030;
  margin-bottom: 4px;
}

.message-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
}

.message-time {
  font-size: 11px;
  color: #667781;
}

.message-status {
  display: flex;
  align-items: center;
}

.status-icon {
  opacity: 0.8;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.typing-bubble {
  background-color: white;
  padding: 8px 12px;
  border-radius: 8px;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background-color: #667781;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.typing-text {
  font-size: 12px;
  color: #667781;
  font-style: italic;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

.input-area {
  padding: 8px 16px 16px 16px;
  background-color: #f0f2f5;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background-color: white;
  border-radius: 24px;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

.emoji-button,
.attach-button {
  color: #667781 !important;
}

.message-input {
  flex: 1;
}

.message-input :deep(.v-field) {
  border-radius: 20px;
  box-shadow: none;
}

.message-input :deep(.v-field__outline) {
  display: none;
}

.send-button {
  margin: 4px;
}

.info-item {
  margin-bottom: 12px;
}

@media (max-width: 600px) {
  .message-bubble {
    max-width: 85%;
  }
  
  .chat-header {
    padding: 8px 12px;
  }
  
  .messages-area {
    padding: 12px;
  }
}
</style>

<template>
  <div class="mentoring-chat-container">
    <div class="chat-header">
      <v-btn icon variant="text" @click="$emit('back')" class="back-button">
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
          <template v-slot:activator="{ props: menuProps }">
            <v-btn icon variant="text" v-bind="menuProps">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="reloadChatHistory" :disabled="!isConnected || loading">
              <template v-slot:prepend>
                <v-icon size="small">mdi-refresh</v-icon>
              </template>
              <v-list-item-title>Recarregar histórico</v-list-item-title>
            </v-list-item>
            
            <v-divider class="my-1"></v-divider>
            
            <v-list-item @click="clearChat">
              <template v-slot:prepend>
                <v-icon size="small">mdi-delete-outline</v-icon>
              </template>
              <v-list-item-title>Limpar conversa</v-list-item-title>
            </v-list-item>
            
            <v-list-item @click="toggleNotifications">
              <template v-slot:prepend>
                <v-icon size="small">
                  {{ notifications ? 'mdi-bell-off-outline' : 'mdi-bell-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>
                {{ notifications ? 'Silenciar' : 'Ativar' }} notificações
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <div ref="messagesContainer" class="messages-area" @scroll="handleScroll">
      <div v-if="loading" class="loading-container">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <span class="ml-3">Carregando mensagens...</span>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-2">mdi-message-text-outline</v-icon>
        <h3 class="text-h6 mt-4 text-grey">Nenhuma mensagem ainda</h3>
        <p class="text-body-2 text-grey mt-2">
          Envie uma mensagem para começar a conversa sobre {{ mentoria?.disciplineName }}
        </p>
      </div>

      <div v-else class="messages-list">
        <template v-for="(group, groupIndex) in groupedMessages" :key="groupIndex">
          <div class="date-separator">
            <v-chip size="small" variant="tonal" color="grey">
              {{ formatDateSeparator(group.date) }}
            </v-chip>
          </div>

          <div v-for="message in group.messages" :key="message.id" class="message-container"
            :class="{ 'own-message': isOwnMessage(message) }">
            <div class="message-bubble" :class="getMessageBubbleClass(message)">
              <div v-if="!isOwnMessage(message)" class="sender-name">
                {{ message.senderName }}
              </div>

              <div class="message-content">
                {{ message.message }}
              </div>

              <div class="message-info">
                <span class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </span>
                <div v-if="isOwnMessage(message)" class="message-status">
                  <v-icon :size="16" :color="getStatusIconColor(message.status)" class="status-icon">
                    {{ getStatusIcon(message.status) }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </template>

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

      <v-fab-transition>
        <v-btn v-if="showScrollButton" class="scroll-to-bottom-btn" size="small" icon color="primary"
          @click="scrollToBottom()" elevation="4">
          <v-badge v-if="unreadCount > 0" :content="unreadCount > 9 ? '9+' : unreadCount" color="error" floating
            overlap>
            <v-icon>mdi-chevron-down</v-icon>
          </v-badge>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </v-fab-transition>
    </div>

    <div class="input-area">
      <div class="input-container">
        <v-textarea v-model="newMessage" :placeholder="getInputPlaceholder()" variant="solo" density="compact"
          hide-details single-line :disabled="!isConnected || sending" @keydown.enter.prevent="sendMessage"
          @input="handleTyping" @focus="markAsRead" class="message-input" rows="1" auto-grow max-rows="4" flat>
          <template v-slot:append-inner>
            <v-btn icon variant="text" size="small" @click="attachFile" class="attach-button">
              <v-icon>mdi-paperclip</v-icon>
            </v-btn>
          </template>
        </v-textarea>
      </div>
    </div>

    <v-snackbar v-model="connectionSnackbar" :color="isConnected ? 'success' : 'error'" :timeout="3000" location="top">
      <v-icon class="mr-2">
        {{ isConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}
      </v-icon>
      {{ isConnected ? 'Conectado' : 'Desconectado. Tentando reconectar...' }}
    </v-snackbar>

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
          <v-btn color="primary" text @click="showInfo = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import MentorChatClient from '@/services/chatClient';
import { useAuthStore } from '@/stores/auth';
import { getChatHistoryByTutoringId } from '@/services/chatHistoryService';

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
const isRecordingAudio = ref(false);

// Adicionar Map para rastrear mensagens temporárias
const tempMessageMap = ref(new Map());

// Constantes
const MESSAGE_TIMEOUT = 30000; // 30 segundos
let pendingCheckInterval = null;

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
    case 'failed': return 'mdi-alert-circle-outline';
    default: return 'mdi-clock-outline';
  }
};

const getStatusIconColor = (status) => {
  switch (status) {
    case 'read': return 'blue';
    case 'delivered': return 'grey';
    case 'sent': return 'grey';
    case 'failed': return 'error';
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
    default: return props.mentoria.status || 'Offline';
  }
};

const getInputPlaceholder = () => {
  if (!isConnected.value) return 'Conectando ao chat...';
  if (props.mentoria?.status === 'FINALIZADA') return 'Esta mentoria foi finalizada.';
  if (props.mentoria?.status === 'CANCELADA') return 'Esta mentoria foi cancelada.';
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
  if (!timestamp) return '';
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
  loading.value = true;
  isConnected.value = false;
  try {
    chatClient.value = new MentorChatClient({
      debug: import.meta.env.DEV
    });

    chatClient.value.onConnect(() => {
      isConnected.value = true;
      connectionSnackbar.value = true;
      if (props.mentoria?.originalId) {
        subscribeToMentoria();
      } else {
        console.error("Mentoria originalId não disponível no momento da conexão.");
        loading.value = false;
      }
    });

    chatClient.value.onDisconnect(() => {
      isConnected.value = false;
      connectionSnackbar.value = true;
    });

    chatClient.value.onError((error) => {
      console.error('Erro WebSocket:', error);
      isConnected.value = false;
      connectionSnackbar.value = true;
      loading.value = false;
    });

    // Handler modificado para evitar duplicatas
    chatClient.value.onMessage('general', (message) => {
      if (message.tutoringId === props.mentoria.originalId) {
        // Verificar se é uma mensagem própria retornada do servidor
        if (String(message.senderId) === String(currentUserId.value)) {
          // Procurar pela mensagem temporária correspondente
          const tempId = tempMessageMap.value.get(message.message);
          
          if (tempId) {
            // Encontrou a mensagem temporária - substituir
            const tempIndex = messages.value.findIndex(m => m.id === tempId);
            if (tempIndex !== -1) {
              // Atualizar a mensagem temporária com os dados do servidor
              messages.value[tempIndex] = {
                ...message,
                status: 'sent',
                isTemp: false
              };
              // Remover do mapa
              tempMessageMap.value.delete(message.message);
            }
          } else {
            // Mensagem própria não encontrada no mapa (pode ser de outra sessão)
            // Verificar se já não existe antes de adicionar
            const exists = messages.value.some(m => 
              m.id === message.id || 
              (m.message === message.message && 
               String(m.senderId) === String(message.senderId) &&
               Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000)
            );
            
            if (!exists) {
              addMessage(message);
            }
          }
        } else {
          // Mensagem de outro usuário - adicionar normalmente
          addMessage(message);
        }
      }
      emit('messageReceived', message);
    });

    await chatClient.value.initialize();

  } catch (error) {
    console.error('Falha ao inicializar o chat client:', error);
    loading.value = false;
    isConnected.value = false;
    connectionSnackbar.value = true;
  }
};

const subscribeToMentoria = () => {
  if (!props.mentoria || !chatClient.value || !isConnected.value) {
    console.warn("Não é possível subscrever: Mentoria, chatClient ou conexão ausente.");
    if (!isConnected.value) loading.value = false;
    return;
  }

  const tutoringIdToUse = props.mentoria.originalId;

  if (typeof tutoringIdToUse === 'number') {
    chatClient.value.setCurrentTutoring(tutoringIdToUse);
    chatClient.value.subscribeTutoring(tutoringIdToUse, {
      subscribeGeneral: true
    });
    loadPreviousMessages(tutoringIdToUse);
  } else {
    console.error('Erro Crítico: props.mentoria.originalId não é um número válido para subscrição.', props.mentoria);
    loading.value = false;
    isConnected.value = false;
  }
};

// Implementação do loadPreviousMessages com histórico
const loadPreviousMessages = async (tutoringId) => {
  try {
    // Limpar mensagens anteriores
    messages.value = [];
    loading.value = true;
    
    // Buscar histórico do chat
    const response = await getChatHistoryByTutoringId(tutoringId);
    
    if (response && response.data) {
      // Processar mensagens do histórico
      const historicalMessages = response.data.map(msg => ({
        id: msg.id || `hist_${msg.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        message: msg.message || msg.content,
        senderId: msg.senderId,
        senderName: msg.senderName || (String(msg.senderId) === String(currentUserId.value) ? 'Você' : msg.senderName),
        timestamp: msg.timestamp || msg.createdAt,
        tutoringId: msg.tutoringId || tutoringId,
        status: String(msg.senderId) === String(currentUserId.value) ? 'read' : 'received',
        isTemp: false
      }));
      
      // Ordenar mensagens por timestamp
      historicalMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Adicionar mensagens ao array
      messages.value = historicalMessages;
      
      console.log(`Carregadas ${historicalMessages.length} mensagens do histórico`);
    }
  } catch (error) {
    console.error('Erro ao carregar histórico de mensagens:', error);
    // Você pode adicionar uma notificação de erro aqui se desejar
  } finally {
    loading.value = false;
    // Scroll para o final após carregar as mensagens
    nextTick(() => scrollToBottom('auto'));
  }
};

// Método para recarregar o histórico quando necessário
const reloadChatHistory = async () => {
  if (props.mentoria?.originalId && isConnected.value) {
    await loadPreviousMessages(props.mentoria.originalId);
  }
};

// Método addMessage modificado para evitar duplicatas com mensagens do histórico
const addMessage = (message) => {
  const formattedMessage = {
    ...message,
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: message.timestamp || new Date().toISOString(),
    status: String(message.senderId) === String(currentUserId.value) ? (message.status || 'sent') : 'received',
    isTemp: false
  };

  // Verificar duplicatas de forma mais robusta
  const isDuplicate = messages.value.some(m => {
    // Verificar por ID
    if (m.id === formattedMessage.id && !m.isTemp) return true;
    
    // Verificar por conteúdo similar (para evitar duplicatas de race condition)
    if (m.message === formattedMessage.message && 
        String(m.senderId) === String(formattedMessage.senderId) &&
        !m.isTemp) {
      const timeDiff = Math.abs(new Date(m.timestamp) - new Date(formattedMessage.timestamp));
      return timeDiff < 5000; // 5 segundos de tolerância
    }
    
    return false;
  });

  if (!isDuplicate) {
    // Verificar se é uma mensagem mais antiga que todas as existentes
    const oldestMessage = messages.value.length > 0 
      ? messages.value.reduce((oldest, current) => 
          new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
        )
      : null;
    
    if (oldestMessage && new Date(formattedMessage.timestamp) < new Date(oldestMessage.timestamp)) {
      // Inserir no início se for mais antiga
      messages.value.unshift(formattedMessage);
    } else {
      // Adicionar no final
      messages.value.push(formattedMessage);
    }
    
    // Notificações e scroll
    if (String(message.senderId) !== String(currentUserId.value)) {
      if (messagesContainer.value && 
          (messagesContainer.value.scrollHeight - messagesContainer.value.scrollTop - messagesContainer.value.clientHeight > 50)) {
        unreadCount.value++;
      } else {
        markAsRead();
      }
    }

    nextTick(() => {
      if (shouldAutoScroll() || String(message.senderId) === String(currentUserId.value)) {
        scrollToBottom();
      }
    });
  }
};

// Método sendMessage modificado
const sendMessage = async () => {
  if (!canSendMessage.value) return;

  sending.value = true;
  const messageText = newMessage.value.trim();
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Criar mensagem temporária
  const tempMessage = {
    id: tempId,
    message: messageText,
    senderId: currentUserId.value,
    senderName: authStore.user?.name || 'Você',
    timestamp: timestamp,
    status: 'sending',
    isTemp: true // Marcador importante
  };

  // Adicionar ao mapa de mensagens temporárias
  tempMessageMap.value.set(messageText, tempId);

  // Adicionar mensagem localmente
  messages.value.push(tempMessage);
  newMessage.value = '';

  // Scroll para baixo
  nextTick(() => scrollToBottom());

  try {
    const success = chatClient.value.sendGeneralMessage(messageText, props.mentoria.originalId);
    if (!success) {
      throw new Error("Falha ao enviar mensagem via STOMP.");
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    // Atualizar status para falha
    const msgIndex = messages.value.findIndex(m => m.id === tempId);
    if (msgIndex !== -1) {
      messages.value[msgIndex].status = 'failed';
    }
    // Remover do mapa
    tempMessageMap.value.delete(messageText);
  } finally {
    sending.value = false;
  }
};

// Verificar mensagens pendentes
const checkPendingMessages = () => {
  const now = Date.now();
  messages.value.forEach((msg, index) => {
    if (msg.status === 'sending' && msg.isTemp) {
      const msgTime = new Date(msg.timestamp).getTime();
      if (now - msgTime > MESSAGE_TIMEOUT) {
        messages.value[index].status = 'failed';
        // Remover do mapa se ainda estiver lá
        tempMessageMap.value.delete(msg.message);
      }
    }
  });
};

const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  showScrollButton.value = distanceFromBottom > 200;

  // Detectar scroll no topo para carregar mais mensagens (se implementar paginação)
  if (scrollTop === 0 && !loading.value && messages.value.length > 0) {
    // Descomentar quando implementar paginação
    // loadMoreMessages();
  }

  if (distanceFromBottom < 50) {
    markAsRead();
  }
};

const shouldAutoScroll = () => {
  if (!messagesContainer.value) return true;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  return scrollHeight <= clientHeight || (scrollHeight - scrollTop - clientHeight) < 100;
};

const scrollToBottom = (behavior = 'smooth') => {
  if (!messagesContainer.value) return;
  nextTick(() => {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: behavior
    });
  });
};

const markAsRead = () => {
  if (unreadCount.value > 0) {
    unreadCount.value = 0;
  }
};

const handleTyping = () => {
  if (!isConnected.value) return;
  if (typingTimeout.value) clearTimeout(typingTimeout.value);
  typingTimeout.value = setTimeout(() => {
    // chatClient.value.sendTypingEvent(props.mentoria.originalId, false);
  }, 1500);
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const attachFile = () => {
  alert('Funcionalidade de anexar arquivos ainda não implementada.');
};

const clearChat = () => {
  if (confirm('Tem certeza que deseja limpar todas as mensagens desta conversa (apenas localmente)?')) {
    messages.value = [];
    tempMessageMap.value.clear();
  }
};

const toggleNotifications = () => {
  notifications.value = !notifications.value;
};

const toggleInfo = () => {
  showInfo.value = !showInfo.value;
};

onMounted(() => {
  if (props.mentoria && props.mentoria.originalId) {
    initializeChat();
  } else {
    console.error("Mentoria ou originalId não disponível no onMounted.");
    loading.value = false;
  }
  
  // Iniciar verificação de mensagens pendentes
  pendingCheckInterval = setInterval(checkPendingMessages, 5000);
});

onUnmounted(() => {
  if (chatClient.value) {
    chatClient.value.disconnect();
  }
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  if (pendingCheckInterval) {
    clearInterval(pendingCheckInterval);
  }
  tempMessageMap.value.clear();
});

watch(() => props.mentoria.originalId, (newId, oldId) => {
  if (newId !== oldId && newId) {
    console.log(`ID da Mentoria mudou de ${oldId} para ${newId}. Re-inicializando chat.`);
    messages.value = [];
    tempMessageMap.value.clear();
    unreadCount.value = 0;
    loading.value = true;
    isConnected.value = false;
    if (chatClient.value && chatClient.value.isConnected()) {
      chatClient.value.disconnect();
    }
    initializeChat();
  } else if (!newId && oldId) {
    console.warn("Mentoria originalId tornou-se nulo. Desconectando chat se ativo.");
    if (chatClient.value && chatClient.value.isConnected()) {
      chatClient.value.disconnect();
    }
    messages.value = [];
    tempMessageMap.value.clear();
    loading.value = false;
    isConnected.value = false;
  }
}, { immediate: false });

</script>

<style scoped>
.mentoring-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background-color: #004aad;
  color: white;
  min-height: 56px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.back-button {
  margin-right: 8px;
  color: white !important;
}

.chat-header-info {
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
}

.header-text {
  flex-grow: 1;
  overflow: hidden;
  margin-left: 8px;
}

.chat-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-subtitle {
  font-size: 0.75rem;
  opacity: 0.85;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-actions {
  display: flex;
  align-items: center;
}

.chat-actions .v-btn {
  color: white !important;
}

.chat-actions .v-btn {
  color: white !important;
}

.messages-area {
  flex-grow: 1;
  /* Ocupar todo o espaço vertical restante */
  overflow-y: auto;
  padding: 16px 12px;
  /* Padding horizontal menor */
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAFUlEQVQImWNgoAgg+vmP8WyMGUwPMAAALuwFR1QOimAAAAAASUVORK5CYII=");
  /* Padrão de pontinhos sutis */
  background-repeat: repeat;
  position: relative;
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #54656f;
  /* Cor do texto do WhatsApp para placeholders */
  height: 100%;
  box-sizing: border-box;
  text-align: center;
}

.loading-container span {
  margin-top: 12px;
}

.empty-state .v-icon {
  opacity: 0.3;
}

.empty-state h3 {
  color: #111b21;
  /* Cor do título escuro do WhatsApp */
  margin-top: 16px;
}

.empty-state p {
  color: #54656f;
}


.messages-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  /* Pequeno espaço entre as bolhas */
}

.date-separator {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.date-separator .v-chip {
  background-color: #e9edef;
  /* Cor de chip de data do WhatsApp */
  color: #54656f;
  font-size: 0.75rem;
  padding: 4px 8px;
  height: auto;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.1);
}

.message-container {
  display: flex;
  margin-bottom: 1px;
  /* Quase sem margem, o espaçamento vem do gap da lista */
}

.message-container.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: calc(100% - 60px);
  /* Limita a largura máxima */
  width: fit-content;
  /* Ajusta à largura do conteúdo */
  padding: 7px 10px;
  border-radius: 7.5px;
  /* Raio de borda do WhatsApp */
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  line-height: 1.35;
  font-size: 0.9rem;
}

.own-bubble {
  background-color: #dcf8c6;
  /* Verde do WhatsApp */
  border-bottom-right-radius: 2px;
}

.other-bubble {
  background-color: #ffffff;
  /* Branco */
  border-bottom-left-radius: 2px;
}

.sender-name {
  /* Para chats em grupo, não usado aqui mas bom ter */
  font-size: 0.8rem;
  color: #056162;
  /* Cor de nome em grupo do WhatsApp */
  font-weight: 500;
  margin-bottom: 2px;
  padding-left: 2px;
}

.message-content {
  color: #111b21;
  /* Cor do texto principal */
  margin-bottom: 3px;
  white-space: pre-wrap;
  /* Preserva quebras de linha e espaços */
}

.message-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 0px;
  /* Reduzido */
  height: 16px;
  float: right;
  /* Alinha à direita dentro da bolha */
  clear: both;
  /* Limpa float se o conteúdo for curto */
  line-height: 1;
  /* Para não adicionar altura extra */
}

.message-time {
  font-size: 0.7rem;
  /* Hora menor */
  color: #667781;
  margin-right: 2px;
  /* Pequeno espaço antes do ícone de status */
}

.status-icon {
  opacity: 0.9;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  /* Margem vertical */
  padding: 0 8px;
}

.typing-bubble {
  /* Estilo similar à bolha de mensagem */
  background-color: #ffffff;
  padding: 7px 10px;
  border-radius: 7.5px;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
}

.typing-dots span {
  width: 5px;
  /* Pontos menores */
  height: 5px;
  background-color: #8696a0;
  /* Cor dos pontos do WhatsApp */
  border-radius: 50%;
  animation: typing 1.2s infinite ease-in-out both;
  /* Animação mais sutil */
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.24s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.12s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.5;
  }

  40% {
    transform: translateY(-2px) scale(1);
    opacity: 1;
  }
}

.typing-text {
  font-size: 0.8rem;
  color: #54656f;
  font-style: italic;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
}

.scroll-to-bottom-btn .v-badge :deep(.v-badge__badge) {
  font-size: 0.65rem;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  line-height: 14px;
  /* Para centralizar o número */
}

.input-area {
  padding: 6px 10px;
  /* Padding menor */
  background-color: #f0f2f5;
  border-top: 1px solid #dde0e1;
  flex-shrink: 0;
  /* Não encolher */
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  /* Espaço menor */
  background-color: #ffffff;
  /* Fundo branco para o input */
  border-radius: 21px;
  /* Borda do input do WhatsApp */
  padding: 5px 8px;
  /* Padding interno */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.emoji-button,
.attach-button {
  color: #54656f !important;
  /* Cor dos ícones do WhatsApp */
  align-self: center;
  /* Centralizar verticalmente */
}

.emoji-button:hover,
.attach-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.message-input {
  flex-grow: 1;
  align-self: center;
  padding: 0;
  /* Remover padding extra do v-textarea wrapper */
}

/* Ajustes específicos para v-textarea para parecer com input de chat */
.message-input :deep(.v-input__control) {
  min-height: auto !important;
  /* Sobrescrever min-height */
}

.message-input :deep(.v-field) {
  padding: 6px 0px;
  /* Padding interno do campo */
  box-shadow: none !important;
  background-color: transparent !important;
  min-height: auto;
  line-height: 1.4;
  /* Melhorar espaçamento de linha no auto-grow */
}

.message-input :deep(textarea) {
  padding: 0 !important;
  /* Remover padding do textarea em si */
  margin: 0;
  max-height: 100px;
  /* Limitar altura máxima do auto-grow */
  overflow-y: auto !important;
  /* Garantir scroll no textarea se exceder max-rows */
}

.message-input :deep(.v-field__outline) {
  display: none;
}

.message-input :deep(.v-field__append-inner) {
  padding-top: 0;
  /* Ajustar alinhamento do ícone de anexo */
  align-self: center;
}


.send-button {
  margin: 0;
  /* Sem margem extra */
  width: 42px !important;
  /* Tamanho do botão de enviar do WhatsApp */
  height: 42px !important;
  align-self: flex-end;
  /* Alinhar com a base quando o input cresce */
}

.send-button .v-icon {
  font-size: 1.5rem;
  /* Tamanho do ícone de envio */
}

.info-item {
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.info-item strong {
  display: block;
  margin-bottom: 3px;
  color: #333;
  font-weight: 500;
}

@media (max-width: 600px) {
  .message-bubble {
    max-width: 80%;
  }

  .chat-header {
    padding: 8px 12px;
    min-height: 52px;
  }

  .messages-area {
    padding: 12px 8px;
  }

  .input-area {
    padding: 5px 8px;
  }

  .input-container {
    padding: 4px 6px;
    gap: 4px;
  }

  .send-button,
  .emoji-button,
  .attach-button {
    width: 38px !important;
    height: 38px !important;
  }

  .send-button .v-icon {
    font-size: 1.3rem;
  }

  .message-input :deep(textarea) {
    max-height: 80px;
    /* Altura máxima menor em mobile */
  }
}
</style>
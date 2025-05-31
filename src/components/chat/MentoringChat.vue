<template>
  <div class="mentoring-chat-container">
    <div class="chat-header">
      <v-btn icon variant="text" @click="$emit('back')" class="back-button">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div class="chat-header-info">
        <v-avatar size="40" class="mr-3">
          <v-img :src="mentoria?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="header-text">
          <div class="chat-title">{{ mentoria?.title }}</div>
          <div class="chat-subtitle">
            {{ mentoria?.otherUserName }} • {{ getStatusText() }}
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
            <v-list-item @click="reloadChatHistory" :disabled="!chatStore.isConnected || chatStore.isLoadingMessages">
              <template v-slot:prepend>
                <v-icon size="small">mdi-refresh</v-icon>
              </template>
              <v-list-item-title>Recarregar histórico</v-list-item-title>
            </v-list-item>
            
            <v-divider class="my-1"></v-divider>
            
            <v-list-item @click="clearLocalChatMessages">
              <template v-slot:prepend>
                <v-icon size="small">mdi-delete-outline</v-icon>
              </template>
              <v-list-item-title>Limpar conversa (local)</v-list-item-title>
            </v-list-item>
            
            <v-list-item @click="toggleLocalNotifications">
              <template v-slot:prepend>
                <v-icon size="small">
                  {{ localNotificationsEnabled ? 'mdi-bell-off-outline' : 'mdi-bell-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>
                {{ localNotificationsEnabled ? 'Silenciar' : 'Ativar' }} notificações (desta conversa)
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <div ref="messagesContainer" class="messages-area" @scroll="handleScroll">
      <div v-if="isLoading" class="loading-container">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <span class="ml-3">Carregando mensagens...</span>
      </div>

      <div v-else-if="currentChatMessages.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-2">mdi-message-text-outline</v-icon>
        <h3 class="text-h6 mt-4 text-grey">Nenhuma mensagem ainda</h3>
        <p class="text-body-2 text-grey mt-2">
          Envie uma mensagem para começar a conversa sobre {{ mentoria?.title }}
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
              <div v-if="!isOwnMessage(message) && mentoria?.role === 'mentor'" class="sender-name"> {{ message.senderName }}
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

        </div>

      <v-fab-transition>
        <v-btn v-if="showScrollButton" class="scroll-to-bottom-btn" size="small" icon color="primary"
          @click="scrollToBottom()" elevation="4">
          <v-badge v-if="newMessagesBelowCount > 0" :content="newMessagesBelowCount > 9 ? '9+' : newMessagesBelowCount" color="error" floating
            overlap>
            <v-icon>mdi-chevron-down</v-icon>
          </v-badge>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </v-fab-transition>
    </div>

    <div class="input-area">
      <div class="input-container">
        <v-textarea 
          v-model="newMessage" 
          :placeholder="getInputPlaceholder()" 
          variant="solo"
          density="compact"
          hide-details 
          single-line 
          :disabled="!chatStore.isConnected || chatStore.isSendingMessage || !mentoria?.isChatEnable" 
          @keydown.enter.prevent="submitMessage"
          @input="handleTypingInput" 
          @focus="markVisibleMessagesAsRead" 
          class="message-input" 
          rows="1" 
          auto-grow 
          max-rows="4" 
          flat
        >
          <template v-slot:append-inner>
            <v-btn icon variant="text" size="small" @click="attachFile" class="attach-button" :disabled="!mentoria?.isChatEnable">
              <v-icon>mdi-paperclip</v-icon>
            </v-btn>
          </template>
        </v-textarea>
        <v-btn 
          icon 
          color="primary" 
          @click="submitMessage" 
          :loading="chatStore.isSendingMessage" 
          :disabled="!canSendMessage || !mentoria?.isChatEnable"
          class="send-button"
          elevation="0"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="showMentoriaInfo" max-width="500">
      <v-card>
        <v-card-title>Informações da Mentoria</v-card-title>
        <v-card-text>
          <div class="info-item">
            <strong>Disciplina:</strong> {{ mentoria?.title }}
          </div>
          <div class="info-item">
            <strong>{{ mentoria?.role === 'mentor' ? 'Mentorado(s)' : 'Mentor' }}:</strong> 
            <span v-if="mentoria?.role === 'mentor'">
              <v-chip size="small" v-for="p in mentoria?.participants" :key="p.userId" class="mr-1 mb-1">{{ p.userName }}</v-chip>
              <span v-if="!mentoria?.participants?.length">Nenhum participante</span>
            </span>
            <span v-else>{{ mentoria?.otherUserName }}</span>
          </div>
          <div class="info-item">
            <strong>Tipo:</strong> {{ mentoria?.tutoringClassType }}
          </div>
          <div class="info-item">
            <strong>Data da Mentoria:</strong> {{ formatDate(mentoria?.tutoringDate) }}
          </div>
          <div class="info-item">
            <strong>Status da Mentoria:</strong> {{ getStatusText() }}
          </div>
           <div class="info-item">
            <strong>Chat Ativo:</strong> {{ mentoria?.isChatEnable ? 'Sim' : 'Não' }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showMentoriaInfo = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat'; // Import chat store

const props = defineProps({
  mentoria: { // This will be chatStore.selectedChat
    type: Object,
    default: () => null // Allow null when no chat is selected
  }
});

const emit = defineEmits(['back']); // messageReceived is handled by store

const authStore = useAuthStore();
const chatStore = useChatStore(); // Use chat store

// Estado local do componente (UI específico)
const newMessage = ref('');
const messagesContainer = ref(null);
const showScrollButton = ref(false);
const newMessagesBelowCount = ref(0); // For messages that arrive while scrolled up
// const someoneTyping = ref(false); // Typing indicator needs more robust store integration
// const typingUser = ref('');
const localNotificationsEnabled = ref(true); // Example for per-chat notification setting
const showMentoriaInfo = ref(false);
// const showConnectionIssueSnackbar = ref(false); // Handled by ChatManager

const currentUserId = computed(() => authStore.userId); // Assuming authStore has userId

// Get messages for the current chat from the store
const currentChatMessages = computed(() => {
  if (!props.mentoria || !props.mentoria.id) return [];
  return chatStore.messages.get(props.mentoria.id) || [];
});

const isLoading = computed(() => chatStore.isLoadingMessages);

const groupedMessages = computed(() => {
  const groups = [];
  let currentGroup = null;

  currentChatMessages.value.forEach(message => {
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
  return chatStore.isConnected && newMessage.value.trim() && !chatStore.isSendingMessage && props.mentoria?.isChatEnable;
});

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
  // Status from chatStore.messages should be: 'sending', 'sent', 'failed', 'read' (or 'delivered' if implemented)
  switch (status) {
    case 'read': return 'mdi-check-all'; // Blue for read
    case 'delivered': return 'mdi-check-all'; // Grey for delivered (if you implement this)
    case 'sent': return 'mdi-check'; // Single grey check for sent to server
    case 'sending': return 'mdi-clock-outline';
    case 'failed': return 'mdi-alert-circle-outline';
    default: return 'mdi-clock-outline'; // Default for unknown or temp
  }
};

const getStatusIconColor = (status) => {
 switch (status) {
    case 'read': return 'blue';
    case 'delivered': return 'grey'; // If you implement delivered
    case 'sent': return 'grey';
    case 'sending': return 'grey-lighten-1';
    case 'failed': return 'error';
    default: return 'grey-lighten-1';
  }
};

const getStatusText = () => {
  if (!props.mentoria) return 'Offline';
  // Status from the mentoria object (e.g., EM_ANDAMENTO, AGENDADA)
  // This is different from message status
  switch (props.mentoria.status) {
    case 'EM_ANDAMENTO': return 'Online'; // Or "Ao vivo"
    case 'AGENDADA': return 'Agendada';
    case 'FINALIZADA': return 'Finalizada';
    case 'CANCELADA': return 'Cancelada';
    default: return props.mentoria.status || 'Indisponível';
  }
};

const getInputPlaceholder = () => {
  if (!chatStore.isConnected) return 'Conectando ao chat...';
  if (!props.mentoria) return 'Selecione uma conversa.';
  if (!props.mentoria.isChatEnable) return 'O chat para esta mentoria está desabilitado.';
  if (props.mentoria.status === 'FINALIZADA') return 'Esta mentoria foi finalizada.';
  if (props.mentoria.status === 'CANCELADA') return 'Esta mentoria foi cancelada.';
  return 'Digite uma mensagem...';
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Using the corrected formatDate function from the prompt
const formatDate = (dateInput) => {
  if (!dateInput) return 'Data não disponível';
  try {
    let date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const trimmedDate = dateInput.trim();
      if (!trimmedDate) return 'Data não disponível';
      date = new Date(trimmedDate);
      if (isNaN(date.getTime()) && trimmedDate.includes(' ') && !trimmedDate.includes('T')) {
        date = new Date(trimmedDate.replace(' ', 'T'));
      }
      if (isNaN(date.getTime()) && trimmedDate.includes('/')) {
        const [datePart, timePart] = trimmedDate.split(' ');
        const [day, month, year] = datePart.split('/');
        if (timePart) {
          const [hour, minute] = timePart.split(':');
          date = new Date(year, month - 1, day, hour || 0, minute || 0);
        } else {
          date = new Date(year, month - 1, day);
        }
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      console.warn('Formato de data não reconhecido:', dateInput);
      return 'Data inválida';
    }
    if (isNaN(date.getTime())) {
      console.warn('Data inválida após tentativas de conversão:', dateInput);
      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Valor recebido:', dateInput);
    return 'Erro ao formatar data';
  }
};


const reloadChatHistory = async () => {
  if (props.mentoria?.originalId && chatStore.isConnected) {
    // The store action will set isLoadingMessages
    await chatStore.loadChatHistory(props.mentoria.id, props.mentoria.originalId);
  }
};

const submitMessage = async () => {
  if (!canSendMessage.value) return;

  const messageText = newMessage.value.trim();
  newMessage.value = ''; // Clear input immediately

  // Scroll to bottom after clearing input and before sending
  nextTick(() => scrollToBottom('smooth'));
  
  await chatStore.sendMessage(messageText, props.mentoria.id, props.mentoria.originalId);
  // chatStore.sendMessage handles temp message, status updates, and errors.
};

const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  showScrollButton.value = distanceFromBottom > 200;

  if (distanceFromBottom < 50) {
    if (newMessagesBelowCount.value > 0) {
        markVisibleMessagesAsRead(); // This will also reset newMessagesBelowCount
    }
  }
  // Logic for loading older messages on scroll to top can be added here if pagination is implemented in store
};

const shouldAutoScroll = () => {
  if (!messagesContainer.value) return true; // Auto-scroll if container not yet rendered
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // Auto-scroll if already at bottom or very close
  return scrollHeight - scrollTop - clientHeight < 100; 
};

const scrollToBottom = (behavior = 'smooth') => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: behavior
      });
      // Reset new messages count when explicitly scrolling to bottom
      newMessagesBelowCount.value = 0; 
    });
  }
};

const markVisibleMessagesAsRead = () => {
  // This is primarily for the UI's "new messages below" counter.
  // The store's `selectChat` action marks all messages in the chat as read.
  newMessagesBelowCount.value = 0; 
  // Potentially, you could also inform the store if only a portion of messages were "seen"
  // but for now, store handles bulk "read" on chat selection/open.
};

const handleTypingInput = () => {
  // Typing indicator logic would go here, likely involving emitting an event through chatStore
  // e.g., chatStore.sendTypingEvent(props.mentoria.originalId, true/false);
  // This requires STOMP client and store support.
};

const attachFile = () => {
  alert('Funcionalidade de anexar arquivos ainda não implementada.');
};

const clearLocalChatMessages = () => {
  if (props.mentoria?.id && confirm('Tem certeza que deseja limpar as mensagens desta conversa (apenas localmente)?')) {
    chatStore.messages.set(props.mentoria.id, []); // Clears locally, store might re-fetch or not.
    // For a more permanent "clear" that syncs, an API call would be needed.
  }
};

const toggleLocalNotifications = () => {
  localNotificationsEnabled.value = !localNotificationsEnabled.value;
  // This state would be used to suppress new message notifications from this specific chat
  // if chatStore.showNotification considered it.
};

const toggleInfo = () => {
  showMentoriaInfo.value = !showMentoriaInfo.value;
};

// Watch for changes in the selected chat (mentoria prop)
watch(() => props.mentoria, async (newMentoria, oldMentoria) => {
  if (newMentoria && newMentoria.id) {
    if (!oldMentoria || newMentoria.id !== oldMentoria.id) {
      // New chat selected, reset UI state and scroll
      newMessagesBelowCount.value = 0;
      // History loading is handled by chatStore.selectChat
      // but ensure scroll to bottom for new chat.
      nextTick(() => scrollToBottom('auto')); 
    }
  } else {
    // No chat selected, clear messages (though currentChatMessages computed will do this)
    newMessagesBelowCount.value = 0;
  }
}, { immediate: true });


// Watch messages for the current chat to handle auto-scroll and new message counter
watch(currentChatMessages, (newMessages, oldMessages) => {
  if (newMessages.length > oldMessages.length) { // New message(s) arrived
    const lastMessage = newMessages[newMessages.length - 1];
    if (shouldAutoScroll() || (lastMessage && isOwnMessage(lastMessage))) {
      nextTick(() => scrollToBottom('smooth'));
    } else {
      // If not auto-scrolling and message is not own, increment counter
      if (lastMessage && !isOwnMessage(lastMessage)) {
         newMessagesBelowCount.value += newMessages.length - oldMessages.length;
      }
    }
  }
  // If messages are cleared (e.g., history reloaded or chat changed), ensure scroll.
   else if (newMessages.length > 0 && oldMessages.length === 0) {
     nextTick(() => scrollToBottom('auto'));
   }
}, { deep: true });


// Watch for connection changes for UI feedback (e.g., disable input)
// The global snackbar is in ChatManager. This is for specific UI elements here.
// watch(() => chatStore.isConnected, (connected) => {
//   showConnectionIssueSnackbar.value = !connected;
// });

onMounted(() => {
  // When component mounts with a mentoria already selected
  if (props.mentoria && props.mentoria.id) {
     // Ensure messages are marked as read in the store for this chat if it's active
    if(chatStore.unreadMessages.has(props.mentoria.id)) {
        chatStore.unreadMessages.set(props.mentoria.id, 0);
    }
    // Load history if it's empty for this chat (store's selectChat should do this, but as a fallback)
    if (currentChatMessages.value.length === 0 && !chatStore.isLoadingMessages) {
      reloadChatHistory();
    } else {
      nextTick(() => scrollToBottom('auto'));
    }
  }
});

onUnmounted(() => {
  // No client to disconnect here, store manages it.
  // Clear any component-specific timers or listeners if they were added.
});

</script>

<style scoped>
/* Styles from the original prompt are quite good and can be largely reused. */
/* Small adjustments might be needed based on new prop names if any CSS was tied to old data structure. */
.mentoring-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5; /* A slightly different, common chat bg */
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 8.5px 16px;
  background-color: #004aad; /* Primary color from theme */
  color: white;
  min-height: 56px; /* Standard app bar height */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0; /* Prevent header from shrinking */
}

.back-button {
  margin-right: 8px;
  color: white !important;
}

.chat-header-info {
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0; /* Important for ellipsis to work in flex children */
}

.header-text {
  flex-grow: 1;
  overflow: hidden; /* For text ellipsis */
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

.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 12px;
  /* A common WhatsApp-like subtle pattern */
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAFUlEQVQImWNgoAgg+vmP8WyMGUwPMAAALuwFR1QOimAAAAAASUVORK5CYII=");
  background-repeat: repeat;
  position: relative; /* For scroll-to-bottom button positioning */
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #54656f; 
  height: 100%;
  box-sizing: border-box;
  text-align: center;
}

.loading-container span {
  margin-top: 12px;
}
.empty-state .v-icon { opacity: 0.3; }
.empty-state h3 { color: #111b21; margin-top: 16px; }
.empty-state p { color: #54656f; }


.messages-list {
  display: flex;
  flex-direction: column;
  gap: 3px; /* Small gap between message bubbles */
}

.date-separator {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.date-separator .v-chip {
  background-color: #e9edef; /* WhatsApp date chip color */
  color: #54656f;
  font-size: 0.75rem;
  padding: 4px 8px;
  height: auto;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.1);
}

.message-container {
  display: flex;
  margin-bottom: 1px; 
}

.message-container.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: calc(100% - 60px); /* Max width, can be adjusted */
  width: fit-content; /* Adjusts to content width */
  padding: 7px 10px;
  border-radius: 7.5px; /* WhatsApp like border radius */
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 1px rgba(0,0,0,0.08);
  line-height: 1.35;
  font-size: 0.9rem;
}

.own-bubble {
  background-color: #dcf8c6; /* WhatsApp green */
  border-bottom-right-radius: 2px; /* Tail effect */
}

.other-bubble {
  background-color: #ffffff; /* White */
  border-bottom-left-radius: 2px; /* Tail effect */
}

.sender-name {
  font-size: 0.8rem;
  color: #056162; /* WhatsApp group sender name color */
  font-weight: 500;
  margin-bottom: 2px;
  padding-left: 2px; /* Slight indent for sender name */
}

.message-content {
  color: #111b21; /* Main text color */
  margin-bottom: 3px; /* Space for timestamp */
  white-space: pre-wrap; /* Preserve line breaks and spaces */
}

.message-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 0px; 
  height: 16px; /* Fixed height for the info line */
  float: right; /* Align to the right within the bubble */
  clear: both; /* Important if message content is short */
  line-height: 1; /* Prevent adding extra height */
}

.message-time {
  font-size: 0.7rem; /* Smaller timestamp */
  color: #667781; 
  margin-right: 2px; /* Space before status icon */
}

.status-icon {
  opacity: 0.9;
}

/* Typing indicator styles (if re-implemented) */
.typing-indicator { display: flex; align-items: center; gap: 8px; margin: 8px 0; padding: 0 8px; }
.typing-bubble { background-color: #ffffff; padding: 7px 10px; border-radius: 7.5px; border-bottom-left-radius: 2px; box-shadow: 0 1px 1px rgba(0,0,0,0.08); }
.typing-dots span { width: 5px; height: 5px; background-color: #8696a0; border-radius: 50%; display: inline-block; margin: 0 1px; animation: typing 1.2s infinite ease-in-out both; }
.typing-dots span:nth-child(1) { animation-delay: -0.24s; }
.typing-dots span:nth-child(2) { animation-delay: -0.12s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }
@keyframes typing { 0%, 80%, 100% { transform: translateY(0px) scale(0.7); opacity: 0.5; } 40% { transform: translateY(-2px) scale(1); opacity: 1; } }
.typing-text { font-size: 0.8rem; color: #54656f; font-style: italic; }

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
}
.scroll-to-bottom-btn .v-badge :deep(.v-badge__badge) {
  font-size: 0.65rem; min-width: 14px; height: 14px; padding: 0 3px; line-height: 14px;
}

.input-area {
  padding: 6px 10px; 
  background-color: #f0f2f5; /* Match messages area bg or slightly different */
  border-top: 1px solid #dde0e1; /* Subtle separator */
  flex-shrink: 0; /* Prevent input area from shrinking */
}

.input-container {
  display: flex;
  align-items: flex-end; /* Align items to bottom when textarea grows */
  gap: 6px; 
  background-color: #ffffff; /* White background for the input field itself */
  border-radius: 21px; /* WhatsApp input field border radius */
  padding: 5px 8px; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.attach-button { /*, .emoji-button */
  color: #54656f !important; /* WhatsApp icon colors */
  align-self: center; /* Vertically center with single line input */
}
.attach-button:hover { /*, .emoji-button:hover */
  background-color: rgba(0,0,0,0.05); /* Subtle hover */
}

.message-input {
  flex-grow: 1;
  align-self: center; /* Center when single line */
  padding: 0;
}

.message-input :deep(.v-input__control) { min-height: auto !important; }
.message-input :deep(.v-field) { 
  padding: 6px 0px; /* Internal padding for the field */
  box-shadow: none !important; 
  background-color: transparent !important;
  min-height: auto;
  line-height: 1.4;/* Better line spacing for auto-grow */
}
.message-input :deep(textarea) { 
  padding: 0 !important; /* Remove textarea's own padding */
  margin: 0; 
  max-height: 100px; /* Limit max height of auto-grow */
  overflow-y: auto !important;/* Ensure scroll within textarea if max-rows exceeded */
}
.message-input :deep(.v-field__outline) { display: none; } /* Hide default outline */
.message-input :deep(.v-field__append-inner) { 
  padding-top: 0; 
  align-self: center;/* Align attachment icon */
}

.send-button {
  margin: 0;
  width: 42px !important; /* WhatsApp send button size */
  height: 42px !important;
  align-self: flex-end; /* Keep it at the bottom as textarea grows */
}
.send-button .v-icon { font-size: 1.5rem; } /* Send icon size */

.info-item { margin-bottom: 10px; font-size: 0.9rem; }
.info-item strong { display: block; margin-bottom: 3px; color: #333; font-weight: 500; }

@media (max-width: 600px) {
  .message-bubble { max-width: 80%; }
  .chat-header { padding: 8px 12px; min-height: 52px; }
  .messages-area { padding: 12px 8px; }
  .input-area { padding: 5px 8px; }
  .input-container { padding: 4px 6px; gap: 4px; }
  .send-button, .attach-button { /*, .emoji-button */ width: 38px !important; height: 38px !important; }
  .send-button .v-icon { font-size: 1.3rem; }
  .message-input :deep(textarea) { max-height: 80px; }
}
</style>
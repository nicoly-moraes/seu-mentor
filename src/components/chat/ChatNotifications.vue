<template>
  <div class="chat-notifications">
    <!-- Toast de nova mensagem -->
    <v-snackbar
      v-model="showMessageToast"
      :timeout="4000"
      location="top right"
      color="primary"
      class="message-toast"
    >
      <div class="toast-content">
        <v-avatar size="32" class="mr-3">
          <v-img :src="currentNotification?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="toast-text">
          <div class="toast-title">{{ currentNotification?.title }}</div>
          <div class="toast-message">{{ currentNotification?.message }}</div>
        </div>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="openChat"
          size="small"
        >
          Abrir
        </v-btn>
        <v-btn
          icon
          @click="dismissNotification"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Notificação de status de conexão -->
    <v-snackbar
      v-model="showConnectionToast"
      :color="connectionToast.color"
      :timeout="connectionToast.timeout"
      location="bottom"
    >
      <v-icon class="mr-2">{{ connectionToast.icon }}</v-icon>
      {{ connectionToast.message }}
    </v-snackbar>

    <!-- Notificação de digitação -->
    <v-snackbar
      v-model="showTypingToast"
      :timeout="3000"
      location="bottom right"
      color="info"
      class="typing-toast"
    >
      <div class="typing-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="ml-2">{{ typingNotification?.user }} está digitando...</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  notifications: {
    type: Array,
    default: () => []
  },
  connectionStatus: {
    type: Object,
    default: () => ({})
  },
  typingUsers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['openChat', 'dismiss']);

// Estado
const showMessageToast = ref(false);
const showConnectionToast = ref(false);
const showTypingToast = ref(false);
const currentNotification = ref(null);
const connectionToast = ref({});
const typingNotification = ref(null);

// Métodos
const showNotification = (notification) => {
  currentNotification.value = notification;
  showMessageToast.value = true;
  
  // Som de notificação
  playNotificationSound();
};

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (error) {
    // Ignorar erro
  }
};

const openChat = () => {
  emit('openChat', currentNotification.value);
  dismissNotification();
};

const dismissNotification = () => {
  showMessageToast.value = false;
  emit('dismiss', currentNotification.value);
};

// Watchers
watch(() => props.notifications, (newNotifications) => {
  if (newNotifications.length > 0) {
    const latest = newNotifications[newNotifications.length - 1];
    showNotification(latest);
  }
}, { deep: true });

watch(() => props.connectionStatus, (status) => {
  if (status && Object.keys(status).length > 0) {
    connectionToast.value = status;
    showConnectionToast.value = true;
  }
}, { deep: true });

watch(() => props.typingUsers, (users) => {
  if (users.length > 0) {
    typingNotification.value = {
      user: users[0].name,
      mentoria: users[0].mentoria
    };
    showTypingToast.value = true;
  } else {
    showTypingToast.value = false;
  }
}, { deep: true });
</script>

<style scoped>
.message-toast {
  z-index: 2000;
}

.toast-content {
  display: flex;
  align-items: center;
  min-width: 300px;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.typing-toast {
  z-index: 1999;
}

.typing-content {
  display: flex;
  align-items: center;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots span {
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>

<template>
  <div class="chat-example-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Sistema de Chat - Exemplo</h1>
          
          <!-- Informações do usuário -->
          <v-card class="mb-6">
            <v-card-title>Status do Chat</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="status-item">
                    <v-icon 
                      :color="chatManager?.isConnected ? 'success' : 'error'"
                      class="mr-2"
                    >
                      {{ chatManager?.isConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}
                    </v-icon>
                    <span>
                      {{ chatManager?.isConnected ? 'Conectado' : 'Desconectado' }}
                    </span>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="status-item">
                    <v-icon color="primary" class="mr-2">mdi-message</v-icon>
                    <span>{{ totalUnread }} mensagens não lidas</span>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-btn 
                @click="openChat" 
                color="primary"
                :disabled="!hasChats"
              >
                Abrir Chat
              </v-btn>
              <v-btn 
                @click="reconnectChat" 
                variant="outlined"
                :loading="reconnecting"
              >
                Reconectar
              </v-btn>
              <v-btn 
                @click="simulateMessage" 
                variant="outlined"
                color="secondary"
              >
                Simular Mensagem
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Lista de mentorias disponíveis -->
          <v-card>
            <v-card-title>Mentorias com Chat Habilitado</v-card-title>
            <v-card-text>
              <v-row>
                <v-col 
                  v-for="mentoria in mentoriasComChat" 
                  :key="mentoria.id"
                  cols="12" 
                  md="6" 
                  lg="4"
                >
                  <v-card variant="outlined" class="mentoria-card">
                    <v-card-text>
                      <div class="d-flex align-center mb-2">
                        <v-avatar size="40" class="mr-3">
                          <v-img :src="mentoria.mentorAvatar || '/placeholder-user.jpg'" />
                        </v-avatar>
                        <div>
                          <div class="font-weight-medium">{{ mentoria.disciplineName }}</div>
                          <div class="text-caption text-grey">{{ mentoria.mentorName }}</div>
                        </div>
                      </div>
                      <v-chip 
                        :color="getStatusColor(mentoria.status)" 
                        size="small"
                        class="mb-2"
                      >
                        {{ getStatusText(mentoria.status) }}
                      </v-chip>
                      <div class="text-body-2">
                        {{ mentoria.tutoringClassType }} • 
                        {{ formatDate(mentoria.tutoringDate) }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <div v-if="mentoriasComChat.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-message-off</v-icon>
                <p class="text-grey mt-4">Nenhuma mentoria com chat habilitado</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Gerenciador de Chat -->
    <ChatManager
      ref="chatManager"
      :mentorias="mentorias"
      :auto-connect="true"
      @message-received="handleMessageReceived"
      @connection-changed="handleConnectionChanged"
    />

    <!-- Notificações -->
    <ChatNotifications
      :notifications="notifications"
      :connection-status="connectionStatus"
      :typing-users="typingUsers"
      @open-chat="handleOpenChatFromNotification"
      @dismiss="handleDismissNotification"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ChatManager from '@/components/chat/ChatManager.vue';
import ChatNotifications from '@/components/chat/ChatNotifications.vue';

// Estado
const chatManager = ref(null);
const reconnecting = ref(false);
const notifications = ref([]);
const connectionStatus = ref({});
const typingUsers = ref([]);

// Dados de exemplo (normalmente viriam de uma API)
const mentorias = ref([
  {
    id: 1,
    disciplineName: 'Matemática Avançada',
    mentorName: 'Prof. João Silva',
    mentorAvatar: '/placeholder-user.jpg',
    tutoringClassType: 'ONLINE',
    tutoringDate: new Date().toISOString(),
    status: 'EM_ANDAMENTO',
    isChatEnable: true
  },
  {
    id: 2,
    disciplineName: 'Física Quântica',
    mentorName: 'Dra. Maria Santos',
    mentorAvatar: '/placeholder-user.jpg',
    tutoringClassType: 'PRESENCIAL',
    tutoringDate: new Date(Date.now() + 86400000).toISOString(),
    status: 'AGENDADA',
    isChatEnable: true
  },
  {
    id: 3,
    disciplineName: 'Programação Web',
    mentorName: 'Carlos Oliveira',
    mentorAvatar: '/placeholder-user.jpg',
    tutoringClassType: 'ONLINE',
    tutoringDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'FINALIZADA',
    isChatEnable: true
  }
]);

// Computed
const mentoriasComChat = computed(() => {
  return mentorias.value.filter(m => m.isChatEnable);
});

const hasChats = computed(() => {
  return mentoriasComChat.value.length > 0;
});

const totalUnread = computed(() => {
  return chatManager.value?.totalUnreadCount || 0;
});

// Métodos
const getStatusColor = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'success';
    case 'AGENDADA': return 'warning';
    case 'FINALIZADA': return 'info';
    case 'CANCELADA': return 'error';
    default: return 'grey';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'Em Andamento';
    case 'AGENDADA': return 'Agendada';
    case 'FINALIZADA': return 'Finalizada';
    case 'CANCELADA': return 'Cancelada';
    default: return 'Indefinido';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const openChat = () => {
  if (chatManager.value) {
    chatManager.value.openChatList();
  }
};

const reconnectChat = async () => {
  if (chatManager.value) {
    reconnecting.value = true;
    try {
      await chatManager.value.reconnect();
    } finally {
      reconnecting.value = false;
    }
  }
};

const simulateMessage = () => {
  // Simular recebimento de mensagem
  const randomMentoria = mentoriasComChat.value[Math.floor(Math.random() * mentoriasComChat.value.length)];
  if (randomMentoria) {
    const simulatedMessage = {
      id: Date.now(),
      message: 'Esta é uma mensagem de teste para demonstrar as notificações!',
      senderId: 'other-user',
      senderName: randomMentoria.mentorName,
      timestamp: new Date(),
      tutoringId: randomMentoria.id
    };

    handleMessageReceived({
      message: simulatedMessage,
      mentoria: randomMentoria
    });
  }
};

const handleMessageReceived = ({ message, mentoria }) => {
  console.log('Nova mensagem recebida:', message, mentoria);
  
  // Adicionar à lista de notificações
  notifications.value.push({
    id: message.id,
    title: mentoria.disciplineName,
    message: message.message,
    avatar: mentoria.mentorAvatar,
    senderName: message.senderName,
    timestamp: message.timestamp,
    tutoringId: mentoria.id
  });
};

const handleConnectionChanged = (connected) => {
  console.log('Status de conexão alterado:', connected);
  
  connectionStatus.value = {
    color: connected ? 'success' : 'error',
    message: connected ? 'Conectado ao chat' : 'Desconectado do chat',
    icon: connected ? 'mdi-wifi' : 'mdi-wifi-off',
    timeout: 3000
  };
};

const handleOpenChatFromNotification = (notification) => {
  console.log('Abrir chat da notificação:', notification);
  openChat();
};

const handleDismissNotification = (notification) => {
  console.log('Dispensar notificação:', notification);
  const index = notifications.value.findIndex(n => n.id === notification.id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

// Lifecycle
onMounted(() => {
  console.log('Página de exemplo do chat carregada');
});
</script>

<style scoped>
.chat-example-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.mentoria-card {
  height: 100%;
  transition: all 0.2s ease;
}

.mentoria-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>

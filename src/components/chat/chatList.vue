<template>
  <v-dialog
    v-model="visible"
    :fullscreen="$vuetify.display.smAndDown"
    :max-width="$vuetify.display.smAndDown ? undefined : '1200px'"
    :height="$vuetify.display.smAndDown ? undefined : '700px'"
    transition="dialog-bottom-transition"
    persistent
    class="chat-dialog"
  >

    <v-card class="chat-list-container">
      <!-- Sidebar de Conversas -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="!$vuetify.display.mdAndUp && !drawerExpanded"
        :permanent="$vuetify.display.mdAndUp"
        :temporary="!$vuetify.display.mdAndUp"
        width="400"
        class="chat-sidebar"
        :class="{ 'drawer-expanded': drawerExpanded }"
      >
        <!-- Header da Sidebar -->
        <v-toolbar color="primary" dark flat class="sidebar-header">
          <v-btn
            icon="mdi mdi-close"
            @click="close"
            class="close-button"
            > <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title class="sidebar-title">
            <v-icon class="mr-2">mdi-message-text</v-icon>
            Conversas
          </v-toolbar-title>


          <v-btn icon @click="refreshChats" :loading="refreshing">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>

          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="markAllAsRead">
                <v-list-item-title>Marcar todas como lidas</v-list-item-title>
              </v-list-item>
              <v-list-item @click="showArchivedChats = !showArchivedChats">
                <v-list-item-title>
                  {{ showArchivedChats ? 'Ocultar' : 'Mostrar' }} arquivadas
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>

        <!-- Barra de Pesquisa -->
        <div class="search-container">
          <v-text-field
            v-model="searchQuery"
            placeholder="Pesquisar conversas..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            flat
            hide-details
            single-line
            clearable
            class="search-field"
          ></v-text-field>
        </div>

        <!-- Filtros -->
        <div class="filters-container">
          <v-chip-group v-model="selectedFilter" mandatory class="filter-chips">
            <v-chip value="all" size="small">Todas</v-chip>
            <v-chip value="unread" size="small">Não lidas</v-chip>
            <v-chip value="active" size="small">Ativas</v-chip>
          </v-chip-group>
        </div>

        <!-- Lista de Conversas -->
        <v-list class="chat-list" lines="two">
          <template v-if="loading">
            <v-list-item v-for="n in 5" :key="n">
              <template v-slot:prepend>
                <v-skeleton-loader type="avatar"></v-skeleton-loader>
              </template>
              <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
            </v-list-item>
          </template>

          <template v-else-if="filteredChats.length === 0">
            <div class="empty-chats">
              <v-icon size="48" color="grey-lighten-2">mdi-message-outline</v-icon>
              <p class="text-grey mt-2">
                {{ searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível' }}
              </p>
            </div>
          </template>

          <template v-else>
            <v-list-item
              v-for="chat in filteredChats"
              :key="chat.id"
              :active="selectedChat?.id === chat.id"
              @click="selectChat(chat)"
              :class="{
                'has-unread': chat.unreadCount > 0,
                'chat-active': chat.status === 'EM_ANDAMENTO'
              }"
              class="chat-item"
            >
              <template v-slot:prepend>
                <v-badge
                  :content="chat.unreadCount"
                  :model-value="chat.unreadCount > 0"
                  color="error"
                  overlap
                  offset-x="8"
                  offset-y="8"
                >
                  <v-avatar size="56" class="chat-avatar">
                    <v-img
                      :src="chat.avatar || '/placeholder-user.jpg'"
                      :alt="chat.title"
                    />
                    <div
                      v-if="chat.status === 'EM_ANDAMENTO'"
                      class="online-indicator"
                    ></div>
                  </v-avatar>
                </v-badge>
              </template>

              <v-list-item-title class="chat-title">
                {{ chat.title }}
                <v-chip
                  v-if="chat.status === 'EM_ANDAMENTO'"
                  size="x-small"
                  color="success"
                  class="ml-2"
                >
                  Ao vivo
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle class="chat-subtitle">
                <div class="subtitle-line">
                  <span class="mentor-name">{{ chat.mentorName }}</span>
                  <span class="separator">•</span>
                  <span class="class-type">{{ chat.tutoringClassType }}</span>
                </div>
                <div class="last-message">
                  <v-icon
                    v-if="chat.lastMessageSent"
                    size="16"
                    class="mr-1"
                    :color="chat.lastMessageRead ? 'blue' : 'grey'"
                  >
                    {{ chat.lastMessageRead ? 'mdi-check-all' : 'mdi-check' }}
                  </v-icon>
                  {{ chat.lastMessage || 'Clique para iniciar a conversa' }}
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="chat-meta">
                  <div class="chat-time">
                    {{ formatChatTime(chat.lastMessageTime || chat.tutoringDate) }}
                  </div>
                  <div class="chat-status">
                    <v-icon
                      size="16"
                      :color="getStatusColor(chat.status)"
                      class="status-icon"
                    >
                      {{ getStatusIcon(chat.status) }}
                    </v-icon>
                  </div>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-navigation-drawer>

      <!-- Área Principal do Chat -->
      <v-main class="chat-main">
        <div v-if="!selectedChat" class="empty-chat-area">
          <div class="empty-content">
            <v-icon size="80" color="grey-lighten-2">mdi-message-text-outline</v-icon>
            <h3 class="text-h5 mt-4 text-grey-darken-1">Selecione uma conversa</h3>
            <p class="text-body-1 text-grey mt-2 text-center">
              Escolha uma mentoria à esquerda para começar a conversar
            </p>
            <div class="empty-features mt-6">
              <div class="feature-item">
                <v-icon color="primary" class="mr-2">mdi-message-fast</v-icon>
                <span>Mensagens em tempo real</span>
              </div>
              <div class="feature-item">
                <v-icon color="primary" class="mr-2">mdi-file-document</v-icon>
                <span>Compartilhe arquivos e documentos</span>
              </div>
              <div class="feature-item">
                <v-icon color="primary" class="mr-2">mdi-school</v-icon>
                <span>Tire dúvidas sobre suas mentorias</span>
              </div>
            </div>
          </div>
        </div>

        <MentoringChat
          v-else
          :mentoria="selectedChat"
          @back="handleChatBack"
          @messageReceived="handleMessageReceived"
          class="mentoring-chat"
        />
      </v-main>

      <!-- Botão flutuante para mobile -->
      <v-btn
        v-if="$vuetify.display.smAndDown && selectedChat"
        fab
        fixed
        bottom
        left
        color="primary"
        @click="toggleDrawer"
        class="mobile-drawer-toggle"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import MentoringChat from './MentoringChat.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mentorias: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Estado
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const drawer = ref(true);
const drawerExpanded = ref(false);
const searchQuery = ref('');
const selectedFilter = ref('all');
const selectedChat = ref(null);
const chats = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const showArchivedChats = ref(false);

// Filtrar chats
const filteredChats = computed(() => {
  let filtered = chats.value;

  // Filtro por pesquisa
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(chat =>
      chat.title.toLowerCase().includes(query) ||
      chat.mentorName.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }

  // Filtro por tipo
  switch (selectedFilter.value) {
    case 'unread':
      filtered = filtered.filter(chat => chat.unreadCount > 0);
      break;
    case 'active':
      filtered = filtered.filter(chat => chat.status === 'EM_ANDAMENTO');
      break;
  }

  // Ordenar por última mensagem
  return filtered.sort((a, b) => {
    const timeA = new Date(a.lastMessageTime || a.tutoringDate);
    const timeB = new Date(b.lastMessageTime || b.tutoringDate);
    return timeB - timeA;
  });
});

// Converter mentorias em formato de chat
const loadChats = () => {
  loading.value = true;

  try {
    chats.value = props.mentorias
      .filter(mentoria => mentoria.isChatEnable)
      .map(mentoria => ({
        id: mentoria.id,
        title: mentoria.disciplineName,
        mentorName: mentoria.mentorName,
        tutoringClassType: mentoria.tutoringClassType,
        avatar: mentoria.mentorAvatar,
        lastMessage: '',
        lastMessageTime: null,
        lastMessageSent: false,
        lastMessageRead: false,
        unreadCount: Math.floor(Math.random() * 3), // Simulado
        status: mentoria.status,
        tutoringDate: mentoria.tutoringDate,
        ...mentoria
      }));
  } finally {
    loading.value = false;
  }
};

// Selecionar um chat
const selectChat = (chat) => {
  selectedChat.value = chat;

  // Marcar como lido
  const chatIndex = chats.value.findIndex(c => c.id === chat.id);
  if (chatIndex !== -1) {
    chats.value[chatIndex].unreadCount = 0;
  }

  // Em mobile, fechar o drawer
  if (!$vuetify.display.mdAndUp) {
    drawer.value = false;
  }
};

// Formatar tempo do chat
const formatChatTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else if (diffInHours < 168) { // 7 dias
    return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
};

// Ícones e cores de status
const getStatusIcon = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'mdi-circle';
    case 'AGENDADA': return 'mdi-clock-outline';
    case 'FINALIZADA': return 'mdi-check-circle';
    case 'CANCELADA': return 'mdi-cancel';
    default: return 'mdi-circle-outline';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'success';
    case 'AGENDADA': return 'warning';
    case 'FINALIZADA': return 'info';
    case 'CANCELADA': return 'error';
    default: return 'grey';
  }
};

// Handlers
const handleChatBack = () => {
  selectedChat.value = null;
  if (!$vuetify.display.mdAndUp) {
    drawer.value = true;
  }
};

const handleMessageReceived = (message) => {
  // Atualizar última mensagem do chat
  const chatIndex = chats.value.findIndex(c => c.id === selectedChat.value?.id);
  if (chatIndex !== -1) {
    chats.value[chatIndex].lastMessage = message.message;
    chats.value[chatIndex].lastMessageTime = message.timestamp;
    chats.value[chatIndex].lastMessageSent = message.senderId === 'currentUserId'; // Ajustar conforme necessário
  }
};

const refreshChats = async () => {
  refreshing.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
  loadChats();
  refreshing.value = false;
};

const markAllAsRead = () => {
  chats.value.forEach(chat => {
    chat.unreadCount = 0;
  });
};

const toggleDrawer = () => {
  drawer.value = !drawer.value;
  drawerExpanded.value = !drawerExpanded.value;
};

const close = () => {
  visible.value = false;
  selectedChat.value = null;
  emit('close');
};

// Lifecycle
watch(visible, (newValue) => {
  if (newValue) {
    loadChats();
  }
});

onMounted(() => {
  if (visible.value) {
    loadChats();
  }
});
</script>

<style scoped>
.chat-dialog :deep(.v-overlay__content) {
  margin: 0;
  height: 100vh;
  max-height: 100vh;
}

.chat-list-container {
  height: 100%;
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  border-right: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.sidebar-header {
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-title {
  font-size: 18px;
  font-weight: 500;
}

.search-container {
  padding: 12px;
  background-color: #f8f9fa;
}

.search-field :deep(.v-field) {
  border-radius: 20px;
  background-color: white;
}

.filters-container {
  padding: 0 12px 8px 12px;
  background-color: #f8f9fa;
}

.filter-chips {
  justify-content: flex-start;
}

.chat-list {
  background-color: white;
  overflow-y: auto;
  height: calc(100% - 180px);
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.chat-item {
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 12px 16px;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-item.has-unread {
  background-color: #f0f7ff;
}

.chat-item.chat-active {
  border-left: 3px solid #4caf50;
}

.chat-avatar {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-title {
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.chat-subtitle {
  margin-top: 4px;
}

.subtitle-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #667781;
  margin-bottom: 2px;
}

.mentor-name {
  font-weight: 500;
}

.separator {
  margin: 0 6px;
}

.class-type {
  text-transform: capitalize;
}

.last-message {
  font-size: 13px;
  color: #667781;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 60px;
}

.chat-time {
  font-size: 12px;
  color: #667781;
  white-space: nowrap;
}

.status-icon {
  opacity: 0.7;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #e5ddd5;
}

.empty-chat-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
}

.mentoring-chat {
  height: 100%;
}

.mobile-drawer-toggle {
  z-index: 1000;
  margin: 16px;
}

@media (max-width: 960px) {
  .chat-sidebar.drawer-expanded {
    width: 100% !important;
  }

  .sidebar-header {
    padding: 8px 12px;
  }

  .chat-item {
    padding: 16px;
  }

  .empty-content {
    padding: 20px;
  }

  .empty-features {
    margin-top: 24px;
  }
}
</style>

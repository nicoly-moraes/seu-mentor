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
          <v-btn icon="mdi mdi-close" @click="close" class="close-button">
            <v-icon>mdi-close</v-icon>
          </v-btn>

          <v-toolbar-title class="sidebar-title">
            <v-icon class="mr-2">mdi-message-text</v-icon>
            Conversas
          </v-toolbar-title>

          <v-spacer></v-spacer>

          <v-badge
            :content="chatStore.totalUnreadCount"
            :model-value="chatStore.totalUnreadCount > 0"
            color="error"
            overlap
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>

          <v-btn icon @click="refreshChats" :loading="chatStore.isLoadingMentorias">
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

        <!-- Status de Conexão -->
        <v-alert
          v-if="!chatStore.isConnected"
          type="warning"
          variant="tonal"
          density="compact"
          class="ma-2"
        >
          <v-icon class="mr-2">mdi-wifi-off</v-icon>
          Reconectando...
        </v-alert>

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
            <v-chip value="all" size="small">
              Todas ({{ chatStore.allChats.length }})
            </v-chip>
            <v-chip value="unread" size="small">
              Não lidas ({{ unreadCount }})
            </v-chip>
            <v-chip value="active" size="small">
              Ativas ({{ activeCount }})
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Lista de Conversas -->
        <v-list class="chat-list" lines="two">
          <template v-if="chatStore.isLoadingMentorias">
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
              :active="chatStore.selectedChat?.id === chat.id"
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
                    <v-img :src="chat.avatar || '/placeholder-user.jpg'" :alt="chat.title" />
                    <div v-if="chat.status === 'EM_ANDAMENTO'" class="online-indicator"></div>
                  </v-avatar>
                </v-badge>
              </template>

              <v-list-item-title class="chat-title">
                {{ chat.title }}
                <v-chip v-if="chat.status === 'EM_ANDAMENTO'" size="x-small" color="success" class="ml-2">
                  Ao vivo
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle class="chat-subtitle">
                <div class="subtitle-line">
                  <v-icon size="14" class="mr-1">{{ chat.role === 'mentor' ? 'mdi-school' : 'mdi-account' }}</v-icon>
                  <span class="role-text">{{ chat.role === 'mentor' ? 'Você é mentor' : 'Você é mentorado' }}</span>
                </div>
                <div class="last-message">
                  <v-icon 
                    v-if="chat.lastMessage && isOwnMessage(chat)" 
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
                    <v-icon size="16" :color="getStatusColor(chat.status)" class="status-icon">
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
        <div v-if="!chatStore.selectedChat" class="empty-chat-area">
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
          :key="chatStore.selectedChat.id"
          :mentoria="chatStore.selectedChat" 
          @back="handleChatBack" 
          @messageReceived="handleMessageReceived"
          class="mentoring-chat" 
        />
      </v-main>

      <!-- Botão flutuante para mobile -->
      <v-btn 
        v-if="$vuetify.display.smAndDown && chatStore.selectedChat" 
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import MentoringChat from './MentoringChat.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Stores
const chatStore = useChatStore();
const authStore = useAuthStore();

// Estado local
const drawer = ref(true);
const drawerExpanded = ref(false);
const searchQuery = ref('');
const selectedFilter = ref('all');
const showArchivedChats = ref(false);

// Computed
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Contadores
const unreadCount = computed(() => {
  return chatStore.allChats.filter(chat => chat.unreadCount > 0).length;
});

const activeCount = computed(() => {
  return chatStore.allChats.filter(chat => chat.status === 'EM_ANDAMENTO').length;
});

// Filtrar chats
const filteredChats = computed(() => {
  let filtered = chatStore.allChats;

  // Filtro por pesquisa
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(chat =>
      chat.title.toLowerCase().includes(query) ||
      chat.otherUserName.toLowerCase().includes(query) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
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

  // Filtro de arquivadas (se implementar)
  if (!showArchivedChats.value) {
    filtered = filtered.filter(chat => !chat.archived);
  }

  return filtered;
});

// Métodos
const isOwnMessage = (chat) => {
  // Verifica se a última mensagem foi enviada pelo usuário atual
  const lastMsg = chatStore.messages.get(chat.id)?.[chatStore.messages.get(chat.id)?.length - 1];
  return lastMsg && String(lastMsg.senderId) === String(authStore.userId);
};

const selectChat = async (chat) => {
  await chatStore.selectChat(chat);
  
  // Em mobile, fechar o drawer
  if (!$vuetify.display.mdAndUp) {
    drawer.value = false;
  }
};

const formatChatTime = (date) => {
  if (!date) return '';

  const messageDate = new Date(date);
  const now = new Date();
  const diffInMillis = now - messageDate;
  const diffInHours = diffInMillis / (1000 * 60 * 60);

  if (diffInMillis < 0) {
    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

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
  chatStore.selectedChat = null;
  if (!$vuetify.display.mdAndUp) {
    drawer.value = true;
  }
};

const handleMessageReceived = (message) => {
  // O store já cuida de atualizar as mensagens
  // Aqui podemos adicionar lógica adicional se necessário
};

const refreshChats = async () => {
  await chatStore.loadMentorias();
};

const markAllAsRead = () => {
  chatStore.allChats.forEach(chat => {
    chatStore.unreadMessages.set(chat.id, 0);
  });
};

const toggleDrawer = () => {
  drawer.value = !drawer.value;
  drawerExpanded.value = !drawerExpanded.value;
};

const close = () => {
  visible.value = false;
  emit('close');
};

// Lifecycle
onMounted(() => {
  // Se o chat não estiver inicializado, inicializar
  if (!chatStore.isConnected && authStore.isAuthenticated) {
    chatStore.initialize(authStore.userId);
  }
});

// Watch para quando o diálogo abrir
watch(visible, (newValue) => {
  if (newValue && !chatStore.isConnected && authStore.isAuthenticated) {
    chatStore.initialize(authStore.userId);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.role-text {
  font-weight: 500;
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

.feature-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #667781;
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
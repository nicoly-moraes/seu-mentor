<template>
  <v-dialog
    v-model="visible"
    :fullscreen="$vuetify.display.smAndDown"
    :max-width="$vuetify.display.smAndDown ? undefined : '900px'"
    :height="$vuetify.display.smAndDown ? undefined : '600px'"
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card class="d-flex chat-list-container">
      <v-navigation-drawer
        v-model="drawer"
        :rail="!$vuetify.display.mdAndUp"
        :permanent="$vuetify.display.mdAndUp"
        :temporary="!$vuetify.display.mdAndUp"
        width="350"
        class="chat-sidebar"
      >
        <!-- Sidebar Header -->
        <v-toolbar color="primary" dark flat>
          <v-btn icon @click="close" v-if="!$vuetify.display.mdAndUp">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Conversas</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="refreshChats">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-toolbar>

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Pesquisar conversas..."
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          hide-details
          single-line
          class="ma-2"
        ></v-text-field>

        <!-- Chat List -->
        <v-list class="chat-list">
          <v-list-item
            v-for="chat in filteredChats"
            :key="chat.id"
            :active="selectedChat?.id === chat.id"
            @click="selectChat(chat)"
            :class="{ 'has-unread': chat.unreadCount > 0 }"
          >
            <template v-slot:prepend>
              <v-badge
                :content="chat.unreadCount"
                :model-value="chat.unreadCount > 0"
                color="error"
                overlap
              >
                <v-avatar size="48">
                  <v-img :src="chat.avatar || '/placeholder-user.jpg'" />
                </v-avatar>
              </v-badge>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ chat.title }}
            </v-list-item-title>
            
            <v-list-item-subtitle class="d-flex align-center">
              <span class="text-truncate mr-2">{{ chat.lastMessage }}</span>
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-caption text-right">
                <div>{{ formatChatTime(chat.lastMessageTime) }}</div>
                <v-chip
                  v-if="chat.status === 'EM_ANDAMENTO'"
                  size="x-small"
                  color="success"
                  class="mt-1"
                >
                  Ao vivo
                </v-chip>
              </div>
            </template>
          </v-list-item>

          <v-list-item v-if="filteredChats.length === 0" class="text-center">
            <v-list-item-title class="text-grey">
              {{ searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível' }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Main Chat Area -->
      <v-main class="flex-grow-1">
        <div v-if="!selectedChat" class="empty-chat-area">
          <v-icon size="64" color="grey-lighten-1">mdi-message-text-outline</v-icon>
          <h3 class="text-h5 mt-4 text-grey-darken-1">Selecione uma conversa</h3>
          <p class="text-body-2 text-grey mt-2">
            Escolha uma mentoria à esquerda para começar a conversar
          </p>
        </div>

        <MentoringChat
          v-else
          v-model="chatOpen"
          :mentoria="selectedChat"
          @close="handleChatClose"
        />
      </v-main>

      <!-- Mobile Close Button -->
      <v-btn
        v-if="$vuetify.display.smAndDown"
        fab
        fixed
        bottom
        right
        color="primary"
        @click="close"
        class="mb-16 mr-4"
      >
        <v-icon>mdi-close</v-icon>
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
const searchQuery = ref('');
const selectedChat = ref(null);
const chatOpen = ref(false);
const chats = ref([]);

// Filtrar chats baseado na pesquisa
const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value;
  
  const query = searchQuery.value.toLowerCase();
  return chats.value.filter(chat => 
    chat.title.toLowerCase().includes(query) ||
    chat.lastMessage.toLowerCase().includes(query)
  );
});

// Converter mentorias em formato de chat
const loadChats = () => {
  chats.value = props.mentorias
    .filter(mentoria => mentoria.isChatEnable)
    .map(mentoria => ({
      id: mentoria.id,
      title: mentoria.disciplineName,
      subtitle: `${mentoria.mentorName} • ${mentoria.tutoringClassType}`,
      avatar: mentoria.mentorAvatar,
      lastMessage: 'Clique para iniciar a conversa',
      lastMessageTime: new Date(mentoria.tutoringDate),
      unreadCount: 0,
      status: mentoria.status,
      ...mentoria
    }));
};

// Selecionar um chat
const selectChat = (chat) => {
  selectedChat.value = chat;
  chatOpen.value = true;
  
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
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else {
    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
};

// Atualizar lista de chats
const refreshChats = () => {
  loadChats();
};

// Fechar chat individual
const handleChatClose = () => {
  chatOpen.value = false;
  selectedChat.value = null;
};

// Fechar toda a janela
const close = () => {
  visible.value = false;
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
.chat-list-container {
  height: 100%;
  overflow: hidden;
}

.chat-sidebar {
  border-right: 1px solid #e0e0e0;
}

.chat-list {
  overflow-y: auto;
  height: calc(100% - 120px);
}

.chat-list .v-list-item {
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-list .v-list-item:hover {
  background-color: #f5f5f5;
}

.chat-list .v-list-item.has-unread {
  background-color: #f0f7ff;
}

.empty-chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

@media (max-width: 960px) {
  .chat-sidebar {
    position: absolute;
    z-index: 10;
  }
}
</style>
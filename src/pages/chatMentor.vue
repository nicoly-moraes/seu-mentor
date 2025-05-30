<template>
  <div class="chat-test-container">
    <h1>Teste do Chat de Mentoria</h1>
    
    <!-- Status da Conexão -->
    <div class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
      <span class="status-icon">{{ isConnected ? '🟢' : '🔴' }}</span>
      <span>{{ isConnected ? 'Conectado' : 'Desconectado' }}</span>
    </div>

    <!-- Informações do Usuário -->
    <div class="user-info" v-if="currentUser">
      <h3>Usuário Atual</h3>
      <p>ID: {{ currentUser.id }}</p>
      <p>Nome: {{ currentUser.name || 'Não informado' }}</p>
    </div>

    <!-- Controles de Conexão -->
    <div class="connection-controls">
      <button @click="connect" :disabled="isConnected" class="btn btn-primary">
        Conectar
      </button>
      <button @click="disconnect" :disabled="!isConnected" class="btn btn-danger">
        Desconectar
      </button>
      <button @click="initialize" :disabled="isConnected" class="btn btn-success">
        Inicializar Automático
      </button>
    </div>

    <!-- Configuração de Mentoria -->
    <div class="tutoring-config" v-if="isConnected">
      <h3>Configurar Mentoria</h3>
      <div class="form-group">
        <label>ID da Mentoria:</label>
        <input 
          v-model.number="tutoringId" 
          type="number" 
          placeholder="Digite o ID da mentoria"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>ID do Outro Usuário (para chat privado):</label>
        <input 
          v-model.number="privateUserId" 
          type="number" 
          placeholder="Digite o ID do outro usuário"
          class="form-control"
        />
      </div>
      <button 
        @click="subscribeTutoring" 
        :disabled="!tutoringId"
        class="btn btn-primary"
      >
        Inscrever-se na Mentoria
      </button>
    </div>

    <!-- Chat -->
    <div class="chat-section" v-if="isSubscribed">
      <h3>Chat da Mentoria #{{ tutoringId }}</h3>
      
      <!-- Tipo de Mensagem -->
      <div class="message-type-selector">
        <label>
          <input 
            type="radio" 
            v-model="messageType" 
            value="general"
          /> 
          Geral
        </label>
        <label>
          <input 
            type="radio" 
            v-model="messageType" 
            value="private"
            :disabled="!privateUserId"
          /> 
          Privado
        </label>
      </div>

      <!-- Área de Mensagens -->
      <div class="messages-container">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="message"
          :class="{
            'own-message': msg.senderId == currentUser.id,
            'private-message': msg.type === 'private',
            'general-message': msg.type === 'general'
          }"
        >
          <div class="message-header">
            <span class="sender">{{ msg.senderName || `Usuário ${msg.senderId}` }}</span>
            <span class="message-type-badge">{{ msg.type }}</span>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-content">{{ msg.message }}</div>
        </div>
        <div v-if="messages.length === 0" class="no-messages">
          Nenhuma mensagem ainda...
        </div>
      </div>

      <!-- Input de Mensagem -->
      <div class="message-input-container">
        <input 
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Digite sua mensagem..."
          class="message-input"
        />
        <button 
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="btn btn-send"
        >
          Enviar
        </button>
      </div>
    </div>

    <!-- Logs de Debug -->
    <div class="debug-section" v-if="showDebug">
      <h3>Logs de Debug</h3>
      <div class="debug-logs">
        <div v-for="(log, index) in debugLogs" :key="index" class="debug-log">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-type" :class="log.type">{{ log.type }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- Toggle Debug -->
    <div class="debug-toggle">
      <label>
        <input type="checkbox" v-model="showDebug" />
        Mostrar Debug
      </label>
    </div>
  </div>
</template>

<script>
import MentorChatClient from '@/services/chatClient';

export default {
  name: 'MentorChatTest',
  data() {
    return {
      chatClient: null,
      isConnected: false,
      isSubscribed: false,
      currentUser: null,
      tutoringId: null,
      privateUserId: null,
      messages: [],
      newMessage: '',
      messageType: 'general',
      showDebug: false,
      debugLogs: []
    };
  },
  mounted() {
    this.initializeChatClient();
    this.loadUserInfo();
  },
  beforeUnmount() {
    if (this.chatClient) {
      this.chatClient.disconnect();
    }
  },
  methods: {
    initializeChatClient() {
      this.chatClient = new MentorChatClient({
        debug: true,
        // Você pode adicionar outras configurações aqui
      });

      // Configurar handlers de conexão
      this.chatClient.onConnect(() => {
        this.isConnected = true;
        this.addDebugLog('info', 'Conectado ao WebSocket');
      });

      this.chatClient.onDisconnect(() => {
        this.isConnected = false;
        this.isSubscribed = false;
        this.addDebugLog('warning', 'Desconectado do WebSocket');
      });

      this.chatClient.onError((error) => {
        this.addDebugLog('error', `Erro: ${error.message || 'Erro desconhecido'}`);
      });

      // Configurar handlers de mensagens
      this.chatClient.onMessage('general', (message, type, tutoringId) => {
        this.addMessage({ ...message, type: 'general' });
        this.addDebugLog('info', `Mensagem geral recebida na mentoria ${tutoringId}`);
      });

      this.chatClient.onMessage('private', (message, type, tutoringId) => {
        this.addMessage({ ...message, type: 'private' });
        this.addDebugLog('info', `Mensagem privada recebida na mentoria ${tutoringId}`);
      });
    },

    loadUserInfo() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.currentUser = {
          id: userId,
          name: localStorage.getItem('userName') || null
        };
      }
    },

    async connect() {
      try {
        this.addDebugLog('info', 'Tentando conectar...');
        
        if (!this.currentUser) {
          const userId = prompt('Digite seu ID de usuário:');
          if (!userId) return;
          
          this.currentUser = { id: userId };
          localStorage.setItem('userId', userId);
        }

        this.chatClient.setCurrentUser(this.currentUser.id, this.currentUser);
        await this.chatClient.connect();
        
        this.addDebugLog('success', 'Conexão estabelecida com sucesso!');
      } catch (error) {
        this.addDebugLog('error', `Erro ao conectar: ${error.message}`);
        console.error('Erro ao conectar:', error);
      }
    },

    disconnect() {
      this.chatClient.disconnect();
      this.messages = [];
      this.isSubscribed = false;
    },

    async initialize() {
      try {
        this.addDebugLog('info', 'Inicializando automaticamente...');
        await this.chatClient.initialize();
        this.loadUserInfo();
        this.addDebugLog('success', 'Inicialização automática concluída!');
      } catch (error) {
        this.addDebugLog('error', `Erro na inicialização: ${error.message}`);
        
        // Se falhar por falta de autenticação, pedir o ID
        if (error.message.includes('não autenticado')) {
          const userId = prompt('Digite seu ID de usuário:');
          if (userId) {
            localStorage.setItem('userId', userId);
            this.loadUserInfo();
            await this.connect();
          }
        }
      }
    },

    subscribeTutoring() {
      if (!this.tutoringId) {
        alert('Por favor, insira o ID da mentoria');
        return;
      }

      this.chatClient.setCurrentTutoring(this.tutoringId);
      
      const options = {
        subscribeGeneral: true,
        privateWith: this.privateUserId || null
      };

      const subscriptions = this.chatClient.subscribeTutoring(this.tutoringId, options);
      
      if (subscriptions) {
        this.isSubscribed = true;
        this.addDebugLog('success', `Inscrito na mentoria ${this.tutoringId}`);
        
        subscriptions.forEach(sub => {
          this.addDebugLog('info', `Inscrito no canal ${sub.type}`);
        });
      }
    },

    sendMessage() {
      if (!this.newMessage.trim()) return;

      const success = this.messageType === 'private' && this.privateUserId
        ? this.chatClient.sendPrivateMessage(this.newMessage, this.privateUserId)
        : this.chatClient.sendGeneralMessage(this.newMessage);

      if (success) {
        this.addDebugLog('success', `Mensagem ${this.messageType} enviada`);
        this.newMessage = '';
      } else {
        this.addDebugLog('error', 'Erro ao enviar mensagem');
      }
    },

    addMessage(message) {
      this.messages.push({
        ...message,
        timestamp: message.timestamp || new Date()
      });
      
      // Auto-scroll para a última mensagem
      this.$nextTick(() => {
        const container = this.$el.querySelector('.messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },

    addDebugLog(type, message) {
      this.debugLogs.unshift({
        type,
        message,
        time: new Date()
      });
      
      // Limitar a 50 logs
      if (this.debugLogs.length > 50) {
        this.debugLogs.pop();
      }
    },

    formatTime(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    }
  }
};
</script>

<style scoped>
.chat-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.connection-status.connected {
  background-color: #d4edda;
  color: #155724;
}

.connection-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.status-icon {
  font-size: 16px;
}

.user-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.connection-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-send {
  background-color: #17a2b8;
  color: white;
}

.tutoring-config {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.chat-section {
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
}

.message-type-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.message-type-selector label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.messages-container {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f8f9fa;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message.own-message {
  background-color: #e3f2fd;
  margin-left: 20%;
}

.message.private-message {
  border-left: 3px solid #ff6b6b;
}

.message.general-message {
  border-left: 3px solid #4caf50;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
  color: #6c757d;
}

.sender {
  font-weight: bold;
  color: #495057;
}

.message-type-badge {
  background-color: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
}

.timestamp {
  margin-left: auto;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
}

.no-messages {
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.message-input-container {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.debug-section {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.debug-logs {
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}

.debug-log {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  padding: 5px;
  background-color: white;
  border-radius: 3px;
}

.log-time {
  color: #6c757d;
}

.log-type {
  font-weight: bold;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.log-type.info {
  background-color: #17a2b8;
  color: white;
}

.log-type.success {
  background-color: #28a745;
  color: white;
}

.log-type.warning {
  background-color: #ffc107;
  color: #212529;
}

.log-type.error {
  background-color: #dc3545;
  color: white;
}

.log-message {
  flex: 1;
}

.debug-toggle {
  margin-top: 10px;
}

.debug-toggle label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
</style>
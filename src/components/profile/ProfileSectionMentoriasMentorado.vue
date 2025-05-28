<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Minhas Mentorias (Mentorado)</h1>

    <v-row>
      <v-col
          cols="12"
          class="btn"
      >
        <v-btn
          class="btn"
          variant="flat"
          color="primary"
          append-icon="mdi mdi-plus"
          to="/discipline"
        >
          Mentoria
        </v-btn>
      </v-col>

      <v-col cols="12">
        <v-card v-if="isLoadingParticipationSessions" class="text-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Carregando suas mentorias...</p>
        </v-card>

        <template v-else-if="props.participationSessions.length > 0">
          <v-card
            v-for="session in props.participationSessions"
            :key="session.id"
            class="mb-4"
            elevation="2"
          >
            <v-card-title class="d-flex justify-space-between align-center">
              <div>
                <span class="text-h6">{{ session.disciplineName }}</span>
                <v-chip
                  :color="props.getStatusColor(session.status)"
                  size="small"
                  class="ml-2"
                  label
                >
                  {{ session.status }}
                </v-chip>
              </div>
              <v-chip size="small" :color="session.tutoringClassType === 'ONLINE' ? 'info' : 'success'" label>
                {{ session.tutoringClassType }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <p><v-icon class="mr-1" small>mdi-account</v-icon> <strong>Mentor:</strong> {{ session.mentorName }}</p>
                  <p><v-icon class="mr-1" small>mdi-calendar</v-icon> <strong>Data:</strong> {{ props.formatDate(session.tutoringDate) }}</p>
                  <p><v-icon class="mr-1" small>mdi-clock-outline</v-icon> <strong>Horário:</strong> {{ session.startTime }} - {{ session.endTime }}</p>
                </v-col>

                <v-col cols="12" md="6">
                  <p v-if="session.local"><v-icon class="mr-1" small>mdi-map-marker</v-icon> <strong>Local:</strong> {{ session.local }}</p>
                  <p v-if="session.linkVideo">
                    <v-icon class="mr-1" small>mdi-video</v-icon>
                    <strong>Link:</strong>
                    <a :href="session.linkVideo" target="_blank" rel="noopener noreferrer" class="text-decoration-none">Acessar aula</a>
                  </p>
                  <p><v-icon class="mr-1" small>mdi-account-group</v-icon> <strong>Participantes:</strong> {{ session.qtdParticipants }} / {{ session.maxParticipants }}</p>
                  <p v-if="session.topics && session.topics.length > 0">
                    <v-icon class="mr-1" small>mdi-tag-multiple</v-icon>
                    <strong>Tópicos:</strong> {{ session.topics.join(', ') }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="pa-3">
              <v-spacer></v-spacer>
              <v-btn
                v-if="session.status !== 'CONCLUIDA'"
                color="error"
                variant="outlined"
                prepend-icon="mdi-logout"
                @click="handleLeaveTutoring(session.id)"
                :loading="isLeavingTutoring === session.id"
                :disabled="isLeavingTutoring === session.id"
              >
                Sair da Mentoria
              </v-btn>
            </v-card-actions>

          </v-card>
        </template>

        <v-card v-else class="text-center pa-6">
          <v-icon size="x-large" color="grey-lighten-1" class="mb-3">mdi-information-outline</v-icon>
          <p class="text-h6 text-medium-emphasis">Você não está participando de nenhuma mentoria no momento.</p>
          <v-btn color="primary" class="mt-4" to="/discipline" append-icon="mdi-magnify">Encontrar Mentorias</v-btn>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top"
    rounded="pill"
    variant="elevated"
  >
    {{ snackbar.message }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="snackbar.show = false"
      >
        Fechar
      </v-btn>
    </template>
  </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { leaveTutoringSession } from '@/services/userService';

const props = defineProps({
  participationSessions: { type: Array, default: () => [] },
  isLoadingParticipationSessions: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
  getStatusColor: { type: Function, required: true }
});

const emit = defineEmits(['session-left', 'operation-success', 'operation-error']);

const authStore = useAuthStore();
const isLeavingTutoring = ref(null);

// --- State for Snackbar (Toast) ---
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 5000,
});

// Function to display the snackbar
const showSnackbar = (message, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, message, color, timeout };
};

async function handleLeaveTutoring(tutoringId) {
  if (!window.confirm("Você tem certeza que deseja sair desta mentoria? Esta ação não pode ser desfeita.")) {
    return;
  }

  const userIdString = authStore.getCurrentUserId;
  if (!userIdString) {
    const errorMsg = "Não foi possível identificar o usuário. Por favor, tente fazer login novamente.";
    console.error(errorMsg);
    emit('operation-error', errorMsg);
    return;
  }

  const userId = parseInt(userIdString, 10);
  if (isNaN(userId)) {
    const errorMsg = "ID do usuário inválido. Não é possível processar a solicitação.";
    console.error(errorMsg);
    emit('operation-error', errorMsg);
    return;
  }

  isLeavingTutoring.value = tutoringId;

  try {
    await leaveTutoringSession(tutoringId, userId);
    emit('session-left', tutoringId);
    emit('operation-success', "Você saiu da mentoria com sucesso!");
  } catch (error) {
    console.error(`Erro ao sair da mentoria ID ${tutoringId} para o usuário ID ${userId}:`, error);
    let errorMessage = "Ocorreu um erro ao tentar sair da mentoria.";

    if (error.response) {
      // Use the error message from the backend if available
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      switch(error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || "Operação inválida. Verifique se você é um participante desta mentoria.";
          break;
        case 401:
          errorMessage = error.response.data?.message || "Não autorizado. Sua sessão pode ter expirado. Tente fazer login novamente.";
          break;
        case 403:
          errorMessage = error.response.data?.message || "Acesso negado. Você não tem permissão para realizar esta ação.";
          break;
        case 404:
          errorMessage = error.response.data?.message || "Mentoria ou usuário não encontrado.";
          break;
        case 500:
          errorMessage = error.response.data?.message || "Erro interno no servidor. Por favor, tente novamente mais tarde.";
          break;
      }
    } else if (error.request) {
      errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    } else {
      errorMessage = error.message || "Erro desconhecido ao processar sua solicitação.";
    }
    emit('operation-error', errorMessage);
  } finally {
    isLeavingTutoring.value = null;
  }
}
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

.btn {
  display: flex;
  justify-content: end;
}

.v-card-actions .v-btn {
  text-transform: none;
}
</style>

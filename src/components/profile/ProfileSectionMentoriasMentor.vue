<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Minhas Mentorias (Mentor)</h1>

    <v-row>
      <v-col cols="12">
        <v-card v-if="isLoadingMentoringSessionsAsMentor" class="text-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Carregando suas mentorias...</p>
        </v-card>

        <template v-else-if="mentoringSessionsAsMentor.length > 0">
          <v-card
            v-for="session in mentoringSessionsAsMentor"
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
              <div class="d-flex align-center">
                <v-chip size="small" :color="session.tutoringClassType === 'ONLINE' ? 'info' : 'success'" class="mr-2" label>
                  {{ session.tutoringClassType }}
                </v-chip>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  @click="openEditSessionDialog(session)"
                  prepend-icon="mdi-pencil-outline"
                  :disabled="isSessionSaving === session.id || isSessionCancelling === session.id"
                  class="mr-2"
                >
                  Editar Detalhes
                </v-btn>
                <v-btn
                  v-if="canCancelSession(session.status)"
                  color="error"
                  variant="tonal"
                  size="small"
                  @click="openCancelSessionDialog(session)"
                  prepend-icon="mdi-cancel"
                  :disabled="isSessionSaving === session.id || isSessionCancelling === session.id"
                >
                  Cancelar Mentoria
                </v-btn>
              </div>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <p><v-icon small class="mr-1">mdi-calendar-blank-outline</v-icon> <strong>Data:</strong> {{ props.formatDate(session.tutoringDate) }}</p>
                  <p><v-icon small class="mr-1">mdi-clock-outline</v-icon> <strong>Horário:</strong> {{ session.startTime }} - {{ session.endTime }}</p>
                  <p v-if="session.local"><v-icon small class="mr-1">mdi-map-marker-outline</v-icon> <strong>Local:</strong> {{ session.local }}</p>
                  <p v-if="session.linkVideo">
                    <v-icon small class="mr-1">mdi-video-outline</v-icon>
                    <strong>Link:</strong>
                    <a :href="session.linkVideo" target="_blank" rel="noopener noreferrer" class="text-decoration-none">Acessar aula</a>
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <p><v-icon small class="mr-1">mdi-account-group-outline</v-icon> <strong>Máx. Participantes:</strong> {{ session.maxParticipants }}</p>
                  <p><v-icon small class="mr-1">mdi-chat-processing-outline</v-icon> <strong>Chat:</strong> {{ session.isChatEnable ? 'Habilitado' : 'Desabilitado' }}</p>
                  <div v-if="session.participants && session.participants.length > 0" class="mt-2">
                    <p><strong>Participantes Inscritos ({{ session.participants.length }}):</strong></p>
                    <v-list density="compact" lines="one" class="py-0">
                      <v-list-item
                        v-for="p in session.participants"
                        :key="p.userId"
                        :title="p.userName"
                        :subtitle="p.topic ? `Tópico: ${p.topic}` : 'Tópico não especificado'"
                        prepend-icon="mdi-account-circle-outline"
                        class="px-1"
                      ></v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="mt-2 text-medium-emphasis"><em>Nenhum participante inscrito.</em></p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>

        <v-card v-else class="text-center pa-6">
          <v-icon size="x-large" color="grey-lighten-1" class="mb-3">mdi-information-outline</v-icon>
          <p class="text-h6 text-medium-emphasis">Você não tem nenhuma mentoria agendada como mentor.</p>
          <v-btn color="primary" class="mt-4" @click="$emit('activate-disponibilidades')" append-icon="mdi-calendar-plus">Gerenciar Disponibilidades</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <EditMentoringSessionDialog
      :visible="isEditDialogVisible"
      :editing-session="sessionToEdit"
      :loading="isSessionSaving === sessionToEdit?.id"
      @update:visible="isEditDialogVisible = $event"
      @save="handleSaveSessionDetails"
      @close="closeEditSessionDialog"
    />

    <CancelTutoringDialog
      :visible="isCancelDialogVisible"
      :session-name="sessionToCancel?.disciplineName"
      :loading="isSessionCancelling === sessionToCancel?.id"
      @update:visible="isCancelDialogVisible = $event"
      @confirm-cancel="handleConfirmCancellation"
      @close="closeCancelSessionDialog"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
// Make sure the path to userService and the dialogs are correct
import { confirmTutoringSession, cancelMentorTutoringSession } from '@/services/userService'; // Added cancelMentorTutoringSession
import EditMentoringSessionDialog from './EditMentoringSessionDialog.vue';
import CancelTutoringDialog from './CancelTutoringDialog.vue'; // Import the new dialog
import { useAuthStore } from '@/stores/auth'; // To get the mentor's userId

const props = defineProps({
  mentoringSessionsAsMentor: { type: Array, default: () => [] },
  isLoadingMentoringSessionsAsMentor: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
  getStatusColor: { type: Function, required: true }
  // editableTutoringStatusForMentor prop might be useful here to enable/disable cancel button
});

const emit = defineEmits([
  'activate-disponibilidades',
  'mentoria-updated',
  'operation-success',
  'operation-error'
]);

const authStore = useAuthStore(); // Initialize auth store

// --- State for Edit Dialog ---
const isEditDialogVisible = ref(false);
const sessionToEdit = ref(null);
const isSessionSaving = ref(null); // ID of session being saved

// --- State for Cancel Dialog ---
const isCancelDialogVisible = ref(false);
const sessionToCancel = ref(null); // Stores the session object to be cancelled
const isSessionCancelling = ref(null); // ID of session being cancelled

function openEditSessionDialog(session) {
  sessionToEdit.value = { ...session };
  isEditDialogVisible.value = true;
}

function closeEditSessionDialog() {
  isEditDialogVisible.value = false;
}

async function handleSaveSessionDetails(updatedDataFromDialog) {
  if (!sessionToEdit.value || !sessionToEdit.value.id) {
    emit('operation-error', "Erro: Nenhuma sessão selecionada para edição.");
    return;
  }
  const sessionId = sessionToEdit.value.id;
  isSessionSaving.value = sessionId;
  try {
    const response = await confirmTutoringSession(sessionId, updatedDataFromDialog);
    if (response && response.data) {
      emit('mentoria-updated', response.data);
      emit('operation-success', "Detalhes da mentoria atualizados com sucesso!");
      closeEditSessionDialog();
    } else {
      console.warn("Resposta da atualização da mentoria não continha os dados esperados:", response);
      emit('mentoria-updated', { id: sessionId, ...updatedDataFromDialog });
      emit('operation-error', "Detalhes atualizados, mas houve um problema ao receber a confirmação completa do servidor.");
      closeEditSessionDialog();
    }
  } catch (error) {
    console.error(`Erro ao atualizar detalhes da mentoria ${sessionId}:`, error);
    let errorMessage = "Falha ao atualizar os detalhes da mentoria.";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || `Erro ${error.response.status}: Falha ao salvar.`;
    } else if (error.request) {
      errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }
    emit('operation-error', errorMessage);
  } finally {
    isSessionSaving.value = null;
  }
}

// --- Functions for Cancel Dialog ---
function openCancelSessionDialog(session) {
  sessionToCancel.value = { ...session }; // Store a copy of the session
  isCancelDialogVisible.value = true;
}

function closeCancelSessionDialog() {
  isCancelDialogVisible.value = false;
  // sessionToCancel.value = null; // Optional: clear when dialog closes
}

async function handleConfirmCancellation(payload) {
  if (!sessionToCancel.value || !sessionToCancel.value.id) {
    emit('operation-error', "Erro: Nenhuma sessão selecionada para cancelamento.");
    closeCancelSessionDialog();
    return;
  }

  const mentorUserId = authStore.userId; // Get current mentor's ID
  if (!mentorUserId) {
    emit('operation-error', "Erro: Não foi possível identificar o mentor. Tente fazer login novamente.");
    closeCancelSessionDialog();
    return;
  }

  const sessionId = sessionToCancel.value.id;
  const { deactivateAvailability } = payload;
  isSessionCancelling.value = sessionId;

  try {
    const response = await cancelMentorTutoringSession(mentorUserId, sessionId, deactivateAvailability);
    if (response && response.data) {
      // The response.data should be the updated TutoringRepresentation (status CANCELADA)
      emit('mentoria-updated', response.data);
      emit('operation-success', `Mentoria de "${sessionToCancel.value.disciplineName}" cancelada com sucesso.`);
      closeCancelSessionDialog();
    } else {
      console.warn("Resposta do cancelamento da mentoria não continha os dados esperados:", response);
      // Fallback or error - ideally, the API always returns the updated object
      emit('operation-error', "Mentoria cancelada, mas houve um problema ao receber a confirmação do servidor.");
      // You might want to force a refetch in the parent in this scenario
      // or emit a specific event to indicate an inconsistent state.
      closeCancelSessionDialog();
    }
  } catch (error) {
    console.error(`Erro ao cancelar mentoria ${sessionId} pelo mentor ${mentorUserId}:`, error);
    let errorMessage = "Falha ao cancelar a mentoria.";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || `Erro ${error.response.status}: Falha ao cancelar.`;
    } else if (error.request) {
      errorMessage = "Não foi possível conectar ao servidor.";
    }
    emit('operation-error', errorMessage);
    // Do not close dialog on error, let user try again or explicitly close
  } finally {
    isSessionCancelling.value = null;
  }
}

// Helper to determine if cancel button should be shown/enabled
// (Example: can't cancel if already 'CONCLUIDA' or 'CANCELADA')
function canCancelSession(status) {
  return !['CONCLUIDA', 'CANCELADA'].includes(status);
}

</script>

<style scoped>
.titulo {
  text-align: center;
  padding: 20px;
}
</style>

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
                  v-if="session.status === 'AGENDADA'"
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

                  <div class="btn-mentoria">
                    <v-btn
                      v-if="canStartSessionVisually(session)"
                      color="success"
                      variant="flat"
                      size="small"
                      @click="startMentoringSession(session)"
                      :disabled="!canStartSession(session) || isSessionUpdatingStatus === session.id"
                      prepend-icon="mdi-play-circle-outline"
                      class="mr-2"
                    >
                      Começar Mentoria
                    </v-btn>

                    <v-btn
                      v-if="canEndSessionVisually(session)"
                      color="warning"
                      variant="flat"
                      size="small"
                      @click="endMentoringSession(session.id)"
                      :disabled="!canEndSession(session) || isSessionUpdatingStatus === session.id"
                      prepend-icon="mdi-stop-circle-outline"
                      class="mr-2"
                    >
                      Encerrar Mentoria
                    </v-btn>
                  </div>
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

    <MentoringDetailsDialog
      :visible="isDetailsDialogVisible"
      :session-details="sessionToViewDetails"
      :format-date="formatDate"
      :get-status-color="getStatusColor"
      @update:visible="isDetailsDialogVisible = $event"
      @close="closeDetailsDialog"
    />

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
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { confirmTutoringSession, cancelMentorTutoringSession } from '@/services/userService';
import { updateTutoringStatus } from '@/services/tutoringService';
import EditMentoringSessionDialog from './EditMentoringSessionDialog.vue';
import CancelTutoringDialog from './CancelTutoringDialog.vue';
import MentoringDetailsDialog from './MentoringDetailsDialog.vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  mentoringSessionsAsMentor: { type: Array, default: () => [] },
  isLoadingMentoringSessionsAsMentor: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
  getStatusColor: { type: Function, required: true }
});

const emit = defineEmits([
  'activate-disponibilidades',
  'mentoria-updated',
  'operation-success',
  'operation-error'
]);

const authStore = useAuthStore();

// --- State for Edit Dialog ---
const isEditDialogVisible = ref(false);
const sessionToEdit = ref(null);
const isSessionSaving = ref(null); // ID of session being saved

// --- State for Cancel Dialog ---
const isCancelDialogVisible = ref(false);
const sessionToCancel = ref(null); // Stores the session object to be cancelled
const isSessionCancelling = ref(null); // ID of session being cancelled

// --- New State for Details Dialog ---
const isDetailsDialogVisible = ref(false);
const sessionToViewDetails = ref(null); // Stores the session object whose details are being viewed

// --- State for Status Update ---
const isSessionUpdatingStatus = ref(null); // ID of session being updated

// --- State for Snackbar (Toast) ---
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 5000,
});

// --- New state for tracking notified sessions ---
const notifiedSessions = ref(new Set());

const currentTimeRef = ref(new Date());
let intervalId = null;

// --- Helper Functions for Date/Time Comparison ---
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const convertDdMmYyyyToYyyyMmDd = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

// --- Logic for "Começar Mentoria" Button (para desabilitar o clique) ---
const canStartSession = (session) => {
  const now = currentTimeRef.value;
  const today = now.toISOString().split('T')[0];

  const isToday = isSameDay(session.tutoringDate, today);
  const isScheduled = session.status === 'AGENDADA';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);
  const sessionEndDateTime = new Date(`${formattedDate}T${session.endTime}:00`);

  if (isNaN(sessionStartDateTime.getTime()) || isNaN(sessionEndDateTime.getTime())) {
      console.error('Data ou hora inválida para sessão (canStartSession):', session.tutoringDate, session.startTime, session.endTime);
      return false;
  }

  // O botão fica ativo 5 minutos ANTES do início e até 5 minutos DEPOIS do início
  const activationWindowStart = new Date(sessionStartDateTime.getTime() - 5 * 60 * 1000);
  const activationWindowEnd = new Date(sessionStartDateTime.getTime() + 5 * 60 * 1000); // 5 minutos após o início

  const canStart = now >= activationWindowStart && now <= activationWindowEnd;

  return isToday && isScheduled && canStart;
};

// --- Logic for "Começar Mentoria" Button (para visibilidade) ---
const canStartSessionVisually = (session) => {
  const now = currentTimeRef.value;
  const today = now.toISOString().split('T')[0];

  const isToday = isSameDay(session.tutoringDate, today);
  const isScheduled = session.status === 'AGENDADA';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);

  if (isNaN(sessionStartDateTime.getTime())) {
      console.error('Data ou hora inválida para sessão (canStartSessionVisually):', session.tutoringDate, session.startTime);
      return false;
  }

  // O botão é visível 5 minutos ANTES do início e até 5 minutos DEPOIS do início
  const visualWindowStart = new Date(sessionStartDateTime.getTime() - 5 * 60 * 1000);
  const visualWindowEnd = new Date(sessionStartDateTime.getTime() + 5 * 60 * 1000); // 5 minutos após o início

  const isWithinVisualStartWindow = now >= visualWindowStart && now <= visualWindowEnd;

  return isToday && isScheduled && isWithinVisualStartWindow;
};

// --- Logic for "Encerrar Mentoria" Button (para desabilitar o clique) ---
const canEndSession = (session) => {
  const now = currentTimeRef.value;
  const today = now.toISOString().split('T')[0];

  const isToday = isSameDay(session.tutoringDate, today);
  const isInProgress = session.status === 'EM_ANDAMENTO';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);
  const sessionEndDateTime = new Date(`${formattedDate}T${session.endTime}:00`);

  if (isNaN(sessionStartDateTime.getTime()) || isNaN(sessionEndDateTime.getTime())) {
      console.error('Data ou hora inválida para sessão (canEndSession):', session.tutoringDate, session.startTime, session.endTime);
      return false;
  }

  // A janela de ativação para encerrar mentoria (do início até 5 minutos após o fim)
  const activationWindowStart = sessionStartDateTime;
  const activationWindowEnd = new Date(sessionEndDateTime.getTime() + 5 * 60 * 1000);

  const canEnd = now >= activationWindowStart && now <= activationWindowEnd;

  return isToday && isInProgress && canEnd;
};

// --- Logic for "Encerrar Mentoria" Button (para visibilidade) ---
const canEndSessionVisually = (session) => {
  const now = currentTimeRef.value;
  const today = now.toISOString().split('T')[0];

  const isToday = isSameDay(session.tutoringDate, today);
  const isInProgress = session.status === 'EM_ANDAMENTO';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionEndDateTime = new Date(`${formattedDate}T${session.endTime}:00`); // Usar o horário final

  if (isNaN(sessionEndDateTime.getTime())) {
      console.error('Data ou hora inválida para sessão (canEndSessionVisually):', session.tutoringDate, session.endTime);
      return false;
  }

  // O botão de "Encerrar Mentoria" é visível apenas 5 minutos ANTES do horário final e até 5 minutos DEPOIS do horário final.
  const visualWindowStart = new Date(sessionEndDateTime.getTime() - 5 * 60 * 1000); // 5 minutos antes do fim
  const visualWindowEnd = new Date(sessionEndDateTime.getTime() + 5 * 60 * 1000); // 5 minutos depois do fim

  const isWithinVisualEndWindow = now >= visualWindowStart && now <= visualWindowEnd;

  return isToday && isInProgress && isWithinVisualEndWindow;
};


// --- Actions for Mentoring Status Update ---
const updateSessionStatus = async (sessionId, newStatus, sessionData) => {
  isSessionUpdatingStatus.value = sessionId;
  try {
    const requestData = { status: newStatus };
    const response = await updateTutoringStatus(sessionId, requestData);

    if (response && response.data) {
      emit('mentoria-updated', response.data);
      if (newStatus === 'EM_ANDAMENTO') {
          snackbar.value.show = false;
          // Abre o painel de detalhes APÓS a atualização do status no backend
          sessionToViewDetails.value = { ...sessionData, status: newStatus }; // Atualiza o status para exibição
          isDetailsDialogVisible.value = true;
      }
      showSnackbar(`Mentoria ${newStatus === 'EM_ANDAMENTO' ? 'iniciada' : 'encerrada'} com sucesso!`, 'success');
    } else {
      console.warn("Resposta da atualização de status não continha os dados esperados:", response);
      emit('operation-error', `Status da mentoria atualizado, mas houve um problema ao receber a confirmação completa do servidor.`);
    }
  } catch (error) {
    console.error(`Erro ao atualizar status da mentoria ${sessionId} para ${newStatus}:`, error);
    let errorMessage = "Falha ao atualizar o status da mentoria.";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || `Erro ${error.response.status}: Falha ao atualizar status.`;
    } else if (error.request) {
      errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }
    emit('operation-error', errorMessage);
  } finally {
    isSessionUpdatingStatus.value = null;
  }
};

const startMentoringSession = (session) => {
  updateSessionStatus(session.id, 'EM_ANDAMENTO', session);
};

const endMentoringSession = (sessionId) => {
  updateSessionStatus(sessionId, 'CONCLUIDA');
};

// --- Toast (Snackbar) Logic ---
const showSnackbar = (message, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, message, color, timeout };
};

const upcomingMentoringSessions = computed(() => {
  const now = currentTimeRef.value;
  const today = now.toISOString().split('T')[0];

  return props.mentoringSessionsAsMentor.filter(session => {
    if (session.status !== 'AGENDADA') {
      return false;
    }

    const sessionDate = session.tutoringDate;
    const sessionStartTime = session.startTime;

    const formattedDate = convertDdMmYyyyToYyyyMmDd(sessionDate);
    const sessionDateTime = new Date(`${formattedDate}T${sessionStartTime}:00`);

    if (isNaN(sessionDateTime.getTime())) {
      console.error('Data ou hora inválida para sessão (upcomingMentoringSessions):', sessionDate, sessionStartTime);
      return false;
    }

    const notificationWindowStart = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);
    const notificationWindowEnd = new Date(sessionDateTime.getTime() + 30 * 60 * 1000);

    return isSameDay(sessionDate, today) && now >= notificationWindowStart && now <= notificationWindowEnd;
  });
});

onMounted(() => {
  intervalId = setInterval(() => {
    currentTimeRef.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  notifiedSessions.value.clear();
});

watch(upcomingMentoringSessions, (newSessions) => {
  newSessions.forEach(session => {
    if (!notifiedSessions.value.has(session.id)) {
      showSnackbar(`Atenção! A mentoria de ${session.disciplineName} está prestes a começar ou já começou!`, 'info', 10000);
      notifiedSessions.value.add(session.id);
    }
  });
  const currentSessionIds = new Set(newSessions.map(s => s.id));
  notifiedSessions.value.forEach(sessionId => {
    if (!currentSessionIds.has(sessionId)) {
      notifiedSessions.value.delete(sessionId);
    }
  });
}, { deep: true });

// --- Existing Dialog Functions (Sem duplicações) ---
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

function openCancelSessionDialog(session) {
  sessionToCancel.value = { ...session };
  isCancelDialogVisible.value = true;
}

function closeCancelSessionDialog() {
  isCancelDialogVisible.value = false;
}

async function handleConfirmCancellation(payload) {
  if (!sessionToCancel.value || !sessionToCancel.value.id) {
    emit('operation-error', "Erro: Nenhuma sessão selecionada para cancelamento.");
    closeCancelSessionDialog();
    return;
  }

  const mentorUserId = authStore.userId;
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
      emit('mentoria-updated', response.data);
      emit('operation-success', `Mentoria de "${sessionToCancel.value.disciplineName}" cancelada com sucesso.`);
      closeCancelSessionDialog();
    } else {
      console.warn("Resposta do cancelamento da mentoria não continha os dados esperados:", response);
      emit('operation-error', "Mentoria cancelada, mas houve um problema ao receber a confirmação do servidor.");
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
  } finally {
    isSessionCancelling.value = null;
  }
}

function canCancelSession(status) {
  return status === 'AGENDADA'; // Só pode cancelar se estiver AGENDADA
}

// --- Functions for Details Dialog ---
function closeDetailsDialog() {
  isDetailsDialogVisible.value = false;
  sessionToViewDetails.value = null;
}
</script>

<style scoped>
.titulo {
  text-align: center;
  padding: 20px;
}

.btn-mentoria {
  padding: 10px;
  display: flex;
  justify-content: end;
}
</style>

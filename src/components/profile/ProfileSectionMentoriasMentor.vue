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
          <v-list class="bg-transparent">
            <v-list-item
              v-for="session in mentoringSessionsAsMentor"
              :key="session.id"
              class="mb-2"
              :class="{ 'list-item-expanded': expandedSession === session.id }"
              @click="toggleExpansion(session.id)"
            >
              <v-list-item-title class="text-subtitle-1 font-weight-medium">
                {{ session.disciplineName }}
              </v-list-item-title>

              <v-list-item-subtitle class="mt-1">
                <div class="d-flex align-center flex-wrap ga-2">
                  <v-chip
                    :color="props.getStatusColor(session.status)"
                    size="x-small"
                    label
                  >
                    {{ session.status }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    :color="session.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
                    label
                  >
                    {{ session.tutoringClassType }}
                  </v-chip>
                  <span class="text-caption">{{ props.formatDate(session.tutoringDate) }}</span>
                  <span class="text-caption">{{ session.startTime }}</span>
                  <span class="text-caption">
                    <v-icon size="small" class="mr-1">mdi-account-group-outline</v-icon>
                    {{ session.participants ? session.participants.length : 0 }}/{{ session.maxParticipants }}
                  </span>
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-icon
                  :class="{ 'rotate-icon': expandedSession === session.id }"
                  class="transition-transform"
                >
                  mdi-chevron-down
                </v-icon>
              </template>

              <v-expand-transition>
                <div v-if="expandedSession === session.id" class="expansion-content mt-4">
                  <v-divider class="mb-4"></v-divider>

                  <v-row>
                    <v-col cols="12" md="7">
                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-calendar-blank-outline</v-icon>
                        <strong>Data:</strong> {{ props.formatDate(session.tutoringDate) }}
                      </div>
                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-clock-outline</v-icon>
                        <strong>Horário:</strong> {{ session.startTime }} - {{ session.endTime }}
                      </div>
                      <div v-if="session.local" class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-map-marker-outline</v-icon>
                        <strong>Local:</strong> {{ session.local }}
                      </div>
                      <div v-if="session.linkVideo && session.linkVideo !== 'Não se aplica'" class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-video-outline</v-icon>
                        <strong>Link:</strong>
                        <a
                          :href="session.linkVideo"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-decoration-none ml-1"
                          @click.stop
                        >
                          Acessar aula
                        </a>
                      </div>
                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-account-group-outline</v-icon>
                        <strong>Máx. Participantes:</strong> {{ session.maxParticipants }}
                      </div>
                       <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-chat-processing-outline</v-icon>
                        <strong>Chat:</strong> {{ session.isChatEnable ? 'Habilitado' : 'Desabilitado' }}
                      </div>
                      <div class="detail-item">
                         <v-chip
                            size="small"
                            :color="session.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
                            label
                          >
                            {{ session.tutoringClassType }}
                          </v-chip>
                      </div>
                    </v-col>

                    <v-col cols="12" md="5">
                      <div v-if="session.participants && session.participants.length > 0" class="mb-3">
                        <div class="topics-header mb-1">
                            <v-icon class="mr-2" size="small">mdi-account-multiple</v-icon>
                            <strong>Participantes Inscritos ({{ session.participants.length }}):</strong>
                        </div>
                        <v-list density="compact" lines="one" class="py-0 bg-transparent participants-list-container">
                          <v-list-item
                            v-for="p in session.participants"
                            :key="p.userId"
                            class="px-1 py-0 my-0 participant-list-item"
                            density="compact"
                          >
                            <template v-slot:prepend>
                                <v-icon size="small">mdi-account-circle-outline</v-icon>
                            </template>
                            <v-list-item-title class="text-caption">{{ p.userName }}</v-list-item-title>
                            <v-list-item-subtitle class="text-caption" v-if="p.topic">
                                {{ p.topic ? `Tópico: ${p.topic}` : 'Tópico não especificado' }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </div>
                      <p v-else class="mt-2 text-medium-emphasis text-caption"><em>Nenhum participante inscrito.</em></p>
                    </v-col>
                  </v-row>

                  <v-row class="mt-4" justify="end">
                    <v-col cols="auto" class="d-flex flex-wrap ga-2 justify-end">
                      <v-btn
                        v-if="session.status === 'PENDENTE'"
                        color="warning"
                        variant="tonal"
                        size="small"
                        @click.stop="openMentoriaDialog(session, 'confirm')"
                        prepend-icon="mdi-check-circle-outline"
                        :disabled="isSessionConfirming === session.id || isSessionSaving === session.id || isSessionCancelling === session.id"
                      >
                        Confirmar
                      </v-btn>

                      <v-btn
                        v-if="session.status === 'AGENDADA'"
                        color="primary"
                        variant="tonal"
                        size="small"
                        @click.stop="openMentoriaDialog(session, 'edit')"
                        prepend-icon="mdi-pencil-outline"
                        :disabled="isSessionSaving === session.id || isSessionCancelling === session.id || isSessionConfirming === session.id"
                      >
                        Editar
                      </v-btn>

                      <v-btn
                        v-if="canCancelSession(session.status)"
                        color="error"
                        variant="tonal"
                        size="small"
                        @click.stop="openCancelSessionDialog(session)"
                        prepend-icon="mdi-cancel"
                        :disabled="isSessionSaving === session.id || isSessionCancelling === session.id || isSessionConfirming === session.id"
                      >
                        Cancelar
                      </v-btn>

                      <v-btn
                        v-if="canStartSessionVisually(session)"
                        color="success"
                        variant="flat"
                        size="small"
                        @click.stop="startMentoringSession(session)"
                        :disabled="!canStartSession(session) || isSessionUpdatingStatus === session.id"
                        prepend-icon="mdi-play-circle-outline"
                      >
                        Começar
                      </v-btn>

                      <v-btn
                        v-if="canEndSessionVisually(session)"
                        color="warning"
                        variant="flat"
                        size="small"
                        @click.stop="endMentoringSession(session.id)"
                        :disabled="!canEndSession(session) || isSessionUpdatingStatus === session.id"
                        prepend-icon="mdi-stop-circle-outline"
                      >
                        Encerrar
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-list-item>
          </v-list>
        </template>

        <v-card v-else class="text-center pa-6">
          <v-icon size="x-large" color="grey-lighten-1" class="mb-3">mdi-information-outline</v-icon>
          <p class="text-h6 text-medium-emphasis">Você não tem nenhuma mentoria agendada como mentor.</p>
          <v-btn color="primary" class="mt-4" @click="$emit('activate-disponibilidades')" append-icon="mdi-calendar-plus">Gerenciar Disponibilidades</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <MentoriaConfirmationDialog
      :model-value="isMentoriaDialogVisible"
      :editing-tutoring-session-prop="sessionToEdit"
      :is-confirming-session-prop="isSessionConfirming !== null || isSessionSaving !== null"
      :dialog-mode="dialogMode"
      @update:model-value="isMentoriaDialogVisible = $event"
      @confirm-session="handleConfirmSession"
      @session-confirmed="handleSessionConfirmed"
      @save="handleSaveSessionDetails"
      @close="closeMentoriaDialog"
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
import CancelTutoringDialog from './CancelTutoringDialog.vue';
import MentoringDetailsDialog from './MentoringDetailsDialog.vue';
import MentoriaConfirmationDialog from './MentoriaConfirmationDialog.vue'; // Único componente
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

// --- State for Expansion Panel ---
const expandedSession = ref(null);

// --- State for Unified Dialog ---
const isMentoriaDialogVisible = ref(false);
const sessionToEdit = ref(null); // Used for both confirm and edit dialog context
const dialogMode = ref('confirm'); // 'confirm' or 'edit'
const isSessionSaving = ref(null); // ID of session being saved (edited)
const isSessionConfirming = ref(null); // ID of session being confirmed

// --- State for Cancel Dialog ---
const isCancelDialogVisible = ref(false);
const sessionToCancel = ref(null);
const isSessionCancelling = ref(null);

// --- State for Details Dialog (when starting session) ---
const isDetailsDialogVisible = ref(false);
const sessionToViewDetails = ref(null);

// --- State for Status Update (Start/End session) ---
const isSessionUpdatingStatus = ref(null);

// --- State for Snackbar (Toast) ---
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 5000,
});

// --- State for tracking notified sessions ---
const notifiedSessions = ref(new Set());
const currentTimeRef = ref(new Date());
let intervalId = null;

// --- Function to toggle expansion ---
const toggleExpansion = (sessionId) => {
  expandedSession.value = expandedSession.value === sessionId ? null : sessionId;
};

// --- Helper Functions for Date/Time Comparison ---
const isSameDay = (date1, date2Input) => {
  let d1;
  if (typeof date1 === 'string' && date1.includes('/')) {
    const parts = date1.split('/');
    d1 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  } else if (date1 instanceof Date) {
    d1 = new Date(date1);
    d1.setHours(0,0,0,0);
  } else { // assume YYYY-MM-DD or other parsable format
    try {
      d1 = new Date(date1 + 'T00:00:00');
      if (isNaN(d1.getTime())) throw new Error('Invalid date1');
    } catch (e) {
      console.error("Invalid date1 for isSameDay:", date1, e); return false;
    }
  }
  d1.setHours(0,0,0,0);


  let d2;
  if (date2Input instanceof Date) {
    d2 = new Date(date2Input);
  } else { // assume YYYY-MM-DD string or other parsable format
    try {
      d2 = new Date(date2Input + 'T00:00:00');
      if (isNaN(d2.getTime())) throw new Error('Invalid date2Input');
    } catch (e) {
       console.error("Invalid date2Input for isSameDay:", date2Input, e); return false;
    }
  }
  d2.setHours(0,0,0,0);

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

// --- Logic for "Começar Mentoria" Button ---
const canStartSession = (session) => {
  const now = currentTimeRef.value;
  const todayISO = now.toISOString().split('T')[0];

  const isToday = isSameDay(session.tutoringDate, todayISO);
  const isScheduled = session.status === 'AGENDADA';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);

  if (isNaN(sessionStartDateTime.getTime())) {
    console.error('Data ou hora inválida para sessão (canStartSession):', session.tutoringDate, session.startTime);
    return false;
  }

  const activationWindowStart = new Date(sessionStartDateTime.getTime() - 5 * 60 * 1000);
  const activationWindowEnd = new Date(sessionStartDateTime.getTime() + 5 * 60 * 1000);

  return isToday && isScheduled && now >= activationWindowStart && now <= activationWindowEnd;
};

const canStartSessionVisually = (session) => {
  const now = currentTimeRef.value;
  const todayISO = now.toISOString().split('T')[0];
  const isToday = isSameDay(session.tutoringDate, todayISO);
  const isScheduled = session.status === 'AGENDADA';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);

  if (isNaN(sessionStartDateTime.getTime())) {
    console.error('Data ou hora inválida (canStartSessionVisually):', session.tutoringDate, session.startTime);
    return false;
  }
  const visualWindowStart = new Date(sessionStartDateTime.getTime() - 5 * 60 * 1000);
  const visualWindowEnd = new Date(sessionStartDateTime.getTime() + 5 * 60 * 1000);

  return isToday && isScheduled && now >= visualWindowStart && now <= visualWindowEnd;
};

// --- Logic for "Encerrar Mentoria" Button ---
const canEndSession = (session) => {
  const now = currentTimeRef.value;
  const todayISO = now.toISOString().split('T')[0];
  const isToday = isSameDay(session.tutoringDate, todayISO);
  const isInProgress = session.status === 'EM_ANDAMENTO';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionStartDateTime = new Date(`${formattedDate}T${session.startTime}:00`);
  const sessionEndDateTime = new Date(`${formattedDate}T${session.endTime}:00`);

  if (isNaN(sessionStartDateTime.getTime()) || isNaN(sessionEndDateTime.getTime())) {
    console.error('Data ou hora inválida (canEndSession):', session.tutoringDate, session.startTime, session.endTime);
    return false;
  }

  const activationWindowStart = sessionStartDateTime;
  const activationWindowEnd = new Date(sessionEndDateTime.getTime() + 5 * 60 * 1000);

  return isToday && isInProgress && now >= activationWindowStart && now <= activationWindowEnd;
};

const canEndSessionVisually = (session) => {
  const now = currentTimeRef.value;
  const todayISO = now.toISOString().split('T')[0];
  const isToday = isSameDay(session.tutoringDate, todayISO);
  const isInProgress = session.status === 'EM_ANDAMENTO';

  const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
  const sessionEndDateTime = new Date(`${formattedDate}T${session.endTime}:00`);

  if (isNaN(sessionEndDateTime.getTime())) {
    console.error('Data ou hora inválida (canEndSessionVisually):', session.tutoringDate, session.endTime);
    return false;
  }

  const visualWindowStart = new Date(sessionEndDateTime.getTime() - 5 * 60 * 1000);
  const visualWindowEnd = new Date(sessionEndDateTime.getTime() + 5 * 60 * 1000);

  return isToday && isInProgress && now >= visualWindowStart && now <= visualWindowEnd;
};

// --- Actions for Mentoring Status Update (Start/End) ---
const updateSessionStatus = async (sessionId, newStatus, sessionDataForDetailsDialog) => {
  isSessionUpdatingStatus.value = sessionId;
  try {
    const requestData = { status: newStatus };
    const response = await updateTutoringStatus(sessionId, requestData);

    if (response && response.data) {
      emit('mentoria-updated', response.data);
      if (newStatus === 'EM_ANDAMENTO' && sessionDataForDetailsDialog) {
        snackbar.value.show = false; // Hide any existing snackbar
        sessionToViewDetails.value = { ...sessionDataForDetailsDialog, status: newStatus };
        isDetailsDialogVisible.value = true;
      }
      showSnackbar(`Mentoria ${newStatus === 'EM_ANDAMENTO' ? 'iniciada' : 'encerrada'} com sucesso!`, 'success');
    } else {
      console.warn("Update status response missing data:", response);
      emit('operation-error', `Status atualizado, mas confirmação incompleta.`);
    }
  } catch (error) {
    console.error(`Erro ao atualizar status da mentoria ${sessionId} para ${newStatus}:`, error);
    let errorMessage = "Falha ao atualizar o status da mentoria.";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || `Erro ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Sem resposta do servidor. Verifique sua conexão.";
    }
    emit('operation-error', errorMessage);
  } finally {
    isSessionUpdatingStatus.value = null;
  }
};

const startMentoringSession = (session) => {
  updateSessionStatus(session.id, 'EM_ANDAMENTO', session); // Pass session data for details dialog
};

const endMentoringSession = (sessionId) => {
  updateSessionStatus(sessionId, 'CONCLUIDA');
};

// --- Toast (Snackbar) Logic ---
const showSnackbar = (message, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, message, color, timeout };
};

// --- Upcoming Session Notifications ---
const upcomingMentoringSessions = computed(() => {
  const now = currentTimeRef.value;
  const todayISO = now.toISOString().split('T')[0];

  return props.mentoringSessionsAsMentor.filter(session => {
    if (session.status !== 'AGENDADA') return false;

    const formattedDate = convertDdMmYyyyToYyyyMmDd(session.tutoringDate);
    const sessionDateTime = new Date(`${formattedDate}T${session.startTime}:00`);
    if (isNaN(sessionDateTime.getTime())) return false;

    const notificationWindowStart = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);
    const notificationWindowEnd = new Date(sessionDateTime.getTime() + 30 * 60 * 1000);

    return isSameDay(session.tutoringDate, todayISO) && now >= notificationWindowStart && now <= notificationWindowEnd;
  });
});

onMounted(() => {
  intervalId = setInterval(() => { currentTimeRef.value = new Date(); }, 1000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  notifiedSessions.value.clear();
});

watch(upcomingMentoringSessions, (newSessions) => {
  newSessions.forEach(session => {
    if (!notifiedSessions.value.has(session.id)) {
      showSnackbar(`Atenção! Mentoria de ${session.disciplineName} está prestes a começar ou já começou!`, 'info', 10000);
      notifiedSessions.value.add(session.id);
    }
  });
  const currentSessionIds = new Set(newSessions.map(s => s.id));
  notifiedSessions.value.forEach(id => { if (!currentSessionIds.has(id)) notifiedSessions.value.delete(id); });
}, { deep: true });

// --- Unified Mentoria Dialog Functions (Confirm/Edit) ---
function openMentoriaDialog(session, mode) {
  sessionToEdit.value = { ...session };
  dialogMode.value = mode;
  isMentoriaDialogVisible.value = true;
}

function closeMentoriaDialog() {
  isMentoriaDialogVisible.value = false;
  sessionToEdit.value = null;
  // dialogMode.value = 'confirm'; // Resetting mode can be optional
}

async function handleConfirmSession(confirmationData) { // For 'PENDENTE' -> 'AGENDADA'
  if (!sessionToEdit.value || !sessionToEdit.value.id) {
    emit('operation-error', "Nenhuma sessão para confirmação."); return;
  }
  const sessionId = sessionToEdit.value.id;
  isSessionConfirming.value = sessionId;
  isSessionSaving.value = null; // Ensure not in saving mode

  try {
    // Assuming confirmTutoringSession also handles setting details if provided
    const response = await confirmTutoringSession(sessionId, confirmationData);
    if (response && response.data) {
      emit('mentoria-updated', response.data);
      emit('operation-success', `Mentoria "${sessionToEdit.value.disciplineName}" confirmada!`);
      closeMentoriaDialog();
    } else {
      console.warn("Confirmação sem dados esperados:", response);
      emit('operation-error', "Confirmada, mas resposta incompleta do servidor.");
      closeMentoriaDialog();
    }
  } catch (error) {
    console.error(`Erro ao confirmar mentoria ${sessionId}:`, error);
    let msg = "Falha ao confirmar mentoria.";
    if (error.response?.data?.message) msg = error.response.data.message;
    else if (error.response?.data?.error) msg = error.response.data.error;
    emit('operation-error', msg);
  } finally {
    isSessionConfirming.value = null;
  }
}

async function handleSaveSessionDetails(updatedDataFromDialog) { // For 'AGENDADA' -> 'AGENDADA' (edit)
  if (!sessionToEdit.value || !sessionToEdit.value.id) {
    emit('operation-error', "Nenhuma sessão para editar."); return;
  }
  const sessionId = sessionToEdit.value.id;
  isSessionSaving.value = sessionId;
  isSessionConfirming.value = null; // Ensure not in confirming mode

  try {
    // confirmTutoringSession is used for both confirming and updating details.
    // The backend should differentiate or handle based on current session status or payload.
    const response = await confirmTutoringSession(sessionId, updatedDataFromDialog);
    if (response && response.data) {
      emit('mentoria-updated', response.data);
      emit('operation-success', "Detalhes da mentoria atualizados!");
      closeMentoriaDialog();
    } else {
      console.warn("Atualização de detalhes sem dados esperados:", response);
      emit('mentoria-updated', { id: sessionId, ...updatedDataFromDialog }); // Optimistic
      emit('operation-error', "Detalhes atualizados, mas resposta incompleta.");
      closeMentoriaDialog();
    }
  } catch (error) {
    console.error(`Erro ao atualizar detalhes da mentoria ${sessionId}:`, error);
    let msg = "Falha ao atualizar detalhes.";
    if (error.response?.data?.message) msg = error.response.data.message;
    else if (error.response?.data?.error) msg = error.response.data.error;
    emit('operation-error', msg);
  } finally {
    isSessionSaving.value = null;
  }
}

function handleSessionConfirmed() { // Called by dialog on successful internal confirmation
  // This might be redundant if primary actions are handleConfirmSession/handleSaveSessionDetails
  // but can be used for any post-dialog logic if needed.
  // For now, just ensures dialog closes.
  closeMentoriaDialog();
}

// --- Cancel Dialog Functions ---
function openCancelSessionDialog(session) {
  sessionToCancel.value = { ...session };
  isCancelDialogVisible.value = true;
}

function closeCancelSessionDialog() {
  isCancelDialogVisible.value = false;
  sessionToCancel.value = null;
}

async function handleConfirmCancellation(payload) {
  if (!sessionToCancel.value || !sessionToCancel.value.id) {
    emit('operation-error', "Nenhuma sessão para cancelamento."); closeCancelSessionDialog(); return;
  }
  const mentorUserId = authStore.userId;
  if (!mentorUserId) {
    emit('operation-error', "ID do mentor não encontrado."); closeCancelSessionDialog(); return;
  }
  const sessionId = sessionToCancel.value.id;
  const { deactivateAvailability } = payload;
  isSessionCancelling.value = sessionId;

  try {
    const response = await cancelMentorTutoringSession(mentorUserId, sessionId, deactivateAvailability);
    if (response && response.data) {
      emit('mentoria-updated', response.data); // Expects updated list or session
      emit('operation-success', `Mentoria "${sessionToCancel.value.disciplineName}" cancelada.`);
      closeCancelSessionDialog();
    } else {
      console.warn("Cancelamento sem dados esperados:", response);
      emit('operation-error', "Cancelada, mas resposta incompleta.");
      closeCancelSessionDialog();
    }
  } catch (error) {
    console.error(`Erro ao cancelar mentoria ${sessionId}:`, error);
    let msg = "Falha ao cancelar mentoria.";
    if (error.response?.data?.message) msg = error.response.data.message;
    else if (error.response?.data?.error) msg = error.response.data.error;
    emit('operation-error', msg);
  } finally {
    isSessionCancelling.value = null;
  }
}

function canCancelSession(status) {
  return status === 'AGENDADA' || status === 'PENDENTE';
}

// --- Details Dialog Functions (for "EM_ANDAMENTO" sessions) ---
function closeDetailsDialog() {
  isDetailsDialogVisible.value = false;
  sessionToViewDetails.value = null;
}
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

/* .btn-mentoria class might be less relevant now buttons are in a generic actions row */
/*
.btn-mentoria {
  padding: 10px;
  display: flex;
  justify-content: end;
}
*/

.v-list-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 16px;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.list-item-expanded {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.rotate-icon {
  transform: rotate(180deg);
}

.transition-transform {
  transition: transform 0.3s ease;
}

.expansion-content {
  padding: 0 0 16px 0; /* Rely on v-list-item's padding for horizontal */
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.detail-item strong {
  margin-right: 6px;
}

.topics-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.participants-list-container {
  max-height: 150px; /* Or adjust as needed */
  overflow-y: auto;
  /* border: 1px solid rgba(0,0,0,0.08); */ /* Optional border */
  /* border-radius: 4px; */ /* Optional border-radius */
  /* padding: 4px; */ /* Optional padding */
}
.participant-list-item.v-list-item--density-compact {
    min-height: auto !important;
    padding-top: 2px !important;
    padding-bottom: 2px !important;
}
</style>
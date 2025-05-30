<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12" md="3" lg="2" class="profile-sidebar">
        <UserProfileSidebar :user-data="userData" :menu-items="menuItems" :active-section="activeSection"
          @update:active-section="newSection => activeSection = newSection" />
      </v-col>

      <v-col cols="12" md="9" lg="10" class="profile-content">
        <v-card class="h-100" elevation="1">
          <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="ma-4"
            @click:close="errorMessage = ''">
            {{ errorMessage }}
          </v-alert>

          <v-alert v-if="successMessage" type="success" variant="tonal" closable class="ma-4"
            @click:close="successMessage = ''">
            {{ successMessage }}
          </v-alert>

          <ProfileSectionInicio v-if="activeSection === 'inicio'"
            :mentoring-sessions-as-mentor="mentoringSessionsAsMentor"
            :participation-sessions="participationSessions"
            :is-loading-mentoring-sessions-as-mentor="isLoadingMentoringSessionsAsMentor"
            :is-loading-participation-sessions="isLoadingParticipationSessions"
            :editable-tutoring-status-for-mentor="editableTutoringStatusForMentor"
            :format-date="formatDate"
            :get-status-color="getStatusColor"
            @open-confirmation-form="openConfirmationForm"/>

          <ProfileSectionPerfil v-else-if="activeSection === 'perfil'" :user-data-prop="userData"
            :initial-profile-form-data="profileForm" :is-loading="isLoading" :format-date="formatDate"
            @update-profile="handleUpdateProfile" @profile-updated="fetchUserData"
            @operation-success="handleOperationSuccess" @operation-error="handleOperationError" />

          <ProfileSectionMentoriasMentorado v-else-if="activeSection === 'mentorias-mentorado'"
            :participation-sessions="participationSessions"
            :is-loading-participation-sessions="isLoadingParticipationSessions" :format-date="formatDate"
            :get-status-color="getStatusColor" @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError" @session-left="handleSessionLeftMentorado" />

          <ProfileSectionMentoriasMentor v-else-if="activeSection === 'mentorias-mentor'"
            :mentoring-sessions-as-mentor="mentoringSessionsAsMentor"
            :is-loading-mentoring-sessions-as-mentor="isLoadingMentoringSessionsAsMentor"
            :editable-tutoring-status-for-mentor="editableTutoringStatusForMentor" :format-date="formatDate"
            :get-status-color="getStatusColor" @open-confirmation-form="openConfirmationForm"
            @activate-disponibilidades="activeSection = 'disponibilidades'"
            @mentoria-updated="handleMentoriaMentorAtualizada" @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError" />

          <ProfileSectionDisponibilidades v-else-if="activeSection === 'disponibilidades'"
            ref="disponibilidadesComponent"
            :mentor-availabilities-prop="mentorAvailabilities" :disciplines-prop="disciplines"
            :is-loading-availabilities-prop="isLoadingAvailabilities"
            :is-adding-availability-prop="isAddingAvailability"
            :is-updating-availability-id-prop="isUpdatingAvailabilityId"
            :is-deleting-availability-id-prop="isDeletingAvailabilityId" :format-day-of-week="formatDayOfWeek"
            :dias-da-semana-prop="diasDaSemana" :tiposTutoria-prop="tiposTutoria"
            @add-availability="handleAddAvailability" @toggle-availability-status="handleToggleAvailabilityStatus"
            @delete-availability="handleDeleteAvailability" @availabilities-updated="fetchMentorAvailabilities"
            @operation-success="handleOperationSuccess" @operation-error="handleOperationError" />

          <ProfileSectionConta v-else-if="activeSection === 'conta'" :is-loading-prop="isLoading"
            :is-deleting-account-prop="isDeletingAccount" @change-password="handleChangePassword"
            @delete-account="handleDeleteAccount" @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError" />
        </v-card>
      </v-col>
    </v-row>

    <ChatManager
      @messageReceived="handleChatMessage"
      @connectionChanged="handleChatConnection"
    />
    <MentoriaConfirmationDialog 
      v-if="editingTutoringSession"
      v-model="isConfirmationDialogVisible"
      :session-data="editingTutoringSession"
      :is-confirming="isConfirmingSession"
      @confirm="handleConfirmTutoringSession"
      @close="isConfirmationDialogVisible = false"
    />

  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Import useChatStore se você precisar interagir com o store do chat diretamente aqui,
// embora o ChatManager deva encapsular a maior parte da lógica.
// import { useChatStore } from '@/stores/chat'; 

import {
  getUserData,
  updateUserData,
  changePassword,
  getMentorAvailability,
  updateAvailabilityStatus,
  getUserParticipationSessions,
  getUserMentoringSessions,
  addMentorAvailability,
  deleteAvailability,
  deleteUser,
  confirmTutoringSession // Presumindo que esta função ainda é usada pelo MentoriaConfirmationDialog
} from '@/services/userService';
import { getAllDisciplines } from '@/services/disciplineService';

import ChatManager from '@/components/chat/ChatManager.vue';

import UserProfileSidebar from '@/components/profile/UserProfileSidebar.vue';
import ProfileSectionInicio from '@/components/profile/ProfileSectionInicio.vue';
import ProfileSectionPerfil from '@/components/profile/ProfileSectionPerfil.vue';
import ProfileSectionMentoriasMentorado from '@/components/profile/ProfileSectionMentoriasMentorado.vue';
import ProfileSectionMentoriasMentor from '@/components/profile/ProfileSectionMentoriasMentor.vue';
import ProfileSectionDisponibilidades from '@/components/profile/ProfileSectionDisponibilidades.vue';
import ProfileSectionConta from '@/components/profile/ProfileSectionConta.vue';
import MentoriaConfirmationDialog from '@/components/profile/MentoriaConfirmationDialog.vue'; // Verifique se este componente ainda é usado como previsto

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
// const chatStore = useChatStore(); // Descomente se precisar acessar o chatStore aqui

const userData = ref(null);
const mentorAvailabilities = ref([]);
const participationSessions = ref([]); // Ainda necessário para ProfileSectionInicio e ProfileSectionMentoriasMentorado
const mentoringSessionsAsMentor = ref([]); // Ainda necessário para ProfileSectionInicio e ProfileSectionMentoriasMentor
const disciplines = ref([]);

const activeSection = ref('inicio');
const isLoading = ref(false);
const isLoadingAvailabilities = ref(false);
const isLoadingParticipationSessions = ref(false);
const isLoadingMentoringSessionsAsMentor = ref(false);
const isUpdatingAvailabilityId = ref(null);
const isDeletingAvailabilityId = ref(null);
const isAddingAvailability = ref(false);
const isDeletingAccount = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const disponibilidadesComponent = ref(null);

// Estado para o MentoriaConfirmationDialog
const editingTutoringSession = ref(null);
const isConfirmationDialogVisible = ref(false);
const isConfirmingSession = ref(false);

const profileForm = ref({
  profileImg: '', birthday: '', phone: '', city: '', state: '',
  country: '', courseName: '', semester: '', university: ''
});

const menuItems = [
  { title: 'Início', value: 'inicio', icon: 'mdi-view-dashboard' },
  { title: 'Meu Perfil', value: 'perfil', icon: 'mdi-account' },
  { title: 'Mentorias (Mentorado)', value: 'mentorias-mentorado', icon: 'mdi-school' },
  { title: 'Mentorias (Mentor)', value: 'mentorias-mentor', icon: 'mdi-school' },
  { title: 'Disponibilidades', value: 'disponibilidades', icon: 'mdi-calendar-clock' },
  { title: 'Conta', value: 'conta', icon: 'mdi-cog' },
];

const handleOperationSuccess = (message) => {
  successMessage.value = message;
  errorMessage.value = '';
  setTimeout(() => successMessage.value = '', 5000);
};

const handleOperationError = (message) => {
  errorMessage.value = message;
  successMessage.value = '';
  setTimeout(() => errorMessage.value = '', 7000);
};

const fetchUserData = async () => {
  isLoading.value = true;
  try {
    const response = await getUserData(authStore.userId);
    userData.value = response.data;
    for (const key in profileForm.value) {
      if (response.data && response.data.hasOwnProperty(key)) {
        profileForm.value[key] = response.data[key];
      } else {
        profileForm.value[key] = '';
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    handleOperationError('Não foi possível carregar os dados do usuário.');
  } finally {
    isLoading.value = false;
  }
};

const fetchMentorAvailabilities = async () => {
  isLoadingAvailabilities.value = true;
  try {
    const availabilitiesResponse = await getMentorAvailability(authStore.userId);
    mentorAvailabilities.value = availabilitiesResponse.data;
  } catch (error) {
    console.error('Erro ao buscar disponibilidades do mentor:', error);
    handleOperationError('Não foi possível carregar as disponibilidades.');
  } finally {
    isLoadingAvailabilities.value = false;
  }
};

// Estas funções continuam sendo necessárias para as seções do perfil que exibem essas informações.
// O ChatManager buscará esses dados de forma independente para o chat.
const fetchParticipationSessions = async () => {
  isLoadingParticipationSessions.value = true;
  try {
    const response = await getUserParticipationSessions(authStore.userId);
    participationSessions.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar sessões de participação:', error);
    handleOperationError('Não foi possível carregar suas participações em mentorias.');
  } finally {
    isLoadingParticipationSessions.value = false;
  }
};

const fetchMentoringSessionsAsMentor = async () => {
  isLoadingMentoringSessionsAsMentor.value = true;
  try {
    const response = await getUserMentoringSessions(authStore.userId);
    mentoringSessionsAsMentor.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar sessões como mentor:', error);
    handleOperationError('Não foi possível carregar suas mentorias (como mentor).');
  } finally {
    isLoadingMentoringSessionsAsMentor.value = false;
  }
};

const fetchDisciplines = async () => {
  try {
    const response = await getAllDisciplines();
    disciplines.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    handleOperationError('Não foi possível carregar as disciplinas.');
  }
};

const handleUrlParams = () => {
  const section = route.query.section;
  const disciplineId = route.query.disciplineId;
  const disciplineName = route.query.disciplineName;

  if (section) {
    activeSection.value = section;
  }

  if (section === 'disponibilidades' && disciplineId && disciplineName) {
    const tryPreSelectDiscipline = () => {
      if (disponibilidadesComponent.value && 
          typeof disponibilidadesComponent.value.preSelectDiscipline === 'function' &&
          disciplines.value.length > 0) {
        disponibilidadesComponent.value.preSelectDiscipline(parseInt(disciplineId), disciplineName);
        return true;
      }
      return false;
    };

    if (!tryPreSelectDiscipline()) {
      nextTick(() => {
        if (!tryPreSelectDiscipline()) {
          setTimeout(() => {
            tryPreSelectDiscipline();
          }, 500);
        }
      });
    }
  }
};

watch(() => disciplines.value, (newDisciplines) => {
  if (newDisciplines && newDisciplines.length > 0) {
    const section = route.query.section;
    const disciplineId = route.query.disciplineId;
    const disciplineName = route.query.disciplineName;
    
    if (section === 'disponibilidades' && disciplineId && disciplineName && 
        activeSection.value === 'disponibilidades') {
      nextTick(() => {
        if (disponibilidadesComponent.value && 
            typeof disponibilidadesComponent.value.preSelectDiscipline === 'function') {
          disponibilidadesComponent.value.preSelectDiscipline(parseInt(disciplineId), disciplineName);
        }
      });
    }
  }
}, { deep: true });

const handleUpdateProfile = async (profileDataToUpdate) => {
  if (!authStore.userId) return;
  isLoading.value = true;
  try {
    const response = await updateUserData(authStore.userId, profileDataToUpdate);
    userData.value = response.data;
    for (const key in profileForm.value) {
      if (response.data && response.data.hasOwnProperty(key)) {
        profileForm.value[key] = response.data[key];
      }
    }
    handleOperationSuccess('Perfil atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    handleOperationError(error.response?.data?.message || error.response?.data || 'Erro ao atualizar perfil. Tente novamente.');
  } finally {
    isLoading.value = false;
  }
};

const handleChangePassword = async (passwordData) => {
  if (!authStore.userId) return;
  isLoading.value = true;
  try {
    await changePassword(authStore.userId, passwordData);
    handleOperationSuccess('Senha alterada com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    let apiErrorMessage = error.response?.data?.message || error.response?.data || 'Erro ao alterar senha.';
    if (error.response?.status === 400 && error.response?.data === "A senha antiga está incorreta.") {
      apiErrorMessage = "A senha antiga está incorreta.";
    } else if (typeof error.response?.data === 'string' && error.response.data.includes("A nova senha deve ter pelo menos 8 caracteres")) {
      apiErrorMessage = "A nova senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.";
    }
    handleOperationError(apiErrorMessage);
  } finally {
    isLoading.value = false;
  }
};

const handleToggleAvailabilityStatus = async ({ availability, newStatus }) => {
  if (!authStore.userId) return;
  isUpdatingAvailabilityId.value = availability.id;
  try {
    const response = await updateAvailabilityStatus(authStore.userId, availability.id, { isAvailable: newStatus });

    if (response && response.data) {
      const index = mentorAvailabilities.value.findIndex(a => a.id === response.data.id);
      if (index !== -1) {
        mentorAvailabilities.value[index] = response.data;
      } else {
        await fetchMentorAvailabilities();
      }
      handleOperationSuccess(`Status da disponibilidade para ${availability.discipline.name || availability.discipline.disciplineName} atualizado!`);
    } else {
      await fetchMentorAvailabilities();
       handleOperationSuccess(`Status atualizado! Atualizando lista...`);
    }
  } catch (error) {
    console.error('Erro ao atualizar status da disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao atualizar status da disponibilidade.');
  } finally {
    isUpdatingAvailabilityId.value = null;
  }
};

const handleAddAvailability = async (availabilityData) => {
  if (!authStore.userId) return;
  isAddingAvailability.value = true;
  try {
    const response = await addMentorAvailability(authStore.userId, availabilityData);

    if (response && response.data) {
      mentorAvailabilities.value.push(response.data);
      handleOperationSuccess('Nova disponibilidade adicionada com sucesso!');
    } else {
      await fetchMentorAvailabilities();
      handleOperationSuccess('Nova disponibilidade adicionada! Atualizando lista...');
    }
    
    if (disponibilidadesComponent.value && typeof disponibilidadesComponent.value.resetForm === 'function') {
      disponibilidadesComponent.value.resetForm();
    }
  } catch (error) {
    console.error('Erro ao adicionar disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao adicionar disponibilidade.');
  } finally {
    isAddingAvailability.value = false;
  }
};

const handleDeleteAvailability = async ({ availabilityId, disciplineName }) => {
  if (!authStore.userId) return;
  isDeletingAvailabilityId.value = availabilityId;
  try {
    await deleteAvailability(authStore.userId, availabilityId);

    mentorAvailabilities.value = mentorAvailabilities.value.filter(a => a.id !== availabilityId);
    handleOperationSuccess(`Disponibilidade para ${disciplineName} excluída com sucesso!`);
  } catch (error) {
    console.error('Erro ao excluir disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao excluir disponibilidade.');
  } finally {
    isDeletingAvailabilityId.value = null;
  }
};

const openConfirmationForm = (session) => {
  editingTutoringSession.value = session;
  isConfirmationDialogVisible.value = true;
};

// Esta função e o MentoriaConfirmationDialog podem precisar ser revisados
// se a lógica de confirmação/atualização de mentorias mudar ou for centralizada no store/outros componentes.
const handleConfirmTutoringSession = async (sessionDataFromDialog) => { // Renomeado para evitar conflito com a função importada
  if (!editingTutoringSession.value || !editingTutoringSession.value.id) return;
  isConfirmingSession.value = true;
  try {
    // Supondo que 'confirmTutoringSession' é a chamada de API correta
    const updatedSession = await confirmTutoringSession(editingTutoringSession.value.id, sessionDataFromDialog);
    
    // Atualiza a lista local de mentorias do mentor
    const index = mentoringSessionsAsMentor.value.findIndex(s => s.id === updatedSession.data.id);
    if (index !== -1) {
      mentoringSessionsAsMentor.value[index] = updatedSession.data;
    } else {
      // Se não encontrar, pode ser uma nova sessão ou precisar recarregar
      fetchMentoringSessionsAsMentor();
    }
    
    handleOperationSuccess('Mentoria atualizada com sucesso!');
    isConfirmationDialogVisible.value = false;
    editingTutoringSession.value = null;
    
    // Notificar o chat store para recarregar as mentorias, se necessário
    // Exemplo: chatStore.loadMentorias(); (se você importar e usar chatStore)
    // Ou, se o ChatManager já tiver um mecanismo de atualização periódica ou via evento.

  } catch (error) {
    console.error('Erro ao confirmar/atualizar mentoria:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao confirmar/atualizar mentoria.');
  } finally {
    isConfirmingSession.value = false;
  }
};


const handleMentoriaMentorAtualizada = (sessaoAtualizadaDoServidor) => {
  const index = mentoringSessionsAsMentor.value.findIndex(s => s.id === sessaoAtualizadaDoServidor.id);
  if (index !== -1) {
    mentoringSessionsAsMentor.value[index] = sessaoAtualizadaDoServidor;
  } else {
    fetchMentoringSessionsAsMentor();
  }
  // O ChatManager deve recarregar seus dados através do chatStore se essa atualização for relevante para o chat.
  // Ex: `chatStore.loadMentorias()` ou um evento que o ChatManager escute.
};

const handleSessionLeftMentorado = (tutoringId) => {
  participationSessions.value = participationSessions.value.filter(session => session.id !== tutoringId);
  // O ChatManager deve recarregar seus dados através do chatStore se essa atualização for relevante para o chat.
};

const handleDeleteAccount = async () => {
  if (!authStore.userId) return;
  isDeletingAccount.value = true;
  try {
    await deleteUser(authStore.userId);
    handleOperationSuccess('Conta excluída com sucesso. Você será redirecionado.');
    setTimeout(() => {
      authStore.logout(); // Isso deve limpar o userId e acionar o clearAll no chatStore
      router.push('/login');
    }, 2000);
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao excluir sua conta.');
    isDeletingAccount.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  // Verifica se a data já está no formato dd/mm/yyyy
  if (String(dateString).includes('/') && String(dateString).length === 10) {
      const parts = String(dateString).split('/');
      if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          return dateString;
      }
  }
  // Tenta converter de yyyy-mm-dd ou timestamp ISO
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Data inválida"); // Lança erro se a data não for válida

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é base 0
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
  } catch (e) {
      // Se a conversão falhar, retorna a string original ou um placeholder
      return dateString; 
  }
};


const formatDayOfWeek = (day) => {
  const days = {
    "SEGUNDA_FEIRA": "Segunda-feira", "TERCA_FEIRA": "Terça-feira",
    "QUARTA_FEIRA": "Quarta-feira", "QUINTA_FEIRA": "Quinta-feira",
    "SEXTA_FEIRA": "Sexta-feira", "SABADO": "Sábado", "DOMINGO": "Domingo"
  };
  return days[day] || day;
};

const getStatusColor = (status) => {
  const statusColors = {
    'AGENDADA_ALUNO': 'warning',
    'PENDENTE_CONFIRMACAO_MENTOR': 'warning',
    'PENDENTE': 'warning', // Genérico, pode ser usado por outros fluxos
    'CONFIRMADA': 'success', // Ou 'AGENDADA' dependendo da semântica do seu sistema
    'EM_ANDAMENTO': 'primary', // Se tiver status de "ao vivo"
    'CONCLUIDA': 'info', // Ou 'FINALIZADA'
    'CANCELADA': 'error'
  };
  return statusColors[status] || 'grey';
};


const diasDaSemana = [
  { value: 'SEGUNDA_FEIRA', text: 'Segunda-feira' }, { value: 'TERCA_FEIRA', text: 'Terça-feira' },
  { value: 'QUARTA_FEIRA', text: 'Quarta-feira' }, { value: 'QUINTA_FEIRA', text: 'Quinta-feira' },
  { value: 'SEXTA_FEIRA', text: 'Sexta-feira' }, { value: 'SABADO', text: 'Sábado' },
  { value: 'DOMINGO', text: 'Domingo' }
];

const tiposTutoria = [
  { value: 'ONLINE', text: 'Online' }, { value: 'PRESENCIAL', text: 'Presencial' }
];

const editableTutoringStatusForMentor = ['AGENDADA_ALUNO', 'PENDENTE_CONFIRMACAO_MENTOR', 'PENDENTE'];

watch(editingTutoringSession, (newValue) => {
  if (isConfirmationDialogVisible.value && !newValue) {
    isConfirmationDialogVisible.value = false;
  } else if (!isConfirmationDialogVisible.value && newValue) {
    isConfirmationDialogVisible.value = true;
  }
});

watch(isConfirmationDialogVisible, (newValue) => {
  if (!newValue && editingTutoringSession.value !== null) {
    editingTutoringSession.value = null;
  }
});

watch(() => route.query, () => {
  handleUrlParams();
}, { deep: true });

onMounted(async () => {
  if (authStore.userId) {
    await Promise.all([
      fetchUserData(),
      fetchMentorAvailabilities(),
      fetchParticipationSessions(), // Ainda necessário para as seções do perfil
      fetchMentoringSessionsAsMentor(), // Ainda necessário para as seções do perfil
      fetchDisciplines()
    ]);
    handleUrlParams();

    // O ChatManager se autoinicializará com base na autenticação do authStore
    // e sua prop autoConnect.
  } else {
    router.push('/login');
  }
});

// Handlers do Chat (mantidos para logging, podem ser removidos se não usados)
const handleChatMessage = ({ message, mentoria }) => {
  // console.log('Nova mensagem recebida em Perfil.vue:', message, 'na mentoria:', mentoria);
  // O chatStore já lida com a mensagem. [cite: 35, 41]
  // A notificação visual é feita pelo ChatManager/ChatNotification. [cite: 177, 366]
};

const handleChatConnection = (connected) => {
  // console.log('Status de conexão do chat em Perfil.vue:', connected ? 'Conectado' : 'Desconectado');
  // O ChatManager exibe um indicador de conexão. [cite: 191]
};
</script>

<style scoped>
.profile-sidebar {
  min-height: calc(100vh - 64px); /* Considerando uma app-bar de 64px */
  /* position: sticky; top: 64px; /* Para manter visível ao rolar, se a sidebar não for fixed */
}

.profile-sidebar-card { /* Se você envolver UserProfileSidebar em um v-card com esta classe */
  position: sticky;
  top: 64px; /* Altura da sua barra de navegação superior, ajuste se necessário */
  /* max-height: calc(100vh - 64px); */
  /* overflow-y: auto; */
}


.profile-content {
  min-height: calc(100vh - 64px); /* Ajuste conforme a altura do seu header */
  /* padding: 16px; */ /* Adicione padding se necessário */
}

.h-100 {
  height: 100%;
}
</style>
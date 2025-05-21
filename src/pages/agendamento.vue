<template>
  <v-container fluid>
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Agendamento de Mentorias</h1>

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-filter</v-icon>
            Filtros
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="filtros.disciplina"
              :items="disciplinas"
              item-title="disciplineName"
              item-value="disciplineId"
              label="Disciplina"
              variant="outlined"
              clearable
              density="comfortable"
              class="mb-3"
              @update:model-value="filtrarMentorias"
            ></v-select>

            <v-select
              v-model="filtros.tipo"
              :items="tiposMentoria"
              label="Tipo de Mentoria"
              variant="outlined"
              clearable
              density="comfortable"
              class="mb-3"
              @update:model-value="filtrarMentorias"
            ></v-select>

            <v-btn
              block
              color="primary"
              class="mt-2"
              @click="limparFiltros"
              prepend-icon="mdi-refresh"
            >
              Limpar Filtros
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-calendar</v-icon>
            Calendário
          </v-card-title>
          <v-card-text>
            <v-date-picker
              v-model="datasSelecionadas"
              multiple
              color="primary"
              elevation="0"
              :min="dataMinima"
              :max="dataMaxima"
              @update:model-value="filtrarMentorias"
            ></v-date-picker>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <v-card elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="text-h6 font-weight-bold">
              <v-icon class="mr-2">mdi-teach</v-icon>
              Mentorias Disponíveis
            </div>
            <v-chip
              v-if="datasSelecionadas.length > 0"
              color="primary"
              size="small"
              class="ml-2"
              closable
              @click:close="datasSelecionadas = []"
            >
              {{ datasSelecionadas.length }} {{ datasSelecionadas.length === 1 ? 'data selecionada' : 'datas selecionadas' }}
            </v-chip>
          </v-card-title>

          <v-card-text v-if="carregando" class="text-center pa-6">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Carregando mentorias disponíveis...</p>
          </v-card-text>

          <template v-else-if="mentoriasFiltradas.length > 0">
            <v-list>
              <v-list-subheader v-if="mentoriasFiltradas.length > 0">
                {{ mentoriasFiltradas.length }} mentorias encontradas
              </v-list-subheader>

              <v-list-item
                v-for="mentoria in mentoriasFiltradas"
                :key="mentoria.id"
                :value="mentoria.id"
                @click="selecionarMentoria(mentoria)"
                :active="mentoriaSelecionada?.id === mentoria.id"
                :title="mentoria.disciplineName"
                :subtitle="`${formatarData(mentoria.tutoringDate)} • ${mentoria.startTime} - ${mentoria.endTime}`"
                rounded="lg"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal">
                    <v-icon>mdi-book-education</v-icon>
                  </v-avatar>
                </template>

                <template v-slot:append>
                  <v-chip
                    :color="mentoria.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
                    size="small"
                    class="mr-2"
                  >
                    {{ mentoria.tutoringClassType }}
                  </v-chip>
                  <v-btn
                    icon="mdi-information-outline"
                    variant="text"
                    size="small"
                    @click.stop="selecionarMentoria(mentoria)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </template>

          <v-card-text v-else class="text-center pa-6">
            <v-icon size="large" color="grey" class="mb-2">mdi-calendar-alert</v-icon>
            <p class="text-h6 text-medium-emphasis">Nenhuma mentoria disponível com os filtros selecionados.</p>
            <v-btn color="primary" class="mt-4" @click="limparFiltros">Limpar Filtros</v-btn>
          </v-card-text>
        </v-card>

        <v-card v-if="mentoriaSelecionada" class="mt-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Detalhes da Mentoria
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <p><v-icon class="mr-1" small>mdi-book-open-variant</v-icon> <strong>Disciplina:</strong> {{ mentoriaSelecionada.disciplineName }}</p>
                <p><v-icon class="mr-1" small>mdi-account</v-icon> <strong>Mentor:</strong> {{ mentoriaSelecionada.mentorName }}</p>
                <p><v-icon class="mr-1" small>mdi-calendar</v-icon> <strong>Data:</strong> {{ formatarData(mentoriaSelecionada.tutoringDate) }}</p>
                <p><v-icon class="mr-1" small>mdi-clock-outline</v-icon> <strong>Horário:</strong> {{ mentoriaSelecionada.startTime }} - {{ mentoriaSelecionada.endTime }}</p>
              </v-col>

              <v-col cols="12" md="6">
                <p><v-icon class="mr-1" small>mdi-teach</v-icon> <strong>Tipo:</strong> {{ mentoriaSelecionada.tutoringClassType }}</p>
                <p v-if="mentoriaSelecionada.local"><v-icon class="mr-1" small>mdi-map-marker</v-icon> <strong>Local:</strong> {{ mentoriaSelecionada.local }}</p>
                <p v-if="mentoriaSelecionada.linkVideo">
                  <v-icon class="mr-1" small>mdi-video</v-icon>
                  <strong>Link:</strong>
                  <a :href="mentoriaSelecionada.linkVideo" target="_blank" rel="noopener noreferrer" class="text-decoration-none">Acessar aula</a>
                </p>
                <p><v-icon class="mr-1" small>mdi-account-group</v-icon> <strong>Participantes:</strong> {{ mentoriaSelecionada.qtdParticipants || 0 }} / {{ mentoriaSelecionada.maxParticipants }}</p>
              </v-col>

              <v-col cols="12" v-if="mentoriaSelecionada.description">
                <p><v-icon class="mr-1" small>mdi-text-box-outline</v-icon> <strong>Descrição:</strong></p>
                <p class="pl-6">{{ mentoriaSelecionada.description }}</p>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              color="grey-darken-1"
              variant="text"
              @click="mentoriaSelecionada = null"
            >
              Fechar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="agendarMentoria"
              :loading="agendando"
              :disabled="agendando || !podeAgendar"
            >
              Agendar Mentoria
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogConfirmacao" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          Confirmar Agendamento
        </v-card-title>
        <v-card-text class="pt-4">
          <p>Você está prestes a agendar uma mentoria de <strong>{{ mentoriaSelecionada?.disciplineName }}</strong> com o mentor <strong>{{ mentoriaSelecionada?.mentorName }}</strong>.</p>
          <p class="mt-2">Data: <strong>{{ mentoriaSelecionada ? formatarData(mentoriaSelecionada.tutoringDate) : '' }}</strong></p>
          <p>Horário: <strong>{{ mentoriaSelecionada?.startTime }} - {{ mentoriaSelecionada?.endTime }}</strong></p>

          <v-text-field
            v-model="topicoMentoria"
            label="Tópico específico (opcional)"
            placeholder="Ex: Tenho dúvidas sobre o capítulo 3"
            variant="outlined"
            class="mt-4"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogConfirmacao = false" :disabled="agendando">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="confirmarAgendamento" :loading="agendando">
            Confirmar Agendamento
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getAllDisciplines } from '@/services/disciplineService';
import { getAvailableTutoringSessions, joinTutoringSession } from '@/services/userService';

const router = useRouter();
const authStore = useAuthStore();

// Estado
const mentorias = ref([]);
const disciplinas = ref([]);
const carregando = ref(true);
const mentoriaSelecionada = ref(null);
const datasSelecionadas = ref([]);
const agendando = ref(false);
const dialogConfirmacao = ref(false);
const topicoMentoria = ref('');
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000
});

// Filtros
const filtros = ref({
  disciplina: null,
  tipo: null
});

// Constantes
const tiposMentoria = [
  { title: 'Online', value: 'ONLINE' },
  { title: 'Presencial', value: 'PRESENCIAL' }
];

// Data mínima (hoje) e máxima (3 meses à frente)
const hoje = new Date();
const dataMinima = hoje.toISOString().split('T')[0];
const dataMaxima = new Date(hoje.setMonth(hoje.getMonth() + 3)).toISOString().split('T')[0];

// Computed properties
const mentoriasFiltradas = computed(() => {
  let resultado = [...mentorias.value];

  // Filtrar por disciplina
  if (filtros.value.disciplina) {
    resultado = resultado.filter(m => m.disciplineId === filtros.value.disciplina);
  }

  // Filtrar por tipo de mentoria
  if (filtros.value.tipo) {
    resultado = resultado.filter(m => m.tutoringClassType === filtros.value.tipo);
  }

  // Filtrar por datas selecionadas
  if (datasSelecionadas.value.length > 0) {
    resultado = resultado.filter(m => {
      const dataFormatada = m.tutoringDate.split('T')[0];
      return datasSelecionadas.value.includes(dataFormatada);
    });
  }

  return resultado;
});

const podeAgendar = computed(() => {
  if (!mentoriaSelecionada.value) return false;

  // Verificar se há vagas disponíveis
  const vagas = mentoriaSelecionada.value.maxParticipants - (mentoriaSelecionada.value.qtdParticipants || 0);
  return vagas > 0;
});

// Métodos
const buscarMentorias = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  carregando.value = true;
  try {
    // Simulando a chamada à API - substitua pela chamada real
    // const response = await getAvailableTutoringSessions();
    // mentorias.value = response.data;

    // Dados simulados para demonstração
    setTimeout(() => {
      mentorias.value = gerarMentoriasSimuladas();
      carregando.value = false;
    }, 1000);
  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    mostrarMensagem('Erro ao carregar mentorias disponíveis.', 'error');
    carregando.value = false;
  }
};

const buscarDisciplinas = async () => {
  try {
    const response = await getAllDisciplines();
    disciplinas.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    mostrarMensagem('Erro ao carregar lista de disciplinas.', 'error');
  }
};

const selecionarMentoria = (mentoria) => {
  mentoriaSelecionada.value = mentoria;
};

const limparFiltros = () => {
  filtros.value.disciplina = null;
  filtros.value.tipo = null;
  datasSelecionadas.value = [];
  filtrarMentorias();
};

const filtrarMentorias = () => {
  // A filtragem é feita automaticamente pelo computed property
};

const agendarMentoria = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  if (!mentoriaSelecionada.value) {
    mostrarMensagem('Selecione uma mentoria para agendar.', 'warning');
    return;
  }

  dialogConfirmacao.value = true;
};

const confirmarAgendamento = async () => {
  if (!mentoriaSelecionada.value || !authStore.userId) return;

  agendando.value = true;
  try {
    // Implementação real:
    // const payload = {
    //   userId: authStore.userId,
    //   topic: topicoMentoria.value || null
    // };
    // await joinTutoringSession(mentoriaSelecionada.value.id, payload);

    // Simulação para demonstração
    await new Promise(resolve => setTimeout(resolve, 1500));

    mostrarMensagem('Mentoria agendada com sucesso!', 'success');
    dialogConfirmacao.value = false;
    mentoriaSelecionada.value = null;
    topicoMentoria.value = '';

    // Recarregar mentorias após agendamento
    await buscarMentorias();
  } catch (error) {
    console.error('Erro ao agendar mentoria:', error);
    mostrarMensagem('Erro ao agendar mentoria. Tente novamente.', 'error');
  } finally {
    agendando.value = false;
  }
};

const formatarData = (dataString) => {
  if (!dataString) return '';

  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const mostrarMensagem = (texto, cor = 'success') => {
  snackbar.value.text = texto;
  snackbar.value.color = cor;
  snackbar.value.show = true;
};

// Função para gerar dados simulados
const gerarMentoriasSimuladas = () => {
  const mentoriasSimuladas = [];
  const disciplinasSimuladas = [
    { id: 1, nome: 'Cálculo I', mentorNome: 'João Silva' },
    { id: 2, nome: 'Programação Orientada a Objetos', mentorNome: 'Maria Oliveira' },
    { id: 3, nome: 'Estrutura de Dados', mentorNome: 'Pedro Santos' },
    { id: 4, nome: 'Banco de Dados', mentorNome: 'Ana Costa' },
    { id: 5, nome: 'Inteligência Artificial', mentorNome: 'Carlos Ferreira' }
  ];

  const tipos = ['ONLINE', 'PRESENCIAL'];
  const locais = ['Sala B203', 'Laboratório de Informática', 'Biblioteca Central', 'Sala de Estudos'];
  const links = ['https://meet.google.com/abc-def-ghi', 'https://zoom.us/j/123456789', 'https://teams.microsoft.com/l/meetup-join/123'];

  // Gerar 20 mentorias para os próximos 30 dias
  for (let i = 0; i < 20; i++) {
    const disciplina = disciplinasSimuladas[Math.floor(Math.random() * disciplinasSimuladas.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];

    // Data aleatória nos próximos 30 dias
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + Math.floor(Math.random() * 30));

    // Horário aleatório entre 8h e 18h
    const horaInicio = `${8 + Math.floor(Math.random() * 10)}:00`;
    const horaFim = `${parseInt(horaInicio) + 1}:00`;

    const mentoria = {
      id: i + 1,
      disciplineId: disciplina.id,
      disciplineName: disciplina.nome,
      mentorName: disciplina.mentorNome,
      tutoringDate: dataFutura.toISOString().split('T')[0],
      startTime: horaInicio,
      endTime: horaFim,
      tutoringClassType: tipo,
      maxParticipants: 5 + Math.floor(Math.random() * 5),
      qtdParticipants: Math.floor(Math.random() * 5),
      description: `Mentoria de ${disciplina.nome} com foco em resolução de exercícios e esclarecimento de dúvidas.`
    };

    if (tipo === 'PRESENCIAL') {
      mentoria.local = locais[Math.floor(Math.random() * locais.length)];
    } else {
      mentoria.linkVideo = links[Math.floor(Math.random() * links.length)];
    }

    mentoriasSimuladas.push(mentoria);
  }

  return mentoriasSimuladas;
};

onMounted(async () => {
  await Promise.all([
    buscarMentorias(),
    buscarDisciplinas()
  ]);
});
</script>

<style scoped>
.titulo {
  text-align: center;
  padding: 20px;
  font-family: 'Advent Pro';
}

.v-list-item--active {
  background-color: rgba(0, 74, 173, 0.1);
}

.v-card-title.bg-primary {
  color: white;
}
</style>

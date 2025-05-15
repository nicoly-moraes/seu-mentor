<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAllDisciplines } from '@/services/disciplineService'; 

interface Discipline {
  disciplineId: number;
  disciplineName: string;
  description: string;
  courseAreaId: number;
  courseName: string;
}

const disciplines = ref<Discipline[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchDisciplines = async (courseAreaId?: number) => {
  loading.value = true;
  error.value = null;
  try {
    const params = courseAreaId ? { courseAreaId } : {};
    const response = await getAllDisciplines(params);
    disciplines.value = response.data;
  } catch (err: any) {
    console.error("Erro ao buscar disciplinas:", err);
    error.value = err.response?.data?.message || err.message || "Ocorreu um erro desconhecido.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDisciplines(); // Busca todas as disciplinas
  // Para testar com filtro:
  // fetchDisciplines(1); // Exemplo: Buscar disciplinas para courseAreaId = 1
});
</script>

<template>
  <v-container>
    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p>Carregando disciplinas...</p>
    </div>

    <v-alert v-if="error" type="error" dense dismissible>
      {{ error }}
    </v-alert>

    <v-row v-if="!loading && !error && disciplines.length">
      <v-col v-for="discipline in disciplines" :key="discipline.disciplineId" cols="12" sm="6" md="4" lg="3">
        <v-card class="mx-auto my-2" outlined hover>
          <v-card-title class="text-primary">
            {{ discipline.disciplineName }}
          </v-card-title>
          <v-card-subtitle>
            Área: {{ discipline.courseName }} (ID: {{ discipline.courseAreaId }})
          </v-card-subtitle>
          <v-card-text>
            <div><strong>Descrição:</strong> {{ discipline.description }}</div>
            <div class="text-caption grey--text mt-2">
              ID da Disciplina: {{ discipline.disciplineId }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="!loading && !error && !disciplines.length" class="text-center grey--text mt-5">
      Nenhuma disciplina encontrada.
    </div>
  </v-container>
</template>

<style scoped>
/* Estilos específicos para este componente, se necessário */
.mx-auto {
  height: 100%;
  /* Para que os cards na mesma linha tenham a mesma altura se o conteúdo variar */
  display: flex;
  flex-direction: column;
}

.v-card-title {
  word-break: break-word;
  /* Para quebrar títulos longos */
}

.v-card-text {
  flex-grow: 1;
  /* Faz com que o texto ocupe o espaço disponível, ajudando a alinhar rodapés se houver actions */
}
</style>
<template>
  <h1 class="titulo">MENTORIAS</h1>
  <v-row class="principal px-0">
    <v-col lg="3" md="4" xs="6" v-for="disciplina in disciplines":key="disciplina.disciplineId">
      <v-card class="card mx-auto" variant="outlined" width="300">
        <v-card-title class="card-titulo">
          {{ disciplina.disciplineName }}
        </v-card-title>
        <v-card-subtitle class="card-subtitulo">
          {{ disciplina.courseName }}
        </v-card-subtitle>
        <v-img height="200px" src="../assets/ads-img.png" cover title="Imagem"></v-img>

        <v-card-text class="descricao" :title="disciplina.description">
          {{ disciplina.description }}
        </v-card-text>

        <div class="btn-card">
          <v-btn class="btn" @click="irParaSejaMentor(disciplina.disciplineId, disciplina.disciplineName)" title="Seja Mentor">
            Seja Mentor
          </v-btn>
          <v-btn class="btn" @click="irParaAgendamento(disciplina.disciplineId, disciplina.courseName)" title="Mentorias">
            Mentoria
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { getAllDisciplines } from '@/services/disciplineService';
import { useAuthStore } from '@/stores/auth';

interface Discipline {
  disciplineId: number;
  disciplineName: string;
  description: string;
  courseAreaId: number;
  courseName: string;
}

export default {
  name: "discipline",
  data() {
    return {
      disciplines: [] as Discipline[],
      loading: false,
      error: null as string | null,
    };
  },
  mounted() {
    this.fetchDisciplines();
  },
  methods: {
    async fetchDisciplines(courseAreaId?: number) {
      this.loading = true;
      this.error = null;

      try {
        const params = courseAreaId ? { courseAreaId } : {};
        const response = await getAllDisciplines(params);
        this.disciplines = response.data;
        console.log("[DisciplinePage] Disciplinas carregadas:", this.disciplines);
      } catch (err: any) {
        console.error("Erro ao buscar disciplinas:", err);
        this.error =
          err.response?.data?.message ||
          err.message ||
          "Ocorreu um erro ao carregar as disciplinas.";
      } finally {
        this.loading = false;
      }
    },
    
    // Método para navegar para a página de agendamento
    irParaAgendamento(disciplineId: number, courseName: String) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        // Navega para /agendamento com o ID da disciplina como query parameter
        this.$router.push({ path: '/agendamento', query: { 
          disciplineId: disciplineId.toString(),
          courseName: courseName } });
      } else {
        // Se não estiver autenticado, redireciona para a página de cadastro
        this.$router.push('/cadastre');
      }
    },

    // Novo método para navegar para disponibilidades com disciplina pré-selecionada
    irParaSejaMentor(disciplineId: number, disciplineName: string) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        // Navega para /perfil com a seção de disponibilidades e disciplina pré-selecionada
        this.$router.push({ 
          path: '/perfil', 
          query: { 
            section: 'disponibilidades',
            disciplineId: disciplineId.toString(),
            disciplineName: disciplineName
          } 
        });
      } else {
        // Se não estiver autenticado, redireciona para a página de cadastro
        this.$router.push('/cadastre');
      }
    },
  },
};
</script>

<style scoped>
.titulo {
  font-size: 35px;
  font-family: "Advent Pro";
  text-align: center;
  padding: 12px;
}

.principal {
  padding: 20px;
  font-family: 'Advent Pro';
}

.card {
  height: 100%;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.card-titulo {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 20px;
  font-family: "Advent Pro";
  padding: 12px;
  white-space: normal;
  word-break: break-word;
}

.card-subtitulo {
  padding: 10px;
}

.descricao {
  height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Limita a 3 linhas */
  -webkit-box-orient: vertical;
  line-height: 1.2em; /* Ajuste conforme necessário */
}

.btn-card {
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  align-items: center;
  border-radius: 12px;
  background-color: #004AAD;
  color: #FFFFFF;
  font-size: 12px;
  width: 120px; /* Para manter os botões com o mesmo tamanho */
}
</style>
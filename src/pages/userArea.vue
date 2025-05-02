<template>
  <v-container fluid>
    <v-row align="center" justify="space-between" class="pa-4">
      <h2>Bem-vindo, Usuário.</h2>
      <v-btn class="btn" color="primary" dark>
        Mentoria
        <v-icon right>mdi-plus</v-icon>
      </v-btn>
    </v-row>

    <v-row justify="center">
      <h3>Suas Mentorias</h3>
    </v-row>

    <v-row justify="center" class="pa-4">
      <v-col cols="12" md="5">
        <v-card elevation="10">
          <v-card-title class="text-center">Mentor</v-card-title>
          <v-sheet class="pa-4" color="#041E42" rounded>
            <MentoriaCard
              v-for="(mentoria, index) in mentoriasMentor"
              :key="index"
              :mentoria="mentoria"
            />
          </v-sheet>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card elevation="10">
          <v-card-title class="text-center">Mentorado</v-card-title>
          <v-sheet class="pa-4" color="#041E42" rounded>
            <MentoriaCard
              v-for="(mentoria, index) in mentoriasMentorado"
              :key="index"
              :mentoria="mentoria"
            />
          </v-sheet>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  components: {
    MentoriaCard: {
      props: ["mentoria"],
      template: `
        <v-card class="mb-4" elevation="2">
          <v-card-text>
            <strong>{{ mentoria.titulo }}</strong>
            <p><strong>Data:</strong> {{ mentoria.data }}</p>
            <p><strong>Horário de início:</strong> {{ mentoria.horaInicio }}</p>
            <p><strong>Horário de término:</strong> {{ mentoria.horaFim }}</p>
            <p><strong>Tipo:</strong> {{ mentoria.tipo }}</p>
            <p><strong>Local:</strong> {{ mentoria.local }}</p>
            <p><strong>Status:</strong> {{ mentoria.status }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn icon>
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      `,
    },
  },
  data() {
    return {
      mentoriasMentor: [
        {
          titulo: "Algoritmos",
          data: "15/06/2024",
          horaInicio: "14:30H",
          horaFim: "15:30H",
          tipo: "Presencial",
          local: "PROA - PUC/GO",
          status: "Pendente",
        },
        {
          titulo: "Estrutura de dados",
          data: "03/08/2024",
          horaInicio: "09:30H",
          horaFim: "10:30H",
          tipo: "On-line",
          local: "https://linkdareuniao",
          status: "Concluída",
        },
      ],
      mentoriasMentorado: [
        {
          titulo: "Algoritmos",
          data: "15/06/2024",
          horaInicio: "14:30H",
          horaFim: "15:30H",
          tipo: "Presencial",
          local: "PROA - PUC/GO",
          status: "Pendente",
        },
        {
          titulo: "Estrutura de dados",
          data: "03/08/2024",
          horaInicio: "09:30H",
          horaFim: "10:30H",
          tipo: "On-line",
          local: "https://linkdareuniao",
          status: "Concluída",
        },
      ],
    };
  },
};
</script>

<style scoped>
h2 {
  font-family: "Onest";
}
h3 {
  font-family: "Advent Pro";
  font-size: 32px;
}

.v-card-title {
  font-weight: bold;
  font-size: 1.25rem;
}

.v-card {
  border-radius: 15px;
}

.btn {
  font-family: "Onest";
}
</style>

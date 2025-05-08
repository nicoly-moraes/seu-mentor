<template>
  <h1 class="titulo">Disciplinas</h1>
  <v-row class="principal">
    <v-col
      xs="6"
      md="4"
      lg="3"
      v-for="(_, index) in [].constructor(12)"
      :key="index"
    >
      <v-card
        class="card mx-auto"
        width="300"
        variant="outlined"
      >
        <v-card-title>
          Disciplina
        </v-card-title>
        <v-img
          height="200px"
          src="../assets/ads-img.png"
          cover
        ></v-img>
        <div class="btn-card">
          <v-btn class="btn" to="/cadastre">
            Seja Mentor
          </v-btn>
          <v-btn class="btn" to="/cadastre">
            Seja Mentorado
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
export default {
  name: "discipline"
}
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
  text-align: center;
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
  width: 120px;
}
</style>

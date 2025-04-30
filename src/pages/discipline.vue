<template>
  <h1 class="titulo">Disciplinas</h1>
  <v-row class="principal">
    <v-col
      xs="6"
      md="4"
      lg="3"
      v-for="(_, index) in [].constructor(10)"
      :key="index"
    >
      <v-card
        class="card mx-auto"
        width="300"
      >
        <v-img
          height="200px"
          src="../assets/ads-img.png"
          cover
        ></v-img>

        <v-card-title>
          Disciplina
        </v-card-title>
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
  font-size: 20px;
  text-align: center;
  padding: 12px;
}

.principal {
  padding: 20px;
}

.card {
  text-align: center;
}
</style>

<template>
  <section>
    <h1 class="titulo">
      Comece a sua Jornada!
    </h1>
  </section>
 <v-form>
    <div class="box">
      <v-row>
        <v-col
        cols="12"
        >
          <v-text-field
          label="Nome Completo"
          data-vv-name="nome"
          variant="solo-filled"
          required
          ></v-text-field>
        </v-col>

      <v-col
      cols="12"
        md="7"
      >
        <v-text-field
        v-validate="'required|email'"
        label="E-mail"
        data-vv-name="email"
        variant="solo-filled"
        required
        ></v-text-field>
      </v-col>

      <v-col
      cols="12"
        md="5"
      >
        <v-text-field
        label="Celular"
        data-vv-name="celular"
        variant="solo-filled"
        required
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-select
          v-validate="'required'"
          label="Área de Interesse"
          data-vv-name="select"
          variant="solo-filled"
          required
        ></v-select>
      </v-col>

      <v-col cols="12">
        <v-select
          v-validate="'required'"
          label="Escolha um papel"
          data-vv-name="select"
          variant="solo-filled"
          required
        ></v-select>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn-cadastre" color="primary" size="large">Finalizar</v-btn>
      </v-col>
    </v-row>
    </div>
  </v-form>
</template>

<style scoped>

.titulo{
  padding: 20px;
  text-align: center;
}

.box {
  padding:50px;
}

.btn-cadastre {
  border-radius: 12px;
  border: 20px;
}

</style>

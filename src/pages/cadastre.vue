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
            md="7"
          >
            <v-text-field
            v-model="nome"
            :rules="[validation.required]"
            label="Nome Completo"
            data-vv-name="nome"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="5"
          >
            <v-text-field
            v-model="celular"
            :rules="[validation.required, validation.celular]"
            label="Celular"
            data-vv-name="celular"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
            v-model="email"
            :rules="[validation.required, validation.email]"
            label="E-mail"
            data-vv-name="email"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
            v-model="senha"
            :rules="[validation.required]"
            type="password"
            label="Senha"
            data-vv-name="Senha"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-select
              label="Área de Interesse"
              data-vv-name="select"
              variant="solo-filled"
              required
            ></v-select>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-select
              label="Escolha um papel"
              data-vv-name="select"
              variant="solo-filled"
              required
            ></v-select>
          </v-col>

          <v-col cols="12" class="text-center">
            <v-btn class="btn-cadastre" color="primary" size="large" @click="cadastrar">Finalizar</v-btn>
          </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script lang="ts">
import { validarCelular, validarEmail } from "@/utils/validations.util";

export default {
  name: "cadastre",
  data() {
    return {
      nome: "",
      email: "",
      celular: "",
      senha: "",
      validation: {
        required: (value: string) => !!value || "Campo é obrigatorio",
        email: (value: string) => validarEmail(value) || "Email inválido",
        celular: (value: string) => validarCelular(value) || "Celular inválido"
      }
    }
  },
  methods: {
    cadastrar() {
      if(!this.nome || !this.email || !this.celular || !this.senha || !validarEmail(this.email)) {
        return;
      }
      console.log("🚀 ~ login realizado com sucesso:")
    }
  }
}

</script>

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

<template>
  <section>
    <h1 class="titulo">
      Comece a sua Jornada!
    </h1>
  </section>
  <v-form class="form">
    <div class="box">
      <v-row>
          <v-col
            cols="6"
          >
            <v-text-field
            v-model="nome"
            :rules="[validation.required]"
            label="Nome"
            data-vv-name="nome"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="6"
          >
            <v-text-field
            v-model="sobreNome"
            :rules="[validation.required]"
            label="Sobrenome"
            data-vv-name="sobreNome"
            variant="solo-filled"
            required
            ></v-text-field>
          </v-col>

          <v-col
            cols="6"
          >
            <v-text-field
            v-model="cpf"
            :rules="[validation.required, validation.cpf]"
            label="CPF"
            data-vv-name="cpf"
            variant="solo-filled"
            required
            v-mask="'###.###.###-##'"
            ></v-text-field>
          </v-col>

          <v-col
            cols="6"
          >
            <v-text-field
            v-model="celular"
            :rules="[validation.required, validation.celular]"
            label="Celular"
            data-vv-name="celular"
            variant="solo-filled"
            required
            v-mask="'(##)#####-####'"
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
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

          <v-col cols="12" class="text-center">
            <v-btn class="btn-cadastre" color="primary" size="large" @click="cadastrar">Finalizar</v-btn>
          </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script lang="ts">
import { validarCelular, validarCPF, validarEmail } from "@/utils/validations.util";

export default {
  name: "cadastre",
  data() {
    return {
      nome: "",
      sobreNome: "",
      email: "",
      celular: "",
      cpf: "",
      senha: "",
      validation: {
        required: (value: string) => !!value || "Campo é obrigatório",
        email: (value: string) => validarEmail(value) || "Email inválido",
        celular: (value: string) => validarCelular(value) || "Celular inválido",
        cpf: (value: string) => validarCPF(value) || "CPF inválido"
      }
    };
  },
  methods: {
    cadastrar() {
      if (
        !this.nome ||
        !this.email ||
        !this.celular ||
        !this.senha ||
        !validarEmail(this.email) ||
        !this.cpf
      ) {
        return;
      }
      console.log("🚀 ~ login realizado com sucesso");
    }
  }
}

</script>

<style scoped>

.titulo{
  padding: 20px;
  text-align: center;
  font-family: 'Advent Pro';
  font-size: 35px;
}

.form {
  display: flex;
  justify-content: center;
  margin-bottom: 67px;
}

.box {
  padding:50px;
  max-width: 800px;
}

.btn-cadastre {
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>

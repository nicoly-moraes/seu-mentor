<template>
  <section>
    <h1 class="titulo">
      Faça o seu login
    </h1>
  </section>
 <v-form class="form">
    <v-row class="box">

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
        <a
          class="esqueci-senha text-caption text-decoration-none"
          color="primary"
          href="#"
          rel="noopener noreferrer"
          target="_blank"
        >
          Esqueci minha senha
        </a>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn-entrar" color="primary" size="large" @click="logar">Entrar</v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { validarEmail } from '@/utils/validations.util';

export default {
  name: "login",
  data() {
    return {
      email: "",
      senha: "",
      validation: {
        required: (value: string) => !!value || 'Campo é obrigatorio',
        email: (value: string) => validarEmail(value) || 'Email inválido'
      }
    }
  },
  methods: {
    logar() {
      if(!this.email || !this.senha || !validarEmail(this.email)) {
        return;
      }
      console.log("🚀 ~ login realizado com sucesso:")
    }
  }
}
</script>

<style scoped>
.titulo{
  margin-top: 50px;
  padding: 30px;
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
  max-width: 450px;
}

.esqueci-senha {
}

.btn-entrar {
  margin-bottom: 10px;
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>

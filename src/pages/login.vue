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
        v-model="password"
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
          href="forgotPassword"
          rel="noopener noreferrer"
        >
          Esqueci minha senha
        </a>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn" color="primary" size="large" @click="logar">Entrar</v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { validarEmail } from '@/utils/validations.util';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

export default {
  name: "login",
  data() {
    return {
      email: "",
      password: "",
      validation: {
        required: (value: string) => !!value || 'Campo é obrigatorio',
        email: (value: string) => validarEmail(value) || 'Email inválido'
      }
    }
  },
  methods: {
    async logar() {
      if (
        this.email &&
        this.password
      ) {
      try {
        const response = await authStore.login({
          email: this.email,
          password: this.password,
        });
        this.$router.push('/userArea');

        } catch (error) {
          console.error("❌ Erro ao logar:", error);
        }
      }
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

.btn {
  margin-bottom: 10px;
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>

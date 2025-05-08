<template>
  <v-container>
    <v-card class="mb-5 pa-5">
      <v-card-title>Status da Autenticação</v-card-title>
      <v-card-text>
        <p>Autenticado: {{ authStore.isAuthenticated }}</p>
        <p>Token: {{ authStore.getCurrentToken || 'Nenhum' }}</p>
        <p>User ID: {{ authStore.getCurrentUserId || 'Nenhum' }}</p>
        <v-btn v-if="authStore.isAuthenticated" color="warning" @click="handleLogout" class="mt-3">Logout</v-btn>
      </v-card-text>
    </v-card>

    <v-card class="mb-5 pa-5">
      <v-card-title>Registrar Novo Usuário</v-card-title>
      <v-form @submit.prevent="handleRegister">
        <v-text-field v-model="registerForm.firstName" label="Nome" required></v-text-field>
        <v-text-field v-model="registerForm.lastName" label="Sobrenome" required></v-text-field>
        <v-text-field v-model="registerForm.email" label="Email" type="email" required></v-text-field>
        <v-text-field v-model="registerForm.cpf" label="CPF" required></v-text-field>
        <v-text-field v-model="registerForm.phone" label="Telefone" required></v-text-field>
        <v-text-field v-model="registerForm.password" label="Senha" type="password" required></v-text-field>
        <v-btn type="submit" color="primary" class="mt-3">Registrar</v-btn>
      </v-form>
      <div v-if="registerResponse" class="mt-3 pa-3" :class="registerError ? 'bg-red-lighten-4' : 'bg-green-lighten-4'">
        <pre>{{ registerResponse }}</pre>
      </div>
    </v-card>

    <v-card class="mb-5 pa-5">
      <v-card-title>Login</v-card-title>
      <v-form @submit.prevent="handleLogin">
        <v-text-field v-model="loginForm.email" label="Email" type="email" required></v-text-field>
        <v-text-field v-model="loginForm.password" label="Senha" type="password" required></v-text-field>
        <v-btn type="submit" color="success" class="mt-3">Login</v-btn>
      </v-form>
      <div v-if="loginResponse" class="mt-3 pa-3" :class="loginError ? 'bg-red-lighten-4' : 'bg-green-lighten-4'">
        <pre>{{ loginResponse }}</pre>
      </div>
    </v-card>

    <v-card class="mb-5 pa-5">
      <v-card-title>Esqueci Minha Senha</v-card-title>
      <v-form @submit.prevent="handleForgotPassword">
        <v-text-field v-model="forgotPasswordForm.email" label="Email" type="email" required></v-text-field>
        <v-btn type="submit" color="info" class="mt-3">Solicitar Redefinição</v-btn>
      </v-form>
      <div v-if="forgotPasswordResponse" class="mt-3 pa-3"
        :class="forgotPasswordError ? 'bg-red-lighten-4' : 'bg-green-lighten-4'">
        <pre>{{ forgotPasswordResponse }}</pre>
      </div>
    </v-card>

    <v-card class="pa-5">
      <v-card-title>Resetar Senha</v-card-title>
      <v-form @submit.prevent="handleResetPassword">
        <v-text-field v-model="resetPasswordForm.token" label="Token de Redefinição (do email)" required></v-text-field>
        <v-text-field v-model="resetPasswordForm.newPassword" label="Nova Senha" type="password"
          required></v-text-field>
        <v-btn type="submit" color="purple" class="mt-3">Redefinir Senha</v-btn>
      </v-form>
      <div v-if="resetPasswordResponse" class="mt-3 pa-3"
        :class="resetPasswordError ? 'bg-red-lighten-4' : 'bg-green-lighten-4'">
        <pre>{{ resetPasswordResponse }}</pre>
      </div>
    </v-card>

  </v-container>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Ajuste o caminho se necessário
import {
  // registerUser, // Se quiser chamar direto sem passar pelo store para teste
  // loginUser, // Se quiser chamar direto sem passar pelo store para teste
  forgotPassword,
  resetPassword,
} from '@/services/authService'; // Ajuste o caminho se necessário

const authStore = useAuthStore();

// --- Registro ---
const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  cpf: '',
  phone: '',
  password: '',
});
const registerResponse = ref<any>(null);
const registerError = ref(false);

async function handleRegister() {
  registerError.value = false;
  registerResponse.value = null;
  try {
    const response = await authStore.register({ ...registerForm }); // Usando a ação do store
    // const response = await registerUser({ ...registerForm }); // Chamada direta ao serviço
    registerResponse.value = response; // Store já deve ter atualizado o estado
  } catch (error: any) {
    registerError.value = true;
    registerResponse.value = error.message || error;
  }
}

// --- Login ---
const loginForm = reactive({
  email: '',
  password: '',
});
const loginResponse = ref<any>(null);
const loginError = ref(false);

async function handleLogin() {
  loginError.value = false;
  loginResponse.value = null;
  try {
    const response = await authStore.login({ ...loginForm });
    loginResponse.value = response; // Store já deve ter atualizado o estado e localStorage
  } catch (error: any) {
    loginError.value = true;
    loginResponse.value = error.message || error;
  }
}

// --- Logout ---
function handleLogout() {
  authStore.logout();
  // A store já deve lidar com o redirecionamento se configurado
}

// --- Esqueci a Senha ---
const forgotPasswordForm = reactive({
  email: '',
});
const forgotPasswordResponse = ref<any>(null);
const forgotPasswordError = ref(false);

async function handleForgotPassword() {
  forgotPasswordError.value = false;
  forgotPasswordResponse.value = null;
  try {
    const response = await forgotPassword({ ...forgotPasswordForm });
    forgotPasswordResponse.value = response.data;
  } catch (error: any) {
    forgotPasswordError.value = true;
    forgotPasswordResponse.value = error.response ? error.response.data : (error.message || error);
  }
}

// --- Resetar a Senha ---
const resetPasswordForm = reactive({
  token: '',
  newPassword: '',
});
const resetPasswordResponse = ref<any>(null);
const resetPasswordError = ref(false);

async function handleResetPassword() {
  resetPasswordError.value = false;
  resetPasswordResponse.value = null;
  try {
    const response = await resetPassword({ ...resetPasswordForm });
    resetPasswordResponse.value = response.data;
  } catch (error: any) {
    resetPasswordError.value = true;
    resetPasswordResponse.value = error.response ? error.response.data : (error.message || error);
  }
}
</script>

<style scoped>
/* Estilos adicionais se necessário */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
}

.bg-red-lighten-4 {
  background-color: #FFEBEE;
  /* Exemplo de cor para erro */
  border: 1px solid #FFCDD2;
}

.bg-green-lighten-4 {
  background-color: #E8F5E9;
  /* Exemplo de cor para sucesso */
  border: 1px solid #C8E6C9;
}
</style>
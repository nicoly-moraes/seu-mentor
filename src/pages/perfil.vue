<template>
  <section>
    <h1 class="titulo">
      Dados do Usuário
    </h1>
  </section>
  <v-form class="form">
    <div class="box">
      <v-row>
        <v-col
          cols="6"
        >
          <v-text-field
            v-model="firstName"
            :rules="[validation.required]"
            label="Nome"
            data-vv-name="nome"
            variant="solo-filled"
            required
            :readonly="!isEditing"
          ></v-text-field>
        </v-col>
        <v-col
          cols="6"
        >
          <v-text-field
            v-model="lastName"
            :rules="[validation.required]"
            label="Sobrenome"
            data-vv-name="sobrenome"
            variant="solo-filled"
            required
            :readonly="!isEditing"
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
        >
          <v-text-field
            v-model="phone"
            :rules="[validation.required, validation.celular]"
            label="Celular"
            data-vv-name="celular"
            variant="solo-filled"
            required
            v-mask="'(##)#####-####'"
            :readonly="!isEditing"
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
            :readonly="!isEditing"
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          class="btn"
        >
          <v-btn v-if="!isEditing"
            append-icon="mdi mdi-square-edit-outline"
            variant="text"
            size="small"
            color="primary"
            @click="startEditing"
          >
            Alterar dados
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          class="btn"
        >
          <v-btn
            append-icon="mdi mdi-delete-outline"
            variant="text"
            size="small"
            color="red"
            @click="deleteAccount"
          >
            Excluir conta
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          class="btn-alteração"
        >
          <v-btn
            v-if="isEditing"
            color="primary"
            @click="saveChanges"
          >
            Salvar alterações
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script lang="ts">
import { validarCelular, validarEmail } from '@/utils/validations.util';
import { useAuthStore } from '@/stores/auth';
// @ts-ignore
import { getUserData, updateUserData, deleteUser } from '@/services/userService';

export default {
  name: "perfil",
  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isEditing: false,
      originalData: { firstName: '', lastName: '', email: '', phone: '' },
      validation: {
        required: (value: string) => !!value || "Campo é obrigatório",
        email: (value: string) => validarEmail(value) || "Email inválido",
        celular: (value: string) => validarCelular(value) || "Celular inválido",
      },
    };
  },
  mounted() {
    this.fetchUserData();
  },
  methods: {
    async fetchUserData() {
      const authStore = useAuthStore();
      const userId = authStore.getCurrentUserId;

      if (userId) {
        try {
          const response = await getUserData(userId);
          if (response && response.data) {
            this.firstName = response.data.firstName || '';
            this.lastName = response.data.lastName || '';
            this.email = response.data.email || '';
            this.phone = response.data.phone || '';
            this.originalData = {
              firstName: response.data.firstName || '',
              lastName: response.data.lastName || '',
              email: response.data.email || '',
              phone: response.data.phone || '',
            };
          } else {
            console.error("Erro ao buscar dados do usuário");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        console.error("Usuário não autenticado");
      }
    },
    startEditing() {
      this.isEditing = true;
    },
    async saveChanges() {
      const authStore = useAuthStore();
      const userId = authStore.getCurrentUserId;

      if (userId) {
        try {
          const updatedData = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
          };
          const response = await updateUserData(userId, updatedData);
          if (response && response.data) {
            console.log("Dados do usuário atualizados com sucesso:", response.data);
            this.isEditing = false;
            await this.fetchUserData();
            // Opcional: Mostrar mensagem de sucesso
          } else {
            console.error("Erro ao atualizar dados do usuário");
            // Opcional: Mostrar mensagem de erro
          }
        } catch (error) {
          console.error("Erro ao atualizar dados do usuário:", error);
          // Opcional: Mostrar mensagem de erro
        }
      } else {
        console.error("Usuário não autenticado");
      }
    },
    async deleteAccount() {
      const authStore = useAuthStore();
      const userId = authStore.getCurrentUserId;

      if (userId) {
        // Adiciona confirmação antes de excluir
        const confirmDeletion = confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.");
        if (!confirmDeletion) {
          return; // Cancela a exclusão se o usuário clicar em "Cancelar"
        }
        try {
          const response = await deleteUser(userId);
          if (response && response.status === 204) {
            console.log("Conta excluída com sucesso");
            // Redireciona para a página de logout ou inicial
            authStore.logout();
            this.$router.push('/'); // Use o nome da sua rota inicial
          } else if (response && response.status === 403) {
             console.error("Erro ao excluir a conta. Status:", response.status);
            // Exibe mensagem de erro ao usuário
            alert("Você não tem permissão para excluir esta conta.");
          }
          else {
            console.error("Erro ao excluir a conta. Status:", response ? response.status : 'Desconhecido');
            // Exibe mensagem de erro ao usuário
            alert("Ocorreu um erro ao excluir sua conta. Por favor, tente novamente.");
          }
        } catch (error: any) {
          console.error("Erro ao excluir a conta:", error);
          // Exibe mensagem de erro ao usuário
          alert(`Ocorreu um erro ao excluir sua conta: ${error.message || 'Erro desconhecido'}`);
        }
      } else {
        console.error("Usuário não autenticado");
        alert("Usuário não autenticado. Não foi possível excluir a conta.");
      }
    },
  },
};
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
  width: 850px;
}

.btn {
  display: flex;
  justify-content: end;
}

.btn-alteração {
  display: flex;
  justify-content: center;
}
</style>

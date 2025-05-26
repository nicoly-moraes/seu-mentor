<template>
  <v-app-bar class="header-principal">
    <div class="principal d-flex flex-column w-100 px-4 ga-2">
      <div class="d-flex justify-space-between w-100">
        <div class="d-flex align-center ga-2">
          <img src="../assets/logo.png" alt="Logo" class="logo" />

          <v-btn color="primary" title="Explorar">
            Explorar
            <v-icon icon="mdi-chevron-down"></v-icon>

            <v-menu activator="parent" class="info-list">
              <v-list class="text-primary">
                <v-list-item to="/" link>
                  <v-list-item-title>Home</v-list-item-title>
                </v-list-item>
                <v-list-item to="/discipline" link>
                  <v-list-item-title>Mentorias</v-list-item-title>
                </v-list-item>
                <v-list-item to="/mindMap" link>
                  <v-list-item-title>Mapa Mental</v-list-item-title>
                </v-list-item>
                <v-list-item to="/aboutUs" link>
                  <v-list-item-title>Quem Somos</v-list-item-title>
                </v-list-item>
                <v-list-item to="/faq" link>
                  <v-list-item-title>FAQ</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn>
        </div>

        <div class="search-principal d-flex align-center">
          <v-text-field
            class="search"
            density="compact"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            hide-details
            single-line
          ></v-text-field>
        </div>

        <div class="nav-right" v-if="!isAuthenticated">
          <v-btn class="btn-cadastre text-primary" variant="text" to="/cadastre" title="Cadastre-se">Cadastre-se</v-btn>
          <v-btn class="btn-login" color="primary" variant="flat" to="/login" title="Entrar">Entrar</v-btn>
        </div>

        <div class="nav-right" v-else>
          <v-menu location="bottom end" class="info-list">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-account" size="large" rounded="circle"></v-btn>
            </template>
            <v-card class="info-authenticated">
              <v-list>
                <v-list-item class="text-primary" to="/perfil" link>
                  <v-list-item-title>Perfil</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-red" @click="logout">
                  <v-list-item-title>Sair</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <div class="nav-right-mobile" v-if="!isAuthenticated">
          <v-menu
            v-model="menu"
            location="bottom"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                color="indigo"
                v-bind="props"
                icon="mdi-account"
              >
              </v-btn>
            </template>

            <v-card>
              <v-list class="btn-list">
                <v-list-item >
                  <v-btn block class="btn-login" color="primary" variant="flat" to="/login">Entrar</v-btn>
                </v-list-item>
                <v-list-item >
                  <v-btn block class="btn-cadastre text-primary" variant="text" to="/cadastre">Cadastre-se</v-btn>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <div class="nav-right-mobile" v-else>
          <v-menu location="bottom end" class="info-list">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-account" size="large" rounded="circle"></v-btn>
            </template>
            <v-card class="info-authenticated">
              <v-list>
                <v-list-item class="text-primary" to="/perfil" link>
                  <v-list-item-title>Perfil</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-red" @click="logout">
                  <v-list-item-title>Sair</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>

      <div class="search-mobile">
        <v-text-field
          density="compact"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          flat
          hide-details
          single-line
        ></v-text-field>
      </div>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { useAuthStore } from '@/stores/auth';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: "AppHeader", // Se você tiver outros componentes sendo usados aqui
  data() {
    return {
      menu: false,
    };
  },
  computed: {
    isAuthenticated() {
      const authStore = useAuthStore();
      return authStore.isAuthenticated;
    },
  },
  methods: {
    logout() {
      const authStore = useAuthStore();
      const router = useRouter();
      authStore.logout();
      router.push('/login');
    },
  },
};
</script>

<style scoped>

.logo {
  height: 64px;
}

.info-list {
  text-align: center;
}

.info-authenticated {
  width: 100px;
}

.search {
  display: none;
}

.search-mobile {
  width: 100%;
  height: 40px;
  margin-bottom: 16px;
}

@media (min-width: 640px) {
  .search-principal {
    width: 100%;
    max-width: 350px;
  }

  .search {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 40px;
  }

  .search-mobile {
    display: none;
  }
}

.btn-login {
  border-radius: 12px;
  color: #FFFFFF;
}

.btn-list {
  text-align: center;
}

.nav-right {
  display: none;
}

.nav-right-mobile {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (min-width: 992px) {
  .nav-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nav-right-mobile {
    display: none;
  }
}
</style>

<template>
  <v-card class="profile-sidebar-card h-100" elevation="2">
    <div class="text-center pa-4">
      <v-avatar size="120" class="mb-3">
        <v-img
          :src="userData?.profileImg || 'https://cdn.vuetifyjs.com/images/john.jpg'"
          alt="Foto de perfil"
        ></v-img>
      </v-avatar>
      <h2 class="text-h5 font-weight-bold">
        {{ userData ? `${userData.firstName} ${userData.lastName}` : 'Carregando...' }}
      </h2>
      <p class="text-subtitle-2 text-medium-emphasis">
        {{ userData?.email || '' }}
      </p>
    </div>

    <v-divider></v-divider>

    <v-list nav>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item.value"
        :title="item.title"
        :prepend-icon="item.icon"
        :active="activeSection === item.value"
        @click="$emit('update:activeSection', item.value)"
        class="my-1"
        rounded="lg"
      ></v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
defineProps({
  userData: {
    type: Object,
    default: null
  },
  menuItems: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    required: true
  }
});

defineEmits(['update:activeSection']);
</script>

<style scoped>
/* Styles specific to the sidebar card, if any, were already in UserProfilePage.vue */
/* .profile-sidebar-card and .h-100 are general, so kept them in parent for now or make global */
</style>
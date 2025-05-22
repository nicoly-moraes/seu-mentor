<template>
  <v-app>
    <router-view />
    <AppSnackbar />
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppSnackbar from '@/components/AppSnackbar.vue';

export default defineComponent({
  name: 'App',
  components: {
    AppSnackbar,
  },
});
</script>

<template>
  <div class="center-container">
    <a>
      <img alt="Mapa mental" src="@/assets/mindmental.jpg">
    </a>
  </div>
</template>

<script lang="ts">
export default {
  name: "mindMap"
}
</script>

<style scoped>
.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
}

img {
  max-width: 100%;
  height: auto;
}

</style>

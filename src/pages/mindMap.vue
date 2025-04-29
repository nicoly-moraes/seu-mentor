<template>
  <div class="center-container">
    <a href="https://www.exemplo.com">
      <img src="@/assets/mindmental.jpg" alt="Descrição da imagem">
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

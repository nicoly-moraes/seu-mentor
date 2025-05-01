<template>
   <h1 class="titulo">Organize sua mentoria</h1>
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

.titulo {
  font-size: 35px;
  font-family: "Advent Pro";
  text-align: center;
  padding: 12px;
}

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

<template>
  <div class="has-tertiary">
    <TertiaryNav>
      <NuxtLink to="/create/singles" class="exact">
        <Icon type="opepen" />
        <span>Created</span>
      </NuxtLink>
      <NuxtLink to="/create/singles/submit">
        <Icon type="opepen-outline" />
        <span>New</span>
      </NuxtLink>
    </TertiaryNav>

    <NuxtPage />
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>

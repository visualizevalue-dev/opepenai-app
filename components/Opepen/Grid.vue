<template>
  <PaginatedContent
    :url="url"
    :query="`limit=${limit}`"
    v-slot="{ items, meta }"
    class="opepen-grid"
  >
    <OpepenCard
      v-for="token in items"
      :key="token.token_id"
      :token="token"
      :set="token.data?.edition || 40"
      :subline="subline(token)"
    />
  </PaginatedContent>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Opepen',
  },
  url: {
    type: String,
    default: 'https://api.opepen.art/v1/opepen',
  },
  limit: {
    type: Number,
    default: 80,
  },
  subline: {
    type: Function,
    default: token => undefined,
  },
})
</script>

<style>
  .opepen-grid {
    display: grid;
    gap: var(--spacer);
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));

    flex-wrap: wrap;
    width: 100%;
    margin: 0 auto;

    @media (--md) {
      gap: var(--spacer);
    }
  }
</style>


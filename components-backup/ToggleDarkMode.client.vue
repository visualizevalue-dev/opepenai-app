<template>
  <button @click="() => toggleDark()" title="Switch Light/Dark mode">
    <Icon v-if="isDark" type="sun" :size="20" />
    <Icon v-else type="moon" :size="20" />
  </button>
</template>

<script setup>
import { useToggle } from '@vueuse/core'
import { isDark } from '~/helpers/colors'

const toggleDark = useToggle(isDark)

watch(isDark, () => {
  if (isDark.value) {
    document.documentElement.classList.remove('lightmode')
    localStorage.setItem('color-scheme', 'dark')
  } else {
    document.documentElement.classList.add('lightmode')
    localStorage.setItem('color-scheme', 'light')
  }
})

onMounted(() => {
  if (! isDark.value) {
    document.documentElement.classList.add('lightmode')
  }
})
</script>

<style scoped>
  button {
    position: fixed;
    bottom: var(--size-4);
    right: var(--size-4);
    height: var(--size-5);
    width: var(--size-5);
    outline: none;
    z-index: 40;

    .vue-feather {
      height: var(--size-5);
      width: var(--size-5);
      transition: all var(--speed);
    }

    &:--highlight {
      .vue-feather {
        color: var(--gray-z-7);
      }
    }
  }
</style>

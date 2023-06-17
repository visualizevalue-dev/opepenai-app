<template>

  <section v-if="set.name" class="opt-in">
    <header v-if="revealed">
      <Icon type="info" />
      <h1>Revealed on {{ revealDate }} at <NuxtLink :to="`https://etherscan.io/block/${set.reveal_block_number}`">Block {{ set.reveal_block_number }}</NuxtLink> using the <NuxtLink to="https://github.com/visualizevalue-dev/opepens-metadata-api/tree/main/drops/sets">Opepen Metadata Reveal Script</NuxtLink>.</h1>
    </header>
    <header v-else>
      <div>Opt-In window <span class="hidden-sm">for "{{ set.name }}"&nbsp;</span>closes in <CountDown @complete="onComplete" :until="revealsAt" class="inline nowrap" />.</div>
      <ClientOnly>
        <SetOptInFlow
          :set="set"
          :subscribed="subscription?.opepen_ids || []"
          :open="optInOpen"
          @close="optInOpen = false"
          :click-outside="false"
        />
      </ClientOnly>
      <Button @click="optInOpen = true">
        <Icon type="feather" />
        <span class="nowrap"><span v-if="subscription?.opepen_ids?.length">Change</span> Opt-In</span>
      </Button>
    </header>
    <div v-if="subscription" class="selection">
      <template v-if="subscription.opepen_ids.length">
        <p>You submitted {{ subscription.opepen_ids.length }} Opepen for potential reveal:</p>
        <p class="muted">{{ subscription.opepen_ids.map(id => `#${id}`).join(', ') }}.</p>
      </template>
      <template v-else>
        <p>You opted out all opepen submissions.</p>
      </template>
    </div>
  </section>

</template>

<script setup>
import { DateTime } from 'luxon'
import { useAccount } from 'vagmi'

const config = useRuntimeConfig()
const props = defineProps({ set: Object })
const emit = defineEmits(['update'])
const { address } = useAccount()

const revealDate = ref(DateTime.fromISO(props.set?.reveals_at).toFormat('LLL dd, yyyy'))
const revealsAt = ref(DateTime.fromISO(props.set?.reveals_at).toUnixInteger())
const revealed = ref(revealsAt.value <= DateTime.now().toUnixInteger())
const onComplete = () => {
  revealed.value = true
}

const { data: subscription, refresh } = await useLazyAsyncData(
  'set',
  () =>
    $fetch(
      `${config.public.opepenApi}/accounts/${address.value}/sets/${props.set.id}`
    ),
  {
    watch: [address],
  }
);

const optInOpen = ref(false)
watch(optInOpen, () => {
  if (optInOpen.value === false) {
    emit('update')
    refresh()
  }
})

</script>

<style lang="postcss" scoped>
  .opt-in {
    border: var(--border);
    border-radius: var(--size-5);
    border-top-left-radius: var(--size-1);
    background-color: var(--gray-z-0);

    header,
    .selection {
      padding: var(--size-2) var(--size-2) var(--size-2) var(--size-4);
    }

    header {
      display: flex;
      align-items: center;
      padding: var(--size-2) var(--size-2) var(--size-2) var(--size-4);

      > .vue-feather {
        flex-shrink: 0;
        margin-right: var(--size-4);
        color: var(--gray-z-6);
      }

      > div,
      h1 {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-sm);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-md);

        a {
          text-decoration: underline;
        }
      }

      + .selection {
        border-top: var(--border);
      }

      > .button:last-child {
        margin-left: auto;
      }
    }

    .selection {
      font-size: var(--font-sm);
      padding: var(--size-3) var(--size-2) var(--size-3) var(--size-4);
    }
  }
</style>

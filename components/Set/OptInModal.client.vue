<template>
<div>
  <Modal :open="open" scroll @close="$emit('close')" :click-outside="clickOutside">
    <div class="opt-in-flow" :class="{ signing }">
      <header>
        <h1>
          <template v-if="subscribed?.length && !selected.length">Opt-Out of Set "{{ data.name }}"</template>
          <template v-else>Opt-In to Set "{{ data.name }}"</template>
        </h1>
      </header>
      <section>
        <Loading v-if="opepenLoading" />

        <div v-else-if="! opepen.length" class="empty">
          <p>No Opepen to opt-in found.</p>
        </div>

        <div v-else class="opepens">
          <div v-for="(opepens, g) in grouped" class="group">
            <div v-if="opepens.length">
              <header>
                <h1>Editions of {{ g }}:</h1>

                <Button v-if="hasCompleteGroupSelection(g)" @click="() => deselectAll(g)" class="sm">Deselect All</Button>
                <Button v-else @click="() => selectAll(g)" class="sm">Select All</Button>
              </header>

              <label v-if="selectedInGroup(g).length > 1 && g !== '1'" class="setting">
                <span>Max Reveal:</span>
                <input
                  type="number"
                  min="1"
                  :max="maxInGroup(g)"
                  :value="maxRevealSetting[g] || maxInGroup(g)"
                  @input="$event => {
                    maxRevealSetting[g] = parseInt($event.target.value);
                    validateMaxReveal(g)
                  }"
                  :placeholder="maxInGroup(g)"
                  :style="{
                    minWidth: hasCompleteGroupSelection(g) ? '7rem' : '6rem'
                  }"
                >
              </label>
            </div>

            <label v-for="o in opepens">
              <input type="checkbox" :value="o.token_id" v-model="selected">
              <span>#{{ o.token_id }}</span>
              <abbr :title="`Edition of ${o.data.edition}`" class="edition">({{ o.data.edition }} Ed.)</abbr>
            </label>
          </div>
        </div>
      </section>
      <footer>
        <div v-if="selected.length" class="left">
          <span>Submitting {{ selected.length }} Opepen</span>
          <template v-for="(_, g) in grouped">
            <div v-if="selectedInGroup(g).length" class="group">
              <span>
                {{selectedInGroup(g).length}}<span class="times">x</span><span class="edition">{{ getEditionName(g) }}</span>
              </span>
            </div>
          </template>
        </div>
        <Button @click="$emit('close')">
          <span v-if="hasChange">Cancel</span>
          <span v-else>Ok</span>
        </Button>
        <Button v-if="hasChange" :disabled="signing" @click="sign">
          <span v-if="signing">Confirming...</span>
          <span v-else>
            <template v-if="subscribed?.length && !selected.length">Opt-Out</template>
            <template v-else>Confirm</template>
          </span>
        </Button>
      </footer>
    </div>
  </Modal>

  <Modal v-if="signed" :open="true" title="Success" @close="() => signed = false">
    <div class="success-modal">
      <template v-if="!selected.length">
        <p>You removed all your Opepen submissions from "{{ data.name }}"!</p>
      </template>
      <template v-else>
        <p>You submitted {{ selected.length }} Opepen to be included in "{{ data.name }}"!</p>
        <p>If your Opepen {{ selected.length > 1 ? 'are' : 'is' }} selected as part of this set, your metadata will update after the opt-in window closes.</p>
      </template>

      <div class="action">
        <Button @click="() => signed = false">Ok</Button>
      </div>
    </div>
  </Modal>
</div>
</template>

<script setup>
import { signMessage } from '@wagmi/core'

const config = useRuntimeConfig()
const props = defineProps({
  address: String,
  open: Boolean,
  data: Object,
  clickOutside: Boolean,
  subscribed: Array,
  storedComment: String,
  maxReveals: {
    type: Object,
    default: () => ({
      '1': null,
      '4': null,
      '5': null,
      '10': null,
      '20': null,
      '40': null,
    })
  },
})
const emit = defineEmits(['close', 'update'])

// FIXME: filter to delegated tokenIDs for token specific delegations
const { addresses: delegatedAddresses } = await useDelegation(address)

const {
  opepen, opepenByEdition: grouped, opepenLoading, fetchOpepen
} = await useOpepen([props.address, ...delegatedAddresses.value])
watch(delegatedAddresses, () => fetchOpepen([props.address, ...delegatedAddresses.value]))

const validSubscribed = computed(() => [...props.subscribed]
  // All opt ins that are still owned by the owner
  .filter(i => opepen.value.map(o => o.token_id).includes(i))
)

const selected = ref(validSubscribed.value?.length ? [...validSubscribed.value] : [])
watch(validSubscribed, () => {
  selected.value = [...validSubscribed.value] || []
})
const selectedPerGroup = computed(() => Object.keys(grouped.value)
  .map(g => [g, selected.value.filter(id => grouped.value[g].map(g => g.token_id).includes(id))])
  .reduce((groups, [g, ids]) => {
    groups[g] = ids
    return groups
  }, {})
)
const hasChange = computed(() =>
  opepen.value.length &&
  JSON.stringify(selected.value.sort()) !== JSON.stringify(props.subscribed.sort()) ||
  JSON.stringify(maxRevealValues.value) !== JSON.stringify(props.maxReveals)
)

const selectAll = (group) => {
  grouped.value[group].forEach(o => {
    if (! selected.value.includes(o.token_id)) {
      selected.value.push(o.token_id)
    }
  })
}
const deselectAll = (group) => {
  grouped.value[group].forEach(o => {
    const i = selected.value.findIndex(s => s == o.token_id)
    selected.value.splice(i, 1)
  })
}
const selectedInGroup = group => {
  return selectedPerGroup.value[group]
}
const maxInGroup = group => {
  const count = selectedInGroup(group).length
  const edition = parseInt(group)
  return count > edition ? edition : count
}
const hasCompleteGroupSelection = group => {
  return selectedInGroup(group).length === grouped.value[group].length
}

const maxRevealSetting = reactive({ ...props.maxReveals })
watch(() => props.maxReveals, () => {
  maxRevealSetting['1'] = props.maxReveals['1']
  maxRevealSetting['4'] = props.maxReveals['4']
  maxRevealSetting['5'] = props.maxReveals['5']
  maxRevealSetting['10'] = props.maxReveals['10']
  maxRevealSetting['20'] = props.maxReveals['20']
  maxRevealSetting['40'] = props.maxReveals['40']
})
const maxRevealValues = computed(() => ({
  '1':  maxRevealSetting['1']  ? maxRevealSetting['1']  : maxInGroup('1'),
  '4':  maxRevealSetting['4']  ? maxRevealSetting['4']  : maxInGroup('4'),
  '5':  maxRevealSetting['5']  ? maxRevealSetting['5']  : maxInGroup('5'),
  '10': maxRevealSetting['10'] ? maxRevealSetting['10'] : maxInGroup('10'),
  '20': maxRevealSetting['20'] ? maxRevealSetting['20'] : maxInGroup('20'),
  '40': maxRevealSetting['40'] ? maxRevealSetting['40'] : maxInGroup('40'),
}))
const validateMaxReveal = g => {
  if (maxRevealSetting[g] > parseInt(g)) {
    maxRevealSetting[g] = parseInt(g)
  }
  if (maxRevealSetting[g] < 1) {
    maxRevealSetting[g] = 1
  }
}

const message = computed(() => {
  return `I want to submit ${selected.value.length} Opepen for possible artwork reveal in the following set:

SET NAME: ${props.data.name}

MAX REVEALS:
${Object.keys(maxRevealValues.value)
  .filter(g => maxRevealValues.value[g])
  .map(g => [g, maxRevealValues.value[g]])
  .map(([g, max]) => `- Edition of ${g}: ${max} Reveal${max > 1 ? 's' : ''}`)
  .join('\n')
}

OPEPEN PROOF: ${ proof(selected.value.map(id => `#${id}`).join(', ')) }`
})

const signing = ref(false)
const signed = ref(false)
const sign = async () => {
  if (! selected.value?.length && ! props.subscribed.length) {
    alert(`Please select at least one Opepen to submit to the drop first!`)
    return
  }

  try {
    signing.value = true

    const signature = await signMessage({
      message: message.value,
    })

    await $fetch(`${config.public.opepenApi}/set-submissions/${props.data.uuid}/subscribe`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        address: props.address,
        opepen: selected.value,
        max_reveals: maxRevealValues.value,
        message: message.value,
        signature,
        delegated_by: delegatedAddresses.value.join(',')
      })
    })

    signed.value = true
  } catch (e) {
    // ...
  }

  await fetchOpepen([props.address, ...delegatedAddresses.value])

  signing.value = false
  emit('close')
  emit('update')
}
</script>

<style scoped>
.opt-in-flow {
  --header-height: calc(var(--size-8) + var(--size-2));

  &.signing {
    > section {
      pointer-events: none;
      user-select: none;
      opacity: 0.5;
    }
  }
}

.opt-in-flow > header {
  padding: var(--size-4);
  border-bottom: var(--border-dark);

  position: absolute;
  z-index: 4;
  top: 0;
  width: 100%;
  height: var(--header-height);

  background-color: var(--semi);
  backdrop-filter: var(--blur);

  h1 {
    text-align: center;
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
  }
}

section {
  padding: var(--header-height) 0 var(--size-9);
}

.empty {
  padding: var(--size-8) var(--size-4);
  text-align: center;
  color: var(--gray-z-5);
}

.opepens {
  > .group {
    > div {
      text-transform: uppercase;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-sm);
      padding: var(--size-2) var(--size-4);
      letter-spacing: var(--letter-spacing-md);
      position: sticky;
      top: var(--header-height);
      z-index: 2;

      > * {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      > label {
        border-top: var(--border);
        margin: var(--size-2) 0 0;
        padding: var(--size-2) 0 0;
        color: var(--gray-z-5);
        font-size: var(--font-xs);

        span {
          white-space: nowrap;
        }

        input {
          font-size: var(--font-xs);
          padding-top: var(--size-1);
          padding-bottom: var(--size-1);
          min-height: 0;
          height: calc(var(--size-6) + var(--size-1));
          margin-left: auto;
          min-width: 6rem;
          width: auto;

          &:--highlight {
            color: var(--color);
          }
        }
      }

      background-color: var(--gray-z-2);

      .button {
        padding: var(--size-0) var(--size-2);
        font-size: var(--font-xs);
        padding-top: var(--size-1);
        padding-bottom: var(--size-1);
        min-height: 0;
        height: calc(var(--size-6) + var(--size-1));
      }
    }

    > label {
      display: grid;
      grid-template-columns: var(--size-5) 40% 1fr;
      align-items: center;
      gap: var(--size-4);
      text-transform: uppercase;
      font-weight: var(--font-weight-bold);
      padding: var(--size-1) var(--size-4);
      white-space: nowrap;

      input {
        width: var(--size-4);
        height: var(--size-4);
      }

      .edition {
        color: var(--gray-z-6);
        font-size: var(--font-sm);
        text-align: right;
      }

      &:--highlight {
        background-color: var(--gray-z-1);
      }
    }
  }
}

footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 6;

  padding: var(--size-4);

  background-color: var(--semi);
  backdrop-filter: var(--blur);
  border-top: var(--border);

  display: flex;
  justify-content: flex-end;
  gap: var(--size-4);

  .left {
    margin-right: auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
    font-size: var(--font-sm);
    align-items: center;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    line-height: 0.75;
    font-size: var(--font-xs);

    span:first-child {
      width: 100%;
      color: var(--gray-z-6);
      margin-bottom: -0.25em;
    }

    .times {
      color: var(--gray-z-6);
      text-transform: lowercase;
    }

    .edition {
      color: var(--gray-z-9);
    }
  }
}

.success-modal {
  p {
    font-weight: var(--font-weight-bold);
    margin: var(--size-2) 0;
  }

  .action {
    margin-top: var(--size-5);
    display: flex;
    justify-content: flex-end;
  }
}
</style>

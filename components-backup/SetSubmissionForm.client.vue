<template>
  <form @submit.stop.prevent="store">
    <Alert v-if="toSign && published" class="span-2 inline">
      <p>Artist Signature: You can sign your set via an onchain transaction.</p>

      <div class="actions">
        <SignSet :data="data" @signed="markSigned" />
      </div>
    </Alert>
    <Alert v-else-if="isPublishedToSet" class="span-2 inline">
      <p>Note: This submission is published to <NuxtLink :to="`/sets/${data.set_id}`">set {{ pad(data.set_id, 3) }}</NuxtLink>. If you want to change antything about the set, please reach out to the VV team.</p>

      <div class="actions">
        <Button :to="`/sets/${data.set_id}`">View Set</Button>
      </div>
    </Alert>

    <label class="name">
      <span class="label">Name</span>
      <input type="text" v-model="name" placeholder="Set Name" :disabled="disabled" required />
    </label>

    <div class="images">
      <ImageUpload @stored="image1 = $event" name="1/1 Media" :image="image1" :disabled="disabled" />
      <ImageUpload @stored="image4 = $event" name="1/4 Media" :image="image4" :disabled="disabled" />
      <ImageUpload @stored="image5 = $event" name="1/5 Media" :image="image5" :disabled="disabled" />
      <ImageUpload @stored="image10 = $event" name="1/10 Media" :image="image10" :disabled="disabled" />
      <ImageUpload @stored="image20 = $event" name="1/20 Media" :image="image20" :disabled="disabled" />
      <ImageUpload @stored="image40 = $event" name="1/40 Media" :image="image40" :disabled="disabled" />
    </div>

    <div class="names">
      <span class="label">Edition Names</span>
      <div>
        <div><Image :image="image1" /></div>
        <input type="text" v-model="name1"  :disabled="disabled" placeholder="1/1 Name" />
      </div>
      <div>
        <div><Image :image="image4" /></div>
        <input type="text" v-model="name4"  :disabled="disabled" placeholder="1/4 Name" />
      </div>
      <div>
        <div><Image :image="image5" /></div>
        <input type="text" v-model="name5"  :disabled="disabled" placeholder="1/5 Name" />
      </div>
      <div>
        <div><Image :image="image10" /></div>
        <input type="text" v-model="name10" :disabled="disabled" placeholder="1/10 Name" />
      </div>
      <div>
        <div><Image :image="image20" /></div>
        <input type="text" v-model="name20" :disabled="disabled" placeholder="1/20 Name" />
      </div>
      <div>
        <div><Image :image="image40" /></div>
        <input type="text" v-model="name40" :disabled="disabled" placeholder="1/40 Name" />
      </div>
    </div>

    <label class="description">
      <span class="label">Description</span>
      <Input v-model="description" :disabled="disabled" placeholder="Description" />
    </label>

    <label class="artist">
      <span class="label">Artist</span>
      <input type="text" v-model="artist" :disabled="disabled" placeholder="Your artist name" />
    </label>

    <div class="">
      <label v-if="isAdmin" class="creator">
        <span class="label">Creator Address (Ethereum Public Key)</span>
        <Input v-model="creator" :disabled="disabled" :placeholder="data.creator" />
      </label>

      <span class="label">Co-Creators</span>
      <SortableList :items="coCreators" @update="coCreators = $event" class="co-creators">
        <template v-slot="{ item, index }">
          <input
            type="text"
            :value="item.address"
            @input="coCreators[index].address = $event.target.value"
            placeholder="0x000...000"
            :disabled="disabled"
          >
        </template>
      </SortableList>
    </div>

    <label class="type">
      <span class="label">Edition Type</span>
      <select v-model="type" class="input" :disabled="disabled">
        <option value="DYNAMIC">Dynamic</option>
        <option value="PRINT" default>Prints</option>
        <option value="NUMBERED_PRINT" disabled="disabled">Numbered Prints</option>
      </select>
    </label>

    <DyanamicImagesForm
      v-if="isDynamic && data.uuid"
      :set-submission-id="data.uuid"
      :dynamic-set-images="data.dynamicSetImages"
      :disabled="disabled"
      class="span-2"
    />

    <div class="actions">
      <small class="muted" v-if="lastSaved">Last saved {{ lastSavedAt }}</small>

      <DeleteSetSubmissionForm v-if="data.uuid && ! disabled" :submission="data" />

      <Button type="submit" :disabled="saving" v-if="! disabled">
        <Icon type="save" />
        <span v-if="saving">Saving...</span>
        <span v-else>Save</span>
      </Button>
      <Button v-else :to="`/sets/${data.uuid}`">View Submission</Button>

      <SignSet v-if="toSign" :data="data" @signed="markSigned" key="sign" />

      <PublishSetSubmissionForm v-if="! published && dataComplete" :submission="data" :save="store" key="publish" />
      <UnpublishSetSubmissionForm :submission="data" key="unpublish" @unpublished="$emit('updated', $event)" />
    </div>


    <section class="deep-dive span-2">
      <hr>

      <RichContentLinksForm
        :loaded-links="data.richContentLinks"
        :new-link-data="{ address: data.creator, set_submission_id: data.id }"
        title="Deep Dive Links"
      />
    </section>
  </form>
</template>

<script setup>
import { DateTime } from 'luxon'
import { useAccount, useEnsName } from '~/helpers/use-wagmi'
import { useSignIn, isAdmin } from '~/helpers/siwe'
import { formatTime } from '~/helpers/dates'
import pad from '~/helpers/pad'

const config = useRuntimeConfig()

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
})
const emit = defineEmits(['updated'])

const { session, signIn } = useSignIn()
const { address } = useAccount()
const ens = useEnsName(address)

const isCreator = computed(() => address.value?.toLowerCase() === props.data.creator)

const name = ref(props.data.name || '')
const image1 = ref(props.data.edition1Image || null)
const image4 = ref(props.data.edition4Image || null)
const image5 = ref(props.data.edition5Image || null)
const image10 = ref(props.data.edition10Image || null)
const image20 = ref(props.data.edition20Image || null)
const image40 = ref(props.data.edition40Image || null)
const name1 = ref(props.data.edition1Name || '')
const name4 = ref(props.data.edition4Name || '')
const name5 = ref(props.data.edition5Name || '')
const name10 = ref(props.data.edition10Name || '')
const name20 = ref(props.data.edition20Name || '')
const name40 = ref(props.data.edition40Name || '')
const description = ref(props.data.description || '')
const artist = ref(props.data.artist)
const creator = ref(props.data.creator)
const withEmptyCoCreators = list => {
  if (list.length === 5) return list

  if (! list.length || list[list.length - 1].address !== '') {
    list.push({ id: list.length, address: '' })
  }

  return list
}
const sortableCoCreators = list => {
  const array = Array.isArray(list)
    ? list.filter(address => !! address).map((address) => ({ id: address, address }))
    : [{ id: 0, address: '' }]

  return withEmptyCoCreators(array)
}
const coCreators = ref(sortableCoCreators([
  props.data.co_creator_1,
  props.data.co_creator_2,
  props.data.co_creator_3,
  props.data.co_creator_4,
  props.data.co_creator_5,
]))
watch(() => JSON.stringify(coCreators.value), () => coCreators.value = withEmptyCoCreators(coCreators.value))

const type = ref(props.data.edition_type || 'PRINT')
const isDynamic = computed(() => type.value !== 'PRINT')
const imagesComplete = computed(() => {
  const hasPreviewImages = image1.value &&
                           image4.value &&
                           image5.value &&
                           image10.value &&
                           image20.value &&
                           image40.value

  if (! isDynamic.value) return hasPreviewImages

  return hasPreviewImages && (
    props.data.dynamicSetImages?.image4_1 &&
    props.data.dynamicSetImages?.image4_2 &&
    props.data.dynamicSetImages?.image4_3 &&
    props.data.dynamicSetImages?.image4_4 &&
    props.data.dynamicSetImages?.image5_1 &&
    props.data.dynamicSetImages?.image5_2 &&
    props.data.dynamicSetImages?.image5_3 &&
    props.data.dynamicSetImages?.image5_4 &&
    props.data.dynamicSetImages?.image5_5 &&
    props.data.dynamicSetImages?.image10_1 &&
    props.data.dynamicSetImages?.image10_2 &&
    props.data.dynamicSetImages?.image10_3 &&
    props.data.dynamicSetImages?.image10_4 &&
    props.data.dynamicSetImages?.image10_5 &&
    props.data.dynamicSetImages?.image10_6 &&
    props.data.dynamicSetImages?.image10_7 &&
    props.data.dynamicSetImages?.image10_8 &&
    props.data.dynamicSetImages?.image10_9 &&
    props.data.dynamicSetImages?.image10_10 &&
    props.data.dynamicSetImages?.image20_1 &&
    props.data.dynamicSetImages?.image20_2 &&
    props.data.dynamicSetImages?.image20_3 &&
    props.data.dynamicSetImages?.image20_4 &&
    props.data.dynamicSetImages?.image20_5 &&
    props.data.dynamicSetImages?.image20_6 &&
    props.data.dynamicSetImages?.image20_7 &&
    props.data.dynamicSetImages?.image20_8 &&
    props.data.dynamicSetImages?.image20_9 &&
    props.data.dynamicSetImages?.image20_10 &&
    props.data.dynamicSetImages?.image20_11 &&
    props.data.dynamicSetImages?.image20_12 &&
    props.data.dynamicSetImages?.image20_13 &&
    props.data.dynamicSetImages?.image20_14 &&
    props.data.dynamicSetImages?.image20_15 &&
    props.data.dynamicSetImages?.image20_16 &&
    props.data.dynamicSetImages?.image20_17 &&
    props.data.dynamicSetImages?.image20_18 &&
    props.data.dynamicSetImages?.image20_19 &&
    props.data.dynamicSetImages?.image20_20 &&
    props.data.dynamicSetImages?.image40_1 &&
    props.data.dynamicSetImages?.image40_2 &&
    props.data.dynamicSetImages?.image40_3 &&
    props.data.dynamicSetImages?.image40_4 &&
    props.data.dynamicSetImages?.image40_5 &&
    props.data.dynamicSetImages?.image40_6 &&
    props.data.dynamicSetImages?.image40_7 &&
    props.data.dynamicSetImages?.image40_8 &&
    props.data.dynamicSetImages?.image40_9 &&
    props.data.dynamicSetImages?.image40_10 &&
    props.data.dynamicSetImages?.image40_11 &&
    props.data.dynamicSetImages?.image40_12 &&
    props.data.dynamicSetImages?.image40_13 &&
    props.data.dynamicSetImages?.image40_14 &&
    props.data.dynamicSetImages?.image40_15 &&
    props.data.dynamicSetImages?.image40_16 &&
    props.data.dynamicSetImages?.image40_17 &&
    props.data.dynamicSetImages?.image40_18 &&
    props.data.dynamicSetImages?.image40_19 &&
    props.data.dynamicSetImages?.image40_20 &&
    props.data.dynamicSetImages?.image40_21 &&
    props.data.dynamicSetImages?.image40_22 &&
    props.data.dynamicSetImages?.image40_23 &&
    props.data.dynamicSetImages?.image40_24 &&
    props.data.dynamicSetImages?.image40_25 &&
    props.data.dynamicSetImages?.image40_26 &&
    props.data.dynamicSetImages?.image40_27 &&
    props.data.dynamicSetImages?.image40_28 &&
    props.data.dynamicSetImages?.image40_29 &&
    props.data.dynamicSetImages?.image40_30 &&
    props.data.dynamicSetImages?.image40_31 &&
    props.data.dynamicSetImages?.image40_32 &&
    props.data.dynamicSetImages?.image40_33 &&
    props.data.dynamicSetImages?.image40_34 &&
    props.data.dynamicSetImages?.image40_35 &&
    props.data.dynamicSetImages?.image40_36 &&
    props.data.dynamicSetImages?.image40_37 &&
    props.data.dynamicSetImages?.image40_38 &&
    props.data.dynamicSetImages?.image40_39 &&
    props.data.dynamicSetImages?.image40_40
  )
})
const dataComplete = computed(() => {
  return name.value &&
    name1.value &&
    name4.value &&
    name5.value &&
    name10.value &&
    name20.value &&
    name40.value &&
    imagesComplete.value &&
    description.value &&
    artist.value &&
    type.value
})
const isSigned = ref(!!props.data.artist_signature)
const published = computed(() => !! props.data.published_at)
const isPublishedToSet = computed(() => !!props.data.set_id)
const toSign = computed(() =>
  isCreator.value &&
  !isSigned.value &&
  dataComplete.value
)
const disabled = computed(() => published.value && ! isAdmin.value)
const markSigned = (set) => {
  isSigned.value = !!set.artist_signature
  emit('updated', set)
}
watch(ens, () => {
  if (props.data.creator !== address.value.toLowerCase()) return

  artist.value = props.data.artist || ens.value || ''
})

const saving = ref(false)
const lastSaved = ref(null)
const lastSavedAt = computed(() => lastSaved.value ? formatTime(lastSaved.value) : '')
const store = async () => {
  if (! session.value) await signIn()
  if (! session.value) return

  saving.value = true

  const url = props.data?.uuid
    ? `${config.public.opepenApi}/set-submissions/${props.data.uuid}`
    : `${config.public.opepenApi}/set-submissions`

  const set = await $fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      name: name.value,
      description: description.value,
      artist: artist.value,
      edition_type: type.value,
      edition_1_image_id: image1.value?.uuid,
      edition_4_image_id: image4.value?.uuid,
      edition_5_image_id: image5.value?.uuid,
      edition_10_image_id: image10.value?.uuid,
      edition_20_image_id: image20.value?.uuid,
      edition_40_image_id: image40.value?.uuid,
      edition_1_name: name1.value,
      edition_4_name: name4.value,
      edition_5_name: name5.value,
      edition_10_name: name10.value,
      edition_20_name: name20.value,
      edition_40_name: name40.value,
      creator: creator.value,
      co_creator_1: coCreators.value[0]?.address || undefined,
      co_creator_2: coCreators.value[1]?.address || undefined,
      co_creator_3: coCreators.value[2]?.address || undefined,
      co_creator_4: coCreators.value[3]?.address || undefined,
      co_creator_5: coCreators.value[4]?.address || undefined,
    })
  })

  saving.value = false
  lastSaved.value = DateTime.now()

  emit('updated', set)

  if (! props.data?.uuid && set?.uuid) {
    await navigateTo(`/create/sets/${set.uuid}`)
  }
}
onMounted(() => {
  if (! props.data?.uuid) store()
})
</script>

<style scoped>
form {
  display: grid;
  gap: var(--size-7);
  margin: var(--size-7) auto;
  max-width: var(--content-width);

  @media (--xl) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .name,
    .description,
    .actions,
    .span-2 {
      grid-column: span 2;
    }
  }

  .deep-dive {
    display: grid;
    gap: var(--size-5);
  }

  .images {
    height: min-content;
    align-self: center;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--size-5);

    :first-child {
      grid-column: span 2;
      grid-row: span 2;
    }
  }

  .names {
    display: grid;
    gap: var(--size-4);
    padding: var(--size-3) var(--size-4) var(--size-4);
    background: var(--gray-z-1);
    border: var(--border-dark);
    border-radius: var(--size-5);
    border-top-left-radius: var(--size-1);

    > .label {
      margin: var(--size-1) 0 0;
    }

    > div {
      display: flex;
      height: var(--size-8);

      :deep(.image) {
        width: var(--size-8);
        height: var(--size-8);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      input {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }

  .creator {
    display: grid;
    margin-bottom: var(--size-4);
  }

  > .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--size-4);

    :deep(.button) {
      min-height: var(--size-8);
    }
  }
}
</style>

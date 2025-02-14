import { http } from 'viem'
import { DelegateV2, type V1Delegation, type V2Delegation } from '@delegatexyz/sdk'

const filterApplicable = (d: V1Delegation|V2Delegation) => d.type === 'ALL' || (
  ['CONTRACT', 'ERC721'].includes(d.type) &&
  d.contract?.toLowerCase() === `0x6339e5e072086621540d0362c4e3cea0d643e114`
)

export const useDelegation = async (address: Ref<`0x${string}`>) => {
  const config = useRuntimeConfig()
  const addresses: Ref<string[]> = ref([])
  const tokenIds: Ref<number[]> = ref([])

  // @ts-ignore
  const v2 = new DelegateV2(http(config.public.rpc))

  const update = async () => {
    if (! address.value) {
      console.debug(`Abort fetching delegation for null address`)
      return
    }

    const incoming = await v2.getIncomingDelegations(address.value)
    const outgoing = await v2.getOutgoingDelegations(address.value)

    const applicableV1 = incoming.filter(filterApplicable)
    const applicableV2 = outgoing.filter(filterApplicable)

    addresses.value = Array.from(new Set(
      applicableV1.map(d => d.from).concat(applicableV2.map(d => d.to))
                  .map(a => a.toLowerCase())
    ))

    tokenIds.value = Array.from(new Set(
      applicableV1.filter(d => d.type === 'ERC721').map(d => d.tokenId).concat(
        applicableV2.filter(d => d.type === 'ERC721').map(d => d.tokenId)
      )
    ))
  }

  await update()
  watch(address, () => update())

  return {
    addresses,
    tokenIds,
    update,
  }
}

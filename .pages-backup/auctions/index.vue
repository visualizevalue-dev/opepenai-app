<template>
  <div>
    <section>
      <SectionTitle>All Auctions</SectionTitle>

      <div v-for="auction in auctions" :auction="auction" :key="auction.id" class="auction">
        <img :src="auction.image" :alt="auction.title">

        <div class="text">
          <h1>{{ auction.title }}</h1>
          <p>{{ auction.description }}</p>
          <div class="bid">
            <p>Winning bid:</p>
            <AuctionBidListItem :bid="auction.highestBid" />
          </div>

          <footer>
            <Button :to="`/auctions/${auction.slug}`"><span>View Auction</span></Button>
          </footer>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useMetaData } from '~/helpers/head'

const config = useRuntimeConfig()
const { data: auctions } = await useFetch(config.public.opepenApi + '/auctions')

useMetaData({
  title: 'Opepen Auctions',
  // og: 'https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/sets.png',
})
</script>

<style scoped>
section {
  max-width: var(--content-width);
  margin: var(--size-8) auto var(--size-9);

  &:first-child {
    margin-top: var(--size-5);

    .set-preview:not(:last-child) {
      margin-bottom: var(--size-5);
    }
  }

  h1 {
    margin: var(--size-5) 0;
  }

  .progress {
    margin: var(--size-7) 0 var(--size-8);
  }

  .grid {
    display: grid;
    gap: var(--size-5);

    article {
      width: 100%;
    }

    @media (--md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (--lg) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}

.auction {
  display: flex;
  flex-direction: column;
  gap: var(--size-4);
  padding: var(--size-4);
  border: var(--border-dark);
  border-radius: var(--size-4);
  border-top-left-radius: var(--size-2);
  background: var(--gray-z-1);
  margin-bottom: var(--size-5);

  @media (--md) {
    flex-direction: row;
    padding-right: var(--size-8);

    img {
      max-width: 15rem;
    }
  }


  .text {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
    width: 100%;

    h1 {
      margin: 0;
    }

    p {
      color: var(--gray-z-6);
    }

    > .bid {
      display: grid;

      > p {
        color: var(--gray-z-6);
      }
    }

    footer {
      margin-top: auto;

      a {
        display: inline-block;
      }
    }
  }
}
</style>

<script>
  import * as R from 'ramda';
  import * as Maybe from '@Utility/maybe-utils';

  export let href;
  export let text = '';
  export let target = '_self';
  export let icon = Maybe.None();
</script>

<style type="text/postcss">
  a {
    @apply relative flex items-start text-link border-b-1 border-transparent;
  }

  a:hover {
    @apply cursor-pointer border-primary;
  }
</style>

<a {href} {target}>
  {#each Maybe.toArray(icon) as i}
    <span class="font-icon mr-1">{i}</span>
  {/each}
  {#if text}
    <span>{text}</span>
  {/if}
</a>

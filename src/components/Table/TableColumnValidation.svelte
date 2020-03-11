<script>
  import * as R from 'ramda';
  import * as Maybe from '@Utility/maybe-utils';

  export let value;
  export let transform = R.identity;
  export let validation = R.always(true);

  $: error = R.ifElse(
    R.compose(
      R.equals('String'),
      R.type
    ),
    R.compose(
      R.not,
      validation,
      transform
    ),
    R.always(true)
  )(value);
</script>

<style type="text/postcss">
  .error {
    @apply text-error font-bold;
  }
</style>

<div class:error>
  {#if value}{value}{:else}-{/if}
</div>

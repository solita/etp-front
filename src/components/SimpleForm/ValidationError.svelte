<script>
  import * as R from 'ramda';

  export let validationId;
  export let validationResults;

  $: errorMsg = R.prop(validationId, validationResults);
</script>

<style type="text/postcss">
  span {
      @apply block;
      color: red;
  }
</style>

{#if errorMsg}
  <span>{errorMsg}</span>
{/if}

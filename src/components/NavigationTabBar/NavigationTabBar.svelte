<script>
  import * as R from 'ramda';
  import NavigationTab from '@Component/NavigationTab/NavigationTab';
  import * as Navigation from '@Utility/navigation';

  export let idTranslate;
  export let location;
  export let whoami;
  export let i18n;
  export let config;

  $: links = Navigation.navigationParse(
    config.isDev,
    i18n,
    whoami,
    location,
    idTranslate
  );
</script>

<style type="text/postcss">
  div {
    @apply flex pb-4;
  }

  div:last-child::after {
    content: '';
    @apply flex-grow border-dark border-b-3;
  }
</style>

{#if !R.isEmpty(links)}
  <div>
    {#each links as link}
      <NavigationTab
        label={link.label}
        href={link.href}
        activePath={link.activePath}
        disabled={link.disabled} />
    {/each}
  </div>
{/if}

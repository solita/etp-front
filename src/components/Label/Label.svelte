<script>
  export let id;
  export let required;
  export let error;
  export let warning;
  export let focused;
  export let label = '';
  export let compact = false;

  export let unit;
</script>

<style type="text/postcss">
  label {
    @apply text-secondary;
  }

  label.required::before {
    @apply font-icon text-xs align-top mr-1;
    content: '*';
  }

  label.warning,
  label.warning::before {
    @apply text-dark;
  }

  label.error,
  label.error::before {
    @apply text-error;
  }

  label.focused,
  label.focused::before {
    @apply font-bold;
  }
</style>

<!-- purgecss: sr-only required error focused warning -->
<label
  for={id}
  class:sr-only={compact}
  class:required
  class:warning
  class:error
  class:focused>
  {label}
  <svelte:component this={unit} />
</label>

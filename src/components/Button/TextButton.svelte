<script>
  export let text = '';
  export let icon = '';
  export let type = 'submit';
</script>

<style type="text/postcss">
  button {
    @apply flex justify-center items-center text-primary border-b-1 border-transparent font-semibold;
  }

  button:hover {
    @apply border-primary;
  }

  button:active {
    @apply text-secondary;
  }

  button:focus {
    @apply outline-none;
  }
</style>

<button {type} on:click>
  <span class="font-icon mr-1">{icon}</span>
  {text}
</button>

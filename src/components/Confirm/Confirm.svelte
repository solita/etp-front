<script>
  import Button from '@Component/Button/Button';

  export let message;
  let hide = true;
  let resolve = () => {};
  let reject = () => {};

  const confirmAction = (action, ...params) => {
    hide = false;

    resolve = () => {
      hide = true;
      action(...params);
    };
    reject = () => {
      hide = true;
    };
  };
</script>

<style type="text/postcss">
  dialog {
    @apply fixed top-0 bottom-0 left-0 right-0 bg-light;
  }

  div {
    @apply flex justify-center items-center mt-8 opacity-75;
  }
</style>

<slot confirm={confirmAction} />

{#if !hide}
  <dialog open={!hide}>
    <p>{message}</p>
    <div>
      <Button on:click={resolve} style="primary" text="Hyväksy" />
      <Button on:click={reject} style="secondary" text="Peru" />
    </div>
  </dialog>
{/if}

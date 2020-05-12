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
    @apply fixed top-0 bottom-0 left-0 right-0 bg-light w-2/3 py-32 border-dark border-1 flex flex-col justify-center cursor-default;
  }

  .close {
    @apply absolute top-0 right-0 pt-4 pr-4 text-primary cursor-pointer;
  }

  .message {
    @apply text-primary text-center;
  }
  .buttons {
    @apply flex justify-center items-center mt-8;
  }
</style>

<slot confirm={confirmAction} />

{#if !hide}
  <dialog open={!hide} on:click|stopPropagation={() => {}}>

    <span class="material-icons close" on:click|stopPropagation={reject}>
      highlight_off
    </span>
    <p class="message">{message}</p>
    <div class="buttons">
      <div class="px-2">
        <Button on:click={resolve} style="primary" text="Hyväksy" />
      </div>
      <div class="px-2">
        <Button on:click={reject} style="secondary" text="Peru" />
      </div>
    </div>

  </dialog>
{/if}

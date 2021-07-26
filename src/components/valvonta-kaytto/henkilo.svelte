<script>
  export let params;
  $: console.log(params);
</script>

<div class="flex flex-col">
  <span>Kohde id: {params.id}</span>
  <span>Henkilo id: {params['henkilo-id']}</span>
</div>

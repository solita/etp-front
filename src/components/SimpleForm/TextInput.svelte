<script>
  import * as Maybe from '@Utility/maybe-utils';

  export let id;
  export let label;
  export let value = Maybe.None();

  const handleInput = e => {
    if(e.target.value === '') {
      value = Maybe.None();
    } else {
     value = Maybe.of(e.target.value);
    }
  }
</script>

<style type="text/postcss">
</style>

<div>
  <label for="{id}">{label + " - " + value}</label>
  <input type="text" id="{id}" value="{value.orSome('')}" on:input="{handleInput}" class="border-2 border-black" />
</div>

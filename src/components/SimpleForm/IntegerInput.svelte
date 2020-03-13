<script>
  import * as R from 'ramda';
  import * as Maybe from '@Utility/maybe-utils';
  import * as Either from '@Utility/either-utils';

  export let id;
  export let label;
  export let value = Either.of(Maybe.None());

  const handleInput = e => {
    const input = e.target.value;
    if(input === '') {
      value = Either.of(Maybe.None());
    } else {
      const parsedInt = parseInt(input);
      const roundTripped = parsedInt.toString();

      if(input === roundTripped) {
        value = Either.of(Maybe.of(parsedInt));
      } else {
        value = Either.Left(input);
      }
    }
  }

</script>

<style type="text/postcss">
</style>

<div>
  <label for="{id}">{label + " - " + value}</label>
  <input type="text"
         id="{id}"
         value="{value.cata(R.identity, right => right.orSome(''))}"
         on:input="{handleInput}" class="border-2 border-black" />
</div>

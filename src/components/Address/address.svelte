<script>
  import * as R from 'ramda';

  import { _, locale } from '@Language/i18n';

  import * as Locales from '@Language/locale-utils';
  import * as Postinumerot from '@Utility/postinumero';
  import * as Maybe from '@Utility/maybe-utils';

  export let jakeluosoite;
  export let postinumero = Maybe.None();
  export let postitoimipaikka = Maybe.None();
  export let postinumerot;

  $: formatPostinumero = Postinumerot.formatPostinumero(postinumerot, $locale);
</script>

<style type="text/postcss">
  address {
    @apply not-italic;
  }
</style>

<address>
  {jakeluosoite}
  <span class="whitespace-no-wrap">
    {Maybe.cata(
      () => formatPostinumero(Maybe.orSome('', postinumero)),
      postitoimipaikka =>
        Maybe.orSome('', postinumero) + ' ' + R.toUpper(postitoimipaikka),
      postitoimipaikka
    )}
  </span>
</address>

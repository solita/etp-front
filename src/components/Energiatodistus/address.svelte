<script>
  import * as R from 'ramda';

  import { _, locale } from '@Language/i18n';

  import * as Locales from '@Language/locale-utils';
  import * as Postinumerot from '@Utility/postinumero';
  import * as Maybe from '@Utility/maybe-utils';

  import Address from '@Component/Address/address';

  export let energiatodistus;
  export let postinumerot;

  $: katuosoitteet = [
    energiatodistus.perustiedot['katuosoite-fi'],
    energiatodistus.perustiedot['katuosoite-sv']
  ];

  $: katuosoitteetOrdered = Locales.isSV($locale)
    ? R.reverse(katuosoitteet)
    : katuosoitteet;
</script>

<Address
  jakeluosoite={Maybe.orSome(
    '',
    Maybe.orElse(katuosoitteetOrdered[1], katuosoitteetOrdered[0])
  )}
  postinumero={energiatodistus.perustiedot.postinumero}
  {postinumerot} />

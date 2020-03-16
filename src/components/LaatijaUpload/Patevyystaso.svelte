<script>
  import * as R from 'ramda';
  import { locale, _ } from '@Language/i18n';
  import * as Maybe from '@Utility/maybe-utils';
  import * as Either from '@Utility/either-utils';
  import * as Future from '@Utility/future-utils';
  import * as Fetch from '@Utility/fetch-utils';
  import { patevyystasoStore } from '@/stores';

  export let value;

  const patevyystasoFuture = R.compose(
    Future.coalesce(Either.Left, Either.Right),
    Fetch.responseAsJson,
    Future.encaseP(Fetch.getFetch(fetch))
  )('api/private/patevyydet/');

  $: Either.isRight($patevyystasoStore) ||
    Future.fork(
      patevyystasoStore.set,
      patevyystasoStore.set,
      patevyystasoFuture
    );

  $: patevyystaso = Either.foldRight(
    [],
    R.compose(
      R.prop(
        `label-${R.compose(
          R.head,
          R.split('-')
        )($locale)}`
      ),
      R.find(R.propEq('id', parseInt(value)))
    ),
    $patevyystasoStore
  );
</script>

{#if patevyystaso}{patevyystaso}{:else}-{/if}

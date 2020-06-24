<script>
  import { onMount } from 'svelte';
  import * as R from 'ramda';

  import Table from '@Component/Table/Table';
  import Input from '@Component/Input/Input';
  import Button from '@Component/Button/Button';
  import * as laatijaApi from '@Component/Laatija/laatija-api';
  import { locale, _ } from '@Language/i18n';
  import * as locales from '@Language/locale-utils';
  import * as LaatijaUtils from './laatija-utils';

  import * as Future from '@Utility/future-utils';

  import { flashMessageStore } from '@/stores';

  let model = { search: '', laatijat: [], searchLaatijat: [] };

  const fields = [
    { id: 'laatija', title: $_('laatija.laatija') },
    { id: 'puhelin', title: $_('kayttaja.puhelinnumero') },
    {
      id: 'patevyystaso',
      title: $_('laatija.patevyystaso')
    },
    {
      id: 'toteamispaivamaara',
      title: $_('laatija.patevyydenvoimassaolo'),
      format: LaatijaUtils.formatVoimassaoloaika
    },
    { id: 'toimintaalue', title: $_('laatija.paatoimintaalue') },
    { id: 'postinumero', title: $_('laatija.postinumero') },
    { id: 'yritys', title: $_('yritys.yritykset'), format: R.join(', ') }
  ];

  const serializePatevyys = R.curry((patevyydet, patevyystaso) =>
    R.compose(
      locales.label($locale),
      R.find(R.propEq('id', patevyystaso))
    )(patevyydet)
  );

  const findYritysById = R.curry((yritykset, id) =>
    R.find(R.propEq('id', id), yritykset)
  );

  const serializeYritys = R.curry((yritykset, idt) =>
    R.compose(
      R.map(R.prop('nimi')),
      R.map(findYritysById(yritykset))
    )(idt)
  );

  const serializeLaatija = R.curry((patevyydet, yritykset) =>
    R.compose(
      R.map(laatija => {
        return R.compose(
          R.pick(R.append('id', R.map(R.prop('id'), fields))),
          R.assoc(
            'patevyystaso',
            serializePatevyys(patevyydet, laatija.patevyystaso)
          ),
          R.assoc('yritys', serializeYritys(yritykset, laatija.yritys)),
          R.assoc('laatija', `${laatija.etunimi} ${laatija.sukunimi}`)
        )(laatija);
      })
    )
  );

  const getLaatijat = () =>
    R.compose(
      Future.fork(
        R.compose(
          flashMessageStore.add('Laatija', 'error'),
          R.always($_('errors.load-error'))
        ),
        R.compose(([result, yritykset, patevyydet]) => {
          model = R.assoc(
            'laatijat',
            serializeLaatija(patevyydet, yritykset)(result),
            model
          );
        })
      ),
      Future.parallel(5),
      R.append(laatijaApi.patevyydet),
      R.juxt([laatijaApi.getLaatijat, laatijaApi.getAllYritykset])
    )(fetch);

  onMount(getLaatijat);

  const findLaatija = R.curry(search =>
    R.cond([
      [
        R.compose(
          R.contains(search),
          R.toLower,
          R.propOr('', 'laatija')
        ),
        R.always(true)
      ],
      [
        R.compose(
          R.contains(search),
          R.toLower,
          R.propOr('', 'puhelin')
        ),
        R.always(true)
      ],
      [
        R.compose(
          R.complement(R.isEmpty),
          R.filter(
            R.compose(
              R.contains(search),
              R.toLower
            )
          ),
          R.propOr([], 'yritys')
        ),
        R.always(true)
      ],
      [R.T, R.always(false)]
    ])
  );
  const findLaatijat = R.curry((laatijat, search) =>
    R.compose(R.filter(findLaatija(R.toLower(search))))(laatijat)
  );

  $: results = findLaatijat(model.laatijat, model.search);
  $: hasReusults = R.complement(R.isEmpty)(results);
</script>

<style>

</style>

<div>
  <Input
    id={'search'}
    name={'search'}
    bind:model
    lens={R.lensProp('search')}
    required={false}
    disabled={false}
    search={true}
    i18n={$_} />
</div>

{#if hasReusults}
  <div class="w-full overflow-x-auto mt-4">
    <Table {fields} tablecontents={results} />
  </div>
{/if}

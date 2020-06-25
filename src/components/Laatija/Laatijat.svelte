<script>
  import { onMount } from 'svelte';
  import { push, location, querystring } from 'svelte-spa-router';
  import * as R from 'ramda';
  import * as qs from 'qs';

  import Table from '@Component/Table/Table';
  import Input from '@Component/Input/Input';
  import Button from '@Component/Button/Button';
  import * as laatijaApi from '@Component/Laatija/laatija-api';
  import * as geoApi from '@Component/Geo/geo-api';
  import { locale, _ } from '@Language/i18n';
  import * as locales from '@Language/locale-utils';
  import * as LaatijaUtils from './laatija-utils';

  import * as Future from '@Utility/future-utils';

  import { flashMessageStore } from '@/stores';

  let model = R.pick(['search'], qs.parse($querystring));
  let laatijat = [];

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
    {
      id: 'yritys',
      type: 'action-with-template',
      title: $_('yritys.yritykset'),
      actionTemplate: ({ id, nimi }) => ({
        type: 'link',
        href: `#/yritys/${id}`,
        text: `${nimi}`
      })
    }
  ];

  const formatLocale = R.curry((patevyydet, patevyystaso) =>
    R.compose(
      locales.label($locale),
      R.find(R.propEq('id', patevyystaso))
    )(patevyydet)
  );

  const findYritysById = R.curry((yritykset, id) =>
    R.find(R.propEq('id', id), yritykset)
  );

  const formatYritys = R.curry((yritykset, idt) =>
    R.compose(
      R.map(R.pick(['id', 'nimi'])),
      R.map(findYritysById(yritykset))
    )(idt)
  );

  const formatLaatija = R.curry((patevyydet, yritykset, toimintaalueet) =>
    R.compose(
      R.map(laatija => {
        return R.compose(
          R.pick(R.append('id', R.map(R.prop('id'), fields))),
          R.assoc(
            'patevyystaso',
            formatLocale(patevyydet, laatija.patevyystaso)
          ),
          R.assoc(
            'toimintaalue',
            formatLocale(toimintaalueet, laatija.toimintaalue)
          ),
          R.assoc('yritys', formatYritys(yritykset, laatija.yritys)),
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
        R.compose(([result, yritykset, patevyydet, toimintaalueet]) => {
          // Maybe?
          laatijat = formatLaatija(patevyydet, yritykset, toimintaalueet)(
            result
          );
        })
      ),
      Future.parallel(5),
      R.append(geoApi.toimintaalueet),
      R.append(laatijaApi.patevyydet),
      R.juxt([laatijaApi.getLaatijat, laatijaApi.getAllYritykset])
    )(fetch);

  onMount(_ => {
    getLaatijat();
  });

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
          R.map(R.prop('nimi')),
          R.propOr([], 'yritys')
        ),
        R.always(true)
      ],
      [R.T, R.always(false)]
    ])
  );
  const findLaatijat = R.curry((laatijat, search) =>
    R.filter(findLaatija(R.toLower(search)), laatijat)
  );

  const onRowClick = ({ id }) => push(`#/kayttaja/${id}`);

  $: results = findLaatijat(laatijat, model.search);
  $: hasReusults = R.complement(R.isEmpty)(results);

  let pageNum = 1;
  let pageCount = 10;
  let laatijatPerPage = 1;

  /*
  $: R.when(
    R.complement(R.equals(R.eqProps('search', model, qs.parse($querystring)))),
    push(`${$location}?${qs.stringify(model)}`)
  );
  */
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
  <div>Tuloksia {R.length(results)}</div>
  <div class="w-full overflow-x-auto mt-4">
    <Table
      {fields}
      tablecontents={results}
      {onRowClick}
      {pageNum}
      {pageCount} />
  </div>
{/if}

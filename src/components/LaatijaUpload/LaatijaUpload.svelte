<script>
  import * as R from 'ramda';

  import * as Fetch from '@Utility/fetch-utils';
  import * as Future from '@Utility/future-utils';

  import { locale, _ } from '@Language/i18n';

  import Fileupload from '@Component/Fileupload/Fileupload';
  import Table from '@Component/Table/Table';
  import Button from '@Component/Button/Button';
  import {
    parse,
    validate,
    readData,
    dataValid,
    postLaatijatFuture
  } from './laatija-utils';
  import Patevuustaso from './Patevyystaso';
  import Date from './Date';

  let laatijaData;
  let update = data => {
    let files = R.compose(data)({});
    const reader = new FileReader();
    reader.onload = e => {
      laatijaData = e.target.result;
    };

    reader.readAsText(files.files[0], 'UTF-8');
  };

  export const fields = [
    { id: 'etunimi', title: 'Etunimi' },
    { id: 'sukunimi', title: 'Sukunimi' },
    { id: 'henkilotunnus', title: 'Henkilötunnus' },
    { id: 'jakeluosoite', title: 'Jakeluosoite' },
    { id: 'postinumero', title: 'Postinumero' },
    { id: 'postitoimipaikka', title: 'Postitoimipaikka' },
    { id: 'email', title: 'Email' },
    { id: 'puhelin', title: 'Puhelin' },
    { id: 'patevyystaso', title: 'Pätevyystaso', component: Patevuustaso },
    { id: 'toteamispaivamaara', title: 'Toteamispäivämäärä', component: Date },
    { id: 'toteaja', title: 'Toteaja' }
  ];

  const submit = R.compose(
    Future.fork(console.error, ({ id }) => replace(`/laatijat/`)),
    postLaatijatFuture(fetch)
  );

  $: tablecontents = readData(laatijaData);
  $: valid = dataValid(tablecontents);
  $: readError = R.and(laatijaData, R.isEmpty(tablecontents));
  $: readOk = R.and(laatijaData, R.complement(R.isEmpty)(tablecontents));
  $: console.log(`read error ${readError}`);
</script>

<style type="text/postcss">

</style>

<Fileupload {update} />
{#if readOk}
  <div class="w-full overflow-x-auto mt-4">
    <Table {fields} {validate} {tablecontents} />
  </div>
  <div class="flex -mx-4 pt-8">
    <div class="px-4">
      <Button
        disabled={!valid}
        type={'submit'}
        text={$_('tallenna')}
        on:click={event => {
          event.preventDefault();
          submit(tablecontents);
        }} />
    </div>
    <div class="px-4">
      <Button
        style={'secondary'}
        text={$_('peruuta')}
        on:click={event => {
          event.preventDefault();
          laatijaData = undefined;
        }} />
    </div>
  </div>
{/if}

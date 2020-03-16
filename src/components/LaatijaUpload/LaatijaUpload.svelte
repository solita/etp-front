<script>
  import * as R from 'ramda';

  import { locale, _ } from '@Language/i18n';

  import Fileupload from '@Component/Fileupload/Fileupload';
  import Table from '@Component/Table/Table';
  import Button from '@Component/Button/Button';
  import { parse, validate, readData, dataValid } from './laatija-utils';
  import Patevuustaso from './Patevyystaso';

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
    { id: 'toteamispaivamaara', title: 'Toteamispäivämäärä' },
    { id: 'toteaja', title: 'Toteaja' }
  ];

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
  <Table {fields} {parse} {validate} {tablecontents} />
  <Button disabled={!valid} type={'submit'} text={$_('tallenna')} />
{/if}

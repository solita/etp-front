<script>
  import * as R from 'ramda';
  import TextInput from './TextInput';
  import IntegerInput from './IntegerInput'
  import ValidationError from './ValidationError'
  import * as Validations from './validations.js'

  let model = {};

  const textAndNumberMustMatch = f => {
    return model => {
      const value = f(model);

      if(value !== undefined &&
         value.text !== undefined &&
         value.number !== undefined) {
        return value.number.foldLeft(false)((acc, v) => v.equals(value.text.map(parseInt)));
     } else {
       return false;
     }
   }
 }

  const validations = [
    {
      id: 'text',
      f: Validations.required(R.prop('text')),
      label: 'Kenttä on pakollinen'
    },
    {
      id: 'number',
      f: Validations.numberBetween(R.prop('number'), 1000, 2000),
      label: 'Kentän täytyy sisältää kokonaisluku väliltä 1000 - 2000'
    },
    {
      id: 'textAndNumber',
      f: textAndNumberMustMatch(R.identity),
      label: 'Tekstin ja numeron pitää olla samat'
    }
  ];

  $: validationResults = Validations.runValidations(model, validations);

  const handleSubmit = e => console.log('Submitting: ' + JSON.stringify(model) + ', validationResults: ' + JSON.stringify(validationResults));
</script>

<style type="text/postcss">
</style>

<form on:submit|preventDefault="{handleSubmit}">
  <TextInput bind:value={model.text} id="text" label="Some text" />
  <ValidationError validationId="text" validationResults={validationResults} />
  <IntegerInput bind:value={model.number} id="text" label="Some number" />
  <ValidationError validationId="number" validationResults={validationResults} />
  <ValidationError validationId="textAndNumber" validationResults={validationResults} />
  <input type="submit">
</form>

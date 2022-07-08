<script>
  import * as R from 'ramda';
  import * as Maybe from '@Utility/maybe-utils';
  import { _, locale } from '@Language/i18n';

  import Select from '@Component/Select/Select';
  import Select2 from '@Component/Select/select2';

  const i18n = $_;

  const items = ["One", "Two", "Three"];

  let model = Maybe.None();

  const items2 = R.concat([Maybe.None()], R.map(Maybe.Some, ["One", "Two", "Three"]));
  let model2 = Maybe.Some("One");

  const format2 = Maybe.getOrElse(i18n('validation.no-selection'));

</script>

<h1>Hello</h1>
<p>This page simply has some select boxes</p>

<p>The boxes allow selecting the content for this passage: <span>{model}</span></p>

<p>And this: <span>{Maybe.getOrElse("(no selection)", model2)}</span></p>


<h2>Select</h2>
<div>
<Select
  label={"Number"}
  bind:model={model}
  {items}
  allowNone={true}
  compact={false}
  />

<Select
  label={"Number"}
  bind:model={model}
  {items}
  allowNone={true}
  compact={true}
  />

</div>

<h2>Select2</h2>

<Select2
  label={"Number"}
  bind:model={model2}
  items={items2}
  format={format2}
  />


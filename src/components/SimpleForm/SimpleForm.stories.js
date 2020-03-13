import SimpleForm from './SimpleForm';
import ValidationError from './ValidationError';
import TextInput from './TextInput';
import IntegerInput from './IntegerInput';

export default { title: 'SimpleForm' };

export const textInput = () => ({
  Component: TextInput,
  props: {
    id: 'test-id',
    label: "Some text",
  }
});

export const integerInput = () => ({
  Component: IntegerInput,
  props: {
    id: 'test-id',
    label: "Some integer",
  }
});

export const validationError = () => ({
  Component: ValidationError,
  props: {
    validationId: 'test',
    validationResults: {
      test: 'This is an error for test',
      nonexisting: 'This error is not visible'
    }
  }
});

export const withDefault = () => ({
  Component: SimpleForm
});

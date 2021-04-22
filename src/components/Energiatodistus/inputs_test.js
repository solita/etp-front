import { assert } from 'chai';
import * as R from 'ramda';

import * as Inputs from './inputs';

describe('Inputs:', () => {
  describe('aggregateLabelContext', () => {
    it('should return aggergated label-contexts', () => {
      const i18n = path =>
        R.path(R.split('.', path), {
          energiatodistus: {
            first: {
              'label-context': '$unused',
              second: {
                'label-context': 'Second label context',
                third: {
                  'label-context': 'Third label context'
                }
              }
            }
          }
        });

      const expected = ['Second label context', 'Third label context'];

      assert.deepEqual(
        Inputs.aggregateLabelContext(i18n, 'first.second.third.fourth'),
        expected
      );
    });
  });

  describe('aggregateLabel', () => {
    it('should return aggregated label', () => {
      const i18n = path =>
        R.path(R.split('.', path), {
          energiatodistus: {
            first: {
              'label-context': '$unused',
              second: {
                'label-context': 'Second label context',
                third: {
                  'label-context': 'Third label context',
                  fourth: 'Fourth'
                }
              }
            }
          }
        });

      const expected =
        'Second label context / Third label context / Fourth / fi';

      assert.deepEqual(
        Inputs.aggregateLabel(i18n, 'first.second.third.fourth-fi'),
        expected
      );
    });
  });
});

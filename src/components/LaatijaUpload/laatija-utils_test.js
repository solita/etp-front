import { assert } from 'chai';

import { readData, dataValid } from './laatija-utils';

describe('Laatija utils', () => {
  describe('valid data', () => {
    it('a row', () => {
      const data = `FISE;Tarja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019`;

      assert.equal(dataValid(readData(data)), true);
    });

    it('more than one row', () => {
      const data = `FISE;Tarja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019
  FISE;Arja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019
  FISE;Sari Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019`;

      assert.equal(dataValid(readData(data)), true);
    });

    it('a row with a whitespace', () => {
      const data = `FISE;Tarja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019
       `;

      assert.equal(dataValid(readData(data)), true);
    });
  });
  describe('invalid data', () => {
    it('a row with an invalid postinumero', () => {
      const data = `FISE;Tarja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150a;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019`;

      assert.equal(dataValid(readData(data)), false);
    });

    it('more than one row with invalid postinumero', () => {
      const data = `FISE;Tarja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019
  FISE;Arja Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150a;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019
  FISE;Sari Helena;Specimen-Pirex;061154-922D;Kirsinkatu;15150;Lahti;arja.pirex@ara.fi;0400123456;2;21.3.2019`;

      assert.equal(dataValid(readData(data)), false);
    });

    it('empty data', () => {
      const data = '';

      assert.equal(dataValid(readData(data)), false);
    });

    it('null data', () => {
      const data = null;

      assert.equal(dataValid(readData(data)), false);
    });

    it('invalid row', () => {
      const data = 'FISE;Tarja Helena;Specimen-Pirex';

      assert.equal(dataValid(readData(data)), false);
    });

    it('invalid data', () => {
      const data = 'datadatadata';

      assert.equal(dataValid(readData(data)), false);
    });
  });
});

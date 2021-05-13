import { assert } from 'chai';
import fsm from './index.js';

describe('the module', () => {
  it('exports a function', () => {
    assert.isFunction(fsm);
  });
});

import { assert } from 'chai';
import svelteFsm from './index.js';

describe('a simple state machine', () => {
  let simpleMachine;

  beforeEach(() => {
    simpleMachine = svelteFsm('off');
  });

  it('provides a subscribe function', () => {
    assert.isFunction(simpleMachine.subscribe);
  });

  describe('subscribe function', () => {
    it('accepts a callback function', () => {
      assert.doesNotThrow(() => {
        simpleMachine.subscribe(console.log);
      });
    });

    it('throws TypeError if no callback provided', () => {
      assert.throws(() => {
        simpleMachine.subscribe();
      }, TypeError);
    });

    it('throws TypeError if callback is not a function', () => {
      assert.throws(() => {
        simpleMachine.subscribe('please call me back');
      }, TypeError);
    });
  });

});

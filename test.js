import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a simple state machine', () => {
  let simpleMachine;

  beforeEach(() => {
    simpleMachine = svelteFsm('off', {
      off: {
        toggle: 'on',
        surge: 'blown'
      },
      on: {
        toggle: 'off'
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('provides a subscribe function', () => {
    assert.isFunction(simpleMachine.subscribe);
  });

  it('provides a handle function', () => {
    assert.isFunction(simpleMachine.handle);
  });

  describe('subscribe function', () => {
    it('accepts a callback function', () => {
      assert.doesNotThrow(() => {
        simpleMachine.subscribe(sinon.fake());
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

    it('returns unsubscribe function', () => {
      assert.isFunction(simpleMachine.subscribe(sinon.fake()));
    });
  });

  describe('subscribed callback', () => {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.spy();
      unsubscribe = simpleMachine.subscribe(callback);
    });

    it('should be invoked with new state on state change', () => {
      simpleMachine.handle('toggle');
      assert.isTrue(callback.calledOnce);
      assert.equal('on', callback.firstCall.args[0]);
    });

    it('should not be invoked when no matching event', () => {
      simpleMachine.handle('noop');
      assert.isTrue(callback.notCalled);
    });

    it('should not throw error when no matching state node', () => {
      simpleMachine.handle('surge');
      assert.equal('blown', callback.firstCall.args[0]);
      assert.doesNotThrow(() => simpleMachine.handle('toggle'));
    });

    it('should not be invoked once unsubscribed', () => {
      unsubscribe();
      simpleMachine.handle('toggle');
      assert.isTrue(callback.notCalled);
    });
  });
});

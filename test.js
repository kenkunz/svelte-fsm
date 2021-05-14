import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a simple state machine', () => {
  let simpleMachine;
  let kick;

  beforeEach(() => {
    kick = sinon.spy();

    simpleMachine = svelteFsm('off', {
      off: {
        toggle: 'on',
        surge: 'blown',
        kick
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

  describe('with a subscribed callback', () => {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.spy();
      unsubscribe = simpleMachine.subscribe(callback);
    });

    it('should transition to static value registered to event', () => {
      simpleMachine.handle('toggle');
      assert.isTrue(callback.calledOnce);
      assert.equal('on', callback.firstCall.args[0]);
    });

    it('should silently handle unregistered event', () => {
      simpleMachine.handle('noop');
      assert.isTrue(callback.notCalled);
    });

    it('should invoke a function registered to event', () => {
      simpleMachine.handle('kick');
      assert.isTrue(kick.calledOnce);
    });

    it('should not throw error when no matching state node', () => {
      simpleMachine.handle('surge');
      assert.equal('blown', callback.firstCall.args[0]);
      assert.doesNotThrow(() => simpleMachine.handle('toggle'));
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      simpleMachine.handle('toggle');
      assert.isTrue(callback.notCalled);
    });
  });
});

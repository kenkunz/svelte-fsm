import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a finite state machine', () => {
  let fsm;
  let kick;

  beforeEach(() => {
    kick = sinon.spy();

    fsm = svelteFsm('off', {
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
    assert.isFunction(fsm.subscribe);
  });

  it('provides a handle function', () => {
    assert.isFunction(fsm.handle);
  });

  describe('subscribe function', () => {
    it('accepts a callback function', () => {
      assert.doesNotThrow(() => {
        fsm.subscribe(sinon.fake());
      });
    });

    it('throws TypeError if no callback provided', () => {
      assert.throws(() => {
        fsm.subscribe();
      }, TypeError);
    });

    it('throws TypeError if callback is not a function', () => {
      assert.throws(() => {
        fsm.subscribe('please call me back');
      }, TypeError);
    });

    it('returns unsubscribe function', () => {
      assert.isFunction(fsm.subscribe(sinon.fake()));
    });
  });

  describe('with a subscribed callback', () => {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.spy();
      unsubscribe = fsm.subscribe(callback);
    });

    it('should transition to static value registered to event', () => {
      fsm.handle('toggle');
      assert.isTrue(callback.calledOnce);
      assert.equal('on', callback.firstCall.args[0]);
    });

    it('should silently handle unregistered event', () => {
      fsm.handle('noop');
      assert.isTrue(callback.notCalled);
    });

    it('should invoke a function registered to event', () => {
      fsm.handle('kick');
      assert.isTrue(kick.calledOnce);
    });

    it('should not throw error when no matching state node', () => {
      fsm.handle('surge');
      assert.equal('blown', callback.firstCall.args[0]);
      assert.doesNotThrow(() => fsm.handle('toggle'));
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      fsm.handle('toggle');
      assert.isTrue(callback.notCalled);
    });
  });
});

import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a finite state machine', () => {
  let fsm;
  let kick;

  beforeEach(() => {
    kick = sinon.stub();

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

  it('should provide a subscribe function', () => {
    assert.isFunction(fsm.subscribe);
  });

  it('should provide a handle function', () => {
    assert.isFunction(fsm.handle);
  });

  describe('subscribe function', () => {
    it('should accept a callback function', () => {
      assert.doesNotThrow(() => {
        fsm.subscribe(sinon.fake());
      });
    });

    it('should throw TypeError if no callback provided', () => {
      assert.throws(() => {
        fsm.subscribe();
      }, TypeError);
    });

    it('should throw TypeError if callback is not a function', () => {
      assert.throws(() => {
        fsm.subscribe('please call me back');
      }, TypeError);
    });

    it('should return unsubscribe function', () => {
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

    afterEach(() => {
      unsubscribe();
    });

    it('should invoke callback on initial subscribe', () => {
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to static value registered to event', () => {
      fsm.handle('toggle');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should silently handle unregistered event', () => {
      fsm.handle('noop');
      assert.isTrue(callback.calledOnce);
    });

    it('should invoke event handler function', () => {
      fsm.handle('kick');
      assert.isTrue(kick.calledOnce);
    });

    it('should not transition if nothing returned from event handler', () => {
      fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to event handler return value', () => {
      kick.returns('on');
      fsm.handle('kick');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should pass through args to event handler', () => {
      kick.withArgs('hard').returns('on');

      fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);

      fsm.handle('kick', 'hard');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should not notify subscribers when state unchanged', () => {
      kick.returns('off');
      fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
    });

    it('should not throw error when no matching state node', () => {
      fsm.handle('surge');
      assert.equal('blown', callback.secondCall.args[0]);
      assert.doesNotThrow(() => fsm.handle('toggle'));
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      fsm.handle('toggle');
      assert.isTrue(callback.calledOnce);
    });
  });
});

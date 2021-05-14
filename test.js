import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a finite state machine', () => {
  let fsm, kick, sequenceSpy;

  beforeEach(() => {
    kick = sinon.stub();
    sequenceSpy = sinon.spy();

    fsm = svelteFsm('off', {
      off: {
        toggle: 'on',
        surge: 'blown',
        kick,
        async toggleEventually() { return 'on'; },
        _exit() { sequenceSpy('off:_exit'); }
      },
      on: {
        toggle: 'off',
        _enter() { sequenceSpy('on:_enter'); },
        async _exit() {
          return new Promise(resolve => {
            setTimeout(() => {
              sequenceSpy('on:_exit');
              resolve();
            });
          });
        }
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
      callback = sinon.stub();
      unsubscribe = fsm.subscribe(callback);
    });

    afterEach(() => {
      unsubscribe();
    });

    it('should invoke callback on initial subscribe', () => {
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to static value registered to event', async () => {
      await fsm.handle('toggle');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should silently handle unregistered event', async () => {
      await fsm.handle('noop');
      assert.isTrue(callback.calledOnce);
    });

    it('should invoke event handler function', async () => {
      await fsm.handle('kick');
      assert.isTrue(kick.calledOnce);
    });

    it('should not transition if nothing returned from event handler', async () => {
      await fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to event handler return value', async () => {
      kick.returns('on');
      await fsm.handle('kick');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should support async event handlers', async () => {
      await fsm.handle('toggleEventually');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should pass through args to event handler', async () => {
      kick.withArgs('hard').returns('on');

      await fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);

      await fsm.handle('kick', 'hard');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should not notify subscribers when state unchanged', async () => {
      kick.returns('off');
      await fsm.handle('kick');
      assert.isTrue(callback.calledOnce);
    });

    it('should call _exit and _enter handlers in proper sequence', async () => {
      callback.callsFake(sequenceSpy);
      await fsm.handle('toggle');
      assert.isTrue(sequenceSpy.calledThrice);
      assert.equal('off:_exit', sequenceSpy.firstCall.args[0]);
      assert.equal('on', sequenceSpy.secondCall.args[0]);
      assert.equal('on:_enter', sequenceSpy.thirdCall.args[0]);
    });

    it('should support async _exit and _enter handlers', async () => {
      callback.callsFake(sequenceSpy);
      await fsm.handle('toggle'); // toggle off
      await fsm.handle('toggle'); // toggle on
      assert.equal(5, sequenceSpy.callCount);
      assert.equal('on:_exit', sequenceSpy.getCall(3).args[0]);
      assert.equal('off', sequenceSpy.getCall(4).args[0]);
    });

    it('should not throw error when no matching state node', async () => {
      await fsm.handle('surge');
      assert.isTrue(callback.calledTwice);
      assert.equal('blown', callback.secondCall.args[0]);
      assert.doesNotThrow(() => fsm.handle('toggle'));
    });

    it('should stop notifying after unsubscribe', async () => {
      unsubscribe();
      await fsm.handle('toggle');
      assert.isTrue(callback.calledOnce);
    });
  });
});

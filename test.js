import { assert } from 'chai';
import sinon from 'sinon';
import svelteFsm from './index.js';

describe('a finite state machine', () => {
  let fsm, kickHandler, subscribeHandler, sequenceSpy;

  beforeEach(() => {
    kickHandler = sinon.stub();
    subscribeHandler = sinon.stub();
    sequenceSpy = sinon.stub();

    fsm = svelteFsm('off', {
      off: {
        _init() {
          sequenceSpy('off:_init');
        },
        toggle: 'on',
        surge: 'blown',
        kick: kickHandler,
        subscribe: subscribeHandler,
        _exit() {
          sequenceSpy('off:_exit');
        }
      },
      on: {
        _enter() {
          sequenceSpy('on:_enter');
        },
        toggle: 'off'
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('subscribe function', () => {
    it('should accept single argument callback function', () => {
      assert.doesNotThrow(() => {
        fsm.subscribe(sinon.fake());
      });
    });

    it('should return unsubscribe function when invoked with callback', () => {
      assert.isFunction(fsm.subscribe(sinon.fake()));
    });

    it('should call subscribe handler when invoked with no args', () => {
      fsm.subscribe();
      assert.isTrue(subscribeHandler.calledOnce);
      assert.isEmpty(subscribeHandler.firstCall.args);
    });

    it('should call subscribe handler when invoked with single non-function arg', () => {
      fsm.subscribe('not a function');
      assert.isTrue(subscribeHandler.calledOnce);
      assert.lengthOf(subscribeHandler.firstCall.args, 1);
      assert.equal('not a function', subscribeHandler.firstCall.args[0]);
    });

    it('should call subscribe handler when invoked with multiple args', () => {
      const fn = sinon.fake()
      fsm.subscribe(fn, null);
      assert.isTrue(subscribeHandler.calledOnce);
      assert.lengthOf(subscribeHandler.firstCall.args, 2);
      assert.equal(fn, subscribeHandler.firstCall.args[0]);
      assert.isNull(subscribeHandler.firstCall.args[1]);
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

    describe('invoking an event method', function() {
      it('should transition to static value registered to event', async () => {
        await fsm.toggle();
        assert.isTrue(callback.calledTwice);
        assert.equal('on', callback.secondCall.args[0]);
      });

      it('should silently handle unregistered event', async () => {
        await fsm.noop();
        assert.isTrue(callback.calledOnce);
      });

      it('should invoke event handler function', async () => {
        await fsm.kick();
        assert.isTrue(kickHandler.calledOnce);
      });

      it('should not transition if nothing returned from event handler', async () => {
        await fsm.kick();
        assert.isTrue(callback.calledOnce);
        assert.equal('off', callback.firstCall.args[0]);
      });

      it('should transition to event handler return value', async () => {
        kickHandler.returns('on');
        await fsm.kick();
        assert.isTrue(callback.calledTwice);
        assert.equal('on', callback.secondCall.args[0]);
      });

      it('should pass through args to event handler', async () => {
        kickHandler.withArgs('hard').returns('on');

        await fsm.kick();
        assert.isTrue(callback.calledOnce);
        assert.equal('off', callback.firstCall.args[0]);

        await fsm.kick('hard');
        assert.isTrue(callback.calledTwice);
        assert.equal('on', callback.secondCall.args[0]);
      });

      it('should not notify subscribers when state unchanged', async () => {
        kickHandler.returns('off');
        await fsm.kick();
        assert.isTrue(callback.calledOnce);
      });

      it('should call lifecycle handlers in proper sequence', async () => {
        callback.callsFake(sequenceSpy);
        await fsm.toggle();
        assert.equal(4, sequenceSpy.callCount);
        assert.equal('off:_init', sequenceSpy.firstCall.args[0]);
        assert.equal('off:_exit', sequenceSpy.secondCall.args[0]);
        assert.equal('on', sequenceSpy.thirdCall.args[0]);
        assert.equal('on:_enter', sequenceSpy.getCall(3).args[0]);
      });

      it('should not throw error when no matching state node', async () => {
        await fsm.surge();
        assert.isTrue(callback.calledTwice);
        assert.equal('blown', callback.secondCall.args[0]);
        assert.doesNotThrow(() => fsm.toggle());
      });

      it('should stop notifying after unsubscribe', async () => {
        unsubscribe();
        await fsm.toggle();
        assert.isTrue(callback.calledOnce);
      });  
    });

    describe('event hadnlers’ debounce property', () => {
      it('should be a function', () => {
        assert.isFunction(fsm.someEvent.debounce);
      });

      it('should return a function', async () => {
        assert.isFunction(fsm.someEvent.debounce());
      });

      describe('invoking returned debounce function', () => {
        let clock;

        beforeEach(() => {
          clock = sinon.useFakeTimers();
        });

        afterEach(() => {
          clock.restore();
        });

        it('should invoke event after specified wait time', async () => {
          const debouncedKick = fsm.kick.debounce(100)();
          clock.tick(100);
          await debouncedKick;
          assert.isTrue(kickHandler.calledOnce);
        });

        it('should pass arguments through to handler', async () => {
          const debouncedKick = fsm.kick.debounce(100)('hard');
          clock.tick(100);
          await debouncedKick;
          assert.isTrue(kickHandler.calledOnce);
          assert.equal('hard', kickHandler.firstCall.args[0]);
        });

        it('should debounce multiple calls within wait time', async () => {
          const firstKick = fsm.kick.debounce(100)(1);
          clock.tick(50);
          const secondKick = fsm.kick.debounce(100)(2);
          clock.tick(50);
          assert.isTrue(kickHandler.notCalled);
          clock.tick(50);
          await secondKick;
          assert.isTrue(kickHandler.calledOnce);
          assert.equal(2, kickHandler.firstCall.args[0]);
        });

        it('should invoke event after last call’s wait time', async () => {
          const firstKick = fsm.kick.debounce(100)(1);
          clock.tick(50);
          const secondKick = fsm.kick.debounce(10)(2);
          clock.tick(10);
          await secondKick;
          assert.isTrue(kickHandler.calledOnce);
          assert.equal(2, kickHandler.firstCall.args[0]);
        });
      });
    });
  });
});

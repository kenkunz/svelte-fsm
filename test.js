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
      '*': {
        _exit: sequenceSpy.bind(null, '*:_exit'),
        surge: 'blown-default',
        poke: sequenceSpy.bind(null, 'hey!')
      },

      off: {
        _enter: sequenceSpy.bind(null, 'off:_enter'),
        _exit: sequenceSpy.bind(null, 'off:_exit'),
        toggle: 'on',
        surge: 'blown',
        kick: kickHandler,
        subscribe: subscribeHandler,
        arrowFunction: () => {
          this.shouldExplode();
        }
      },

      on: {
        _enter: sequenceSpy.bind(null, 'on:_enter'),
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

    it('should invoke callback on initial subscribe', () => {
      const callback = sinon.stub();
      const unsubscribe = fsm.subscribe(callback);
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
      unsubscribe();
    });

    it('should return unsubscribe function when invoked with callback', () => {
      assert.isFunction(fsm.subscribe(sinon.fake()));
    });

    it('should call subscribe action handler when invoked with no args', () => {
      fsm.subscribe();
      assert.isTrue(subscribeHandler.calledOnce);
      assert.isEmpty(subscribeHandler.firstCall.args);
    });

    it('should call subscribe action handler when invoked with single non-function arg', () => {
      fsm.subscribe('not a function');
      assert.isTrue(subscribeHandler.calledOnce);
      assert.lengthOf(subscribeHandler.firstCall.args, 1);
      assert.equal('not a function', subscribeHandler.firstCall.args[0]);
    });

    it('should call subscribe action handler when invoked with multiple args', () => {
      const fn = sinon.fake()
      fsm.subscribe(fn, null);
      assert.isTrue(subscribeHandler.calledOnce);
      assert.lengthOf(subscribeHandler.firstCall.args, 2);
      assert.equal(fn, subscribeHandler.firstCall.args[0]);
      assert.isNull(subscribeHandler.firstCall.args[1]);
    });
  });

  describe('event invocations', function() {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.stub();
      unsubscribe = fsm.subscribe(callback);
    });

    afterEach(() => {
      unsubscribe();
    });

    it('should silently handle unregistered actions', () => {
      fsm.noop();
      assert.isTrue(callback.calledOnce);
    });

    it('should invoke registered action functions', () => {
      fsm.kick();
      assert.isTrue(kickHandler.calledOnce);
    });

    it('should transition to static value registered action', () => {
      fsm.toggle();
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should not transition if invoked action returns nothing', () => {
      fsm.kick();
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to invoked action return value', () => {
      kickHandler.returns('on');
      fsm.kick();
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should return resulting state', () => {
      assert.equal('on', fsm.toggle());
    });

    it('should pass arguments through to invoked action', () => {
      kickHandler.withArgs('hard').returns('on');

      fsm.kick();
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);

      fsm.kick('hard');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should bind `this` to state proxy object on invoked actions', () => {
      fsm.kick();
      assert.isTrue(kickHandler.calledOn(fsm));
    });

    it('should not bind `this` on actions defined as arrow functions', () => {
      assert.throws(fsm.arrowFunction, TypeError);
    });

    it('should not notify subscribers when state unchanged', () => {
      kickHandler.returns('off');
      fsm.kick();
      assert.isTrue(callback.calledOnce);
    });

    it('should call lifecycle actions in proper sequence', () => {
      callback.callsFake(sequenceSpy);
      fsm.toggle();
      assert.equal(4, sequenceSpy.callCount);
      assert.equal('off:_enter', sequenceSpy.firstCall.args[0]);
      assert.equal('off:_exit', sequenceSpy.secondCall.args[0]);
      assert.equal('on', sequenceSpy.thirdCall.args[0]);
      assert.equal('on:_enter', sequenceSpy.getCall(3).args[0]);
    });

    it('should call lifecycle actions with transition metadata', () => {
      const initial = { from: null, to: 'off', event: null, args: [] };
      const transition = { from: 'off', to: 'on', event: 'toggle', args: [1, 'foo'] };
      fsm.toggle(1, 'foo');
      assert.deepEqual(initial, sequenceSpy.firstCall.args[1]);
      assert.deepEqual(transition, sequenceSpy.secondCall.args[1]);
      assert.deepEqual(transition, sequenceSpy.thirdCall.args[1]);
    });

    it('should not throw error when no matching state node', () => {
      fsm.surge();
      assert.isTrue(callback.calledTwice);
      assert.equal('blown', callback.secondCall.args[0]);
      assert.doesNotThrow(() => fsm.toggle());
    });

    it('should invoke fallback actions if no match on current state', () => {
      sequenceSpy.reset();
      fsm.poke();
      fsm.toggle();
      const state = fsm.surge();
      assert.equal('blown-default', state);
      assert.equal(4, sequenceSpy.callCount);
      assert.equal('hey!', sequenceSpy.firstCall.args[0]);
      assert.equal('*:_exit', sequenceSpy.lastCall.args[0]);
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      fsm.toggle();
      assert.isTrue(callback.calledOnce);
    });
  });

  describe('event debounce methods', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should be a function', () => {
      assert.isFunction(fsm.someEvent.debounce);
    });

    it('should invoke event after specified wait time', async () => {
      const debouncedKick = fsm.kick.debounce(100);
      clock.tick(100);
      await debouncedKick;
      assert.isTrue(kickHandler.calledOnce);
    });

    it('should pass arguments through to action', async () => {
      const debouncedKick = fsm.kick.debounce(100, 'hard');
      clock.tick(100);
      await debouncedKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal('hard', kickHandler.firstCall.args[0]);
    });

    it('should debounce multiple calls within wait time', async () => {
      const firstKick = fsm.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = fsm.kick.debounce(100, 2);
      clock.tick(50);
      assert.isTrue(kickHandler.notCalled);
      clock.tick(50);
      await secondKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal(2, kickHandler.firstCall.args[0]);
    });

    it('should invoke action after last call’s wait time', async () => {
      const firstKick = fsm.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = fsm.kick.debounce(10, 2);
      clock.tick(10);
      await secondKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal(2, kickHandler.firstCall.args[0]);
    });
  });
});

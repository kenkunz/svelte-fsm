import { assert } from 'chai';
import sinon from 'sinon';
import fsm from './index.js';

describe('a finite state machine', () => {
  let machine, kickHandler, subscribeHandler, actionHandler;

  beforeEach(() => {
    kickHandler = sinon.stub();
    subscribeHandler = sinon.stub();
    actionHandler = sinon.stub();

    machine = fsm('off', {
      '*': {
        _exit: actionHandler.bind(null, '*:_exit'),
        surge: 'blown-default',
        poke: actionHandler.bind(null, 'hey!')
      },

      off: {
        _enter: actionHandler.bind(null, 'off:_enter'),
        _exit: actionHandler.bind(null, 'off:_exit'),
        toggle: 'on',
        surge: 'blown',
        kick: kickHandler,
        subscribe: subscribeHandler,
        arrowFunction: () => {
          this.shouldExplode();
        }
      },

      on: {
        _enter: actionHandler.bind(null, 'on:_enter'),
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
        machine.subscribe(sinon.fake());
      });
    });

    it('should invoke callback on initial subscribe', () => {
      const callback = sinon.stub();
      const unsubscribe = machine.subscribe(callback);
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
      unsubscribe();
    });

    it('should return unsubscribe function when invoked with callback', () => {
      assert.isFunction(machine.subscribe(sinon.fake()));
    });

    it('should call subscribe action handler when invoked with no args', () => {
      machine.subscribe();
      assert.isTrue(subscribeHandler.calledOnce);
      assert.isEmpty(subscribeHandler.firstCall.args);
    });

    it('should call subscribe action handler when invoked with single non-function arg', () => {
      machine.subscribe('not a function');
      assert.isTrue(subscribeHandler.calledOnce);
      assert.lengthOf(subscribeHandler.firstCall.args, 1);
      assert.equal('not a function', subscribeHandler.firstCall.args[0]);
    });

    it('should call subscribe action handler when invoked with multiple args', () => {
      const fn = sinon.fake()
      machine.subscribe(fn, null);
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
      unsubscribe = machine.subscribe(callback);
    });

    afterEach(() => {
      unsubscribe();
    });

    it('should silently handle unregistered actions', () => {
      machine.noop();
      assert.isTrue(callback.calledOnce);
    });

    it('should invoke registered action functions', () => {
      machine.kick();
      assert.isTrue(kickHandler.calledOnce);
    });

    it('should transition to static value registered action', () => {
      machine.toggle();
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should not transition if invoked action returns nothing', () => {
      machine.kick();
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);
    });

    it('should transition to invoked action return value', () => {
      kickHandler.returns('on');
      machine.kick();
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should return resulting state', () => {
      assert.equal('on', machine.toggle());
    });

    it('should pass arguments through to invoked action', () => {
      kickHandler.withArgs('hard').returns('on');

      machine.kick();
      assert.isTrue(callback.calledOnce);
      assert.equal('off', callback.firstCall.args[0]);

      machine.kick('hard');
      assert.isTrue(callback.calledTwice);
      assert.equal('on', callback.secondCall.args[0]);
    });

    it('should bind `this` to state proxy object on invoked actions', () => {
      machine.kick();
      assert.isTrue(kickHandler.calledOn(machine));
    });

    it('should not bind `this` on actions defined as arrow functions', () => {
      assert.throws(machine.arrowFunction, TypeError);
    });

    it('should not notify subscribers when state unchanged', () => {
      kickHandler.returns('off');
      machine.kick();
      assert.isTrue(callback.calledOnce);
    });

    it('should call lifecycle actions in proper sequence', () => {
      callback.callsFake(actionHandler);
      machine.toggle();
      assert.equal(4, actionHandler.callCount);
      assert.equal('off:_enter', actionHandler.firstCall.args[0]);
      assert.equal('off:_exit', actionHandler.secondCall.args[0]);
      assert.equal('on', actionHandler.thirdCall.args[0]);
      assert.equal('on:_enter', actionHandler.getCall(3).args[0]);
    });

    it('should call lifecycle actions with transition metadata', () => {
      const initial = { from: null, to: 'off', event: null, args: [] };
      const transition = { from: 'off', to: 'on', event: 'toggle', args: [1, 'foo'] };
      machine.toggle(1, 'foo');
      assert.deepEqual(initial, actionHandler.firstCall.args[1]);
      assert.deepEqual(transition, actionHandler.secondCall.args[1]);
      assert.deepEqual(transition, actionHandler.thirdCall.args[1]);
    });

    it('should not throw error when no matching state node', () => {
      machine.surge();
      assert.isTrue(callback.calledTwice);
      assert.equal('blown', callback.secondCall.args[0]);
      assert.doesNotThrow(() => machine.toggle());
    });

    it('should invoke fallback actions if no match on current state', () => {
      actionHandler.reset();
      machine.poke();
      machine.toggle();
      const state = machine.surge();
      assert.equal('blown-default', state);
      assert.equal(4, actionHandler.callCount);
      assert.equal('hey!', actionHandler.firstCall.args[0]);
      assert.equal('*:_exit', actionHandler.lastCall.args[0]);
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      machine.toggle();
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
      assert.isFunction(machine.someEvent.debounce);
    });

    it('should invoke event after specified wait time', async () => {
      const debouncedKick = machine.kick.debounce(100);
      clock.tick(100);
      await debouncedKick;
      assert.isTrue(kickHandler.calledOnce);
    });

    it('should pass arguments through to action', async () => {
      const debouncedKick = machine.kick.debounce(100, 'hard');
      clock.tick(100);
      await debouncedKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal('hard', kickHandler.firstCall.args[0]);
    });

    it('should debounce multiple calls within wait time', async () => {
      const firstKick = machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(100, 2);
      clock.tick(50);
      assert.isTrue(kickHandler.notCalled);
      clock.tick(50);
      await secondKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal(2, kickHandler.firstCall.args[0]);
    });

    it('should invoke action after last call’s wait time', async () => {
      const firstKick = machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(10, 2);
      clock.tick(10);
      await secondKick;
      assert.isTrue(kickHandler.calledOnce);
      assert.equal(2, kickHandler.firstCall.args[0]);
    });
  });
});

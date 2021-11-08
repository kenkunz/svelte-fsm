import { assert } from 'chai';
import sinon from 'sinon';
import fsm from './index.js';

describe('a finite state machine', () => {
  let states, machine;

  beforeEach(() => {
    states = {
      '*': {
        _exit: sinon.stub(),
        surge: 'blown-default',
        poke: sinon.stub()
      },

      off: {
        _enter: sinon.stub(),
        _exit: sinon.stub(),
        toggle: 'on',
        surge: 'blown',
        kick: sinon.stub(),
        subscribe: sinon.stub(),
        arrowFunction: () => {
          this.shouldExplode();
        }
      },

      on: {
        _enter: sinon.stub(),
        toggle: 'off'
      }
    };

    machine = fsm('off', states);
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
      assert.isTrue(callback.calledWithExactly('off'));
      unsubscribe();
    });

    it('should call subscribe action handler when invoked with no args', () => {
      machine.subscribe();
      assert.isTrue(states.off.subscribe.calledOnce);
    });

    it('should call subscribe action handler when invoked with single non-function arg', () => {
      machine.subscribe('not a function');
      assert.isTrue(states.off.subscribe.calledWithExactly('not a function'));
    });

    it('should call subscribe action handler when invoked with multiple args', () => {
      const fn = sinon.fake()
      machine.subscribe(fn, null);
      assert.isTrue(states.off.subscribe.calledWithExactly(fn, null));
    });
  });

  describe('event invocations', function() {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.stub();
      unsubscribe = machine.subscribe(callback);
      callback.resetHistory();
    });

    afterEach(() => {
      unsubscribe();
    });

    it('should silently handle unregistered actions', () => {
      assert.equal('off', machine.noop());
      assert.isTrue(callback.notCalled);
    });

    it('should invoke registered action functions', () => {
      machine.kick();
      assert.isTrue(states.off.kick.calledOnce);
    });

    it('should transition to static value registered action', () => {
      assert.equal('on', machine.toggle());
      assert.isTrue(callback.calledWithExactly('on'));
    });

    it('should not transition if invoked action returns nothing', () => {
      assert.equal('off', machine.kick());
      assert.isTrue(callback.notCalled);
    });

    it('should transition to invoked action return value', () => {
      states.off.kick.returns('on');
      assert.equal('on', machine.kick());
      assert.isTrue(callback.calledWithExactly('on'));
    });
    
    it('should pass arguments through to invoked action', () => {
      machine.kick('hard');
      assert.isTrue(states.off.kick.calledWithExactly('hard'));
    });

    it('should bind `this` to state proxy object on invoked actions', () => {
      machine.kick();
      assert.isTrue(states.off.kick.calledOn(machine));
    });

    it('should not bind `this` on actions defined as arrow functions', () => {
      assert.throws(machine.arrowFunction, TypeError);
    });

    it('should call lifecycle actions in proper sequence', () => {
      machine.toggle();
      assert.isTrue(states.off._enter.calledBefore(states.off._exit));
      assert.isTrue(states.off._exit.calledBefore(callback));
      assert.isTrue(callback.calledBefore(states.on._enter));
    });

    it('should call _enter with appropirate metadata when fsm is created', () => {
      const metadata = { from: null, to: 'off', event: null, args: [] };
      assert.isTrue(states.off._enter.calledWithExactly(metadata));
    });

    it('should call lifecycle actions with transition metadata', () => {
      const metadata = { from: 'off', to: 'on', event: 'toggle', args: [1, 'foo'] };
      machine.toggle(1, 'foo');
      assert.isTrue(states.off._exit.calledWithExactly(metadata));
      assert.isTrue(states.on._enter.calledWithExactly(metadata));
    });

    it('should not throw error when no matching state node', () => {
      machine.surge();
      assert.isTrue(callback.calledWithExactly('blown'));
      assert.doesNotThrow(() => machine.toggle());
    });

    it('should invoke fallback actions if no match on current state', () => {
      machine.poke();
      assert.isTrue(states['*'].poke.called);
      machine.toggle();
      assert.equal('blown-default', machine.surge());
      assert.isTrue(states['*']._exit.called);
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      machine.toggle();
      assert.isTrue(callback.notCalled);
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
      assert.isTrue(states.off.kick.calledOnce);
    });

    it('should pass arguments through to action', async () => {
      const debouncedKick = machine.kick.debounce(100, 'hard');
      clock.tick(100);
      await debouncedKick;
      assert.isTrue(states.off.kick.calledWithExactly('hard'));
    });

    it('should debounce multiple calls within wait time', async () => {
      const firstKick = machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(100, 2);
      clock.tick(50);
      assert.isTrue(states.off.kick.notCalled);
      clock.tick(50);
      await secondKick;
      assert.isTrue(states.off.kick.calledWithExactly(2));
    });

    it('should invoke action after last call’s wait time', async () => {
      const firstKick = machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(10, 2);
      clock.tick(10);
      await secondKick;
      assert.isTrue(states.off.kick.calledOnce);
      assert.isTrue(states.off.kick.calledWithExactly(2));
    });
  });
});

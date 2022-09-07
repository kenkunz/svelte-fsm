import { assert } from 'chai';
import sinon from 'sinon';
import { inspect } from 'util';
import fsm from '../index.js';

sinon.assert.expose(assert, { prefix: '' });

describe('a finite state machine', () => {
  let states, machine;

  beforeEach(() => {
    states = {
      '*': {
        _exit: sinon.fake(),
        surge: 'blown-default',
        poke: sinon.fake()
      },

      off: {
        _enter: sinon.fake(),
        _exit: sinon.fake(),
        toggle: 'on',
        surge: 'blown',
        kick: sinon.stub(),
        subscribe: sinon.fake(),
        symbolAction: Symbol.for('the nether'),
        dateAction: new Date(),
        objectAction: {},
        numericAction: 1,
        async asyncAction() {},
        arrowFunction: () => {
          this.shouldExplode();
        }
      },

      on: {
        _enter: sinon.fake(),
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
      const callback = sinon.fake();
      const unsubscribe = machine.subscribe(callback);
      assert.calledOnce(callback);
      assert.calledWithExactly(callback, 'off');
      unsubscribe();
    });

    it('should throw TypeError when invoked with no args', () => {
      assert.throws(machine.subscribe, TypeError);
    });

    it('should throw TypeError when invoked with non-function arg', () => {
      assert.throws(() => {
        machine.subscribe('not a function');
      }, TypeError);
    });

    it('should not call subscribe action handler when invoked with multiple args', () => {
      machine.subscribe(sinon.fake(), null);
      assert.notCalled(states.off.subscribe);
    });
  });

  describe('event invocations', () => {
    let callback;
    let unsubscribe;

    beforeEach(() => {
      callback = sinon.fake();
      unsubscribe = machine.subscribe(callback);
      callback.resetHistory();
    });

    afterEach(() => {
      unsubscribe();
    });

    it('should silently handle unregistered actions', () => {
      assert.equal('off', machine.noop());
      assert.notCalled(callback);
    });

    it('should invoke registered action functions', () => {
      machine.kick();
      assert.calledOnce(states.off.kick);
    });

    it('should transition to static value registered action', () => {
      assert.equal('on', machine.toggle());
      assert.calledWithExactly(callback, 'on');
    });

    it('should not transition if invoked action returns nothing', () => {
      assert.equal('off', machine.kick());
      assert.notCalled(callback);
    });

    it('should transition to invoked action return value (string)', () => {
      states.off.kick.returns('on');
      assert.equal('on', machine.kick());
      assert.calledWithExactly(callback, 'on');
    });

    it('should transition to invoked action symbol value', () => {
      const newState = machine.symbolAction();
      assert.equal(Symbol.for('the nether'), newState);
      assert.calledWithExactly(callback, Symbol.for('the nether'));
    });

    it('should ignore non-string|symbol action return values', () => {
      assert.equal('off', machine.dateAction());
      assert.equal('off', machine.objectAction());
      assert.equal('off', machine.numericAction());
      assert.equal('off', machine.asyncAction());
    });

    it('should invoke action with correct `this` binding and arguments', () => {
      machine.kick('hard');
      assert.calledOn(states.off.kick, machine);
      assert.calledWithExactly(states.off.kick, 'hard');
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
      assert.calledWithExactly(states.off._enter, {
        from: null,
        to: 'off',
        event: null,
        args: []
      });
    });

    it('should call lifecycle actions with transition metadata', () => {
      const expected = {
        from: 'off',
        to: 'on',
        event: 'toggle',
        args: [1, 'foo']
      };
      machine.toggle(1, 'foo');
      assert.calledWithExactly(states.off._exit, expected);
      assert.calledWithExactly(states.on._enter, expected);
    });

    it('should not throw error when no matching state node', () => {
      machine.surge();
      assert.calledWithExactly(callback, 'blown');
      assert.doesNotThrow(() => machine.toggle());
    });

    it('should invoke fallback actions if no match on current state', () => {
      machine.poke();
      assert.called(states['*'].poke);
      machine.toggle();
      assert.equal('blown-default', machine.surge());
      assert.called(states['*']._exit);
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      machine.toggle();
      assert.notCalled(callback);
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
      assert.calledOnce(states.off.kick);
    });

    it('should pass arguments through to action', async () => {
      const debouncedKick = machine.kick.debounce(100, 'hard');
      clock.tick(100);
      await debouncedKick;
      assert.calledWithExactly(states.off.kick, 'hard');
    });

    it('should debounce multiple calls within wait time', async () => {
      machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(100, 2);
      clock.tick(50);
      assert.notCalled(states.off.kick);
      clock.tick(50);
      await secondKick;
      assert.calledWithExactly(states.off.kick, 2);
    });

    it('should invoke action after last call’s wait time', async () => {
      machine.kick.debounce(100, 1);
      clock.tick(50);
      const secondKick = machine.kick.debounce(10, 2);
      clock.tick(10);
      await secondKick;
      assert.calledOnce(states.off.kick);
      assert.calledWithExactly(states.off.kick, 2);
    });

    it('should cancel debounce invocation if called with null', async () => {
      const kick = machine.kick.debounce(100, 1);
      const cancelation = machine.kick.debounce(null);
      clock.tick(100);
      const state = await cancelation;
      assert.notCalled(states.off.kick);
      assert.include(inspect(kick), '<pending>');
      assert.equal('off', state);
    });
  });
});

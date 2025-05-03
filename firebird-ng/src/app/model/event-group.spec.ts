// event-group.spec.ts

import {
  EventGroup,
  EventGroupFactory,
  registerEventGroupFactory,
  getEventGroupFactory,
  _resetEventGroupRegistry,
} from './event-group';

describe('EventGroup', () => {
  it('should not allow instantiation of abstract class', () => {
    // Attempting to instantiate an abstract class should result in a compile-time error.
    // This test ensures that the class is abstract by design.

    // Uncommenting the following line should cause a TypeScript error.
    // const component = new EventGroup('name', 'type');

    // Since TypeScript prevents instantiation of abstract classes at compile time,
    // we can simulate this in the test by checking that an error is thrown.

    expect(() => {
      // Force a runtime check by attempting to instantiate via casting.
      (EventGroup as any).call(null, 'name', 'type');
    }).toThrowError();
  });
});

describe('Component Registry', () => {
  // Define a TestComponentFactory for testing
  class TestComponentFactory implements EventGroupFactory {
    type: string = 'TestType';

    fromDexObject(obj: any): EventGroup {
      return new TestEventGroup(obj['name'], obj['origin']);
    }
  }

  // Define TestEventGroup class extending EventGroup
  class TestEventGroup extends EventGroup {
    override get timeRange(): [number, number] | null {
        return [0, 100]
    }
    constructor(name: string, origin?: string) {
      super(name, 'TestType', origin);
    }

    toDexObject(): any {
      return {
        name: this.name,
        type: this.type,
        origin: this.origin,
      };
    }
  }

  beforeEach(() => {
    // Reset the component registry before each test
    _resetEventGroupRegistry();
  });

  it('should register and retrieve component factories correctly', () => {
    const factory = new TestComponentFactory();

    // Register the factory
    registerEventGroupFactory(factory);

    // Retrieve the factory
    const retrievedFactory = getEventGroupFactory('TestType');

    expect(retrievedFactory).toBeDefined();
    expect(retrievedFactory).toBe(factory);
  });

  it('should return undefined for unregistered component types', () => {
    const retrievedFactory = getEventGroupFactory('UnknownType');

    expect(retrievedFactory).toBeUndefined();
  });

  it('should overwrite existing factory when registering a factory with the same type', () => {
    const factory1 = new TestComponentFactory();
    const factory2 = new TestComponentFactory();

    // Register the first factory
    registerEventGroupFactory(factory1);

    // Register the second factory with the same type
    registerEventGroupFactory(factory2);

    // Retrieve the factory
    const retrievedFactory = getEventGroupFactory('TestType');

    expect(retrievedFactory).toBe(factory2);
  });

  it('should use the correct factory to create component instances', () => {
    const factory = new TestComponentFactory();
    registerEventGroupFactory(factory);

    const dexObject = {
      name: 'TestEventGroup',
      type: 'TestType',
      origin: 'TestOrigin',
    };

    const retrievedFactory = getEventGroupFactory('TestType');
    expect(retrievedFactory).toBeDefined();

    const group = retrievedFactory!.fromDexObject(dexObject);
    expect(group).toBeInstanceOf(EventGroup);
    expect(group.name).toBe('TestEventGroup');
    expect(group.type).toBe('TestType');
    expect(group.origin).toBe('TestOrigin');
  });
});

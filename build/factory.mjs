import { uuid, copy, assert, flatsplit, undot, compose } from "./utils.mjs";
export { Factory };
export * from "./utils.mjs";

function Factory() {

  if (this instanceof Factory) {
    throw "Illegal constructor. Use plain Factory(), not new Factory()";
  }

  const BUILDERS = new WeakMap();
  const BUILD = new WeakMap();
  const IS = new WeakMap();
  const TYPEDEFS = {};
  const INITS = new WeakMap();
  const CONSTRUCTS = new WeakMap();
  const SETUPS = new WeakMap();

  const BUILTIN = {
    build: {
      private(def) {
        Object.assign(this, copy(def));
      },
      public(def) {
        const bound = copy(def, this);
        //Object.assign(this, bound);
        Object.assign(this.public, bound);
      }
    },
    self: {
      extend(...args) {
        return extend(this, ...args);
      }
    }
  };

  function register(type, def) {
    assert(!TYPEDEFS[type], 'factory-duplicate-type', { type })
    TYPEDEFS[type] = Object.assign(undot(def), { type });
  }

  function create(typeList, ...initArgs) {
    const obj = {};
    IS.set(obj, {});
    INITS.set(obj, []);
    BUILD.set(obj, {});
    BUILDERS.set(obj, {});
    Object.assign(obj, {
      id: uuid(),
      public: {}
    });

    extendWithTypedef(obj, BUILTIN, ...initArgs);
    extend(obj, typeList, ...initArgs);
    const builders = BUILDERS.get(obj);
    for (const b in builders) {
      const builder = builders[b];
      for (const init of builder.init) init.call(obj, builder.data, ...initArgs);
    }
    for (const init of INITS.get(obj)) {
      init.call(obj, ...initArgs);
    }
    return obj.public;
  }

  function extend(obj, typeList, ...initArgs) {
    const types = flatsplit(typeList);
    const is = IS.get(obj);
    for (const type of types) {
      if (is[type]) continue;
      is[type] = true;
      extendWithType(obj, type, ...initArgs);
    }
  }

  function extendWithType(obj, type, ...initArgs) {
    const typeDef = TYPEDEFS[type];
    assert(typeDef, "factory-no-such-type", { type });
    extendWithTypedef(obj, typeDef, ...initArgs);
  }


  function extendWithTypedef(obj, typeDef, ...initArgs) {
    const is = IS.get(obj);

    if (typeDef.requires) {
      const required = flatsplit(typeDef.requires);
      for (const req of required) {
        assert(is[req], "factory-required-type-missing", { type: req })
      }
    }
    const builders = BUILDERS.get(obj);

    /*
    The build order is:
    1) extend
    2) install builders
    3) build
    4) construct (first builders, then typeDef)
    5) init (first builders, then typeDef)

  */

    if (typeDef.excludes) {
      const excludes = flatsplit(typeDef.excludes);
      for (const type of excludes) assert(!is[type], "factory-excludes-violation", { type });
      extend(obj, typeDef.excludes, ...initArgs);
    }

    if (typeDef.installs) {
      const installs = flatsplit(typeDef.installs);
      for (const type of installs) assert(!is[type], "factory-duplicate-type-install", { type });
      extend(obj, typeDef.installs, ...initArgs);
    }


    // extend
    if (typeDef.extends) extend(obj, typeDef.extends, ...initArgs);

    // add buildiers
    if (typeDef.build) {
      for (const b in typeDef.build) {

        var def = typeDef.build[b];
        if (typeof def === "function") def = { build: def };

        let builder = builders[b];
        if (!builder) {
          builder = builders[b] = {
            data: {},
            build: [],
            construct: [],
            init: [],
          }
          if (def.install) def.install.call(obj, builder.data);
        }
        if (def.build) builder.build.push(def.build);
        if (def.construct) builder.construct.push(def.build);
        if (def.init) builder.init.push(def.init);
      }
    }

    const buildable = {};
    for (const b in builders) {
      if (b in typeDef) buildable[b] = typeDef[b];
    }

    for (var b in buildable) {
      const builder = builders[b];
      for (const build of builder.build) build.call(obj, typeDef[b], builder.data);
    }

    // call typeDef construct
    if (typeDef.construct) typeDef.construct.call(obj, ...initArgs);

    for (var b in buildable) {
      const builder = builders[b];
      for (const construct of builder.construct) construct.call(obj, typeDef[b], builder.data);
    }

    // call typeDef init
    if (typeDef.init) INITS.get(obj).push(typeDef.init.bind(obj));
  }

  return { register, create }
} 

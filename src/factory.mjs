import { uuid, copy, assert, flatsplit, undot, sequence } from "./utils.mjs";
export { Factory };
export * from "./utils.mjs";

function Factory() {

  class Builder {
    
    constructor(obj, name, def) {
      this.obj = obj;
      this.name = name;
      this.data = {};
      this._construct = null;
      this._build = null;
      this.install(def);
    }
    addInit(init) {
      if (!init) return;
      BUILDERINITS.get(this.obj).push(
        (...args) => {
          init.call(this.obj, this.data, ...args)
        }
      );
    }
    install(def) {
      this._build = def.build;
      this._construct = def.construct;
      this.addInit(def.init);
      if (def.install) def.install.call(this.obj, this.data)
    }
    override(def) {
      this._build = sequence(this._build, def.build);
      this._construct = sequence(this._construct, def.construct);
      this.addInit(def.init);
    }
    construct(def,...initArgs) {
      this._construct && this._construct.call(this.obj,  def, this.data,...initArgs)
    }
    build(def) {
      this._build && this._build.call(this.obj, def, this.data)
    }
  }


  if (this instanceof Factory) {
    throw "Illegal constructor. Use plain Factory(), not new Factory()";
  }

  const BUILDERS = new WeakMap();
  const IS = new WeakMap();
  const TYPEDEFS = {};
  const INITS = new WeakMap();
  const BUILDERINITS = new WeakMap();

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
    BUILDERINITS.set(obj, []);
    BUILDERS.set(obj, {});
    Object.assign(obj, {
      id: uuid(),
      public: {}
    });

    extendWithTypedef(obj, BUILTIN, ...initArgs);
    extend(obj, typeList, ...initArgs);
    for (const init of BUILDERINITS.get(obj)) {
      init.call(obj, ...initArgs);
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
      assert(required.every(req=>is[req]))
      for (const req of required) {
        assert(is[req], "factory-required-type-missing", { type: req })
      }
    }

    if (typeDef.excludes) {
      const excludes = flatsplit(typeDef.excludes);
      for (const type of excludes) {
        assert(!is[type], "factory-excludes-violation", { type });
      }
    }

    if (typeDef.installs) {
      const installs = flatsplit(typeDef.installs);
      for (const type of installs) {
        assert(!is[type], "factory-duplicate-type-install", { type });
      }
      extend(obj, typeDef.installs, ...initArgs);
    }

    // extend
    if (typeDef.extends) extend(obj, typeDef.extends, ...initArgs);

    const builders = BUILDERS.get(obj);
    // add buildiers
    if (typeDef.build) {
      for (const b in typeDef.build) {
        var def = typeDef.build[b];
        if (typeof def === "function") def = { build: def };

        if (!builders[b]) builders[b] = new Builder(obj,b,def);
        else builders[b].override(def);
      }
    }
    for (const b in builders) {
      if (b in typeDef) builders[b].build(typeDef[b]);
    }
    if (typeDef.construct) typeDef.construct.call(obj, ...initArgs);
    for (const b in builders) {
      if (b in typeDef) builders[b].construct(typeDef[b]);
    }

  // call typeDef init
    if (typeDef.init) INITS.get(obj).push(typeDef.init.bind(obj));
  }

  return { register, create }

}

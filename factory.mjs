import { uuid, copy, assert, flatsplit } from "./utils";
export { uuid, copy, assert, flatsplit, register, create };

const BUILDERS = new WeakMap();
const BUILD = new WeakMap();
const IS = new WeakMap();
const TYPEDEFS = {};

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
  TYPEDEFS[type] = Object.assign(copy(def), { type });
}

function create(typeList, ...initArgs) {
  const obj = {};
  IS.set(obj, {});
  BUILD.set(obj, {});
  BUILDERS.set(obj, {});
  Object.assign(obj, {
    id: uuid(),
    public: {}
  });

  extendWithTypedef(obj, BUILTIN, ...initArgs);
  extend(obj, typeList, ...initArgs);
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
  const typedef = TYPEDEFS[type];
  assert(typedef, "bad-type:" + type);
  extendWithTypedef(obj, typedef, ...initArgs);
}

function extendWithTypedef(obj, typedef, ...initArgs) {
  const builders = BUILDERS.get(obj);
  const build = BUILD.get(obj);

  /*
  The build order is:
  1) construct (first builders, then typedef)
  2) extend
  3) build
  4) init (first builders, then typedef)

*/

  // call construct of individual builders
  for (const b in builders) {
    if (!(b in typedef)) continue;
    for (const builder of builders[b]) {
      builder.construct &&
        builder.construct.call(obj, typedef[b], build[b], ...initArgs);
    }
  }

  // call typedef construct
  if (typedef.construct) typedef.construct.call(obj, ...initArgs);

  // extend
  if (typedef.extends) extend(obj, typedef.extends, ...initArgs);

  // build
  if (typedef.build) {
    for (const b in typedef.build) {
      var def = typedef.build[b];
      if (typeof def === "function") def = { build: def };
      if (!builders[b]) {
        builders[b] = [];
        build[b] = {};
      }
      builders[b].push({
        build: def.build,
        init: def.init,
        construct: def.construct
      });
    }
  }

  // call build of individual builders
  for (const b in builders) {
    if (!(b in typedef)) continue;
    for (const builder of builders[b]) {
      builder.build && builder.build.call(obj, typedef[b], build[b]);
    }
  }

  // call init of individual builders
  for (const b in builders) {
    if (!(b in typedef)) continue;
    for (const builder of builders[b]) {
      builder.init && builder.init.call(obj, typedef[b], build[b], ...initArgs);
    }
  }

  // call typedef init
  if (typedef.init) typedef.init.call(obj, ...initArgs);
}

// obj.js

const isObject      = value => value !== null && typeof value === 'object';
const isPlainObject = value => isObject(value) && (value.constructor === Object || !value.constructor);     

const obj = {};

obj.resolvePath = (object, dotKey) => {
  const parts  = dotKey.split('.');
  const key    = parts.pop();
  const target = parts.reduce((node, part) => node[part], object);
  const value  = target[key];

  return { target, key, value };
};

obj.assign = (target, ...sources) => {
  return Object.assign(target, ...sources);
};

obj.merge = (target, ...sources) => {
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject(target[key])) {
        merge(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }

  return target;
};

obj.deleteByPath = (object, path) => {
  const { target, key } = obj.resolvePath(object, path);
  delete target[key];

  return object;
};

obj.getValueByPath = (object, dotKey) => {
  return obj.resolvePath(object, dotKey).value;
};

obj.hasPath = (object, path) => {
  const { target, key } = obj.resolvePath(object, path);
  return Object.hasOwn(target, key);
};

obj.setValueByPath = (object, path, value) => {
  const { target, key } = obj.resolvePath(object, path);
  target[key] = value;

  return object;
};

obj.toggleByPath = (object, path) => {
  const { target, key, value } = obj.resolvePath(object, path);

  target[key] = isBool(value) ? !value
    : value === 'on'  ? 'off'
    : value === 'off' ? 'on'
    : value;

  return object;
};

obj.dropByKey = (object, ...keys) => {
  const result = { ...object };

  for (const key of keys) delete result[key];

  return result;
};

// conversion

obj.toEntries = object => Object.entries (object);
obj.toKeys    = object => Object.keys    (object);
obj.toValues  = object => Object.values  (object);

const createChain = object => new Proxy({}, {
  get (_, prop) {
    if (prop in methods)
      return (...args) => methods[prop](object, ...args);

    return object[prop];
  }
});

  const createChain = object => new Proxy({}, {
  get (_, method) {
    if (!(method in methods))
      return undefined;

    return (...args) => methods[method](object, ...args);
  }
});


const obj = Object.assign(
  function obj(object) {
    return createChain(object);
  },
  methods
);

// :::::: EXPORT

export { obj };
export default obj;

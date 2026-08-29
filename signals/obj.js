// obj.js

const obj = {};

obj.resolvePath = (object, dotKey) => {
  const parts  = dotKey.split('.');
  const key    = parts.pop();
  const target = parts.reduce((node, part) => node[part], object);
  const value  = target[key];

  return { target, key, value };
};
obj.getValueByPath = (object, dotKey) => {
  return obj.resolvePath(object, dotKey).value;
};
obj.setValueByPath = (object, path, value) => {
  const { target, key } = obj.resolvePath(object, path);
  target[key] = value;

  return object;
};
obj.toggleByPath = (object, dotKey) => {
  const { target, key, value } = obj.resolvePath(object, dotKey);

  target[key] = isBool(value) ? !value
    : value === 'on'  ? 'off'
    : value === 'off' ? 'on'
    : value;
};

export { obj };
export default obj;

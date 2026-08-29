// @aufbau/signals/betterSignal.js

// ====== betterSignal ==============================================
// a plain object argument is ALWAYS config — wrap real object values in { value }

export let betterSignal = input => {
  let config = isPlainObject(input) ? input : { value: input };
  let { deep = false, key, type, value, values } = config;
  let store  = resolveStore(config.store);

  // pick the carrier and expose a uniform read/write pair for persistence
  let target =
      type === Map ? (target => ({ target, read: () => target.toObject(),    write: saved => target.replace(saved) }))(makeMap(value))
    : type === Set ? (target => ({ target, read: () => target.toArray(),     write: saved => target.replace(saved) }))(makeSet(value))
    : deep         ? (target => ({ target, read: () => target.$signal.value, write: saved => _merge(target, saved) }))(_makeNode(value ?? {}, deep))
    :                (target => ({ target, read: () => target.value,         write: saved => { target.$values = null; target.value = saved; target.$values = values ?? null; } }))(new XSignal(value, values));

  if (!key) return target.target;

  // hydrate first, persist afterwards — never write the initial value back over stored data
  let live  = false;
  let saved = store.get(key);
  let apply = loaded => { if (loaded !== undefined) target.write(loaded); };

  let ready = isPromise(saved)
    ? saved.then(loaded => { apply(loaded); live = true; })
    : (apply(saved), live = true, Promise.resolve());

  effect(() => { let snapshot = target.read(); if (live) store.set(key, snapshot); });
  store.subscribe?.(key, loaded => apply(loaded));

  if (target.target instanceof XSignal) target.target.$ready = ready;
  else if (_meta.has(target.target))    _meta.get(target.target).ready = ready;
  else                                  Object.defineProperty(target.target, '$ready', { get: () => ready });

  return target.target;
};

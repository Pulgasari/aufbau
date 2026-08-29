// ====== hooks =====================================================
// component-scoped equivalents — created once, kept across renders

export let useBetterSignal = input => {
  let ref = useRef(null);
  if (ref.current === null) ref.current = betterSignal(input);
  return ref.current;
};

export let useQuerySignal = (fetcher, options) => {
  let ref = useRef(null);
  if (ref.current === null) ref.current = querySignal(fetcher, options);
  return ref.current;
};

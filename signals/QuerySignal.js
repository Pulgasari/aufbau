// @aufbau/signals/QuerySignal.js
// async query carrier — a plain signal holding fetch state (data, paging, flags),
// re-run when its `deps` change. stays a closure: it wraps a preact signal and hangs
// fetchNextPage/refetch off it, there is no separate object to model as a class.

import { effect, isAbort, signal } from './shared.js';

let emptyState = (pending, fetching) => ({
  data               : null,
  error              : null,
  hasNextPage        : true,
  isFetching         : fetching,
  isFetchingNextPage : false,
  isPending          : pending,
  pages              : [],
});

export let querySignal = (fetcher, options = {}) => {
  let { deps, enabled = true, infinite = false, limit = 100, prefetch = false } = options;

  let state = signal(emptyState(true, true));

  let cached      = null; // pre-fetched page, waiting to be consumed
  let controller  = null;
  let hasMore     = true; // the actual truth from the last response
  let page        = 1;
  let prefetching = null;
  let token       = 0;    // guards against out-of-order responses

  let abort   = () => { controller?.abort(); controller = new AbortController; return controller.signal; };
  let flatten = pages => pages.flat();

  // arrays fall back to the limit heuristic, objects can be explicit
  let normalize = result => {
    if (Array.isArray(result)) return { items: result, hasMore: result.length === limit };
    let items = result?.items ?? [];
    return { items, hasMore: result?.hasMore ?? items.length === limit };
  };

  async function prefetchNext (runToken) {
    if (prefetching || !hasMore) return;
    prefetching = fetcher({ page: page + 1, signal: controller.signal })
      .then(result => {
        if (runToken !== token) return;
        let next = normalize(result);
        cached  = next.items;
        hasMore = next.hasMore;
      })
      .catch(() => { cached = null; }) // let the regular path retry later
      .finally(() => { if (runToken === token) prefetching = null; });
  }

  async function load (runToken) {
    let abortSignal = abort();
    try {
      let result = await fetcher({ page: 1, signal: abortSignal });
      if (runToken !== token) return;

      if (!infinite) {
        state.value = { ...emptyState(false, false), data: result };
        return;
      }
      let { items, hasMore: more } = normalize(result);
      hasMore = more;
      state.value = { ...emptyState(false, false), data: flatten([items]), hasNextPage: more, pages: [items] };
      if (prefetch && more) prefetchNext(runToken);
    } catch (error) {
      if (runToken !== token || isAbort(error)) return;
      state.value = { ...state.peek(), error, isFetching: false, isFetchingNextPage: false, isPending: false };
    }
  }

  async function fetchNextPage () {
    let current = state.peek();
    if (!infinite || !current.hasNextPage || current.isFetchingNextPage) return;

    let runToken = token;

    // the user scrolled faster than the background fetch — wait for it
    if (prefetching) {
      state.value = { ...current, isFetching: true, isFetchingNextPage: true };
      await prefetching;
      if (runToken !== token) return;
    }

    if (cached !== null) {
      let items = cached;
      cached = null;
      page++;
      let previous = state.peek();
      let pages    = [...previous.pages, items];
      state.value  = { ...previous, data: flatten(pages), hasNextPage: hasMore, isFetching: false, isFetchingNextPage: false, pages };
      if (prefetch && hasMore) prefetchNext(runToken);
      return;
    }

    state.value = { ...state.peek(), isFetching: true, isFetchingNextPage: true };
    try {
      let result = await fetcher({ page: page + 1, signal: controller.signal });
      if (runToken !== token) return;

      let { items, hasMore: more } = normalize(result);
      page++;
      hasMore = more;
      let previous = state.peek();
      let pages    = [...previous.pages, items];
      state.value  = { ...previous, data: flatten(pages), hasNextPage: more, isFetching: false, isFetchingNextPage: false, pages };
      if (prefetch && more) prefetchNext(runToken);
    } catch (error) {
      if (runToken !== token || isAbort(error)) return;
      state.value = { ...state.peek(), error, isFetching: false, isFetchingNextPage: false };
    }
  }

  function start () {
    token++;
    cached      = null;
    hasMore     = true;
    page        = 1;
    prefetching = null;
    return token;
  }

  effect(() => {
    deps?.(); // read explicitly — anything after an await in the fetcher is NOT tracked
    let on = typeof enabled === 'function' ? enabled() : enabled;

    let runToken = start();
    state.value  = emptyState(true, on);
    if (on) load(runToken);
    else controller?.abort();
  });

  state.fetchNextPage = fetchNextPage;
  state.refetch       = () => { let runToken = start(); state.value = emptyState(true, true); return load(runToken); };

  return state;
};

    

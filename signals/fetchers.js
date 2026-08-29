// @aufbau/signals/fetchers.js

export let fakeFetcher = ({ delay = 300, fail = 0, limit = 20, total = 200 } = {}) =>
  ({ page = 1 } = {}) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < fail) return reject(new Error('fakeFetcher: simulated failure'));
      let start = (page - 1) * limit;
      let count = Math.max(0, Math.min(limit, total - start));
      let items = Array.from({ length: count }, (_, i) => ({ id: start + i + 1, title: `item ${start + i + 1}` }));
      resolve({ items, hasMore: start + count < total });
    }, delay);
  });

export let dummyFetcher = (resource = 'products', { delay = 0, limit = 20 } = {}) =>
  async ({ page = 1, signal: abortSignal } = {}) => {
    let skip     = (page - 1) * limit;
    let response = await fetch(`https://dummyjson.com/${resource}?limit=${limit}&skip=${skip}&delay=${delay}`, { signal: abortSignal });
    let data     = await response.json();
    let items    = data[resource] ?? [];
    return { items, hasMore: skip + items.length < data.total };
  };

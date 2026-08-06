# preact-x

```javascript
let theme = betterSignal({ value: 'dark', key: 'theme', store: local });
let mode  = betterSignal({ value: 'on', values: ['on','off'], key: 'mode', store: cookie({ days: 7 }) });
let ui    = betterSignal({ value: { sidebar: true }, key: 'ui', store: session, deep: 2 });
let tags  = betterSignal({ value: [], type: Set, key: 'tags', store: local });
let plain = betterSignal('blubb');

mode.cycle();              // on -> off -> on
mode.value = 'xl';         // ignoriert + console.warn
await theme.$ready;        // erst nach Hydration

let icons = querySignal(fakeFetcher({ delay: 400, fail: 0.1, total: 250 }), {
  infinite: true, prefetch: true, limit: 20,
  deps: () => [query.value],
  enabled: () => query.value.length > 1,
});
icons.value.data;          // flach, egal ob infinite
icons.fetchNextPage();
icons.refetch();
```

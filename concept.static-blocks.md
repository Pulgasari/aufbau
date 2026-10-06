# concept: static blocks in element classes

an idea, not a plan. nothing here is built yet.

```js
class MediaAudio extends AufbauElement {
  static {
    // runs once, when the class is evaluated
  }
}
```

a `static { }` block runs **once per class**, when the class is defined, not per
instance. `this` is the class. it is a tidy place for setup on class level, the
same as code after the class body, only inside it. what coordinates instances
is still a shared registry (a static field, a module variable); the block is
where it gets wired up.

static blocks are not inherited: a subclass runs its own block, never the one
of its base. a base class without a block is never touched by it.

## 1. registration instead of `X.init()`

every element file ends with `X.init()`. inside the class:

```js
export default class NavToc extends AufbauElement {
  static { this.init(); }
}
```

- the definition sits where the class is, not after it
- abstract bases (`Btn`, `Pop`, `Input`) have no block, so they can never be
  defined by accident
- the timing stays the same, both run when the module is imported

## 2. media that does not overlap

`play` does not bubble, a capture listener on the document sees it anyway, for
every `<audio>` and `<video>`, plain ones included:

```js
static {
  document.addEventListener('play', ({ target }) => {
    for (const media of document.querySelectorAll('audio, video')) {
      if (media !== target && !media.paused && sameGroup(media, target)) media.pause();
    }
  }, true);
}
```

- one listener for the page, however many players
- `group` works like `name` on radio buttons: players of one group exclude each
  other, no group means all of them, `group="none"` opts out
- inside a shadow root the target is retargeted, the media element would have
  to report its inner `<audio>` itself (an event of its own)

## 3. instances that know each other

```js
static instances = new Set;

static {
  document.addEventListener('keydown', event => {
    for (const instance of this.instances) instance.onShortcut?.(event);
  });
}

onConnected    () { this.constructor.instances.add(this); }
onDisconnected () { this.constructor.instances.delete(this); }
```

uses:

- **only one open**: `pop-menu`, `pop-over` close the others of their kind
- **shortcuts on class level**: one listener instead of one per element
- **a focus ring** across a family (the `nav-` elements of a page)
- **shared state**: one `IntersectionObserver`, one `ResizeObserver`, one
  `matchMedia` for every instance instead of one each

a weak set is not iterable, so the set has to be cleaned on disconnect, which
the lifecycle already does.

## open questions

- does a family need its own registry (all `pop-`) or one per class?
- `instances` on the base (`AufbauElement.instancesOf(Class)`) or per class?
- how much of this belongs to `@aufbau/element` and how much to the elements?

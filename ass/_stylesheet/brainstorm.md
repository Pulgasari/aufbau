# brainstorm

## bookmarks

### css-guides

- [at-rules](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/At-rules)

### css-references

- [at-rules](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules)
- [functions](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/Functions)
- [properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties)
- [selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors)
- [values](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values)

---

##

https://github.com/pulgasari/aufbau/

```js
const ass = {
  propsMap : new Map,
  props (obj) {
    const entries = Object.entries(obj);
    for (let [k,v] of entries) {
      ass.propsMap.set(k,v);
    }
  }
  prop (k,v) {
    if (!k && !v) return null;
    if (!v) return // get value

    // set value
    
  }
}

ass.props({
  font-size : {
    default-value : 16,
    default-unit  : px,
    inherits      : true,
    target        : ':root',
  },
  line-height : {
    default-value : 1.25,
    inherits      : true,
    target        : ':root',
  }
});
```

```css
@aufbau-props {
  font-size : {
    default-value : 16;
    default-unit  : px;
    inherits      : true;
    target        : ':root';
  };
  line-height : {
    default-value : 1.25;
    inherits      : true;
    target        : ':root';
  }
}
```

```css
@property --font-size {
  syntax: "<length>";
  inherits: true;
  initial-value: 16px;
}

@property --line-height {
  syntax: "<length> | <percentage>";
  inherits: true;
  initial-value: 1.25;
}

@property --canBeAnything {
  syntax: "*";
  inherits: true;
}

@property --rotation {
  syntax: "<angle>";
  inherits: false;
  initial-value: 45deg;
}

@property --defaultSize {
  syntax: "<length> | <percentage>";
  inherits: true;
  initial-value: 200px;
}
```



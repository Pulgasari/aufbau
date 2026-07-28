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

```css
@aufbau-props {
  font-size : {
    default-value : 16;
    default-unit  : px;
    
  },
  line-height :
}
```

```css
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



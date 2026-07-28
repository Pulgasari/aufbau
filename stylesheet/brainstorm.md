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

bevor wir das nächste feature einbauen, will ich dieses feature erstmal bissl planen. 

ich weiss zb nich, ob das naming optimal ist oder verbessert werden kann. hast du evtl ideen?

```css
@aufbau-snippet snippet-name {
  display: flex;
  aufbau-webfont: 'Hubot Sans';
}
@aufbau-snippet .sticky-top {
  display: position;
  top: 0;
  aufbau-colors: oled;
}
.bla {
  margin-top: 20px;
}

div {
  border: 10px solid red;
  aufbau-use: .sticky-top, snippet-name, bla;
  text-transform: uppercase;
}
```

- wenn name mit punkt beginnt, wird aus dem snippet auch ne class
- wenn name nicht mit punkt beginnt, wird daraus keine class
- man kann auch ne bestehende class bei `aufbau-use` applien: ums erstma leichter zu machen für uns, muss die class bereits definiert wurden sein im selben doc und nur der erste treffer gematcht, also wenn `.bla` 2mal definiert wurde wird das erste applied



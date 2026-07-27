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

Ich will jetzt `/stylesheet` erweitern, sodass das hier möglich wird:

```css
@aufbau-config {
  charset : utf-8;
  font    : 'Hubot Sans';
  import  : reset, default;
  themes  : monochrome, oled, zombie;
}
```

```css
@aufbau-config {
  charset : utf-8;
  font    : {
    body       : 'Hubot Sans';
    textarea   : 'JetBrains Mono';
    blockquote : 'Vollkorn';
  };
  import  : reset, default;
  theme   : oled;
  themes  : monochrome, oled, zombie;
}
```

daraus wird dann quasi:

```css
@import url('https://github.com/pulgasari/aufbau/css/reset.css');
@import url('https://github.com/pulgasari/aufbau/css/default.css');
@import url('https://github.com/pulgasari/aufbau/css/themes/monochrome.css');
@import url('https://github.com/pulgasari/aufbau/css/themes/zombie.css');
@import url('https://github.com/pulgasari/aufbau/css/themes/oled.css');

@charset "utf-8";

body { aufbau-webfont: 'Hubot Sans'; }
/* bzw. */
body       { aufbau-webfont: 'Hubot Sans'; }
textarea   { aufbau-webfont: 'JetBrains Mono'; }
blockquote { aufbau-webfont: 'Vollkorn'; }
```

- `import` importiert die files in reihenfolge wie angegeben
- `themes` ebenfalls aber wenn `theme` angegeben ist kommt dieses zuletzt (quasi das default-theme)  
- wir bauen das am besten als weitere file in `/stylesheet/skills/config.js`, müssen aber schauen, ob wir dann auch an anderer stelle im package noch was anpassen müssen. also vorher die files des packages gut anschauen.
- um die weitere verarbeitung von `aufbau-webfont` kümmert sich dann das jeweilige andere skill


```css
@aufbau-config {
  charset : utf-8;
  font    : {
    default   : 'Hubot Sans';
    monospace : 'JetBrains Mono';
  };
  import  : reset, default;
  themes  : monochrome, oled, zombie;
}
```



```css
@charset "utf-8";
```

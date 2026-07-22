# aufbau

https://pulgasari.github.io/aufbau/

```md
@layout :: header => flex column center spaced
@layout :: footer => flex column center center
```

```css
@matrix :: .btn-* [bg fg padding border shadow]
default  : #1e1e2e      #ffffff  (10px 20px)  none                 none
primary  : #5865f2      -        (12px 24px)  -                    -
outline  : transparent  #5865f2  -            (2px solid #5865f2)  -
floating : #eb459e      -        (14px 28px)  -                    (0 8px 16px #0003)
```

```css
@matrix .hljs-* < fg font.style font.weight >
attr     #50fa7b  italic  -
bullet   #f1fa8c  -       -
doctag   -        -       bold
```

```css
hljs              { color: #f8f8f2; }
.hljs-attr         { color: #50fa7b; font-style: italic; font-weight: normal; }
.hljs-bullet       { color: #f1fa8c; }
.hljs-doctag       { color: inherit; font-style: normal; font-weight:   bold; }
.hljs-emphasis     { color: inherit; font-style: italic; font-weight: normal; }
.hljs-keyword      { color: #ff79c6; font-style: normal; font-weight:   bold; }
.hljs-literal      { color: #bd93f9; font-style: normal; font-weight:   bold; }  
.hljs-meta         { color: #f1fa8c; }
.hljs-meta-keyword { color: #50fa7b; font-style: italic; font-weight: normal; }
.hljs-name         { color: #f1fa8c; font-style: normal; font-weight:   bold; }
.hljs-number       { color: #bd93f9; font-style: normal; font-weight: normal; }  
.hljs-section      { color: inherit; font-style: normal; font-weight:   bold; }
.hljs-selector-tag { color: inherit; font-style: normal; font-weight:   bold; }
.hljs-string       { color: #f1fa8c; }
.hljs-strong       { color: inherit; font-style: normal; font-weight:   bold; }
.hljs-subst        { color: #f8f8f2; }
.hljs-symbol       { color: #f1fa8c; }
.hljs-title        { color: #50fa7b; font-style: italic; font-weight:   bold; }
.hljs-type         { color: #f1fa8c; font-style: normal; font-weight:   bold; }
```

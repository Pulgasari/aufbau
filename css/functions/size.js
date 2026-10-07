/*//////////// SPACE AND SIZE ////////////*/

/* multiples of --unit, as a number or by name: --space(4) and --space(normal)
   are both 1rem with the default 0.25rem. the keywords are part of the type,
   an unknown one falls back to the default instead of invalidating the value */
@function --space(
  --size type(<number> | tiny | small | normal | large | huge) : normal
) returns <length> {
  --steps: if(
    style(--size: tiny)   :  1; /* 0.25rem */
    style(--size: small)  :  2; /* 0.5rem  */
    style(--size: normal) :  4; /* 1rem    */
    style(--size: large)  :  6; /* 1.5rem  */
    style(--size: huge)   : 10; /* 2.5rem  */
    else                  : var(--size);
  );
  result: calc(var(--unit, 0.25rem) * var(--steps));
}

/* a modular scale: --step(0) is the base, every step --ratio times more.
   font sizes and larger spaces off one ratio */
@function --step(--n <number> : 0) returns <length> {
  result: calc(var(--base-size, 1rem) * pow(var(--ratio, 1.25), var(--n)));
}

/* grows from --min at --from wide to --max at --to wide, clamped outside */
@function --fluid(
  --min  <length> :  1rem,
  --max  <length> :  2rem,
  --from <length> : 20rem,
  --to   <length> : 80rem
) returns <length> {
  result: clamp(
    var(--min),
    calc(var(--min) + (var(--max) - var(--min)) * (100vw - var(--from)) / (var(--to) - var(--from))),
    var(--max)
  );
}

/* line height for a --step: large type sits tighter */
@function --leading(--n <number> : 0) returns <number>
{ result: clamp(1.1, 1.55 - var(--n) * 0.08, 1.7); }

/* letter spacing for a --step: large type a little tighter, small a little wider */
@function --tracking(--n <number> : 0) returns <length>
{ result: calc(var(--n) * -0.012em); }

/* a readable line length, never wider than the parent */
@function --measure(--characters <number> : 65) returns <length-percentage>
{ result: min(100%, calc(var(--characters) * 1ch)); }

/*
the side padding that centers --width content in a full width parent, at least --minimum.
for full bleed layouts: padding-inline: --gutter(60rem) 
*/
@function --gutter(
  --width   <length> : 60rem,
  --minimum <length> : 1rem
) returns <length-percentage> {
  result: max(var(--minimum), (100% - var(--width)) / 2);
}

/* a touch target no smaller than --minimum, 44px is the platform guideline */
@function --tap(
  --size    <length> : 2rem,
  --minimum <length> : 44px
) returns <length> {
  result: max(var(--size), var(--minimum));
}

/* a safe area inset plus --extra: padding-top: --safe(top, 1rem) */
@function --safe(
  --side  type(top | right | bottom | left) : top,
  --extra <length>                         : 0px
) returns <length> {
  result: if(
    style(--side: right)  : calc(env(safe-area-inset-right,  0px) + var(--extra));
    style(--side: bottom) : calc(env(safe-area-inset-bottom, 0px) + var(--extra));
    style(--side: left)   : calc(env(safe-area-inset-left,   0px) + var(--extra));
    else                  : calc(env(safe-area-inset-top,    0px) + var(--extra));
  );
}

/* px written as rem, so the size follows the user's font setting */
@function --rem(--pixels <number> : 16) returns <length> {
  result: calc(var(--pixels) / 16 * 1rem);
}

/* between --from and --to by --progress, 0 to 1 */
@function --lerp(
  --from     <length-percentage> : 0px,
  --to       <length-percentage> : 1rem,
  --progress <number>            : 0.5
) returns <length-percentage> {
  result: calc(var(--from) + (var(--to) - var(--from)) * var(--progress));
}

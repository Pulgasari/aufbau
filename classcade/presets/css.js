// @classcade/presets/css

this.add({ id, kind: 'alias-prop', ref }); // definePropAlias
this.add({ id, kind: 'alias-fn',   ref }); // defineFnAlias
this.add({ id, kind: 'variant-media',  query    : def.media  });
this.add({ id, kind: 'variant-prefix', selector : def.prefix });
this.add({ id, kind: 'variant-suffix', selector : def.suffix });

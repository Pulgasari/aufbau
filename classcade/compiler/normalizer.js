// @classcade/compiler/normalizer.js

export class Normalizer {
  
  static kind (kind) {
    return {
      // alias-fn
      'alias-fn' : 'alias-fn',
      'aliasFn'  : 'alias-fn',
      'fn'       : 'alias-fn',
      // alias-prop
      'alias-prop' : 'alias-prop',
      'aliasProp'  : 'alias-prop',
      'prop'       : 'alias-prop',
      // variant-media
      'variant-media' : 'variant-media',
      'variantMedia'  : 'variant-media',
      'media'         : 'variant-media',
      // variant-prefix
      'variant-prefix' : 'variant-prefix',
      'variantPrefix'  : 'variant-prefix',
      'prefix'         : 'variant-prefix',
      // variant-suffix
      'variant-suffix' : 'variant-suffix',
      'variantSuffix'  : 'variant-suffix',
      'suffix'         : 'variant-suffix',
    }[kind] ?? null;
  }
  
}

export default Normalizer;

export normalize (obj) {
  if (obj.kind) return Normalizer.kind(obj.kind);
  return obj;
}

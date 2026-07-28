// cascade.js

export default class CascadeEngine {
  #matcher;
  #resolver
  #sorter;

  constructor () {
    this.#matcher  = new RuleMatcher();
    this.#sorter   = new CascadeSorter();
    this.#resolver = new StyleResolver();
  }

  compute (sheet, element) {
    const matched = [];
    for (const rule of sheet.children) {
      if (this.#matcher.match(rule, element)) {
        matched.push(rule);
      }
    }
    const sorted = this.#sorter.sort(matched);
    return this.#resolver.resolve(sorted);
  }

}

export default class CascadeSorter {
  sort (rules) {
    return rules.sort(
      (a,b) => {
        if (a.important !== b.important) {
          return (Number(b.important) - Number(a.important));
        }
        const specificity = this.compareSpecificity (a.specificity, b.specificity);
        if (specificity !== 0) return specificity;
        return a.order - b.order;
      }
    );
  }
  compareSpecificity (a,b) {
    if (a.id    !== b.id)    return b.id    - a.id;
    if (a.class !== b.class) return b.class - a.class;
    return b.type - a.type;
  }
}

export class MatchResult {
  constructor (rule, matched) {
    this.rule    = rule;
    this.matched = matched;
  }
}

export class RuleMatcher {
  match (rule, element) {
    return this.matchSelector (rule.selector, element);
  }
  matchSelector (selector, element) {
    return true;
  }
}

class StyleResolver {
  resolve (rules) {
    const result = {};
    for (const rule of rules) {
      for (const declaration of rule.children) {
        result[declaration.property] = declaration.value;
      }
    }
    return result;
  }
}




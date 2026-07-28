// cascade.js

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

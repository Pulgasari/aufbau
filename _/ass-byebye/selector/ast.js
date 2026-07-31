function createSelector (type, data = {}) {
  return { type, ...data };
}

function ComplexSelector (children) {
  return { type: "complex", children };
}

function CompoundSelector (children) {
  return { type: "compound", children };
}

function SimpleSelector (type, value) {
  return { type, value };
}

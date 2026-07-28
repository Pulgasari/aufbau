export default function CompoundSelector (
  children
) {
  return {
    type: "compound",
    children
  };
}

export default function SimpleSelector (
  type,
  value
) {
  return {
    type,
    value
  };
}

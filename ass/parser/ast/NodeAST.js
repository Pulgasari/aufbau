export default function createNodeAST (type, data = {}) {
  return {
    type,
    ...data
  };
}

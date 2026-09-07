/** Loader Node: tira `?v=` dos imports do jogo para os testes rodarem fora do browser. */
export async function resolve(specifier, context, nextResolve) {
  const q = specifier.indexOf(".js?");
  if (q !== -1) specifier = specifier.slice(0, q + 3);
  return nextResolve(specifier, context);
}

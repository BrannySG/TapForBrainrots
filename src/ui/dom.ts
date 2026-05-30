/** Tiny DOM helpers to keep UI builders terse and consistent. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function img(src: string, alt = ""): HTMLImageElement {
  const node = document.createElement("img");
  node.src = src;
  node.alt = alt;
  node.draggable = false;
  return node;
}

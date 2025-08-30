/* Selection observer + magnifier trigger */

type Listener = (payload: { text: string; rect: DOMRect }) => void;

let cleanupFns: Array<() => void> = [];

export function initSelectionMagnifier(onTrigger: Listener, opts?: { container?: HTMLElement; maxLen?: number }) {
  const container = opts?.container || document.body;
  const maxLen = opts?.maxLen ?? 40;

  function getSelectionTextAndRect(): { text: string; rect: DOMRect } | null {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const text = sel.toString().trim();
    if (!text || text.length > maxLen) return null;

    const range = sel.getRangeAt(0);
    // Ensure selection is inside container
    const containerNode = container as Node;
    const anchor = range.commonAncestorContainer;
    const anchorEl = (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement) as Element | null;
    if (!anchorEl || !containerNode.contains(anchorEl)) return null;

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return { text, rect };
  }

  const onMouseUp = () => {
    const info = getSelectionTextAndRect();
    if (!info) return;
    onTrigger(info);
  };

  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('touchend', onMouseUp);

  cleanupFns.push(() => {
    container.removeEventListener('mouseup', onMouseUp);
    container.removeEventListener('touchend', onMouseUp);
  });
}

export function disposeSelectionMagnifier() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}


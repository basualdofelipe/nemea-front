import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver, but Radix primitives (Select, etc.)
// rely on it. Provide a minimal shim so Radix-based component tests run.
class ResizeObserverShim {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (
    globalThis as unknown as { ResizeObserver: typeof ResizeObserverShim }
  ).ResizeObserver = ResizeObserverShim;
}

// jsdom does not implement scrollIntoView either; Radix Select uses it on open.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

// jsdom does not implement HTMLElement.prototype.hasPointerCapture / setPointerCapture
// used by Radix pointer interactions.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture =
      function hasPointerCapture(): boolean {
        return false;
      };
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function setPointerCapture(): void {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture =
      function releasePointerCapture(): void {};
  }
}

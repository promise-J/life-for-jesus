import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
// jsdom has no canvas implementation: previews simply skip drawing.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
window.scrollTo = () => {};

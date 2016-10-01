import createElement from '../../utils/createElement';

const styles = require('./Overlay.css');

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const MARGIN = 5;

function createOverlay() {
  const overlay = createElement();
  overlay.classList.add(styles.overlay);
  return overlay;
}

function contains(elements: Element[], target: Element) {
  for (const element of elements) {
    if (element.contains(target)) return true;
  }
  return false;
}

function calculateBoundingRect(elements: HTMLElement[]): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const element of elements) {
    const rect = element.getBoundingClientRect();

    x0 = Math.min(x0, rect.left);
    y0 = Math.min(y0, rect.top);
    x1 = Math.max(x1, rect.right);
    y1 = Math.max(y1, rect.bottom);
  }

  return { x0, y0, x1, y1 };
}

class Overlay {
  private hightlightedElements: HTMLElement[];

  private overlayFullscreen: HTMLElement;

  private overlay1: HTMLElement;
  private overlay2: HTMLElement;
  private overlay3: HTMLElement;
  private overlay4: HTMLElement;

  constructor() {
    this.overlayFullscreen = createOverlay();
    this.overlayFullscreen.classList.add(styles.fullscreen);

    this.overlay1 = createOverlay();
    this.overlay2 = createOverlay();
    this.overlay3 = createOverlay();
    this.overlay4 = createOverlay();

    this.show();
  }

  show(hightlightedElements: HTMLElement[] = null) {
    this.setHighlighedElements(hightlightedElements);

    document.body.addEventListener('mousedown', this.handleMouseDown, true);
    window.addEventListener('resize', this.handleResize);
  }

  hide() {
    this.hightlightedElements = null;

    this.overlayFullscreen.style.display = 'none';
    this.overlay1.style.display = 'none';
    this.overlay2.style.display = 'none';
    this.overlay3.style.display = 'none';
    this.overlay4.style.display = 'none';

    document.body.removeEventListener('mousedown', this.handleMouseDown, true);
    window.removeEventListener('resize', this.handleResize);
  }

  setHighlighedElements(hightlightedElements: HTMLElement[]) {
    this.hightlightedElements = hightlightedElements;
    this.render();
  }

  private renderFullscreenOverlay() {
    this.overlayFullscreen.style.display = 'block';
    this.overlay1.style.display = 'none';
    this.overlay2.style.display = 'none';
    this.overlay3.style.display = 'none';
    this.overlay4.style.display = 'none';
  }

  private renderHighlightedOverlay(hightlightedElements: HTMLElement[]) {
    this.overlayFullscreen.style.display = 'none';
    this.overlay1.style.display = 'block';
    this.overlay2.style.display = 'block';
    this.overlay3.style.display = 'block';
    this.overlay4.style.display = 'block';

    const boundingRect = calculateBoundingRect(hightlightedElements);

    const x0 = boundingRect.x0 - MARGIN;
    const y0 = boundingRect.y0 - MARGIN;
    const x1 = boundingRect.x1 + MARGIN;
    const y1 = boundingRect.y1 + MARGIN;

    this.overlay1.style.left = `${0}`;
    this.overlay1.style.top = `${0}`;
    this.overlay1.style.width = `${x0}px`;
    this.overlay1.style.height = `${y1}px`;

    this.overlay2.style.left = `${0}`;
    this.overlay2.style.top = `${y1}px`;
    this.overlay2.style.width = `${x1}px`;
    this.overlay2.style.bottom = `${0}`;

    this.overlay3.style.left = `${x1}px`;
    this.overlay3.style.top = `${y0}px`;
    this.overlay3.style.right = `${0}`;
    this.overlay3.style.bottom = `${0}`;

    this.overlay4.style.left = `${x0}px`;
    this.overlay4.style.top = `${0}`;
    this.overlay4.style.right = `${0}`;
    this.overlay4.style.height = `${y0}px`;
  }

  private render() {
    if (this.hightlightedElements) {
      this.renderHighlightedOverlay(this.hightlightedElements);
    } else {
      this.renderFullscreenOverlay();
    }
  }

  handleResize = () => {
    this.render();
  }

  handleMouseDown = (e: MouseEvent) => {
    if (!this.hightlightedElements) return;
    if (contains(this.hightlightedElements, <Element> e.target)) return;

    e.stopPropagation();
  }
}

export default Overlay;

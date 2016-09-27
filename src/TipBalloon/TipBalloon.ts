import Tether from 'tether';

const styles = require('./TipBalloon.css');

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.classList.add(styles.overlay);
  document.body.appendChild(overlay);

  return overlay;
}

class TipBalloon {
  overlay1: HTMLElement;
  overlay2: HTMLElement;
  overlay3: HTMLElement;
  overlay4: HTMLElement;

  balloon: HTMLElement;

  tether: Tether;

  constructor() {
    this.overlay1 = createOverlay();
    this.overlay2 = createOverlay();
    this.overlay3 = createOverlay();
    this.overlay4 = createOverlay();

    this.balloon = document.createElement('div');
    this.balloon.classList.add(styles.balloon);
    this.balloon.innerHTML = '<div>Click this button and see what happens!</div>';
    document.body.appendChild(this.balloon);
  }

  show() {
    this.overlay1.style.display = 'block';
    this.overlay2.style.display = 'block';
    this.overlay3.style.display = 'block';
    this.overlay4.style.display = 'block';
    this.balloon.style.display = 'block';
  }

  hide() {
    this.overlay1.style.display = 'none';
    this.overlay2.style.display = 'none';
    this.overlay3.style.display = 'none';
    this.overlay4.style.display = 'none';
    this.balloon.style.display = 'none';

    if (this.tether) {
      this.tether.destroy();
    }
  }

  makeHole(x0: number, y0: number, x1: number, y1: number) {
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

  attach(target: HTMLElement) {
    if (this.tether) {
      this.tether.destroy();
    }

    this.tether = new Tether({
      element: this.balloon,
      target,
      attachment: 'bottom right',
      targetAttachment: 'bottom left',
      offset: `0 ${16 + 6}px`,
    });
  }
}

export default TipBalloon;

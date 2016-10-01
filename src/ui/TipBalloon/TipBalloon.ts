import Tether from 'tether';

import createElement from '../../utils/createElement';

const styles = require('./TipBalloon.css');

class TipBalloon {
  balloon: HTMLElement;

  tether: Tether;

  constructor() {
    this.balloon = createElement();
    this.balloon.classList.add(styles.balloon);
    const a = document.createElement('div');
    a.classList.add(styles.arrow);
    this.balloon.innerHTML = '<div>Click this button and see what happens!</div>';
    this.balloon.appendChild(a);

    this.hide();
  }

  show(target: HTMLElement) {
    this.balloon.style.display = 'block';
    this.attach(target);
  }

  hide() {
    this.balloon.style.display = 'none';

    if (this.tether) {
      this.tether.destroy();
    }
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

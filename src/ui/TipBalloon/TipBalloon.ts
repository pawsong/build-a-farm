import Tether from 'tether';

import createElement from '../../utils/createElement';

const styles = require('./TipBalloon.css');

class TipBalloon {
  balloon: HTMLElement;
  content: HTMLElement;

  tether: Tether;

  constructor() {
    this.balloon = createElement();
    this.balloon.classList.add(styles.balloon);
    const a = document.createElement('div');
    a.classList.add(styles.arrow);
    this.balloon.appendChild(a);

    this.content = document.createElement('div');
    this.balloon.appendChild(this.content);
    this.content.innerHTML = '<div>Click this button and see what happens!</div>';

    this.hide();
  }

  show(target: HTMLElement, content: string) {
    this.balloon.style.display = 'block';
    this.attach(target, content);
  }

  hide() {
    this.balloon.style.display = 'none';

    if (this.tether) {
      this.tether.destroy();
    }
  }

  attach(target: HTMLElement, content: string) {
    this.content.innerHTML = content;

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

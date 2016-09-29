import classNames from 'classnames';
import createElement from '../../utils/createElement';
const styles = require('./LoadingSpinner.css');

const innerHTML = `<div class="${styles['sk-folding-cube']}">
  <div class="${classNames(styles['sk-cube1'], styles['sk-cube'])}"></div>
  <div class="${classNames(styles['sk-cube2'], styles['sk-cube'])}"></div>
  <div class="${classNames(styles['sk-cube4'], styles['sk-cube'])}"></div>
  <div class="${classNames(styles['sk-cube3'], styles['sk-cube'])}"></div>
</div>`;

class LoadingSpinner {
  private root: HTMLElement;

  constructor() {
    this.root = createElement();
    this.root.classList.add(styles.root);
    this.root.innerHTML = innerHTML;
  }

  show() {
    if (!this.root.parentElement) {
      document.body.appendChild(this.root);
    }
  }

  hide() {
    if (this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
  }
}

export default LoadingSpinner;

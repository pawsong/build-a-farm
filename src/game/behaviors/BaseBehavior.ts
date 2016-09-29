import React from 'react';
import Character from '../Character';
import Behavior from './Behavior';

class BaseBehavior extends Behavior{
  me: Character;
  locks: Set<string>;

  constructor(me: Character) {
    super();
    this.me = me;
    this.locks = new Set();
  }

  lock(key: string) {
    if (this.locks.has(key)) return false;
    this.locks.add(key);
    return true;
  }

  unlock(key: string) {
    this.locks.delete(key);
  }

  protected sendMessage(target: Character, message: React.ReactNode) {
    return new Promise(resolve => target.emit('message', this.me, message, resolve));
  }
}

export default BaseBehavior;

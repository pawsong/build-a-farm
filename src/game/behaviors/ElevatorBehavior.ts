import Character from '../Character';
import BaseBehavior from './BaseBehavior';

enum ElevatorState {
  STAY_BOTTOM,
  GOING_UP,
  STAY_TOP,
  GOING_DOWN,
}

const MAX_SPEED = 3;
const ACC = 3;
const WAIT_TIME = 1000 * 3;

const STOP_ELAPSED_TIME = MAX_SPEED / ACC;
const STOP_DISTANCE = STOP_ELAPSED_TIME * (MAX_SPEED - 0.5 * ACC * STOP_ELAPSED_TIME);
const POSITION_TOP = 16 - STOP_DISTANCE;
const POSITION_BOTTOM = 0.5 + STOP_DISTANCE;

function decreaseSpeed(speed: number, dt: number) {
  return speed > 0
    ? speed - Math.min(  speed, ACC * dt / 1000)
    : speed + Math.min(- speed, ACC * dt / 1000);
}

class ElevatorBehavior extends BaseBehavior {
  state: ElevatorState;
  stayRemain: number;

  constructor(me: Character) {
    super(me);
    this.stayRemain = WAIT_TIME;
    this.state = ElevatorState.STAY_BOTTOM;
  }

  onTick(dt: number) {
    switch(this.state) {
      case ElevatorState.STAY_BOTTOM: {
        if (this.me.physics.velocity[1] !== 0) {
          this.me.physics.velocity[1] = decreaseSpeed(this.me.physics.velocity[1], dt);
        }

        this.stayRemain -= dt;
        if (this.stayRemain < 0) {
          this.state = ElevatorState.GOING_UP;
        }
        break;
      }
      case ElevatorState.GOING_UP: {
        if (this.me.physics.velocity[1] < MAX_SPEED) {
          // TODO: Use phyiscs.addForce API
          this.me.physics.velocity[1] += MAX_SPEED * dt / 1000;
        }

        if (this.me.physics.aabb.center[1] >= POSITION_TOP) {
          this.stayRemain = WAIT_TIME;
          // this.me.physics.velocity[1] = 0;
          this.state = ElevatorState.STAY_TOP;
        }
        break;
      }
      case ElevatorState.STAY_TOP: {
        if (this.me.physics.velocity[1] !== 0) {
          this.me.physics.velocity[1] = decreaseSpeed(this.me.physics.velocity[1], dt);
        }

        this.stayRemain -= dt;
        if (this.stayRemain < 0) {
          this.state = ElevatorState.GOING_DOWN;
        }
        break;
      }
      case ElevatorState.GOING_DOWN: {
        if (this.me.physics.velocity[1] > - MAX_SPEED) {
          // TODO: Use phyiscs.addForce API
          this.me.physics.velocity[1] -= MAX_SPEED * dt / 1000;
        }

        if (this.me.physics.aabb.center[1] <= POSITION_BOTTOM) {
          this.stayRemain = WAIT_TIME;
          // this.me.physics.velocity[1] = 0;
          this.state = ElevatorState.STAY_BOTTOM;
        }
        break;
      }
    }
  }
}

export default ElevatorBehavior;

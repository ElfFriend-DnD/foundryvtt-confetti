import { MODULE_ID } from '../constants';
import { log, random } from '../helpers';
//@ts-ignore
import { gsap, TweenLite, Power4, Physics2DPlugin } from '/scripts/greensock/esm/all.js';
//@ts-ignore
gsap.registerPlugin(Physics2DPlugin);

const DECAY = 4;
const SPREAD = 50;
const GRAVITY = 1200;

type Sprite = {
  angle: number;
  velocity: number;
  x: number;
  y: number;
  r: number;
  d: number;
  color: string;
  tilt: number;
  tiltAngleIncremental: number;
  tiltAngle: number;
};

export enum ConfettiStrength {
  'low' = 0,
  'med' = 1,
  'high' = 2,
}

/**
 * Stolen right from Dice so Nice
 * https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/blob/master/module/main.js
 * Main class to handle ~~3D Dice~~ Confetti animations.
 */
export class Confetti {
  canvas: JQuery<HTMLCanvasElement>;
  confettiSprites: Record<string, Sprite>;
  ctx: CanvasRenderingContext2D;
  dpr: number;

  static get DEFAULT_OPTIONS() {
    return {
      enabled: true,
      sounds: true,
      soundsVolume: 0.5,
    };
  }

  static CONFIG() {
    return mergeObject(Confetti.DEFAULT_OPTIONS, game.settings.get(MODULE_ID, 'settings'));
  }

  /**
   * Create and initialize a new Confetti.
   */
  constructor() {
    Hooks.call(`${MODULE_ID}Init`, this);
    this.dpr = canvas.app.renderer.resolution ?? window.devicePixelRatio ?? 1;

    this._buildCanvas();
    this._initListeners();
    this.confettiSprites = {};
  }

  /**
   * Create and inject the confetti canvas resizing to the window total size.
   *
   * @private
   */
  _buildCanvas() {
    const sidebarWidth = $('#sidebar').width();
    this.canvas = $('<canvas id="confetti-canvas" style="position: absolute; left: 0; top: 0;pointer-events: none;">');
    this.canvas.css('z-index', 2000);
    this.canvas.appendTo($('body'));

    const width = window.innerWidth - sidebarWidth * this.dpr;
    const height = window.innerHeight * this.dpr;

    // set all the heights and widths
    this.canvas.width(window.innerWidth - sidebarWidth + 'px');
    this.canvas.height(window.innerHeight - 1 + 'px');
    this.canvas[0].width = width * this.dpr;
    this.canvas[0].height = height * this.dpr;

    log(false, {
      dpr: this.dpr,
      canvas: this.canvas,
      canvasDims: {
        width: this.canvas.width(),
        height: this.canvas.height(),
      },
    });

    this.ctx = this.canvas[0].getContext('2d');

    this.ctx.beginPath();
    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = 'red';
    this.ctx.rect(this.canvas.width() / 2, this.canvas.height() / 2, 150, 100);
    this.ctx.stroke();
  }

  /**
   * Init listeners on windows resize and on click if auto hide has been disabled within the settings.
   *
   * @private
   */
  _initListeners() {
    game.socket.on(`module.${MODULE_ID}`, (request) => {
      // if (!request.users || request.users.includes(game.user.id)) {
      //     this.show(request.data, game.users.get(request.user));
      // }
    });
  }

  addConfettiParticles({
    amount,
    angle,
    velocity,
    sourceX,
    sourceY,
  }: {
    amount: number;
    angle: number;
    velocity: number;
    sourceX: number;
    sourceY: number;
  }) {
    log(false, {});
    let i = 0;
    while (i < amount) {
      // sprite
      const r = random(4, 6) * this.dpr;
      const d = random(15, 25) * this.dpr;

      const cr = random(50, 255);
      const cg = random(50, 200);
      const cb = random(50, 200);
      const color = `rgb(${cr}, ${cg}, ${cb})`;

      const tilt = random(10, -10);
      const tiltAngleIncremental = random(0.07, 0.05);
      const tiltAngle = 0;

      const id = randomID(); // foundry core
      const sprite: Sprite = {
        angle,
        velocity,
        x: sourceX,
        y: sourceY,
        r,
        d,
        color,
        tilt,
        tiltAngleIncremental,
        tiltAngle,
      };

      this.confettiSprites = {
        ...this.confettiSprites,
        [id]: sprite,
      };

      log(false, 'addConfettiParticles', {
        sprite,
        confettiSprites: this.confettiSprites,
      });

      this.tweenConfettiParticle(id);
      i++;
    }
  }

  tweenConfettiParticle(spriteId: string) {
    const minAngle = this.confettiSprites[spriteId].angle - SPREAD / 2;
    const maxAngle = this.confettiSprites[spriteId].angle + SPREAD / 2;

    const minVelocity = this.confettiSprites[spriteId].velocity / 4;
    const maxVelocity = this.confettiSprites[spriteId].velocity;

    // Physics Props
    const velocity = random(minVelocity, maxVelocity);
    const angle = random(minAngle, maxAngle);
    const gravity = GRAVITY;
    // const friction = random(0.1, 0.25);
    const friction = random(0.01, 0.05);
    const d = 0;

    TweenLite.to(this.confettiSprites[spriteId], DECAY, {
      physics2D: {
        velocity,
        angle,
        gravity,
        friction,
      },
      d,
      ease: Power4.easeIn,
      onComplete: () => {
        // remove confetti sprite and id
        delete this.confettiSprites[spriteId];

        log(false, 'tween complete', {
          spriteId,
          confettiSprites: this.confettiSprites,
        });

        if (Object.keys(this.confettiSprites).length === 0) {
          log(false, 'all tweens complete');
          this.clearConfetti();
          canvas.app.ticker.remove(this.render, this);
        }
      },
    });
  }

  // randomize the confetti particle for the next frame
  updateConfettiParticle(spriteId: string) {
    const sprite = this.confettiSprites[spriteId];

    const tiltAngle = 0.0005 * sprite.d;

    sprite.angle += 0.01;
    sprite.tiltAngle += tiltAngle;
    sprite.tiltAngle += sprite.tiltAngleIncremental;
    sprite.tilt = Math.sin(sprite.tiltAngle - sprite.r / 2) * sprite.r * 2;
    sprite.y += Math.sin(sprite.angle + sprite.r / 2) * 2;
    sprite.x += Math.cos(sprite.angle) / 2;
  }

  clearConfetti() {
    log(false, 'clearConfetti');
    this.ctx.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
  }

  drawConfetti() {
    log(false, 'drawConfetti');
    // map over the confetti sprites
    Object.keys(this.confettiSprites).map((spriteId) => {
      const sprite = this.confettiSprites[spriteId];

      this.ctx.beginPath();
      this.ctx.lineWidth = sprite.d / 2;
      this.ctx.strokeStyle = sprite.color;
      this.ctx.moveTo(sprite.x + sprite.tilt + sprite.r, sprite.y);
      this.ctx.lineTo(sprite.x + sprite.tilt, sprite.y + sprite.tilt + sprite.r);
      this.ctx.stroke();

      this.updateConfettiParticle(spriteId);
    });
  }

  render() {
    log(false, 'render', {
      ctx: this.ctx,
    });

    // first clear the board
    this.clearConfetti();

    // draw the sprites
    this.drawConfetti();
  }

  /**
   * use canvas.app.ticker instance from PIXI instead of our own requestAnimationFrame
   */
  shootConfetti({ strength }: { strength: ConfettiStrength }) {
    log(false, 'shootConfetti');

    canvas.app.ticker.add(this.render, this);

    const commonConfettiParticleProperties = {
      amount: 100,
      velocity: 2000,
      sourceY: this.canvas.height(),
    };

    switch (strength) {
      case ConfettiStrength.high:
        commonConfettiParticleProperties.amount = 200;
        commonConfettiParticleProperties.velocity = 3000;
        break;
      case ConfettiStrength.low:
        commonConfettiParticleProperties.amount = 50;
        commonConfettiParticleProperties.velocity = 1000;
        break;
      default:
        break;
    }

    // bottom left
    this.addConfettiParticles({
      ...commonConfettiParticleProperties,
      angle: -80,
      sourceX: 0,
    });

    // bottom right
    this.addConfettiParticles({
      ...commonConfettiParticleProperties,
      angle: -100,
      sourceX: this.canvas.width(),
    });
  }
}

import { ConfettiStrength, MODULE_ID, MySettings, SOUNDS } from '../constants';
import { log, random } from '../helpers';
//@ts-ignore
import { gsap, TweenLite, Power4, Physics2DPlugin } from '../../../../scripts/greensock/esm/all.js';
//@ts-ignore
gsap.registerPlugin(Physics2DPlugin);

const DECAY = 3;
const SPREAD = 50;
const GRAVITY = 1200;

export interface ShootConfettiProps {
  amount: number;
  velocity: number;
  sound: string;
}

interface AddConfettiParticleProps extends ShootConfettiProps {
  angle: number;
  sourceX: number;
  sourceY: number;
}

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

/**
 * Stolen right from Dice so Nice and butchered
 * https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/blob/master/module/main.js
 * Main class to handle ~~3D Dice~~ Confetti animations.
 */
export class Confetti {
  confettiCanvas: JQuery<HTMLCanvasElement>;
  confettiSprites: Record<string, Sprite>;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  _rtime: Date; // used to keep track of resize
  _timeout: boolean; // used in resize
  _lastShot: Date; // used to prevent rapid fire

  /**
   * Create and initialize a new Confetti.
   */
  constructor() {
    this.dpr = canvas.app.renderer.resolution ?? window.devicePixelRatio ?? 1;

    this._buildCanvas();
    this._initListeners();
    this.confettiSprites = {};
    this._lastShot = new Date();

    game.audio.pending.push(this._preloadSounds.bind(this));

    window[MODULE_ID] = {
      confettiStrength: ConfettiStrength,
      getShootConfettiProps: Confetti.getShootConfettiProps,
      handleShootConfetti: this.handleShootConfetti.bind(this),
      shootConfetti: this.shootConfetti.bind(this),
    };
    Hooks.call(`${MODULE_ID}Ready`, this);
  }

  /**
   * Create and inject the confetti canvas.
   *
   * @private
   */
  _buildCanvas() {
    this.confettiCanvas = $(
      '<canvas id="confetti-canvas" style="position: absolute; left: 0; top: 0;pointer-events: none;">'
    );
    this.confettiCanvas.css('z-index', 2000);
    this.confettiCanvas.appendTo($('body'));

    log(false, {
      dpr: this.dpr,
      confettiCanvas: this.confettiCanvas,
      canvasDims: {
        width: this.confettiCanvas.width(),
        height: this.confettiCanvas.height(),
      },
    });

    this.resizeConfettiCanvas();

    this.ctx = this.confettiCanvas[0].getContext('2d');
  }

  /**
   * Init listeners on windows resize and socket.
   *
   * @private
   */
  _initListeners() {
    (game.socket as any).on(`module.${MODULE_ID}`, (request: { data: ShootConfettiProps }) => {
      log(false, 'got socket connection', {
        request,
      });
      this.handleShootConfetti(request.data);
    });

    this._rtime;
    this._timeout = false;

    $(window).on('resize', () => {
      log(false, 'RESIIIIIIZING');
      this._rtime = new Date();
      if (this._timeout === false) {
        this._timeout = true;
        setTimeout(this._resizeEnd.bind(this), 1000);
      }
    });
  }

  /**
   * Preload sounds so they're ready to play
   */
  _preloadSounds() {
    return Object.values(SOUNDS).map((soundPath) => () =>
      AudioHelper.play(
        {
          src: soundPath,
          autoplay: false,
          volume: 0,
          loop: false,
        },
        false
      )
    );
  }

  /**
   * Resize to the window total size.
   *
   */
  resizeConfettiCanvas() {
    const width = window.innerWidth * this.dpr;
    const height = window.innerHeight * this.dpr;
    // set all the heights and widths
    this.confettiCanvas.width(window.innerWidth + 'px');
    this.confettiCanvas.height(window.innerHeight - 1 + 'px');
    this.confettiCanvas[0].width = width;
    this.confettiCanvas[0].height = height;
  }

  _resizeEnd() {
    if (new Date().getTime() - this._rtime.getTime() < 1000) {
      setTimeout(this._resizeEnd.bind(this), 1000);
    } else {
      log(false, 'resize probably ended');
      this._timeout = false;
      //resize ended probably, lets resize the canvas dimensions
      this.resizeConfettiCanvas();
    }
  }

  /**
   * Adds a given number of confetti particles and kicks off the tweening magic
   *
   * @param {AddConfettiParticleProps} confettiParticleProps
   */
  addConfettiParticles({ amount, angle, velocity, sourceX, sourceY }: AddConfettiParticleProps) {
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

  /**
   * Clear the confettiCanvas
   */
  clearConfetti() {
    log(false, 'clearConfetti');
    this.ctx.clearRect(0, 0, this.confettiCanvas[0].width, this.confettiCanvas[0].height);
  }

  /**
   * Draw a frame of the animation.
   */
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

  /**
   * Get ShootConfettiProps from strength
   * @param {(1|2|3)} strength
   */
  static getShootConfettiProps(strength: ConfettiStrength): ShootConfettiProps {
    const shootConfettiProps: ShootConfettiProps = {
      amount: 100,
      velocity: 2000,
      sound: SOUNDS[strength],
    };

    switch (strength) {
      case ConfettiStrength.high:
        shootConfettiProps.amount = 200;
        shootConfettiProps.velocity = 3000;
        break;
      case ConfettiStrength.low:
        shootConfettiProps.amount = 50;
        shootConfettiProps.velocity = 1000;
        break;
      default:
        break;
    }

    log(false, 'getShootConfettiProps returned', {
      strength,
      shootConfettiProps,
    });

    return shootConfettiProps;
  }

  /**
   * Fires Confetti on the Local instance of Confetti
   * @param {ShootConfettiProps} shootConfettiProps
   */
  handleShootConfetti({ amount, ...shootConfettiProps }: ShootConfettiProps) {
    log(false, 'handleShootConfetti', {
      shootConfettiProps,
      ticker: canvas.app.ticker.count,
    });

    const confettiMultiplier = game.settings.get(MODULE_ID, MySettings.ConfettiMultiplier);
    const mute = game.settings.get(MODULE_ID, MySettings.Mute);

    canvas.app.ticker.add(this.render, this);

    if (!mute) {
      AudioHelper.play({ src: shootConfettiProps.sound, volume: 0.8, autoplay: true, loop: false }, true);
    }

    // bottom left
    this.addConfettiParticles({
      amount: amount * confettiMultiplier,
      angle: -70,
      sourceX: 0,
      sourceY: this.confettiCanvas[0].height,
      ...shootConfettiProps,
    });

    // bottom right
    this.addConfettiParticles({
      amount: amount * confettiMultiplier,
      angle: -110,
      sourceX: this.confettiCanvas[0].width - $('#sidebar').width() * this.dpr,
      sourceY: this.confettiCanvas[0].height,
      ...shootConfettiProps,
    });
  }

  /**
   * Clear the old frame and render a new one.
   */
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
   * Emit a socket message to all users with the ShootConfettiProps
   * Also fire confetti on this screen
   * @param {ShootConfettiProps} shootConfettiProps
   */
  shootConfetti(shootConfettiProps: ShootConfettiProps) {
    const socketProps = { data: shootConfettiProps };

    const now = new Date();
    const rapidFireLimit = game.settings.get(MODULE_ID, MySettings.RapidFireLimit);
    if (rapidFireLimit && (this._lastShot.getTime() + rapidFireLimit * 1000 > now.getTime())) {
      log(false, 'shootConfetti prevented by rapid fire setting');
      return;
    } else {
      this._lastShot = now;
    }

    log(false, 'shootConfetti, emitting socket', {
      shootConfettiProps,
      socketProps,
    });

    this.handleShootConfetti(socketProps.data);

    (game.socket as any).emit(`module.${MODULE_ID}`, socketProps);
  }

  /**
   * GSAP Magic. Does things involving gravity, velocity, and other forces a mere
   * mortal cannot hope to understand.
   * Taken pretty directly from: https://codepen.io/elifitch/pen/apxxVL
   *
   * @param spriteId
   */
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

  /**
   * Randomize a given sprite for the next frame
   * @param spriteId
   */
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
}

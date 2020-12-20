// const DECAY = 4;
// const SPREAD = 50;
// const GRAVITY = 1200;

// let angle = 270;
// let shoot = false;

// let dpr = window.devicePixelRatio || 1;
// const tada = document.getElementById('tada');
// const shaker = document.getElementById('shaker');
// const intro = document.getElementById('intro');
// const ctx = canvas.getContext('2d');

// let confettiSpriteIds = [];
// let confettiSprites = {};

// ctx.scale(dpr, dpr);

// function setupListeners() {
//   // Use TweenLite tick event for the render loop
//   TweenLite.ticker.addEventListener('tick', render);
// }

// function addConfettiParticles(amount, angle, velocity, x, y) {
//   let i = 0;
//   while (i < amount) {
//       // sprite
//       const r = _.random(4, 6) * dpr;
//       const d = _.random(15, 25) * dpr;
      
//       const cr = _.random(50, 255);
//       const cg = _.random(50, 200);
//       const cb = _.random(50, 200);
//       const color = `rgb(${cr}, ${cg}, ${cb})`;
      
//       const tilt = _.random(10, -10);
//       const tiltAngleIncremental = _.random(0.07, 0.05);
//       const tiltAngle = 0;

//       const id = _.uniqueId();
//       const sprite = {
//           [id]: {
//               angle,
//               velocity,
//               x,
//               y,
//               r,
//               d,
//               color,
//               tilt,
//               tiltAngleIncremental,
//               tiltAngle,
//           },
//       };

//       Object.assign(confettiSprites, sprite);
//       confettiSpriteIds.push(id);
//       tweenConfettiParticle(id);
//       i++;
//   }
// }

// function tweenConfettiParticle(id) {
//   const minAngle = confettiSprites[id].angle - SPREAD / 2;
//   const maxAngle = confettiSprites[id].angle + SPREAD / 2;
  
//   const minVelocity = confettiSprites[id].velocity / 4;
//   const maxVelocity = confettiSprites[id].velocity;

//   // Physics Props
//   const velocity = _.random(minVelocity, maxVelocity);
//   const angle = _.random(minAngle, maxAngle);
//   const gravity = GRAVITY;
//   // const friction = _.random(0.1, 0.25);
//   const friction = _.random(0.01, 0.05);
//   const d = 0;

//   TweenLite.to(confettiSprites[id], DECAY, {
//       physics2D: {
//           velocity,
//           angle,
//           gravity,
//           friction,
//       },
//       d,
//       ease: Power4.easeIn,
//       onComplete: () => {
//           // remove confetti sprite and id
//           _.pull(confettiSpriteIds, id);
//           delete confettiSprites[id];
//       },
//   });
// }

// function updateConfettiParticle(id) {
//   const sprite = confettiSprites[id];
  
//   const tiltAngle = 0.0005 * sprite.d;
  
//   sprite.angle += 0.01;
//   sprite.tiltAngle += tiltAngle;
//   sprite.tiltAngle += sprite.tiltAngleIncremental;
//   sprite.tilt = (Math.sin(sprite.tiltAngle - (sprite.r / 2))) * sprite.r * 2;
//   sprite.y += Math.sin(sprite.angle + sprite.r / 2) * 2;
//   sprite.x += Math.cos(sprite.angle) / 2;
// }

// function drawConfetti() {
//   confettiSpriteIds.map(id => {
//       const sprite = confettiSprites[id];
      
//       ctx.beginPath();
//       ctx.lineWidth = sprite.d / 2;
//       ctx.strokeStyle = sprite.color;
//       ctx.moveTo(sprite.x + sprite.tilt + sprite.r, sprite.y);
//       ctx.lineTo(sprite.x + sprite.tilt, sprite.y + sprite.tilt + sprite.r);
//       ctx.stroke();

//       updateConfettiParticle(id);
//   });
// }

// function render() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
  
//   drawConfetti();
// }

// function shootConfetti() {
//   requestAnimationFrame(shootConfetti);
//   if (shoot) {
//       addConfettiParticles(10, angle, 5000, canvas.width/2, canvas.height*.9);   
//   }
// }

// setupListeners();
// setCanvasSize();
// // let foo = addConfettiParticles(100, 0, 5000, window.innerWidth/2, window.innerHeight/2);

// shootConfetti();


import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
  backgroundColor: '#060614',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 900 }, debug: false }
  },
  input: {
    activePointers: 4,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);

// ── Responsive scaling ────────────────────────────────────────────
window.addEventListener('resize', () => {
  const scaleX = window.innerWidth / 800;
  const scaleY = window.innerHeight / 450;
  const scale  = Math.min(scaleX, scaleY);
  game.canvas.style.width  = (800 * scale) + 'px';
  game.canvas.style.height = (450 * scale) + 'px';
});
window.dispatchEvent(new Event('resize'));

// ── Touch state — read by Player.update() ────────────────────────
window.touchState = { left: false, right: false, jump: false, jumpJustPressed: false };

function wireTouchBtn(id, key) {
  const el = document.getElementById(id);
  if (!el) return;

  const down = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.touchState[key] = true;
    if (key === 'jump') window.touchState.jumpJustPressed = true;
    el.classList.add('pressed');
  };
  const up = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.touchState[key] = false;
    if (key === 'jump') window.touchState.jumpJustPressed = false;
    el.classList.remove('pressed');
  };

  el.addEventListener('touchstart', down, { passive: false });
  el.addEventListener('touchend',   up,   { passive: false });
  el.addEventListener('touchcancel',up,   { passive: false });
  el.addEventListener('mousedown',  down);
  el.addEventListener('mouseup',    up);
  el.addEventListener('mouseleave', up);
}

wireTouchBtn('touch-left',  'left');
wireTouchBtn('touch-right', 'right');
wireTouchBtn('touch-jump',  'jump');

// Prevent default touch behaviours (scroll, zoom, context menu)
document.addEventListener('touchmove',    e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu',  e => e.preventDefault());

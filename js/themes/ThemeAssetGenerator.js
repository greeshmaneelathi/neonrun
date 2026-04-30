import { THEMES } from './ThemeConfig.js';

export function generateThemeAssets(scene) {
  Object.values(THEMES).forEach(theme => {
    _makeBackground(scene, theme);
    _makePlatforms(scene, theme);
    _makeEnemy(scene, theme);
    _makeObstacle(scene, theme);
    _makeGround(scene, theme);
    _makePlayer(scene, theme);
  });
}

function _makeBackground(scene, theme) {
  const W = 800, H = 450;
  const [farKey, midKey, nearKey] = theme.bgLayers;

  // Far layer - stars/bubbles/lava glow etc
  const farG = scene.make.graphics({ x: 0, y: 0, add: false });
  farG.fillStyle(Phaser.Display.Color.HexStringToColor(theme.bgColor).color, 1);
  farG.fillRect(0, 0, W, H);

  if (theme.id === 'neon') {
    // Stars
    farG.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 80; i++) {
      farG.fillCircle(Math.random()*W, Math.random()*H*0.7, Math.random()<0.2?2:1);
    }
  } else if (theme.id === 'ocean') {
    // Deep water gradient + bubbles
    farG.fillGradientStyle(0x020d1a, 0x020d1a, 0x011528, 0x011528, 1);
    farG.fillRect(0, 0, W, H);
    farG.fillStyle(0x0066aa, 0.15);
    for (let i = 0; i < 40; i++) {
      const r = 2 + Math.random()*4;
      farG.fillCircle(Math.random()*W, Math.random()*H, r);
    }
  } else if (theme.id === 'lava') {
    // Dark rock with lava glow at bottom
    farG.fillGradientStyle(0x1a0500, 0x1a0500, 0x3a0800, 0x3a0800, 1);
    farG.fillRect(0, 0, W, H);
    farG.fillStyle(0xff2200, 0.08);
    farG.fillRect(0, H*0.75, W, H*0.25);
  } else if (theme.id === 'space') {
    // Dense starfield
    farG.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 120; i++) {
      farG.fillCircle(Math.random()*W, Math.random()*H, Math.random()<0.1?2:1);
    }
    // Nebula patches
    farG.fillStyle(0x4400aa, 0.08);
    farG.fillEllipse(200, 150, 300, 200);
    farG.fillStyle(0x0044aa, 0.06);
    farG.fillEllipse(600, 280, 250, 180);
  } else if (theme.id === 'jungle') {
    // Dark canopy
    farG.fillGradientStyle(0x030d03, 0x030d03, 0x0a1a05, 0x0a1a05, 1);
    farG.fillRect(0, 0, W, H);
    farG.fillStyle(0x003300, 0.5);
    for (let i = 0; i < 20; i++) {
      farG.fillEllipse(Math.random()*W, Math.random()*H*0.5, 80+Math.random()*120, 60+Math.random()*80);
    }
  }
  farG.generateTexture(farKey, W, H);
  farG.destroy();

  // Mid layer - cityscape/reef/mountains/station/ruins
  const midG = scene.make.graphics({ x: 0, y: 0, add: false });
  if (theme.id === 'neon') {
    // City buildings
    _drawBuildings(midG, W, H, 0x0a0a1e, 0x00f5ff, 0.3);
  } else if (theme.id === 'ocean') {
    // Coral reef silhouette
    midG.fillStyle(0x004466, 0.6);
    for (let x = 0; x < W; x += 30) {
      const h = 40 + Math.random()*80;
      midG.fillRect(x, H - h, 20, h);
      midG.fillEllipse(x+10, H-h, 30, 30);
    }
  } else if (theme.id === 'lava') {
    // Volcanic mountains
    midG.fillStyle(0x1a0800, 0.8);
    const peaks = [[0,200],[120,80],[280,140],[400,60],[560,120],[700,90],[800,180]];
    midG.fillPoints(peaks.map(([x,y]) => ({ x, y: H - y })), true);
    midG.fillStyle(0xff2200, 0.12);
    midG.fillRect(0, H-30, W, 30);
  } else if (theme.id === 'space') {
    // Space station structures
    midG.fillStyle(0x111133, 0.7);
    [[60,120,40,180],[200,80,60,160],[420,100,50,170],[600,90,40,180],[720,110,50,165]].forEach(([x,w,offset,h]) => {
      midG.fillRect(x, H-h, w, h);
      midG.lineStyle(1, 0x4444aa, 0.4);
      midG.strokeRect(x, H-h, w, h);
      // windows
      midG.fillStyle(0x4466ff, 0.5);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        if (Math.random()>0.3) midG.fillRect(x+8+c*14, H-h+10+r*20, 8, 10);
      }
      midG.fillStyle(0x111133, 0.7);
    });
  } else if (theme.id === 'jungle') {
    // Ancient ruins silhouette
    midG.fillStyle(0x0d2a0d, 0.7);
    [[0,120,80],[100,160,60],[220,100,50],[340,180,70],[480,130,55],[620,150,65],[720,110,80]].forEach(([x,h,w]) => {
      midG.fillRect(x, H-h, w, h);
      // temple steps
      for (let s = 0; s < 3; s++) {
        midG.fillRect(x+s*5, H-h+s*15, w-s*10, 15);
      }
    });
    // Vines
    midG.lineStyle(2, 0x225522, 0.5);
    for (let i = 0; i < 8; i++) {
      const vx = Math.random()*W;
      midG.lineBetween(vx, 0, vx+20, H);
    }
  }
  midG.generateTexture(midKey, W, H);
  midG.destroy();

  // Near layer (atmosphere effects)
  const nearG = scene.make.graphics({ x: 0, y: 0, add: false });
  if (theme.id === 'ocean') {
    // Light rays
    nearG.fillStyle(0x0088ff, 0.04);
    for (let i = 0; i < 5; i++) {
      const x = i * 180 + 40;
      nearG.fillTriangle(x, 0, x+60, 0, x+30, H);
    }
  } else if (theme.id === 'lava') {
    // Heat shimmer particles at bottom
    nearG.fillStyle(0xff4400, 0.06);
    for (let i = 0; i < 20; i++) {
      nearG.fillEllipse(Math.random()*W, H-20-Math.random()*60, 10+Math.random()*20, 20+Math.random()*40);
    }
  } else if (theme.id === 'space') {
    // Distant planet
    nearG.fillStyle(0x334488, 0.25);
    nearG.fillCircle(680, 80, 55);
    nearG.fillStyle(0x2233aa, 0.15);
    nearG.fillEllipse(680, 95, 130, 18);
  } else if (theme.id === 'jungle') {
    // Foreground leaves
    nearG.fillStyle(0x1a4a1a, 0.4);
    for (let i = 0; i < 12; i++) {
      const x = Math.random()*W, y = Math.random()*H*0.3;
      nearG.fillEllipse(x, y, 60+Math.random()*80, 30+Math.random()*40);
    }
  }
  nearG.generateTexture(nearKey, W, H);
  nearG.destroy();
}

function _drawBuildings(g, W, H, fill, stroke, alpha) {
  const buildings = [[0,60,120],[70,40,80],[120,70,160],[200,50,100],[260,80,140],[350,45,90],[405,65,170],[480,55,110],[545,75,130],[630,50,95],[690,60,150],[760,40,85]];
  buildings.forEach(([x,w,h]) => {
    g.fillStyle(fill);
    g.fillRect(x, H-h, w, h);
    g.lineStyle(1, stroke, alpha);
    g.strokeRect(x, H-h, w, h);
    g.fillStyle(stroke, 0.35);
    for (let r = 0; r < Math.floor(h/18); r++) for (let c = 0; c < Math.floor(w/14); c++) {
      if (Math.random()>0.4) g.fillRect(x+4+c*14, H-h+8+r*18, 6, 8);
    }
  });
}

function _makePlatforms(scene, theme) {
  // Normal platform
  const pg = scene.make.graphics({ x: 0, y: 0, add: false });
  pg.fillStyle(theme.platformFill);
  pg.fillRect(0, 0, 64, 18);
  pg.lineStyle(2, theme.platformColor, 1);
  pg.strokeRect(0, 0, 64, 18);
  pg.fillStyle(theme.platformColor, 0.15);
  pg.fillRect(2, 2, 60, 6);

  // Theme-specific details
  if (theme.id === 'ocean') {
    pg.fillStyle(0x00ffaa, 0.3);
    for (let i = 0; i < 4; i++) pg.fillCircle(8+i*16, 9, 3);
  } else if (theme.id === 'lava') {
    pg.fillStyle(0xff6600, 0.4);
    pg.fillRect(0, 14, 64, 4);
  } else if (theme.id === 'space') {
    pg.fillStyle(0x8888ff, 0.2);
    for (let i = 0; i < 3; i++) pg.fillRect(4+i*22, 6, 16, 6);
  } else if (theme.id === 'jungle') {
    pg.fillStyle(0x88ff44, 0.3);
    pg.fillRect(0, 0, 64, 4);
  }
  pg.generateTexture(`platform_${theme.id}`, 64, 18);
  pg.destroy();

  // Float platform
  const fg = scene.make.graphics({ x: 0, y: 0, add: false });
  fg.fillStyle(theme.floatFill);
  fg.fillRect(0, 0, 64, 14);
  fg.lineStyle(2, theme.floatColor, 1);
  fg.strokeRect(0, 0, 64, 14);
  fg.fillStyle(theme.floatColor, 0.15);
  fg.fillRect(2, 2, 60, 5);
  fg.generateTexture(`platform_float_${theme.id}`, 64, 14);
  fg.destroy();

  // Ground tile
  const gg = scene.make.graphics({ x: 0, y: 0, add: false });
  gg.fillStyle(theme.groundColor);
  gg.fillRect(0, 0, 800, 20);
  gg.lineStyle(3, theme.groundLine, 1);
  gg.lineBetween(0, 0, 800, 0);
  gg.fillStyle(theme.groundLine, 0.08);
  gg.fillRect(0, 0, 800, 20);
  gg.lineStyle(1, theme.groundLine, 0.2);
  for (let x = 0; x < 800; x += 40) gg.lineBetween(x, 0, x, 20);
  gg.generateTexture(`ground_${theme.id}`, 800, 20);
  gg.destroy();

  // Coin (theme-tinted)
  const cg = scene.make.graphics({ x: 0, y: 0, add: false });
  cg.fillStyle(theme.id === 'lava' ? 0xffaa00 : theme.id === 'ocean' ? 0x00ffcc : theme.id === 'space' ? 0xaaaaff : theme.id === 'jungle' ? 0xaaff44 : 0xffee00);
  cg.fillCircle(8, 8, 7);
  cg.fillStyle(0xffffff, 0.4);
  cg.fillCircle(5, 5, 2);
  cg.generateTexture(`coin_${theme.id}`, 16, 16);
  cg.destroy();
}

function _makeEnemy(scene, theme) {
  const eg = scene.make.graphics({ x: 0, y: 0, add: false });
  if (theme.id === 'ocean') {
    // Jellyfish
    eg.fillStyle(0x0066ff, 0.8);
    eg.fillEllipse(14, 10, 24, 16);
    eg.fillStyle(0x00ccff, 0.6);
    eg.fillEllipse(14, 8, 18, 12);
    // Tentacles
    eg.lineStyle(1, 0x0044cc, 0.8);
    for (let t = 0; t < 5; t++) eg.lineBetween(6+t*4, 18, 4+t*5, 28);
  } else if (theme.id === 'lava') {
    // Fireball creature
    eg.fillStyle(0xff4400);
    eg.fillCircle(14, 12, 12);
    eg.fillStyle(0xffaa00, 0.8);
    eg.fillCircle(14, 12, 8);
    eg.fillStyle(0xffff00);
    eg.fillCircle(14, 12, 4);
    // Flames
    eg.fillStyle(0xff6600, 0.7);
    eg.fillTriangle(8, 4, 14, 0, 6, 0);
    eg.fillTriangle(18, 4, 22, 0, 14, 0);
  } else if (theme.id === 'space') {
    // Robot drone
    eg.fillStyle(0x334466);
    eg.fillRect(4, 6, 20, 16);
    eg.lineStyle(1, 0x8888ff, 1);
    eg.strokeRect(4, 6, 20, 16);
    eg.fillStyle(0xff4444);
    eg.fillRect(6, 9, 6, 5);
    eg.fillRect(16, 9, 6, 5);
    // Antenna
    eg.lineStyle(2, 0x8888ff);
    eg.lineBetween(14, 6, 14, 1);
    eg.fillStyle(0x8888ff);
    eg.fillCircle(14, 1, 2);
  } else if (theme.id === 'jungle') {
    // Boulder
    eg.fillStyle(0x4a3a2a);
    eg.fillCircle(14, 14, 13);
    eg.fillStyle(0x5a4a3a, 0.6);
    eg.fillCircle(10, 10, 6);
    eg.lineStyle(1, 0x333322, 0.4);
    eg.strokeCircle(14, 14, 13);
  } else {
    // Default: spiky bot
    eg.fillStyle(theme.enemyColor);
    eg.fillRect(4, 8, 20, 14);
    eg.fillStyle(0xff6600);
    eg.fillRect(6, 10, 16, 10);
    for (let s = 0; s < 4; s++) eg.fillTriangle(5+s*6, 8, 8+s*6, 0, 11+s*6, 8);
    eg.fillStyle(0xffee00);
    eg.fillRect(7, 12, 4, 4);
    eg.fillRect(17, 12, 4, 4);
  }
  eg.generateTexture(`enemy_${theme.id}`, 28, 30);
  eg.destroy();
}

function _makeObstacle(scene, theme) {
  const og = scene.make.graphics({ x: 0, y: 0, add: false });
  if (theme.id === 'neon') {
    // Drone
    og.fillStyle(0x222244);
    og.fillRect(4, 10, 24, 10);
    og.lineStyle(1, 0x00f5ff);
    og.strokeRect(4, 10, 24, 10);
    og.fillStyle(0xff0080);
    og.fillCircle(16, 15, 4);
    // Rotors
    og.lineStyle(2, 0x00f5ff, 0.7);
    og.lineBetween(0, 8, 12, 8);
    og.lineBetween(20, 8, 32, 8);
  } else if (theme.id === 'ocean') {
    // Electric jellyfish hazard
    og.fillStyle(0x0044aa, 0.7);
    og.fillEllipse(12, 10, 22, 16);
    og.lineStyle(1, 0x00ffff, 0.9);
    og.strokeEllipse(12, 10, 22, 16);
    for (let t = 0; t < 4; t++) {
      og.lineStyle(1, 0x00ffff, 0.6);
      og.lineBetween(4+t*6, 18, 2+t*7, 28);
    }
  } else if (theme.id === 'lava') {
    // Lava geyser burst
    og.fillStyle(0xff4400);
    og.fillTriangle(12, 0, 4, 28, 20, 28);
    og.fillStyle(0xffaa00, 0.7);
    og.fillTriangle(12, 4, 7, 28, 17, 28);
    og.fillStyle(0xffff00, 0.5);
    og.fillTriangle(12, 8, 9, 28, 15, 28);
  } else if (theme.id === 'space') {
    // Asteroid
    og.fillStyle(0x443322);
    og.fillCircle(14, 14, 13);
    og.fillStyle(0x554433, 0.6);
    og.fillCircle(9, 9, 5);
    og.fillCircle(18, 17, 4);
    og.lineStyle(1, 0x332211, 0.5);
    og.strokeCircle(14, 14, 13);
  } else if (theme.id === 'jungle') {
    // Spike trap
    og.fillStyle(0x2a1a0a);
    og.fillRect(0, 20, 32, 8);
    og.fillStyle(0x8a5a2a);
    for (let i = 0; i < 5; i++) og.fillTriangle(3+i*6, 20, 6+i*6, 0, 9+i*6, 20);
  }
  og.generateTexture(`obstacle_${theme.id}`, 32, 30);
  og.destroy();
}

function _makeGround(scene, theme) {
  // Already done in _makePlatforms
}

function _makePlayer(scene, theme) {
  // Tinted player per theme (reuse base player, just generate a tinted version)
  const pg = scene.make.graphics({ x: 0, y: 0, add: false });
  pg.fillStyle(theme.platformColor);
  pg.fillRect(6, 8, 16, 14);
  pg.fillStyle(0x000020);
  pg.fillRect(9, 10, 10, 6);
  pg.fillStyle(theme.floatColor, 0.9);
  pg.fillRect(10, 11, 8, 4);
  pg.fillStyle(theme.platformColor, 0.7);
  pg.fillRect(7, 22, 5, 4);
  pg.fillRect(16, 22, 5, 4);
  pg.fillStyle(theme.floatColor);
  pg.fillRect(22, 10, 4, 8);
  pg.generateTexture(`player_${theme.id}`, 28, 28);
  pg.destroy();

  // Run frames
  [0, -2, 0, 2].forEach((off, i) => {
    const fg = scene.make.graphics({ x: 0, y: 0, add: false });
    fg.fillStyle(theme.platformColor);
    fg.fillRect(6, 8+off, 16, 14);
    fg.fillStyle(0x000020);
    fg.fillRect(9, 10+off, 10, 6);
    fg.fillStyle(theme.floatColor, 0.9);
    fg.fillRect(10, 11+off, 8, 4);
    fg.fillStyle(theme.platformColor, 0.7);
    fg.fillRect(7, 22+(i%2===0?0:2), 5, 4);
    fg.fillRect(16, 22+(i%2===0?2:0), 5, 4);
    fg.fillStyle(theme.floatColor);
    fg.fillRect(22, 10+off, 4, 8);
    fg.generateTexture(`player_run_${i}_${theme.id}`, 28, 28);
    fg.destroy();
  });
}

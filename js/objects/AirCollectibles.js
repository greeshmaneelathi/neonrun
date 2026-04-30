export const AIR_COLLECTIBLE_TYPES = {
  boost:   { key: 'air_boost',   label: 'BOOST!',   color: 0xffee00, points: 0,  weight: 30 },
  warp:    { key: 'air_warp',    label: 'WARP!',    color: 0xaa44ff, points: 0,  weight: 10 },
  star:    { key: 'air_star',    label: '+5',       color: 0xffffff, points: 5,  weight: 20 },
  gem:     { key: 'air_gem',     label: '+10',      color: 0x00ffff, points: 10, weight: 8  },
  mystery: { key: 'air_mystery', label: '???',      color: 0xff44ff, points: 0,  weight: 12 },
};

export function generateAirCollectibleTextures(scene) {
  // ── Boost Pad ──────────────────────────────────────────────────────────
  const bg = scene.make.graphics({ x:0, y:0, add:false });
  bg.fillStyle(0xffee00, 0.2);
  bg.fillRect(0, 18, 28, 8);
  bg.lineStyle(2, 0xffee00, 1);
  bg.strokeRect(0, 18, 28, 8);
  // Up arrows
  bg.fillStyle(0xffee00);
  bg.fillTriangle(6,14, 14,0, 22,14);
  bg.fillStyle(0xffaa00);
  bg.fillTriangle(8,18, 14,6, 20,18);
  bg.generateTexture('air_boost', 28, 26);
  bg.destroy();

  // ── Warp Ring ──────────────────────────────────────────────────────────
  const wg = scene.make.graphics({ x:0, y:0, add:false });
  wg.lineStyle(3, 0xaa44ff, 1);
  wg.strokeCircle(13, 13, 12);
  wg.lineStyle(1, 0xcc88ff, 0.6);
  wg.strokeCircle(13, 13, 8);
  // Inner sparkle
  wg.fillStyle(0xaa44ff, 0.4);
  wg.fillCircle(13, 13, 5);
  wg.fillStyle(0xffffff, 0.8);
  wg.fillCircle(13, 13, 2);
  // Orbit dots
  [[13,1],[24,7],[24,19],[13,25],[2,19],[2,7]].forEach(([x,y]) => {
    wg.fillStyle(0xcc88ff, 0.8);
    wg.fillCircle(x, y, 2);
  });
  wg.generateTexture('air_warp', 26, 26);
  wg.destroy();

  // ── Star ───────────────────────────────────────────────────────────────
  const sg = scene.make.graphics({ x:0, y:0, add:false });
  sg.fillStyle(0xffffff);
  _drawStar(sg, 13, 13, 5, 13, 6);
  sg.fillStyle(0xffffaa, 0.6);
  _drawStar(sg, 13, 13, 3, 9, 6);
  sg.generateTexture('air_star', 26, 26);
  sg.destroy();

  // ── Gem ────────────────────────────────────────────────────────────────
  const gg = scene.make.graphics({ x:0, y:0, add:false });
  gg.fillStyle(0x00ffff, 0.9);
  gg.fillPoints([{x:13,y:2},{x:24,y:10},{x:20,y:24},{x:6,y:24},{x:2,y:10}], true);
  gg.lineStyle(1, 0xaaffff, 1);
  gg.strokePoints([{x:13,y:2},{x:24,y:10},{x:20,y:24},{x:6,y:24},{x:2,y:10}], true);
  gg.fillStyle(0xffffff, 0.5);
  gg.fillPoints([{x:13,y:4},{x:20,y:10},{x:13,y:10}], true);
  gg.generateTexture('air_gem', 26, 26);
  gg.destroy();

  // ── Mystery Orb ────────────────────────────────────────────────────────
  const mg = scene.make.graphics({ x:0, y:0, add:false });
  mg.fillStyle(0xff44ff, 0.3);
  mg.fillCircle(13, 13, 12);
  mg.lineStyle(2, 0xff44ff, 1);
  mg.strokeCircle(13, 13, 12);
  // ? symbol
  mg.fillStyle(0xffffff);
  mg.fillRect(10, 7, 6, 2);
  mg.fillRect(14, 9, 2, 4);
  mg.fillRect(10, 13, 4, 2);
  mg.fillRect(10, 13, 2, 3);
  mg.fillRect(10, 18, 4, 2);
  mg.generateTexture('air_mystery', 26, 26);
  mg.destroy();
}

function _drawStar(g, cx, cy, innerR, outerR, points) {
  const verts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  g.fillPoints(verts, true);
}

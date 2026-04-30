export const POWERUP_TYPES = {
  SHIELD:  { key: 'pu_shield',  color: 0x00f5ff, label: 'SHIELD',  duration: 5000 },
  MAGNET:  { key: 'pu_magnet',  color: 0xff0080, label: 'MAGNET',  duration: 6000 },
  SPEED:   { key: 'pu_speed',   color: 0xffee00, label: 'SPEED',   duration: 4000 },
};

export function generatePowerUpTextures(scene) {
  Object.entries(POWERUP_TYPES).forEach(([type, cfg]) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const c = cfg.color;
    g.fillStyle(c, 0.2);
    g.fillCircle(12, 12, 12);
    g.lineStyle(2, c, 1);
    g.strokeCircle(12, 12, 12);
    g.fillStyle(c, 1);
    if (type === 'SHIELD') {
      // shield icon
      g.fillTriangle(12, 4, 4, 8, 4, 16);
      g.fillTriangle(12, 4, 20, 8, 20, 16);
      g.fillRect(4, 14, 16, 4);
    } else if (type === 'MAGNET') {
      // magnet icon
      g.fillRect(8, 5, 4, 10);
      g.fillRect(12, 5, 4, 10);
      g.fillRect(7, 14, 5, 4);
      g.fillRect(12, 14, 5, 4);
    } else if (type === 'SPEED') {
      // lightning bolt
      g.fillTriangle(14, 4, 8, 13, 13, 13);
      g.fillTriangle(11, 11, 6, 20, 16, 11);
    }
    g.generateTexture(cfg.key, 24, 24);
    g.destroy();
  });
}

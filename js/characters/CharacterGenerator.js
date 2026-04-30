import { CHARACTERS } from './CharacterConfig.js';

export function generateCharacterTextures(scene) {
  Object.entries(CHARACTERS).forEach(([themeId, chars]) => {
    chars.forEach(char => {
      _drawCharacter(scene, themeId, char);
      // Run frames
      for (let f = 0; f < 4; f++) _drawCharacterRun(scene, themeId, char, f);
    });
  });
}

function _drawCharacter(scene, themeId, char) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  _drawBody(g, themeId, char.id, char.color, char.accent, 0);
  g.generateTexture(`char_${themeId}_${char.id}`, 28, 28);
  g.destroy();
}

function _drawCharacterRun(scene, themeId, char, frame) {
  const offsets = [0, -2, 0, 2];
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  _drawBody(g, themeId, char.id, char.color, char.accent, offsets[frame], frame);
  g.generateTexture(`char_run_${frame}_${themeId}_${char.id}`, 28, 28);
  g.destroy();
}

function _drawBody(g, themeId, charId, col, acc, yOff = 0, frame = 0) {
  const legSwing = frame % 2 === 0;

  switch (`${themeId}_${charId}`) {

    // ── NEON CITY ──────────────────────────────────────────────────────────
    case 'neon_hacker':
      // Hoodie shape
      g.fillStyle(col); g.fillRect(6, 8+yOff, 16, 14);
      g.fillStyle(0x001122); g.fillRect(9, 10+yOff, 10, 7); // dark visor
      g.fillStyle(acc, 0.9); g.fillRect(10, 11+yOff, 8, 5); // glowing screen
      g.fillStyle(col, 0.8); g.fillRect(7, 22, 5, 4+legSwing); g.fillRect(16, 22, 5, 4+(!legSwing?1:0));
      g.fillStyle(acc); g.fillRect(4, 12+yOff, 2, 6); // arm band
      break;

    case 'neon_cyborg':
      g.fillStyle(0x003344); g.fillRect(6, 8+yOff, 16, 14);
      g.fillStyle(col); g.fillRect(8, 9+yOff, 12, 6); // chest plate
      g.fillStyle(acc); g.fillRect(10, 11+yOff, 4, 4); g.fillRect(16, 11+yOff, 2, 4); // eye + panel
      g.fillStyle(0x00aaff); g.fillRect(22, 10+yOff, 4, 8); // arm cannon
      g.fillStyle(0x003344); g.fillRect(7, 22, 5, 4); g.fillRect(16, 22, 5, 4);
      g.fillStyle(col); g.fillRect(7+(legSwing?1:0), 24, 4, 2); g.fillRect(16+(legSwing?0:1), 24, 4, 2);
      break;

    case 'neon_ninja':
      g.fillStyle(0x110022); g.fillRect(6, 7+yOff, 16, 16); // dark body
      g.fillStyle(col); g.fillRect(7, 8+yOff, 14, 3); // headband
      g.fillStyle(acc); g.fillRect(8, 13+yOff, 12, 2); // eye slit
      g.fillStyle(0x220044); g.fillRect(6, 22, 5, 4); g.fillRect(16, 22, 5, 4);
      g.fillStyle(col); g.fillRect(3, 10+yOff, 3, 8); // scarf
      break;

    case 'neon_punk':
      g.fillStyle(0x222200); g.fillRect(6, 9+yOff, 16, 13);
      g.fillStyle(col); // mohawk
      g.fillTriangle(14, 0+yOff, 10, 9+yOff, 18, 9+yOff);
      g.fillStyle(acc); g.fillRect(8, 13+yOff, 12, 5); // jacket
      g.fillStyle(col); g.fillRect(9, 10+yOff, 4, 3); g.fillRect(16, 10+yOff, 4, 3); // eyes
      g.fillStyle(0x333300); g.fillRect(7, 22, 5, 4); g.fillRect(16, 22, 5, 4);
      break;

    case 'neon_drone':
      g.fillStyle(0x111133); g.fillRect(4, 12+yOff, 20, 10);
      g.fillStyle(col); g.fillRect(6, 14+yOff, 16, 6);
      g.fillStyle(acc); g.fillCircle(14, 16+yOff, 4); // lens
      g.lineStyle(2, col); g.lineBetween(0, 11+yOff, 10, 11+yOff); g.lineBetween(18, 11+yOff, 28, 11+yOff); // rotors
      g.fillStyle(0x334466); g.fillRect(10, 22, 8, 4); // landing gear
      break;

    // ── DEEP OCEAN ─────────────────────────────────────────────────────────
    case 'ocean_diver':
      g.fillStyle(col); g.fillRect(6, 8+yOff, 16, 14); // wetsuit
      g.fillStyle(0x002244); g.fillRect(9, 9+yOff, 10, 8); // mask
      g.fillStyle(acc, 0.8); g.fillRect(10, 10+yOff, 8, 6); // visor
      g.fillStyle(0x003355); g.fillRect(7, 22, 5, 5); g.fillRect(16, 22, 5, 5); // flippers
      g.fillStyle(col); g.fillRect(22, 10+yOff, 4, 8); // tank
      break;

    case 'ocean_mermaid':
      g.fillStyle(acc); g.fillRect(8, 7+yOff, 12, 10); // torso
      g.fillStyle(col); g.fillRect(6, 17+yOff, 16, 6); // tail
      g.fillStyle(col); g.fillRect(4, 24, 8, 3); g.fillRect(16, 24, 8, 3); // fins
      g.fillStyle(0xffccaa); g.fillRect(9, 7+yOff, 10, 8); // face
      g.fillStyle(acc); g.fillRect(7, 5+yOff, 14, 3); // hair
      break;

    case 'ocean_shark':
      g.fillStyle(col); g.fillRect(4, 10+yOff, 22, 10); // body
      g.fillStyle(0xffffff); g.fillRect(16, 12+yOff, 8, 6); // belly
      g.fillStyle(col); g.fillTriangle(14, 4+yOff, 10, 10+yOff, 18, 10+yOff); // dorsal fin
      g.fillStyle(0x222222); g.fillRect(20, 12+yOff, 2, 2); // eye
      g.fillStyle(0xffffff); g.fillRect(14, 18+yOff, 8, 2); // teeth
      g.fillStyle(col); g.fillRect(0, 14+yOff, 4, 6); // tail fin
      break;

    case 'ocean_octopus':
      g.fillStyle(col); g.fillCircle(14, 10+yOff, 10); // head
      g.fillStyle(acc); g.fillRect(9, 10+yOff, 4, 3); g.fillRect(15, 10+yOff, 4, 3); // eyes
      // Tentacles
      for (let t = 0; t < 4; t++) {
        g.fillStyle(col, 0.9);
        g.fillRect(4+t*6, 18, 3, 6+(t%2===0?legSwing?2:0:legSwing?0:2));
      }
      break;

    case 'ocean_crab':
      g.fillStyle(col); g.fillRect(6, 12+yOff, 16, 10); // shell
      g.fillStyle(acc); g.fillRect(8, 13+yOff, 12, 8); // belly
      g.fillStyle(col); g.fillRect(2, 10+yOff, 4, 6); g.fillRect(22, 10+yOff, 4, 6); // claws
      g.fillStyle(0x222200); g.fillRect(10, 12+yOff, 3, 3); g.fillRect(15, 12+yOff, 3, 3); // eyes
      // Legs
      for (let i = 0; i < 3; i++) {
        g.fillStyle(col);
        g.fillRect(6+i*3, 22, 2, 4+(i%2===legSwing?1:0));
        g.fillRect(17+i*2, 22, 2, 4+(i%2!==legSwing?1:0));
      }
      break;

    // ── LAVA WORLD ─────────────────────────────────────────────────────────
    case 'lava_salamander':
      g.fillStyle(col); g.fillRect(5, 9+yOff, 18, 12);
      g.fillStyle(acc); g.fillRect(7, 10+yOff, 14, 8); // pattern
      g.fillStyle(0xffff00); g.fillRect(9, 11+yOff, 3, 3); g.fillRect(16, 11+yOff, 3, 3); // eyes
      g.fillStyle(col); g.fillRect(24, 8+yOff, 4, 14); // tail
      g.fillStyle(col); g.fillRect(5, 21, 5, 5); g.fillRect(14, 21, 5, 5+(legSwing?1:0));
      break;

    case 'lava_phoenix':
      g.fillStyle(col); g.fillRect(8, 9+yOff, 12, 12); // body
      // Flame wings
      g.fillStyle(acc, 0.9);
      g.fillTriangle(2, 8+yOff, 8, 9+yOff, 4, 18+yOff);
      g.fillTriangle(26, 8+yOff, 20, 9+yOff, 24, 18+yOff);
      g.fillStyle(0xffff00); g.fillRect(10, 8+yOff, 8, 4); // crown
      g.fillStyle(0xffaa00); g.fillRect(10, 10+yOff, 4, 3); g.fillRect(15, 10+yOff, 4, 3); // eyes
      g.fillStyle(acc); g.fillRect(9, 21, 5, 5); g.fillRect(14, 21, 5, 5);
      break;

    case 'lava_golem':
      g.fillStyle(col); g.fillRect(4, 6+yOff, 20, 18); // massive body
      g.fillStyle(acc); g.fillRect(6, 10+yOff, 16, 10); // chest crack (glowing)
      g.fillStyle(0xffee00); g.fillRect(8, 12+yOff, 5, 5); g.fillRect(15, 12+yOff, 5, 5); // lava eyes
      g.fillStyle(0x553322); g.fillRect(6, 24, 7, 4); g.fillRect(15, 24, 7, 4); // feet
      break;

    case 'lava_demon':
      g.fillStyle(col); g.fillRect(6, 9+yOff, 16, 14);
      // Horns
      g.fillStyle(acc);
      g.fillTriangle(8, 9+yOff, 6, 2+yOff, 12, 9+yOff);
      g.fillTriangle(20, 9+yOff, 22, 2+yOff, 16, 9+yOff);
      g.fillStyle(0xff0000); g.fillRect(9, 12+yOff, 3, 4); g.fillRect(16, 12+yOff, 3, 4); // eyes
      g.fillStyle(col); g.fillRect(24, 8+yOff, 3, 12); // tail
      g.fillStyle(0x660000); g.fillRect(7, 22, 5, 5); g.fillRect(15, 22, 5, 5);
      break;

    case 'lava_pyro':
      g.fillStyle(0x333300); g.fillRect(6, 9+yOff, 16, 13); // suit
      g.fillStyle(col); g.fillRect(8, 10+yOff, 12, 10); // vest
      // Explosion hair
      g.fillStyle(acc);
      g.fillCircle(14, 6+yOff, 6);
      g.fillStyle(0xffff00); g.fillCircle(14, 6+yOff, 3);
      g.fillStyle(0x222200); g.fillRect(9, 12+yOff, 4, 4); g.fillRect(15, 12+yOff, 4, 4);
      g.fillStyle(col); g.fillRect(7, 22, 5, 4); g.fillRect(15, 22, 5, 4);
      break;

    // ── SPACE STATION ──────────────────────────────────────────────────────
    case 'space_astronaut':
      g.fillStyle(0xdddddd); g.fillRect(5, 7+yOff, 18, 16); // suit
      g.fillStyle(0x111133); g.fillRect(8, 9+yOff, 12, 10); // helmet visor
      g.fillStyle(acc, 0.6); g.fillRect(9, 10+yOff, 10, 8); // visor tint
      g.fillStyle(0xbbbbbb); g.fillRect(7, 23, 6, 4); g.fillRect(15, 23, 6, 4);
      g.fillStyle(col); g.fillRect(22, 11+yOff, 4, 6); // backpack
      break;

    case 'space_alien':
      g.fillStyle(col); g.fillEllipse(14, 10+yOff, 18, 16); // oval head/body
      g.fillStyle(acc); g.fillRect(8, 8+yOff, 5, 5); g.fillRect(15, 8+yOff, 5, 5); // big eyes
      g.fillStyle(0x000000); g.fillRect(9, 9+yOff, 3, 3); g.fillRect(16, 9+yOff, 3, 3); // pupils
      // Tentacle legs
      for (let t = 0; t < 4; t++) {
        g.fillStyle(col, 0.8);
        g.fillRect(5+t*5, 18, 3, 6+(t%2===0?legSwing?2:0:legSwing?0:2));
      }
      break;

    case 'space_robot':
      g.fillStyle(0x334466); g.fillRect(6, 8+yOff, 16, 14);
      g.fillStyle(col); g.fillRect(8, 9+yOff, 12, 6); // head screen
      g.fillStyle(acc); g.fillRect(10, 10+yOff, 4, 4); g.fillRect(16, 10+yOff, 3, 4); // screen pattern
      g.fillStyle(0x334466); g.fillRect(5, 15+yOff, 18, 7); // body block
      g.lineStyle(1, acc); g.strokeRect(7, 16+yOff, 14, 5); // panel
      g.fillStyle(0x223355); g.fillRect(7, 22, 5, 5); g.fillRect(16, 22, 5, 5);
      break;

    case 'space_pilot':
      g.fillStyle(col); g.fillRect(6, 8+yOff, 16, 14);
      g.fillStyle(0x111122); g.fillRect(8, 9+yOff, 12, 9); // helmet
      g.fillStyle(acc); g.fillRect(10, 11+yOff, 8, 5); // visor
      // Wing stripes
      g.fillStyle(acc); g.fillRect(3, 13+yOff, 3, 4); g.fillRect(22, 13+yOff, 3, 4);
      g.fillStyle(0x222233); g.fillRect(7, 22, 5, 5); g.fillRect(16, 22, 5, 5);
      break;

    case 'space_android':
      g.fillStyle(col); g.fillRect(7, 8+yOff, 14, 14);
      g.fillStyle(0x000022); g.fillRect(9, 9+yOff, 10, 9);
      g.fillStyle(acc); g.fillCircle(12, 13+yOff, 3); g.fillCircle(18, 13+yOff, 3); // round eyes
      g.fillStyle(0x0044ff, 0.5); g.fillRect(10, 17+yOff, 8, 2); // mouth LED
      g.fillStyle(col); g.fillRect(4, 12+yOff, 3, 6); g.fillRect(21, 12+yOff, 3, 6); // arms
      g.fillStyle(col); g.fillRect(8, 22, 5, 5); g.fillRect(15, 22, 5, 5);
      break;

    // ── JUNGLE RUINS ───────────────────────────────────────────────────────
    case 'jungle_explorer':
      g.fillStyle(0xcc9944); g.fillRect(6, 9+yOff, 16, 13); // shirt
      g.fillStyle(col); g.fillRect(7, 7+yOff, 14, 5); // hat brim
      g.fillStyle(acc); g.fillRect(8, 4+yOff, 12, 5); // hat top
      g.fillStyle(0xffccaa); g.fillRect(9, 10+yOff, 10, 7); // face
      g.fillStyle(0x333300); g.fillRect(10, 12+yOff, 3, 3); g.fillRect(15, 12+yOff, 3, 3); // eyes
      g.fillStyle(0xcc9944); g.fillRect(7, 22, 5, 5); g.fillRect(16, 22, 5, 5);
      break;

    case 'jungle_monkey':
      g.fillStyle(col); g.fillRect(7, 9+yOff, 14, 13);
      g.fillStyle(acc); g.fillEllipse(14, 8+yOff, 16, 14); // round head
      g.fillStyle(0xffccaa); g.fillEllipse(14, 12+yOff, 10, 8); // face
      g.fillStyle(0x331100); g.fillRect(10, 10+yOff, 3, 3); g.fillRect(15, 10+yOff, 3, 3); // eyes
      g.fillStyle(acc); g.fillRect(24, 8+yOff, 3, 16); // tail
      g.fillStyle(col); g.fillRect(7, 22, 4, 5+(legSwing?1:0)); g.fillRect(16, 22, 4, 5+(legSwing?0:1));
      break;

    case 'jungle_frog':
      g.fillStyle(col); g.fillEllipse(14, 12+yOff, 20, 14); // body
      g.fillStyle(acc, 0.6); g.fillEllipse(14, 14+yOff, 14, 8); // belly
      // Big eyes on top
      g.fillStyle(col); g.fillCircle(9, 8+yOff, 4); g.fillCircle(19, 8+yOff, 4);
      g.fillStyle(0x000000); g.fillCircle(9, 8+yOff, 2); g.fillCircle(19, 8+yOff, 2);
      // Legs
      g.fillStyle(col);
      g.fillRect(3, 18, 5, 3+(legSwing?2:0));
      g.fillRect(20, 18, 5, 3+(legSwing?0:2));
      break;

    case 'jungle_panther':
      g.fillStyle(col); g.fillRect(5, 9+yOff, 18, 12); // sleek body
      g.fillStyle(acc); g.fillRect(7, 10+yOff, 4, 2); g.fillRect(17, 10+yOff, 4, 2); // stripes
      g.fillStyle(0x44ff44); g.fillRect(9, 11+yOff, 3, 3); g.fillRect(16, 11+yOff, 3, 3); // glowing eyes
      g.fillStyle(col); g.fillRect(24, 8+yOff, 3, 14); // tail
      g.fillStyle(col); g.fillRect(6, 21, 5, 6+(legSwing?0:1)); g.fillRect(15, 21, 5, 6+(legSwing?1:0));
      break;

    case 'jungle_shaman':
      g.fillStyle(0x330066); g.fillRect(6, 9+yOff, 16, 13); // robe
      g.fillStyle(col); g.fillRect(8, 10+yOff, 12, 10); // robe detail
      // Feather headdress
      g.fillStyle(acc); g.fillTriangle(10, 8+yOff, 8, 0+yOff, 14, 8+yOff);
      g.fillStyle(0xff4400); g.fillTriangle(14, 8+yOff, 14, 0+yOff, 18, 8+yOff);
      g.fillStyle(0xffaa00); g.fillTriangle(17, 8+yOff, 20, 1+yOff, 20, 8+yOff);
      g.fillStyle(0xffccaa); g.fillRect(10, 10+yOff, 8, 7); // face
      g.fillStyle(acc); g.fillRect(10, 12+yOff, 3, 3); g.fillRect(15, 12+yOff, 3, 3); // eyes
      g.fillStyle(0x330066); g.fillRect(8, 22, 5, 5); g.fillRect(15, 22, 5, 5);
      break;

    default:
      // Fallback
      g.fillStyle(col); g.fillRect(6, 8+yOff, 16, 14);
      g.fillStyle(acc); g.fillRect(9, 10+yOff, 10, 6);
      g.fillStyle(0x000000); g.fillRect(10, 11+yOff, 8, 4);
      g.fillStyle(col, 0.8); g.fillRect(7, 22, 5, 4); g.fillRect(16, 22, 5, 4);
      break;
  }
}

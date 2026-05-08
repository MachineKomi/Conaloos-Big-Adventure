/**
 * HotspotManager — wires up every hotspot in a scene definition.
 *
 * Responsibilities:
 *  - Builds an interactive zone per hotspot at the right normalized bounds,
 *    padded to a minimum 64×64 hit area.
 *  - Hover effect: pulse glow (or static outline if reduced motion).
 *  - Cycles through `responses[]` so the same response never plays twice in a row.
 *  - Plays `rare_response` on every 7th click (1, 8, 15...).
 *  - Triggers DialogueBox and AudioManager on click.
 *  - Forwards portal hotspots to SceneRouter.
 */

import { Accessibility } from './Accessibility.js';

const MIN_HIT_PX = 64;
const HOVER_TINT = 0xffe9a8;
const PULSE_PERIOD_MS = 1100;
const RARE_EVERY = 7;

export class HotspotManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} services - { audio, dialogue, router, onResponse }
   */
  constructor(scene, services) {
    this.scene = scene;
    this.audio = services.audio;
    this.dialogue = services.dialogue;
    this.router = services.router;
    this.onResponse = services.onResponse;
    this.zones = [];
    this.clickCounts = new Map(); // hotspot.id -> number of clicks this visit
  }

  destroy() {
    for (const z of this.zones) z.destroy();
    this.zones = [];
    this.clickCounts.clear();
  }

  /**
   * @param {Array<HotspotDef>} hotspots
   * @param {{w:number,h:number}} sceneSize
   */
  createAll(hotspots, sceneSize) {
    for (const h of hotspots) this._create(h, sceneSize);
  }

  _create(hotspot, sceneSize) {
    const scene = this.scene;
    const sw = sceneSize.w;
    const sh = sceneSize.h;

    const px = (hotspot.bounds.x ?? 0) * sw;
    const py = (hotspot.bounds.y ?? 0) * sh;
    let pw = (hotspot.bounds.w ?? 0.1) * sw;
    let ph = (hotspot.bounds.h ?? 0.1) * sh;

    // Pad to minimum hit area (centre on midpoint).
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    if (pw < MIN_HIT_PX) pw = MIN_HIT_PX;
    if (ph < MIN_HIT_PX) ph = MIN_HIT_PX;
    const ax = cx - pw / 2;
    const ay = cy - ph / 2;

    const zone = scene.add.zone(ax, ay, pw, ph).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setData('hotspot', hotspot);

    // Visual hover feedback — a soft halo behind the zone.
    const halo = scene.add.graphics();
    halo.setDepth(50);
    halo.setVisible(false);
    halo.fillStyle(HOVER_TINT, 0.35);
    halo.fillRoundedRect(ax - 6, ay - 6, pw + 12, ph + 12, 18);

    let pulseTween = null;

    zone.on('pointerover', () => {
      halo.setVisible(true);
      if (Accessibility.reducedMotion) {
        halo.setAlpha(1);
        return;
      }
      halo.setAlpha(0.9);
      pulseTween = scene.tweens.add({
        targets: halo,
        alpha: { from: 0.5, to: 1 },
        duration: PULSE_PERIOD_MS,
        yoyo: true,
        repeat: -1
      });
    });
    zone.on('pointerout', () => {
      pulseTween?.remove();
      pulseTween = null;
      halo.setVisible(false);
    });

    zone.on('pointerup', () => {
      this._onClick(hotspot, { x: cx, y: cy });
    });

    this.zones.push(zone);
    this.zones.push(halo);
  }

  _onClick(hotspot, pos) {
    const prev = this.clickCounts.get(hotspot.id) ?? 0;
    const click = prev + 1;
    this.clickCounts.set(hotspot.id, click);

    // Portal hotspots transition immediately, but still get to say their line.
    if (hotspot.type === 'portal' && hotspot.target) {
      const line = pickResponse(hotspot, click);
      if (line?.sfx) this.audio?.playSfx(line.sfx);
      if (line?.text) {
        this.dialogue.show(line.text, {
          avoid: pos,
          onDismiss: () => this.router?.goToScene(hotspot.target)
        });
      } else {
        this.router?.goToScene(hotspot.target);
      }
      this.onResponse?.(hotspot, line, click);
      return;
    }

    const response = pickResponse(hotspot, click);
    if (response?.sfx) this.audio?.playSfx(response.sfx);
    else this.audio?.playSfx('sfx_pop');

    if (response?.text) {
      this.dialogue.show(response.text, { avoid: pos });
    }

    if (response?.remix && this.onResponse) {
      this.onResponse(hotspot, response, click);
    } else {
      this.onResponse?.(hotspot, response, click);
    }
  }
}

/**
 * Choose response[click], honouring rare_response every Nth click.
 * Cycles through responses so the same one never plays twice in a row
 * (provided there's more than one).
 */
function pickResponse(hotspot, click) {
  const rare = hotspot.rare_response;
  if (rare && click % RARE_EVERY === 0) return rare;

  const list = hotspot.responses || [];
  if (list.length === 0) return null;
  return list[(click - 1) % list.length];
}

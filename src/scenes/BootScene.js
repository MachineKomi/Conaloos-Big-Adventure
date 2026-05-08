/**
 * BootScene — preloads every asset listed in manifest.json, shows a friendly
 * "the crayons are warming up..." progress message, then routes either to
 * the hub scene (if backgrounds exist) or the WaitingScene (if not).
 */

import Phaser from 'phaser';
import { AssetLoader } from '../systems/AssetLoader.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'boot' }); }

  init({ onReady } = {}) {
    this.onReady = onReady;
    this.loader = new AssetLoader();
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0xfff8e7).setOrigin(0, 0);

    const hello = this.add
      .text(cx, cy - 40, 'The crayons are warming up...', {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '32px',
        color: '#4a3a1f',
        align: 'center'
      })
      .setOrigin(0.5);

    const barW = Math.min(420, width * 0.7);
    const barH = 18;
    const barX = cx - barW / 2;
    const barY = cy + 20;
    const trackColour = 0xe5d6b0;
    const fillColour = 0x4a3a1f;

    const track = this.add.graphics();
    track.fillStyle(trackColour, 1);
    track.fillRoundedRect(barX, barY, barW, barH, 9);

    const fill = this.add.graphics();
    const update = (p) => {
      fill.clear();
      fill.fillStyle(fillColour, 1);
      fill.fillRoundedRect(barX, barY, Math.max(8, barW * p), barH, 9);
    };
    update(0);

    this.load.on('progress', (p) => update(p));
    this.load.on('complete', () => {
      hello.setText('Almost there...');
    });

    if (this.loader.total > 0) {
      this.loader.preload(this);
    }
  }

  create() {
    // Hide the boot DIV so the canvas is clean.
    const bootMessage = document.getElementById('boot-message');
    if (bootMessage) bootMessage.classList.add('hidden');

    console.log('[boot] create() — assets loaded:', this.loader.total, 'backgrounds:', this.loader.backgrounds.map(b => b.slug));
    if (typeof this.onReady === 'function') {
      this.onReady(this.loader);
    }
  }
}

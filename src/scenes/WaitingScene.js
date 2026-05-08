/**
 * WaitingScene — shown when /assets/ is empty (or has no backgrounds yet).
 * Friendly placeholder so a parent dropping in mid-build sees the game alive.
 *
 * In dev the manifest plugin watches /assets/ and rewrites manifest.json
 * when files appear, which triggers Vite's HMR — at which point we'll
 * reload to pick up the new manifest.
 */

import Phaser from 'phaser';

export class WaitingScene extends Phaser.Scene {
  constructor() { super({ key: 'scene:waiting' }); }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#fff8e7');

    const title = this.add
      .text(width / 2, height / 2 - 60, "Conaloo's Big Adventure", {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '52px',
        color: '#4a3a1f'
      })
      .setOrigin(0.5);

    const sub = this.add
      .text(
        width / 2,
        height / 2 + 10,
        'Waiting for the drawings to dry...\nDrop sprites into /assets/ and the world will appear.',
        {
          fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
          fontSize: '24px',
          color: '#5a4a2a',
          align: 'center',
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    const dot = this.add
      .text(width / 2, height / 2 + 110, '*', {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '40px',
        color: '#c98c2e'
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: dot,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });

    this.scale.on('resize', () => {
      const w = this.scale.width;
      const h = this.scale.height;
      title.setPosition(w / 2, h / 2 - 60);
      sub.setPosition(w / 2, h / 2 + 10);
      dot.setPosition(w / 2, h / 2 + 110);
    });
  }
}

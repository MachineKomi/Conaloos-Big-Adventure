/**
 * TutorialScene — single page that explains, in rhyme, how to play.
 *
 * Shown automatically on first launch, or any time from the title screen
 * via "How to play". One short rhyming explanation, single Continue
 * button. No timers; tap-anywhere does nothing.
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TYPE, ANIM, drawPanel } from '../systems/UITokens.js';

const VERSE = [
  "Hello! I'm Amelia. The world is below.",
  "Click *anywhere* on it -- I walk where I go.",
  "",
  "Click *peeps*, click *animals*, click *things* on the ground --",
  "they'll all have a rhyme, or a fact, or a sound.",
  "",
  "Pick up the small *gems* -- they fly to the top.",
  "They add up like *sums*. (The math doesn't stop.)",
  "",
  "Pick up *small things* -- they slide into my bag.",
  "Tap the *backpack* to peek. (It's a fine little brag.)",
  "",
  "If a *door* or a *ladder* is what you have spied,",
  "just click it -- and I'll happily go for a ride.",
  "",
  "And the *star* up there? Quests! For when you've done deeds --",
  "you'll find them inside it, with gems for your needs."
];

const CONTINUE_LABEL = "Off we go!";

export class TutorialScene extends Phaser.Scene {
  constructor() { super({ key: 'scene:tutorial' }); }

  init(data) {
    this.audio = data?.audio || this.audio;
    this.onContinue = data?.onContinue || (() => {});
    this.fromTitle = data?.fromTitle || false;
  }

  create() {
    const { width, height } = this.scale;

    // Backdrop — pale, to make the page panel pop.
    const candidates = ['bg_cosy-cottage-interior', 'bg_sunny-rocket-garden'];
    const bgKey = candidates.find((k) => this.textures.exists(k));
    if (bgKey) {
      const bg = this.add.image(width / 2, height / 2, bgKey).setOrigin(0.5);
      const tex = this.textures.get(bgKey).getSourceImage();
      bg.setScale(Math.max(width / tex.width, height / tex.height));
      bg.setAlpha(0.35);
    } else {
      this.cameras.main.setBackgroundColor('#fff8e7');
    }
    const veil = this.add.graphics();
    veil.fillStyle(0xfff8e7, 0.55);
    veil.fillRect(0, 0, width, height);

    // Page panel — centered, generous padding.
    const panelW = Math.round(Math.min(width * 0.86, 720));
    const panelH = Math.round(Math.min(height * 0.78, 640));
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    drawPanel(panel, panelX, panelY, panelW, panelH, { radius: RADIUS.panel });

    // Title.
    const titleSize = Math.round(Math.min(panelW * 0.10, 56));
    const title = this.add.text(width / 2, panelY + 28, "How to play", {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: `${titleSize}px`,
      color: '#4a3a1f'
    }).setOrigin(0.5, 0);

    // Verse — sized to fit.
    const verseSize = Math.round(Math.min(panelW * 0.045, 26));
    const verse = this.add.text(width / 2, panelY + 28 + titleSize + 28, VERSE.join('\n'), {
      fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${verseSize}px`,
      color: '#2b2b2b',
      align: 'center',
      lineSpacing: 4,
      wordWrap: { width: panelW - 80, useAdvancedWrap: true }
    }).setOrigin(0.5, 0);

    // Amelia portrait OUTSIDE the panel, lower-left.
    if (this.textures.exists('peep_Amelia_F_4')) {
      const portraitH = Math.min(height * 0.40, 360);
      const margin = 12;
      const ameliaX = Math.max(panelX - portraitH * 0.4, portraitH * 0.5 + margin);
      const ameliaY = height - margin;
      const amelia = this.add.image(ameliaX, ameliaY, 'peep_Amelia_F_4').setOrigin(0.5, 1);
      const sourceH = amelia.height || 1;
      amelia.setScale(portraitH / sourceH);
      this.tweens.add({
        targets: amelia,
        y: amelia.y - 6,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Continue button — anchored to the bottom of the panel.
    this._makeButton(width / 2, panelY + panelH - 48, CONTINUE_LABEL);
  }

  _makeButton(cx, cy, label) {
    const w = Math.round(Math.min(this.scale.width * 0.32, 280));
    const h = Math.round(Math.min(this.scale.height * 0.10, 70));
    const bgX = cx - w / 2;
    const bgY = cy - h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0xfff2a8, 1);
    bg.lineStyle(4, 0x4a3a1f, 1);
    bg.fillRoundedRect(bgX, bgY, w, h, 22);
    bg.strokeRoundedRect(bgX, bgY, w, h, 22);

    const text = this.add.text(cx, cy, label, {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: `${Math.round(h * 0.45)}px`,
      color: '#4a3a1f'
    }).setOrigin(0.5);

    const zone = this.add.zone(cx, cy, w, h).setOrigin(0.5);
    zone.setInteractive({ useHandCursor: true });
    bg.setAlpha(0.92);
    zone.on('pointerover', () => {
      this.tweens.killTweensOf(bg);
      this.tweens.add({ targets: bg, alpha: 1.0, duration: 120, ease: 'Sine.easeOut' });
    });
    zone.on('pointerout', () => {
      this.tweens.killTweensOf(bg);
      this.tweens.add({ targets: bg, alpha: 0.92, duration: 120, ease: 'Sine.easeOut' });
    });
    zone.on('pointerup', () => {
      this.tweens.killTweensOf(bg);
      this.tweens.add({ targets: bg, alpha: { from: 0.7, to: 1.0 }, duration: 180, ease: 'Sine.easeOut' });
      this.audio?.playSfx?.('sfx_chime');
      this.onContinue?.();
    });
    return { bg, text, zone };
  }
}

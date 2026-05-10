/**
 * TitleScene — the first thing a child sees.
 *
 * Renders a title card with the game name and two big buttons: "Let's go!"
 * (which routes to the tutorial on first launch, or straight to the hub
 * after that) and "How to play" (which always routes to the tutorial).
 *
 * IMPORTANT: this scene is the user's first gesture. Browsers block
 * audio playback until a user gesture, so the Start button click is the
 * thing that unlocks our AudioContext. We resume() the WebAudio context
 * here so music starts cleanly when the next scene asks to play.
 */

import Phaser from 'phaser';

const TITLE_TEXT = "Take the Long Way";
const SUBTITLE_LINES = [
  "A garden, a lake, a friend on the path,",
  "a bear-butterly, and the smallest of math."
];

const PLAY_LABEL = "Let's go!";
const HOW_TO_LABEL = "How to play";

const PALETTE = {
  paper:  '#fff8e7',
  ink:    '#2b2b2b',
  warm:   '#4a3a1f',
  pink:   '#ffd1d1',
  yellow: '#fff2a8'
};

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'scene:title' }); }

  init(data) {
    this.audio = data?.audio || this.audio;
    this.onStart = data?.onStart || (() => {});
  }

  create() {
    const { width, height } = this.scale;

    // Pick a backdrop image — prefer the hub bg if available.
    const candidates = ['bg_sunny-rocket-garden', 'bg_fantasy-garden-playground', 'bg_seaside-village-sunset'];
    const bgKey = candidates.find((k) => this.textures.exists(k));
    if (bgKey) {
      const bg = this.add.image(width / 2, height / 2, bgKey).setOrigin(0.5);
      const tex = this.textures.get(bgKey).getSourceImage();
      bg.setScale(Math.max(width / tex.width, height / tex.height));
      bg.setAlpha(0.55);
    } else {
      this.cameras.main.setBackgroundColor(PALETTE.paper);
    }

    // Soft white veil so text is readable over the backdrop.
    const veil = this.add.graphics();
    veil.fillStyle(0xfff8e7, 0.55);
    veil.fillRect(0, 0, width, height);

    // Title — size for whichever dimension is more constraining.
    const titleSize = Math.round(Math.min(width * 0.075, height * 0.10));
    const title = this.add.text(width / 2, height * 0.18, TITLE_TEXT, {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: `${titleSize}px`,
      color: PALETTE.warm,
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle (rhyming couplet).
    const subSize = Math.round(Math.min(width * 0.035, height * 0.04));
    this.add.text(width / 2, height * 0.32, SUBTITLE_LINES.join('\n'), {
      fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${subSize}px`,
      color: PALETTE.warm,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: Math.round(width * 0.86), useAdvancedWrap: true }
    }).setOrigin(0.5);

    // Amelia portrait (if present).
    if (this.textures.exists('peep_Amelia_F_4')) {
      const amelia = this.add.image(width * 0.20, height * 0.95, 'peep_Amelia_F_4').setOrigin(0.5, 1);
      const sourceH = amelia.height || 1;
      amelia.setScale((height * 0.55) / sourceH);
      this.tweens.add({
        targets: amelia,
        y: amelia.y - 8,
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Buttons.
    this._makeButton(width * 0.65, height * 0.55, PLAY_LABEL, PALETTE.yellow, () => this._startGame());
    this._makeButton(width * 0.65, height * 0.72, HOW_TO_LABEL, PALETTE.pink, () => this._showTutorial());

    // Mute / motion toggles are still in GlobalUI; nothing extra needed here.

    // Soft floaty title bobbing.
    this.tweens.add({
      targets: title,
      y: title.y - 6,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Build a button at world (cx, cy) using a Zone for unambiguous hit
   * detection. The visible bg/text are separate; an invisible Zone the
   * exact size of the button catches the click. (Container-based hit
   * areas were producing offset/missed clicks in v1.0.)
   */
  _makeButton(cx, cy, label, fillColour, onClick) {
    const w = Math.round(Math.min(this.scale.width * 0.32, 320));
    const h = Math.round(Math.min(this.scale.height * 0.10, 80));

    const bgX = cx - w / 2;
    const bgY = cy - h / 2;

    // A glow halo BEHIND the button. Hidden by default, fades in on hover.
    const glow = this.add.graphics();
    const glowPad = 10;
    glow.fillStyle(0xfff2a8, 1);
    glow.fillRoundedRect(bgX - glowPad, bgY - glowPad, w + glowPad * 2, h + glowPad * 2, 30);
    glow.setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(fillColour).color, 1);
    bg.lineStyle(4, 0x4a3a1f, 1);
    bg.fillRoundedRect(bgX, bgY, w, h, 24);
    bg.strokeRoundedRect(bgX, bgY, w, h, 24);

    const text = this.add.text(cx, cy, label, {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: `${Math.round(h * 0.45)}px`,
      color: PALETTE.warm
    }).setOrigin(0.5);

    const zone = this.add.zone(cx, cy, w, h).setOrigin(0.5);
    zone.setInteractive({ useHandCursor: true });

    // Hover: visible warm glow halo behind the button + slight bg
    // brightness lift. Text stays the same size for legibility.
    zone.on('pointerover', () => {
      this.tweens.killTweensOf([glow, bg]);
      this.tweens.add({ targets: glow, alpha: { from: 0, to: 0.85 }, duration: 160, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: bg, alpha: { from: bg.alpha, to: 1 }, duration: 160 });
    });
    zone.on('pointerout', () => {
      this.tweens.killTweensOf([glow, bg]);
      this.tweens.add({ targets: glow, alpha: 0, duration: 160, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: bg, alpha: 1, duration: 160 });
    });
    zone.on('pointerup', () => {
      this.tweens.killTweensOf([glow, bg]);
      this.tweens.add({ targets: glow, alpha: { from: 1, to: 0 }, duration: 260, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: bg,   alpha: { from: 0.6, to: 1 }, duration: 200 });
      onClick();
    });

    return { bg, glow, text, zone };
  }

  _unlockAudio() {
    // Resume the WebAudio context so music can play in browsers that
    // block until a user gesture.
    const ctx = this.sound?.context;
    if (ctx?.state === 'suspended') ctx.resume();
  }

  _startGame() {
    this._unlockAudio();
    this.audio?.playSfx?.('sfx_powerup');
    this.onStart?.();
  }

  _showTutorial() {
    this._unlockAudio();
    this.audio?.playSfx?.('sfx_chime');

    // Sleep the title scene (don't destroy it) and run tutorial as
    // an overlay. When the user closes the tutorial, we wake the
    // title back up so onStart still has the correct closure.
    //
    // This was the v1.3.1 bug Dad reported: the previous
    // `scene.start` cycle (title → tutorial → start title again →
    // wrap onStart) ended up calling a destroyed scene's onStart
    // and the game stalled. scene.sleep keeps title alive.
    this.scene.sleep('scene:title');
    this.scene.run('scene:tutorial', {
      audio: this.audio,
      fromTitle: true,
      onContinue: () => {
        this.scene.stop('scene:tutorial');
        this.scene.wake('scene:title');
      }
    });
  }
}

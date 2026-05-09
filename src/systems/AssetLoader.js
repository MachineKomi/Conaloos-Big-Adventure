/**
 * AssetLoader — registers everything in manifest.json with Phaser's loader.
 * Keeps a small in-memory index of the manifest so other systems can look
 * assets up by key (e.g. 'animal_bobo_butterfly') without rescanning.
 */

import manifest from '../content/manifest.json';
import { indexManifest } from './AssetManifest.js';

export class AssetLoader {
  constructor() {
    this.manifest = manifest;
    this.byKey = indexManifest(manifest);
  }

  /** Total number of assets that will be loaded. */
  get total() {
    return this.manifest.entries.length;
  }

  get hasAnyBackground() {
    return (this.manifest.byType.bg || []).length > 0;
  }

  get backgrounds() {
    return this.manifest.byType.bg || [];
  }

  /** Returns asset entry for a key or null. */
  get(key) {
    return this.byKey.get(key) || null;
  }

  /**
   * Queue every asset onto a Phaser scene's loader.
   * Image keys: the stem (e.g. 'animal_bobo_butterfly').
   * Audio keys: the stem (e.g. 'music_calm').
   */
  preload(scene) {
    for (const e of this.manifest.entries) {
      switch (e.type) {
        case 'peep':
        case 'animal':
        case 'bg':
        case 'thing':
        case 'portal':
          scene.load.image(e.key, e.url);
          break;
        case 'gem':
          scene.load.image(e.key, e.url);
          break;
        case 'music':
        case 'sfx':
          scene.load.audio(e.key, e.url);
          break;
        default:
          break;
      }
    }
  }
}

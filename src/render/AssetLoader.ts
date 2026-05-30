import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

import luckyBlockUrl from "../assets/meshes/lucky_block.fbx?url";
import luckyBlockTexUrl from "../assets/meshes/lucky_block_bc.png?url";

import slimeSpawnUrl from "../assets/enemies/skibidi_slime/spawn.png";
import slimeIdleUrl from "../assets/enemies/skibidi_slime/idle.png";
import slimeFlinchUrl from "../assets/enemies/skibidi_slime/flinch.png";
import slimeDeathUrl from "../assets/enemies/skibidi_slime/death.png";

/** The flipbook frames a sprite-based enemy cycles through. */
export type EnemyFrame = "spawn" | "idle" | "flinch" | "death";
export type EnemyFrames = Record<EnemyFrame, THREE.Texture>;

/** Per-enemy frame URLs, keyed by the enemy id used in the core config. */
const ENEMY_FRAME_URLS: Record<string, Record<EnemyFrame, string>> = {
  skibidi_slime: {
    spawn: slimeSpawnUrl,
    idle: slimeIdleUrl,
    flinch: slimeFlinchUrl,
    death: slimeDeathUrl,
  },
};

/**
 * Load the 4 flipbook frames for an enemy as sRGB textures. Used unlit on a
 * transparent plane so the sprite shows its true colours regardless of scene
 * lighting. Falls back to the slime frames for unknown ids.
 */
export async function loadEnemyFrames(enemyId: string): Promise<EnemyFrames> {
  const urls = ENEMY_FRAME_URLS[enemyId] ?? ENEMY_FRAME_URLS.skibidi_slime;
  const texLoader = new THREE.TextureLoader();
  const frames = ["spawn", "idle", "flinch", "death"] as const;

  const loaded = await Promise.all(
    frames.map((f) => texLoader.loadAsync(urls[f]))
  );

  const result = {} as EnemyFrames;
  frames.forEach((f, i) => {
    const tex = loaded[i];
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    result[f] = tex;
  });
  return result;
}

/**
 * Loads the Lucky Block FBX and applies its base-color texture. The FBX's
 * embedded material paths don't resolve in the browser, so we attach a fresh
 * standard material using the texture we control.
 */
export async function loadLuckyBlock(): Promise<THREE.Group> {
  const fbxLoader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  const [group, texture] = await Promise.all([
    fbxLoader.loadAsync(luckyBlockUrl),
    texLoader.loadAsync(luckyBlockTexUrl),
  ]);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.55,
    metalness: 0.0,
  });

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = material;
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  normalizeToUnitSize(group, 2.2);
  return group;
}

/**
 * Re-centers an object at the origin and scales it so its largest dimension
 * equals `targetSize`. Keeps wildly different source asset scales consistent.
 */
export function normalizeToUnitSize(object: THREE.Object3D, targetSize: number): void {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  object.scale.setScalar(scale);

  // Recenter using the scaled offset.
  object.position.sub(center.multiplyScalar(scale));
}

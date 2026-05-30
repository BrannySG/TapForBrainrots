import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

import luckyBlockUrl from "../assets/meshes/lucky_block.fbx?url";
import luckyBlockTexUrl from "../assets/meshes/lucky_block_bc.png?url";

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
  texture.flipY = false; // FBX UVs are not flipped like glTF/Three defaults.

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

/**
 * De beeldset van F1, gelezen uit `public/beeld/manifest.json`.
 *
 * Eén bron voor alle varianten: welke breedtes er bestaan, staat in het
 * manifest en nergens anders. Zo kan een pagina nooit een 2048-variant
 * aanvragen die niet gemaakt is (geen origineel is breder dan 1600 px).
 */
import manifest from '../../public/beeld/manifest.json';

export type BeeldVariant = {
  breedte: number;
  hoogte: number;
  avif: number;
  webp: number;
  pad: string;
};

export type BeeldRecord = {
  slug: string;
  breedtes: number[];
  varianten: BeeldVariant[];
};

const alle = (manifest as { beelden: BeeldRecord[] }).beelden;

export function beeld(slug: string): BeeldRecord | undefined {
  return alle.find((record) => record.slug === slug);
}

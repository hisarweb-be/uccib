/**
 * Een alinea die uit precies één link bestaat, krijgt de klasse `knop-alinea`
 * (de knop uit `src/styles/tekst.css`).
 *
 * Eerst deed de CSS dat zelf met `p:has(> a:only-child)`. Maar `:only-child`
 * telt alleen elementen, geen tekst: een alinea als "Vragen? Mail naar
 * info@uccib.com" met één mailto-link werd ook een knop. Die alinea werd
 * `inline-flex`, kon niet meer afbreken en duwde de cookiepagina op een
 * telefoon van 390 px tot 583 px breed (verify-mobiel, F2b PR4). Hier, in de
 * boom, is wel te zien of er naast de link nog tekst staat.
 *
 * Draait na `remarkActieveLinks`: een link naar een uitgezette pagina is dan al
 * tekst geworden, of de alinea is weg.
 */
import type { Paragraph, Root } from 'mdast';

function isKnop(alinea: Paragraph): boolean {
  const kinderen = alinea.children.filter((k) => !(k.type === 'text' && k.value.trim() === ''));
  return kinderen.length === 1 && kinderen[0]?.type === 'link';
}

/** Alleen alinea's op het hoogste niveau: de CSS kijkt naar `.tekst > p`. */
export default function remarkKnopAlinea() {
  return (boom: Root): void => {
    for (const knoop of boom.children) {
      if (knoop.type !== 'paragraph' || !isKnop(knoop)) continue;
      const data = (knoop.data ??= {});
      data.hProperties = { ...data.hProperties, className: ['knop-alinea'] };
    }
  };
}

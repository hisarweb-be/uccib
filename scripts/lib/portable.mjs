/**
 * Kleine bouwstenen voor Portable Text.
 *
 * Waarom dit bestand bestaat: de Turkse teksten staan één keer in
 * `scripts/content/`, en zowel de fallback (`src/data/cms-fallback.json`) als
 * de import in Sanity (`scripts/import-sanity.mjs`) gebruiken dezelfde
 * blokken. Zo kan de site nooit iets anders tonen dan wat er in het CMS staat.
 *
 * De `_key` wordt hier bewust NIET gezet. Die komt uit `sleutels()`, zodat
 * dezelfde bron altijd exact dezelfde JSON oplevert en een commit geen ruis
 * bevat van willekeurige sleutels.
 */

/** Eén tekstblok. `style` is de Portable Text-stijl uit `sanity/schemaTypes/objecten.ts`. */
export function blok(style, text) {
  return {
    _type: 'block',
    style,
    markDefs: [],
    children: [{ _type: 'span', text, marks: [] }],
  };
}

/** Alinea. */
export const p = (text) => blok('normal', text);

/** Kop 2. */
export const h2 = (text) => blok('h2', text);

/** Kop 3. */
export const h3 = (text) => blok('h3', text);

/** Citaat. */
export const citaat = (text) => blok('blockquote', text);

/** Alinea in cursief, voor de enkele plek waar de oude site dat deed. */
export function cursief(text) {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text, marks: ['em'] }],
  };
}

function lijst(listItem, items) {
  return items.map((text) => ({
    _type: 'block',
    style: 'normal',
    listItem,
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', text, marks: [] }],
  }));
}

/** Opsomming met bolletjes. */
export const opsomming = (items) => lijst('bullet', items);

/** Genummerde opsomming. */
export const genummerd = (items) => lijst('number', items);

/**
 * Eén alinea die volledig een link is, voor de knoppen die in de oude site
 * tussen de tekst stonden ("Daha fazla bilgi", "Şubelerimiz için buraya
 * tıklayınız!"). De tekst blijft staan waar hij stond; alleen het adres eronder
 * verhuist mee het CMS in.
 */
export function linkParagraaf(label, href) {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'l0', href }],
    children: [{ _type: 'span', text: label, marks: ['l0'] }],
  };
}

/**
 * Afbeelding met verplichte alt-tekst, zoals het schema eist.
 * `ref` is een Sanity-assetverwijzing; de fallback gebruikt het pad in `public/`.
 */
export function afbeelding(ref, alt, onderschrift) {
  const block = { _type: 'image', asset: { _ref: ref }, alt };
  if (onderschrift) block.onderschrift = onderschrift;
  return block;
}

/**
 * Geeft elk blok en elk kind een stabiele `_key`.
 *
 * De sleutel is de positie in de lijst, niet een teller over het hele bestand:
 * een blok toevoegen achteraan verandert dan geen enkele bestaande sleutel en
 * Sanity ziet een echte toevoeging in plaats van een herschrijving.
 */
export function sleutels(blocks) {
  return blocks.map((block, index) => {
    const copy = { ...block, _key: `k${index}` };
    if (Array.isArray(block.children)) {
      copy.children = block.children.map((child, childIndex) => ({
        ...child,
        _key: `k${index}c${childIndex}`,
      }));
    }
    return copy;
  });
}

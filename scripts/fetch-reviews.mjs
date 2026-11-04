// Scarica scheda Google (valutazione, recensioni, indirizzo, orari) tramite Places API (New)
// e la salva in data/reviews.json. Richiede il secret GOOGLE_PLACES_API_KEY.
import { writeFileSync, existsSync } from 'node:fs';

const OUT = 'data/reviews.json';
const KEY = process.env.GOOGLE_PLACES_API_KEY;
// Se la chiave è limitata ai siti web (referrer), si dichiara il sito come provenienza.
const REF = { Referer: process.env.SITE_URL || '' };
const QUERY = 'Vapor Inside Castelfranco Veneto';

async function placeId() {
  if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID;
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { ...REF, 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.id,places.displayName' },
    body: JSON.stringify({ textQuery: QUERY, languageCode: 'it' }),
  });
  const j = await r.json();
  if (!j.places?.length) throw new Error('Attività non trovata: ' + JSON.stringify(j).slice(0, 300));
  console.log('Trovata:', j.places[0].displayName?.text, j.places[0].id);
  return j.places[0].id;
}

try {
  if (!KEY) throw new Error('GOOGLE_PLACES_API_KEY non impostata');
  const id = await placeId();
  const fields = 'id,displayName,rating,userRatingCount,reviews,googleMapsUri,formattedAddress,nationalPhoneNumber,regularOpeningHours.weekdayDescriptions';
  const r = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=it`, {
    headers: { ...REF, 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': fields },
  });
  const p = await r.json();
  if (p.error) throw new Error(p.error.message);
  const out = {
    placeId: p.id,
    name: p.displayName?.text,
    rating: p.rating,
    count: p.userRatingCount,
    url: p.googleMapsUri,
    reviewUrl: `https://search.google.com/local/writereview?placeid=${p.id}`,
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber,
    hours: p.regularOpeningHours?.weekdayDescriptions || [],
    updated: new Date().toISOString(),
    reviews: (p.reviews || []).map((v) => ({
      author: v.authorAttribution?.displayName,
      authorUrl: v.authorAttribution?.uri,
      photo: v.authorAttribution?.photoUri,
      rating: v.rating,
      text: v.text?.text || v.originalText?.text || '',
      when: v.relativePublishTimeDescription,
    })).filter((v) => v.text),
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Salvate ${out.reviews.length} recensioni (media ${out.rating}, totale ${out.count})`);
} catch (err) {
  console.warn('Aggiornamento recensioni fallito:', err.message);
  if (!existsSync(OUT)) writeFileSync(OUT, '{}');
}

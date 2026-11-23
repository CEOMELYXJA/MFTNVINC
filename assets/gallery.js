// Images publiques identifiées dans la galerie « Art & Tatouages » du site melisafortintattoo.com.
// L'album en ligne affiche 1/75, mais seuls ces 12 éléments sont vérifiés ici.
// Ne pas remplacer ce tableau par l'intégralité du Media Manager sans filtrer les éléments NON publiés.
const photo = (id) => `https://static.wixstatic.com/media/${id}~mv2.jpg`;
const thumb = (id, ratio='w_640,h_860') => `https://static.wixstatic.com/media/${id}~mv2.jpg/v1/fill/${ratio},al_c,q_82/${id}~mv2.jpg`;
const ids = [
  '12a55f_08b0ee2a1e3a48be814befa7c2edb9a8',
  '12a55f_60df4e623e04471880ebffd6486f6808',
  '12a55f_29703ffb61ad436c8324685757d3489f',
  '12a55f_185adb36371b41dda77fa0e4d3014b08',
  '12a55f_6b7051be8beb4393941d6f6ef434034c',
  '12a55f_78bd3cc6665845bd9337435664aadbac',
  '12a55f_175b3a0ab6ef4af0ab011b1a311a365b',
  '12a55f_a110d00ea78a4f1e8a597062725412ca',
  '12a55f_69218ee8d0504833b08c925a384893db',
  '12a55f_8c7a4e042cd646c3a797894511c65be2',
  '12a55f_20d11835f9674e84946a2742b9ed5ebf',
  '12a55f_f1df6522492a4d03a1ba0db791002136',
];
const info = [
  ['Tigre et fleurs','Animalier · floral','2026 — Tatouage d’un tigre entouré de fleurs sur le haut du dos.'],
  ['Symboles des doigts','Minimaliste','2026 — Petits symboles et lettres sur les doigts des deux mains.'],
  ['Portrait de gorille','Réalisme animalier','2026 — Portrait de gorille tatoué sur le bras.'],
  ['Papillon ornemental','Ornemental','2026 — Papillon et motifs ornementaux sur le flanc.'],
  ['Dragon ailé','Fantasy','2026 — Dragon ailé tatoué sur l’avant-bras.'],
  ['Ourson arc-en-ciel','Couleur','2026 — Ourson coloré dans un cœur arc-en-ciel avec un soleil.'],
  ['Cocotte · portrait de chat','Réalisme animalier','2026 — Portrait d’un chat tatoué avec le prénom « Cocotte ».'],
  ['Rose rouge','Floral couleur','2026 — Rose rouge aux feuilles vertes dans la nuque.'],
  ['Toiles d’araignée','Blackwork','2026 — Toiles d’araignée tatouées sur les bras.'],
  ['Composition florale','Floral ornemental','2026 — Composition florale sur l’avant-bras et la main.'],
  ['Fleurs en lignes fines','Fine line','2026 — Motif floral en lignes fines sur l’avant-bras.'],
  ['Crânes et flammes','Couleur · dark','2026 — Crânes colorés entourés de flammes sur le bras.'],
];
export const artworks = info.map(([title, category, description], i) => ({
  id: `mft-2026-${String(i+1).padStart(3,'0')}`,
  title, category, description, year: 2026,
  image: photo(ids[i]), thumb: thumb(ids[i]),
  source: 'https://www.melisafortintattoo.com/artettatouages',
}));

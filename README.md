# TATTOOmap — Portfolio spatial interactif 3D

Moteur Three.js, promenade immersive, galeries de photos de tatouages et médias publics Wix classés par téléversement.

## État du catalogue

125 médias publics téléversés en 2025 ou 2026 (41 + 84). Ils incluent 12 œuvres déjà identifiées. Tous les autres médias ne sont pas nécessairement des tatouages. L'année du téléversement n'est pas forcément l'année de réalisation du tatouage.

## Mise à jour — archives Wix 2025–2026

Cette version ouvre directement la promenade 3D avec 125 images publiques de la médiathèque Wix : **41 images téléversées en 2025** et **84 images téléversées en 2026**. Douze photos identifiées dans la galerie publique avaient déjà des titres et descriptions vérifiés; elles sont conservées et dédoublonnées. **Les 113 autres entrées sont des médias publics à trier : tous ne sont PAS nécessairement des tatouages.** Leur année est l'année de téléversement Wix, pas une preuve de l'année d'exécution de l'œuvre.

- Le fichier `IMPORTER_TOUTES_IMAGES_WIX_2025_2026.json` contient les **125 liens d'images** et les métadonnées de tri.
- Les images restent sur les serveurs Wix (pas de copies binaires dans l'archive ZIP). Une connexion Internet est requise.
- La promenade utilise le chargement spatial progressif; aucune image 2025/26 n'est téléchargée en masse au lancement.
- Le site Wix public n'a pas été modifié. La version de ce projet est sauvegardée sous le nom TATTOOmap dans une branche GitHub dédiée.
- Dans Windows : décompresser puis lancer `LANCER_WINDOWS.bat`. La fenêtre de commande doit rester ouverte.

---

# TATTOOmap — MELISA FORTIN

Prototype et version peaufinée d'une galerie 3D à la première personne, en **Three.js / WebGL**.

## Lancer sur Windows

1. Décompresser l'archive ZIP.
2. Double-cliquer sur **LANCER_WINDOWS.bat** à la racine.
3. Le navigateur ouvre automatiquement **l'étape 2** : `http://127.0.0.1:8765/02_peaufine/`.
4. Pour essayer le prototype brut : `http://127.0.0.1:8765/01_prototype/`.

Prérequis : Python 3 installé (la commande `py` ou `python` doit fonctionner) ; connexion Internet pour charger la bibliothèque Three.js par CDN et les photos hébergées par Wix ; navigateur récent avec WebGL2. **Ne pas simplement double-cliquer sur `index.html`** : les modules JavaScript nécessitent un serveur HTTP local. Fermeture du serveur : fermer la fenêtre de commandes ou Ctrl+C.

Sur macOS/Linux, `cd` dans ce dossier puis `python3 -m http.server 8765`, ouvrir la même adresse.

## Étape 1 — 01_prototype

- Terrain, arbres, allée et 12 panneaux de photographies de tatouages réels ;
- Caméra à la première personne, souris + W A S D, Maj pour courir ;
- Approche d'un panneau et **E** pour examiner l'œuvre originale ;
- Un rendu de validation relativement simple.

## Étape 2 — 02_peaufine

- Trois paysages : forêt, jardin botanique, crépuscule ;
- Ciel procédural, végétation en maillages instanciés, feuillage, fleurs, sentiers lumineux, papillons, cerfs et renards stylisés ;
- Navigation à la première personne, téléportation entre biomes (boutons ou touches 1, 2, 3) ;
- Recherche par titre, catégorie, description et année ;
- Carte, coordonnées, compteur d'œuvres, FPS ;
- Ouverture de la photo source et de sa description ;
- Mode mobile expérimental : joystick, balayage pour regarder, bouton Examiner ;
- **Chargement spatial progressif** : les panneaux proches seulement sont instanciés, et leurs textures ne sont demandées que si elles se rapprochent davantage ;
- Importation d'un catalogue JSON (1000 et davantage) en conservant le catalogue importé dans le stockage local du navigateur.

## Réalité de la connexion avec le site

Ce ZIP contient **12 photos de tatouages réels** publiées dans la galerie publique `https://www.melisafortintattoo.com/artettatouages` (identifiées sur la page publique au 23 novembre 2026) : tigre, symboles des doigts, gorille, papillon, dragon, ourson, chat, rose, toiles d'araignée, composition florale, fleurs fines, crânes et flammes.

**Les quelque 1 000 tatouages n'ont pas été importés ni synchronisés.** Le site consulté présente actuellement une galerie affichant « 1/75 ». Ce nombre ne suffit pas à vérifier le nombre total historique et la galerie Wix peut charger d'autres images dynamiquement. **Ne jamais copier indistinctement le Media Manager Wix** : il peut contenir des photos non publiées. Pour passer à toutes les œuvres, il faut exporter / identifier les fichiers **déjà publics** puis générer le fichier JSON.

Les images se chargent via les liens publics `static.wixstatic.com`. Elles **ne sont pas copiées dans cette archive**. Si Wix empêche le chargement de texture entre domaines (CORS), un panneau décoratif de repli apparaît. La photo originale reste consultable à travers le catalogue/lien Wix. Une intégration de production devrait utiliser un domaine autorisé pour les textures ou un proxy d'images configurable.

## Ajouter les 1000 photos

### Option A : importer un JSON

Le bouton **＋ IMPORTER MON PORTFOLIO** en bas du mode peaufiné accepte le format suivant (voir `exemple_catalogue.json`) :

```json
[
  {
    "id": "2025-tattoo-001",
    "title": "Mon tatouage",
    "category": "Floral",
    "year": 2025,
    "description": "Tatouage réalisé en 2025.",
    "image": "https://static.wixstatic.com/media/nom-de-la-photo.jpg",
    "thumb": "https://static.wixstatic.com/media/nom-de-la-photo.jpg",
    "source": "https://www.melisafortintattoo.com/artettatouages"
  }
]
```

Le logiciel n'envoie pas les photos vers un service. Le fichier JSON est enregistré seulement dans le stockage local du navigateur pour être retrouvé au prochain lancement, sur ce même navigateur et cette même adresse.

### Option B : partir d'un CSV

Préparer un CSV ayant les colonnes `id,title,category,year,description,image,thumb,source`, puis exécuter :

```bat
py -3 outils\csv_vers_json.py mon_catalogue.csv mon_catalogue.json
```

Importer le JSON dans l'interface. Les liens `image` peuvent également être des chemins relatifs vers des photos placées dans le dossier `images/`, par exemple `../images/rose.jpg`. Cette solution suppose que le fichier JPG existe réellement à cet emplacement.

## Commandes

| Commande | Action |
|---|---|
| W A S D / flèches | Se déplacer |
| Souris | Orienter la caméra (après entrée dans le monde) |
| Maj | Courir |
| E | Ouvrir le tatouage visé (à moins de 12 m) |
| 1 / 2 / 3 | Téléporter vers l'un des trois paysages |
| Échap | Libérer le curseur ou fermer une fenêtre |
| Bouton ? | Aide intégrée |

## Tests et limites

- Vérification syntaxique JavaScript (`node --check`) et présence des ressources, sans erreur de syntaxe.
- Contrôles sur le catalogue JSON (images HTTPS ou chemins relatifs, titres, identifiants).
- **Aucune validation graphique interactive complète avec images distantes n'a été effectuée dans le navigateur cible** : à tester localement, notamment les textures Wix et les performances sur téléphone.
- LOD au niveau des **panneaux** (instanciation et chargement selon distance), non pas un générateur de modèles 3D pour tatouages.
- Le mode mobile est expérimental. Pas de collisions avancées avec arbres, ni audio 3D, ni synchronisation automatique avec Wix à ce stade.

## Architecture

- `assets/gallery.js` : 12 œuvres réellement identifiées ;
- `01_prototype/` : MVP simple ;
- `02_peaufine/` : version interactive améliorée ;
- `outils/csv_vers_json.py` : conversion des métadonnées ;
- `LANCER_WINDOWS.bat` : serveur HTTP local.

Three.js version 0.175.0 chargée via CDN. Documentation : https://threejs.org/manual/pages/installation.html.

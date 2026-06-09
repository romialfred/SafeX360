# Images vitrine SafeX 360

Ce dossier contient les images de la landing page commerciale.

## Comment ajouter vos propres images Pexels

1. Allez sur https://www.pexels.com et recherchez :
   - "african miner"
   - "black worker safety helmet"
   - "mining africa"
   - "industrial worker"
   - "safety equipment"
2. Téléchargez les images en **Large 2x** ou **Original**
3. Renommez-les exactement comme ci-dessous et placez-les dans ce dossier :

| Nom fichier requis | Usage | Recommandé |
|---|---|---|
| `hero-1.jpg` | Hero rotation #1 | Mineur africain casque, vue de profil |
| `hero-2.jpg` | Hero rotation #2 | Travailleur mine ciel ouvert |
| `hero-3.jpg` | Hero rotation #3 | Équipe HSE briefing |
| `features-bg.jpg` | Décoratif section features | Casques EPI alignés |
| `cta-bg.jpg` | Background CTA final | Équipe minière complète |

## Format recommandé

- **Ratio** : 16:9 ou 3:2
- **Largeur min** : 2400px (4K si possible)
- **Format** : JPEG qualité 85%
- **Poids max** : 600 KB/image (utilisez https://squoosh.app pour compresser)

## Si vous n'ajoutez pas d'images

La landing utilisera des URLs Pexels en fallback automatique (voir `LandingPage.tsx` constante `HERO_IMAGES`). Les images locales prévalent toujours sur les URLs externes.

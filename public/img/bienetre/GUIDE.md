# Photos — bienetre (modèle de référence)

## Structure

```
public/img/bienetre/
├── essentiel/   # 5 images
├── avance/      # 8 images
├── pro/         # 15 images (dont 5 services)
├── GUIDE.md
├── SOURCES.md
└── SOURCES.json
```

## Convention de nommage

`NN-role-description.jpg` — minuscules, tirets, sans accent.

Exemples : `01-hero.jpg`, `03-realisation-pierres-chaudes.jpg`, `11-service-massage-relaxant.jpg`

## Règle absolue

**Aucune photo répétée** entre Essentiel, Avancé et Pro (contrôle SHA-256 dans `SOURCES.json`).

Voir `SOURCES.json` pour l’origine Unsplash de chaque fichier.

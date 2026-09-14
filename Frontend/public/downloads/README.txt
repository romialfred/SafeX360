e-SafeX 360 - application Android (lien public)

SafexMobile.apk sert desormais l'application e-SafeX 360, l'extension terrain et
mobile de la plateforme. Publie le 14 septembre 2026.

  taille  : 4048500 octets
  SHA-256 : 374A11B128996FCA468BA096C405C8D4CEC8E47C2787B9E2EFF2F32CBCA189D9

Ce que fait cette application
-----------------------------
Elle N'EMBARQUE PAS la plateforme : elle l'ouvre. Au premier lancement, elle
demande l'adresse du poste qui heberge e-SafeX 360, puis ouvre le portail
terrain ou le back-office servis par ce poste. Les ecrans, les formulaires et
les donnees sont donc exactement ceux du poste.

Consequence : le telechargement fonctionne depuis n'importe ou, mais
l'application ne fonctionne que sur le meme reseau que le poste qui heberge la
plateforme. Elle n'a ni mode hors ligne ni notifications.

Adresse a saisir : celle communiquee par l'equipe. Les adresses en https
autorisent l'appareil photo du telephone (lecture des cartes MBA, photos
d'inspection) ; en http tout le reste fonctionne, mais le navigateur refuse la
camera.

SafeX 360 Field (l'ancienne application de ce lien)
---------------------------------------------------
Le miroir historique de SafeX 360 Field qui occupait ce fichier jusqu'au
14 septembre 2026 n'est plus publie ici. Il reste disponible :

  - dans l'historique Git, commit 71f96b92
    (SHA-256 8FFFEA666D6F91D0C2566F5B03AE7104F4BEBA794EE9D97577933EADDEA14361) ;
  - et surtout par le canal de validation interne, qui lui fait foi :
    https://github.com/BICONSULT/SafeX360/actions/workflows/android-build.yml
    Selectionner un run release reussi, puis telecharger l'artefact
    "safex360-field-release-<commit SHA>" : il porte son SHA-256, son SBOM
    CycloneDX et son attestation GitHub.

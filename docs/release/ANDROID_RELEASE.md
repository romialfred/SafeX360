# Livraison Android SafeX

## Canal de livraison valide

Le workflow `.github/workflows/android-build.yml` produit un artefact GitHub
Actions immuable nomme `safex360-field-<type>-<commit SHA>`. L'artefact contient :

- l'APK associe au commit exact du run ;
- `SHA256SUMS.txt` pour verifier l'APK et le SBOM ;
- un SBOM CycloneDX JSON ;
- les metadonnees du depot, du commit, de la reference et du run.

La provenance de build et l'attestation du SBOM sont publiees dans l'onglet
**Attestations** du depot. Une release manuelle echoue si un secret de signature
est absent, si le keystore est vide ou invalide, si l'alias n'existe pas ou si
`apksigner` ne valide pas l'APK produit. Le projet Android etant regenere en CI,
le workflow aligne puis signe explicitement l'APK avec `zipalign` et
`apksigner` ; il ne depend pas d'une configuration Gradle locale ignoree par
Git.

## Verification avant diffusion

1. Ouvrir le run GitHub Actions correspondant au commit a livrer.
2. Confirmer que le run `release` est entierement vert.
3. Telecharger l'artefact dont le nom contient ce meme SHA Git.
4. Executer `sha256sum --check SHA256SUMS.txt` dans le repertoire extrait.
5. Executer `gh attestation verify <APK> --repo BICONSULT/SafeX360`.

Les attestations GitHub sont disponibles pour les depots publics. Pour un depot
prive ou interne, le plan GitHub doit prendre en charge les attestations ; sinon
le workflow echoue volontairement au lieu de publier un binaire sans provenance.

## Residuel du lien public

`Frontend/public/downloads/SafexMobile.apk` est un miroir historique versionne
dans Git. Il n'est plus mis a jour par le workflow et ne doit pas etre interprete
comme la derniere release valide. Il est conserve temporairement afin de ne pas
supprimer le canal actuel avant la mise en place d'un lien public stable vers les
artefacts attestes.

Le bouton Android de la page de connexion pointe encore vers ce miroir. Ce
composant est gere par le lot GOV et n'est pas modifie par AUD-REL-001 pour eviter
un conflit. Avant toute diffusion publique, ce bouton devra soit etre desactive
avec la mention explicite « distribution temporairement indisponible », soit
pointer vers un canal public signe, versionne et verifiable.

Les artefacts GitHub Actions expirent selon la politique de retention du depot
(90 jours demandes par le workflow) et exigent normalement une authentification.
Ils securisent la validation interne mais ne constituent donc pas encore, a eux
seuls, le canal public permanent.

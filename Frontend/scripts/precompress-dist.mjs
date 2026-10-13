/**
 * Pré-compresse le build (dist/) pour le conteneur safex-web.
 *
 * Caddy (`file_server { precompressed br gzip }`) sert alors directement le
 * fichier .br ou .gz voisin au lieu de compresser à la volée : Brotli au niveau
 * maximal coûte trop cher en CPU pour être fait à chaque requête, mais réduit
 * d'environ 15 à 20 % le JavaScript et le CSS du premier chargement par rapport
 * au gzip/zstd dynamique — sensible sur les liaisons lentes des sites miniers.
 *
 * Usage : node scripts/precompress-dist.mjs [dossier]   (défaut : dist)
 * Lancé par le Dockerfile après `npm run build`, donc après la génération du
 * Service Worker : les fichiers .br/.gz n'entrent pas dans le précache.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = path.resolve(process.argv[2] ?? 'dist');
// Formats texte uniquement : images, polices woff2 et APK sont déjà compressés.
const COMPRESSIBLE = new Set(['.js', '.mjs', '.css', '.html', '.svg', '.json', '.webmanifest', '.txt', '.xml']);
const MIN_BYTES = 1024;
// Une variante n'est gardée que si elle fait gagner au moins 5 %.
const MAX_RATIO = 0.95;

async function* files(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) yield* files(candidate);
        else yield candidate;
    }
}

let sources = 0;
let rawBytes = 0;
let brBytes = 0;
for await (const file of files(root)) {
    if (!COMPRESSIBLE.has(path.extname(file).toLowerCase())) continue;
    const { size } = await stat(file);
    if (size < MIN_BYTES) continue;

    const content = await readFile(file);
    const br = brotliCompressSync(content, {
        params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
            [constants.BROTLI_PARAM_SIZE_HINT]: size,
        },
    });
    const gz = gzipSync(content, { level: 9 });

    sources += 1;
    rawBytes += size;
    if (br.length <= size * MAX_RATIO) {
        await writeFile(`${file}.br`, br);
        brBytes += br.length;
    } else {
        brBytes += size;
    }
    if (gz.length <= size * MAX_RATIO) await writeFile(`${file}.gz`, gz);
}

const ratio = rawBytes ? Math.round((brBytes / rawBytes) * 100) : 100;
console.log(`[precompress] ${sources} fichier(s), ${rawBytes} octets -> ${brBytes} en Brotli (${ratio} %).`);

/**
 * cameraService — Wrapper Capacitor Camera avec compression cote client.
 *
 * Politique de compression :
 *   - Reduction a 1024 px (cote le plus long) pour cohabiter avec la 3G
 *   - Conversion JPEG qualite 70% (suffisant pour audit HSE)
 *   - Stripping EXIF (anti fuite de coordonnees GPS dans l'image)
 *
 * Fallback navigateur : input file capture environment si Capacitor absent.
 */

import { photoEnqueue } from '../offline/db';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.7;

export interface CapturedPhoto {
    /** Blob compresse (JPEG, EXIF strip). */
    blob: Blob;
    /** Taille en bytes apres compression. */
    sizeBytes: number;
    /** Nom de fichier suggere pour l'audit. */
    filename: string;
}

/**
 * Compresse une image source vers MAX_DIMENSION x ratio + JPEG qualite 70%.
 * Strip implicite des metadonnees EXIF (canvas ne les conserve pas).
 */
async function compressImage(source: Blob | File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(source);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
            const w = Math.round(img.width * ratio);
            const h = Math.round(img.height * ratio);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context indisponible'));
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Compression a echoue'));
                    resolve(blob);
                },
                'image/jpeg',
                JPEG_QUALITY,
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Lecture de l'image impossible"));
        };
        img.src = url;
    });
}

/**
 * Capture une photo via la camera Capacitor (si dispo) ou input file natif.
 * Compresse cote client puis stocke dans photoQueue (upload differe).
 */
export async function capturePhoto(opts: {
    findingId?: number;
    label?: string;
}): Promise<CapturedPhoto> {
    let sourceBlob: Blob | null = null;

    // 1) Tentative Capacitor Camera (APK Android)
    try {
        const mod = await import(/* @vite-ignore */ '@capacitor/camera').catch(() => null);
        if (mod) {
            const { Camera, CameraResultType, CameraSource } = mod;
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera,
                quality: 80,
                allowEditing: false,
                saveToGallery: false,
                correctOrientation: true,
            });
            if (photo.base64String) {
                const byteString = atob(photo.base64String);
                const arr = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
                sourceBlob = new Blob([arr], { type: `image/${photo.format ?? 'jpeg'}` });
            }
        }
    } catch (_e) {
        // Camera plugin absent ou refuse — fallback en input file
    }

    // 2) Fallback navigateur (input capture)
    if (!sourceBlob) {
        sourceBlob = await pickFromInput();
    }

    if (!sourceBlob) throw new Error('Aucune image capturee');

    // 3) Compression cote client
    const compressed = await compressImage(sourceBlob);
    const filename = `${opts.label ?? 'photo'}-${Date.now()}.jpg`;

    // 4) Stockage en queue d'upload differe (Phase M5 : upload server)
    await photoEnqueue({
        findingId: opts.findingId,
        blob: compressed,
        sizeBytes: compressed.size,
    });

    return {
        blob: compressed,
        sizeBytes: compressed.size,
        filename,
    };
}

function pickFromInput(): Promise<Blob | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.onchange = () => {
            const f = input.files?.[0];
            resolve(f ?? null);
        };
        // Annuler renvoie null
        const cancelTimer = window.setTimeout(() => resolve(null), 60000);
        input.addEventListener('cancel', () => {
            clearTimeout(cancelTimer);
            resolve(null);
        });
        input.click();
    });
}

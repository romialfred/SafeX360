/**
 * CameraCaptureModal — Modal de capture photo via la caméra de l'appareil.
 *
 * Utilise navigator.mediaDevices.getUserMedia (Web API standard).
 *  - Sur desktop : webcam frontale par défaut
 *  - Sur mobile : caméra arrière (facingMode: 'environment')
 *  - Fallback : si caméra refusée, message clair + bouton "Choisir un fichier"
 *
 * Capture :
 *  - Stream affiché en live dans <video>
 *  - Bouton "Capturer" → snapshot via <canvas> → File JPEG
 *  - Bouton "Reprendre" si la photo ne convient pas
 *  - Bouton "Utiliser cette photo" → callback parent avec le File
 */

import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Loader } from '@mantine/core';
import {
    IconCamera, IconReload, IconCheck, IconX, IconAlertTriangle, IconCameraRotate,
} from '@tabler/icons-react';

interface CameraCaptureModalProps {
    opened: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export default function CameraCaptureModal({ opened, onClose, onCapture }: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    // Démarre la caméra à l'ouverture, l'arrête à la fermeture
    useEffect(() => {
        if (opened) {
            startCamera();
        } else {
            stopCamera();
            setCapturedDataUrl(null);
            setError(null);
        }
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, facingMode]);

    const startCamera = async () => {
        setLoading(true);
        setError(null);
        try {
            // Demande accès caméra (arrière sur mobile, défaut sur desktop)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (e: any) {
            console.error('[Camera] Erreur accès', e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                setError(
                    "L'accès à la caméra a été refusé. Veuillez l'autoriser dans les paramètres "
                    + "du navigateur ou utiliser \"Choisir un fichier\" à la place."
                );
            } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
                setError(
                    "Aucune caméra n'a été détectée sur cet appareil. Utilisez \"Choisir un fichier\" "
                    + "pour téléverser une photo existante."
                );
            } else {
                setError("Impossible d'accéder à la caméra : " + (e.message || 'erreur inconnue'));
            }
        } finally {
            setLoading(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedDataUrl(dataUrl);
    };

    const retake = () => setCapturedDataUrl(null);

    const confirmCapture = () => {
        if (!capturedDataUrl) return;
        // Convertit data URL en File
        fetch(capturedDataUrl)
            .then((res) => res.blob())
            .then((blob) => {
                const timestamp = Date.now();
                const file = new File([blob], `safex-photo-${timestamp}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            });
    };

    const switchCamera = () => {
        setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <IconCamera size={18} className="text-indigo-700" />
                    <span className="font-semibold">Prendre une photo</span>
                </div>
            }
            size="xl"
            centered
            classNames={{ body: 'p-0' }}
            withCloseButton={false}
        >
            <div className="relative bg-slate-900 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* Vidéo live */}
                {!capturedDataUrl && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Photo capturée */}
                {capturedDataUrl && (
                    <img
                        src={capturedDataUrl}
                        alt="Aperçu capturé"
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col gap-3 text-white">
                        <Loader color="indigo" />
                        <p className="text-[13px] font-medium">Activation de la caméra…</p>
                    </div>
                )}

                {/* Erreur overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black/85 flex items-center justify-center flex-col gap-3 text-white px-6 text-center">
                        <IconAlertTriangle size={32} className="text-amber-400" />
                        <p className="text-[14px] font-medium max-w-md">{error}</p>
                        <Button
                            variant="default"
                            size="sm"
                            color="white"
                            leftSection={<IconReload size={14} />}
                            onClick={startCamera}
                        >
                            Réessayer
                        </Button>
                    </div>
                )}

                {/* Bouton switch caméra (visible seulement en mobile + caméra OK) */}
                {!loading && !error && !capturedDataUrl && (
                    <button
                        onClick={switchCamera}
                        className="cursor-pointer absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
                        aria-label="Changer de caméra"
                    >
                        <IconCameraRotate size={18} className="text-white" />
                    </button>
                )}

                {/* Reticle / grille de composition (tiers) */}
                {!loading && !error && !capturedDataUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
                        <div className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
                        <div className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
                        <div className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
                    </div>
                )}
            </div>

            {/* Canvas caché pour capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Barre d'actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
                <Button variant="default" leftSection={<IconX size={15} />} onClick={onClose}>
                    Annuler
                </Button>

                {!capturedDataUrl && !error && (
                    <Button
                        size="lg"
                        color="indigo"
                        leftSection={<IconCamera size={20} />}
                        onClick={captureFrame}
                        disabled={loading}
                        styles={{
                            root: {
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                fontWeight: 600,
                                boxShadow: '0 8px 20px -5px rgba(99,102,241,0.5)',
                            },
                        }}
                    >
                        Capturer
                    </Button>
                )}

                {capturedDataUrl && (
                    <div className="flex items-center gap-2">
                        <Button variant="default" leftSection={<IconReload size={15} />} onClick={retake}>
                            Reprendre
                        </Button>
                        <Button
                            color="teal"
                            leftSection={<IconCheck size={15} />}
                            onClick={confirmCapture}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                    fontWeight: 600,
                                },
                            }}
                        >
                            Utiliser cette photo
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

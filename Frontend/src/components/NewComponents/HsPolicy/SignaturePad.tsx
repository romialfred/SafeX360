import { useEffect, useRef } from 'react';

/**
 * Pad de signature manuscrite — canvas HTML natif, sans dépendance.
 *
 * Émet la signature en data-URL PNG à chaque trait terminé. Prend en charge
 * souris ET tactile (un directeur signe souvent sur tablette). Le fond reste
 * transparent pour s'intégrer proprement sur le bloc de signature.
 */
export default function SignaturePad({
    onChange,
    height = 160,
}: {
    onChange: (dataUrl: string | null) => void;
    height?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);
    const last = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Rendu net sur écrans haute densité : on dimensionne le buffer au ratio.
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = height * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0F172A';
        }
    }, [height]);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        last.current = pos(e);
    };

    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !last.current) return;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last.current = p;
        hasInk.current = true;
    };

    const end = () => {
        if (!drawing.current) return;
        drawing.current = false;
        last.current = null;
        onChange(hasInk.current ? (canvasRef.current?.toDataURL('image/png') ?? null) : null);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasInk.current = false;
        onChange(null);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
                style={{
                    width: '100%',
                    height,
                    touchAction: 'none',
                    border: '1px dashed #CBD5E1',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    cursor: 'crosshair',
                }}
            />
            <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-slate-400">Signez dans le cadre (souris ou tactile)</span>
                <button type="button" onClick={clear}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline">
                    Effacer
                </button>
            </div>
        </div>
    );
}

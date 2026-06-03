import { useState } from 'react';
import type { IncidentZoneStat } from './IncidentBodyMap';

export type BodyView = 'front' | 'back' | 'skeleton';

interface ZoneCoord {
    /** Identifiant zone (snake_case) */
    id: string;
    /** Coordonnées du centre dans le viewBox (300x720) */
    cx: number;
    cy: number;
    /** Vue où la zone est visible */
    views: BodyView[];
}

/**
 * Zones anatomiques visibles — coordonnées calibrées sur viewBox 300x720
 * Toutes les parties demandées : tête, visage (oeil/bouche/oreille), épaules,
 * bras, mains, torse, abdomen, hanches, cuisses, genoux, pieds.
 * (Organes génitaux volontairement exclus.)
 */
const ZONE_COORDS: ZoneCoord[] = [
    { id: 'head', cx: 150, cy: 75, views: ['front', 'back', 'skeleton'] },
    { id: 'neck', cx: 150, cy: 140, views: ['front', 'back', 'skeleton'] },
    { id: 'shoulder_left', cx: 110, cy: 175, views: ['front', 'back', 'skeleton'] },
    { id: 'shoulder_right', cx: 190, cy: 175, views: ['front', 'back', 'skeleton'] },
    { id: 'chest', cx: 150, cy: 220, views: ['front', 'skeleton'] },
    { id: 'arm_left', cx: 92, cy: 240, views: ['front', 'back', 'skeleton'] },
    { id: 'arm_right', cx: 208, cy: 240, views: ['front', 'back', 'skeleton'] },
    { id: 'elbow_left', cx: 80, cy: 295, views: ['front', 'back', 'skeleton'] },
    { id: 'elbow_right', cx: 220, cy: 295, views: ['front', 'back', 'skeleton'] },
    { id: 'abdomen', cx: 150, cy: 295, views: ['front', 'skeleton'] },
    { id: 'hand_left', cx: 68, cy: 380, views: ['front', 'back', 'skeleton'] },
    { id: 'hand_right', cx: 232, cy: 380, views: ['front', 'back', 'skeleton'] },
    { id: 'hip_left', cx: 130, cy: 365, views: ['front', 'back', 'skeleton'] },
    { id: 'hip_right', cx: 170, cy: 365, views: ['front', 'back', 'skeleton'] },
    { id: 'thigh_left', cx: 128, cy: 440, views: ['front', 'back', 'skeleton'] },
    { id: 'thigh_right', cx: 172, cy: 440, views: ['front', 'back', 'skeleton'] },
    { id: 'knee_left', cx: 128, cy: 525, views: ['front', 'back', 'skeleton'] },
    { id: 'knee_right', cx: 172, cy: 525, views: ['front', 'back', 'skeleton'] },
    { id: 'foot_left', cx: 128, cy: 670, views: ['front', 'back', 'skeleton'] },
    { id: 'foot_right', cx: 172, cy: 670, views: ['front', 'back', 'skeleton'] },
];

interface HumanBodyProps {
    view: BodyView;
    stats: IncidentZoneStat[];
    hoveredZone: string | null;
    onHover: (zone: string | null) => void;
    height: number;
}

const HumanBody = ({ view, stats, hoveredZone, onHover, height }: HumanBodyProps) => {
    const [labelVisible, _setLabelVisible] = useState(true);

    // Couleur par sévérité
    const severityColor = (sev: 'low' | 'medium' | 'high') =>
        sev === 'high' ? '#dc2626' : sev === 'medium' ? '#f59e0b' : '#22c55e';
    const severityGlow = (sev: 'low' | 'medium' | 'high') =>
        sev === 'high' ? '#fca5a5' : sev === 'medium' ? '#fcd34d' : '#86efac';

    // Rayon proportionnel au nombre d'incidents
    const radiusFor = (count: number) => {
        if (count <= 0) return 0;
        return Math.max(11, Math.min(28, 9 + Math.sqrt(count) * 3));
    };

    return (
        <svg
            viewBox="0 0 300 720"
            preserveAspectRatio="xMidYMid meet"
            style={{ height, width: '100%', display: 'block' }}
            className="select-none"
        >
            <defs>
                {/* Gradient peau / corps */}
                <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde7d2" />
                    <stop offset="50%" stopColor="#f4cfa8" />
                    <stop offset="100%" stopColor="#d4a37b" />
                </linearGradient>

                {/* Gradient ombre interne pour réalisme */}
                <radialGradient id="bodyShade" cx="0.3" cy="0.3" r="0.8">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>

                {/* Gradient squelette */}
                <linearGradient id="boneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5f5f4" />
                    <stop offset="50%" stopColor="#e7e5e4" />
                    <stop offset="100%" stopColor="#a8a29e" />
                </linearGradient>

                {/* Filtre lueur pour points de heatmap */}
                <filter id="zoneGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" />
                </filter>

                {/* Pattern grille en arrière-plan */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(20,184,166,0.05)" strokeWidth="0.5" />
                </pattern>
            </defs>

            {/* Fond grille */}
            <rect width="300" height="720" fill="url(#grid)" />

            {/* === CORPS HUMAIN STYLISÉ === */}
            {view !== 'skeleton' ? (
                <g>
                    {/* Tête (ovale réaliste) */}
                    <ellipse cx="150" cy="70" rx="38" ry="46"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1.2" />
                    {/* Front shading */}
                    <ellipse cx="135" cy="55" rx="22" ry="20" fill="url(#bodyShade)" />

                    {/* Cou */}
                    <path d="M 130 110 L 130 140 L 170 140 L 170 110 Z"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1.2" />

                    {/* Épaules + tronc */}
                    <path d="M 100 155
                             Q 95 160 92 170
                             L 88 240
                             Q 92 270 105 280
                             L 105 360
                             Q 110 380 130 385
                             L 170 385
                             Q 190 380 195 360
                             L 195 280
                             Q 208 270 212 240
                             L 208 170
                             Q 205 160 200 155
                             Z"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1.2" />
                    <ellipse cx="135" cy="220" rx="25" ry="35" fill="url(#bodyShade)" />

                    {view === 'front' && (
                        <>
                            {/* Détails du visage — uniquement vue face */}
                            {/* Yeux */}
                            <ellipse cx="135" cy="68" rx="5" ry="3" fill="#fff" stroke="#5b3a1f" strokeWidth="0.8" />
                            <ellipse cx="165" cy="68" rx="5" ry="3" fill="#fff" stroke="#5b3a1f" strokeWidth="0.8" />
                            <circle cx="135" cy="68" r="1.8" fill="#3b2412" />
                            <circle cx="165" cy="68" r="1.8" fill="#3b2412" />
                            {/* Sourcils */}
                            <path d="M 128 60 Q 135 57 142 60" stroke="#5b3a1f" strokeWidth="1.5" fill="none" />
                            <path d="M 158 60 Q 165 57 172 60" stroke="#5b3a1f" strokeWidth="1.5" fill="none" />
                            {/* Nez */}
                            <path d="M 150 70 L 147 85 Q 150 88 153 85 Z" fill="none" stroke="#a16f4d" strokeWidth="1" />
                            {/* Bouche */}
                            <path d="M 142 96 Q 150 100 158 96" stroke="#9b3a2b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            {/* Oreilles */}
                            <path d="M 112 70 Q 108 75 110 85 Q 113 88 116 85" fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="0.8" />
                            <path d="M 188 70 Q 192 75 190 85 Q 187 88 184 85" fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="0.8" />

                            {/* Clavicules */}
                            <path d="M 105 155 Q 130 158 150 160 Q 170 158 195 155" stroke="#a16f4d" strokeWidth="0.8" fill="none" />
                            {/* Sternum / pectoraux léger ombrage */}
                            <line x1="150" y1="170" x2="150" y2="240" stroke="#c69074" strokeWidth="0.5" opacity="0.5" />
                            {/* Nombril */}
                            <circle cx="150" cy="320" r="1.5" fill="#a16f4d" />
                        </>
                    )}

                    {view === 'back' && (
                        <>
                            {/* Colonne vertébrale visible */}
                            <line x1="150" y1="155" x2="150" y2="380" stroke="#a16f4d" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 3" />
                            {/* Omoplates suggérées */}
                            <path d="M 115 200 Q 125 210 130 230" stroke="#a16f4d" strokeWidth="0.5" fill="none" opacity="0.5" />
                            <path d="M 185 200 Q 175 210 170 230" stroke="#a16f4d" strokeWidth="0.5" fill="none" opacity="0.5" />
                        </>
                    )}

                    {/* Bras gauche */}
                    <path d="M 92 175
                             Q 80 200 76 240
                             Q 72 280 76 320
                             Q 78 360 68 395"
                        stroke="url(#skinGrad)" strokeWidth="22" strokeLinecap="round" fill="none" />
                    {/* Bras droit */}
                    <path d="M 208 175
                             Q 220 200 224 240
                             Q 228 280 224 320
                             Q 222 360 232 395"
                        stroke="url(#skinGrad)" strokeWidth="22" strokeLinecap="round" fill="none" />

                    {/* Mains (paume + doigts simplifiés) */}
                    <g>
                        <ellipse cx="68" cy="395" rx="14" ry="20" fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1" />
                        <ellipse cx="232" cy="395" rx="14" ry="20" fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1" />
                        {/* Doigts schématiques */}
                        {[58, 64, 70, 76, 82].map((x, i) => (
                            <line key={`fl${i}`} x1={x} y1={400} x2={x} y2={420} stroke="#a16f4d" strokeWidth="2.5" strokeLinecap="round" />
                        ))}
                        {[218, 224, 230, 236, 242].map((x, i) => (
                            <line key={`fr${i}`} x1={x} y1={400} x2={x} y2={420} stroke="#a16f4d" strokeWidth="2.5" strokeLinecap="round" />
                        ))}
                    </g>

                    {/* Bassin / hanches */}
                    <path d="M 105 360
                             Q 100 380 110 405
                             L 122 410
                             Q 150 415 178 410
                             L 190 405
                             Q 200 380 195 360 Z"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1.2" />

                    {/* Jambe gauche */}
                    <path d="M 125 410
                             Q 122 460 122 510
                             Q 120 560 123 610
                             Q 124 640 122 660"
                        stroke="url(#skinGrad)" strokeWidth="28" strokeLinecap="round" fill="none" />
                    {/* Jambe droite */}
                    <path d="M 175 410
                             Q 178 460 178 510
                             Q 180 560 177 610
                             Q 176 640 178 660"
                        stroke="url(#skinGrad)" strokeWidth="28" strokeLinecap="round" fill="none" />

                    {/* Genoux (rotule visible) */}
                    {view === 'front' && (
                        <>
                            <ellipse cx="123" cy="525" rx="8" ry="6" fill="rgba(161,111,77,0.25)" stroke="#a16f4d" strokeWidth="0.8" />
                            <ellipse cx="177" cy="525" rx="8" ry="6" fill="rgba(161,111,77,0.25)" stroke="#a16f4d" strokeWidth="0.8" />
                        </>
                    )}

                    {/* Pieds */}
                    <path d="M 108 660 Q 105 680 110 695 Q 130 700 145 685 Q 140 670 125 660 Z"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1" />
                    <path d="M 192 660 Q 195 680 190 695 Q 170 700 155 685 Q 160 670 175 660 Z"
                        fill="url(#skinGrad)" stroke="#a16f4d" strokeWidth="1" />
                </g>
            ) : (
                /* === VUE SQUELETTE === */
                <g>
                    {/* Crâne */}
                    <ellipse cx="150" cy="70" rx="36" ry="44"
                        fill="url(#boneGrad)" stroke="#78716c" strokeWidth="1.2" />
                    <ellipse cx="135" cy="78" rx="4" ry="6" fill="#1e293b" />
                    <ellipse cx="165" cy="78" rx="4" ry="6" fill="#1e293b" />
                    <ellipse cx="150" cy="95" rx="5" ry="3" fill="#1e293b" />
                    {/* Sutures crâniennes */}
                    <path d="M 115 55 Q 150 30 185 55" stroke="#78716c" strokeWidth="0.5" fill="none" />
                    {/* Mandibule */}
                    <path d="M 125 95 Q 150 118 175 95" stroke="#78716c" strokeWidth="1" fill="none" />

                    {/* Vertèbres cervicales */}
                    {[120, 128, 136].map((y, i) => (
                        <rect key={`c${i}`} x="143" y={y} width="14" height="4" rx="2"
                            fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />
                    ))}

                    {/* Clavicules */}
                    <path d="M 100 158 Q 130 162 150 165 Q 170 162 200 158"
                        fill="none" stroke="#78716c" strokeWidth="6" strokeLinecap="round" />

                    {/* Cage thoracique (côtes) */}
                    {[180, 200, 220, 240].map((y, i) => (
                        <ellipse key={`r${i}`} cx="150" cy={y} rx={50 - i * 1.5} ry="4"
                            fill="none" stroke="#78716c" strokeWidth="1.5" />
                    ))}
                    {/* Sternum */}
                    <rect x="146" y="175" width="8" height="80" rx="3"
                        fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />

                    {/* Colonne vertébrale */}
                    {[260, 270, 280, 290, 300, 310, 320, 330, 340, 350].map((y, i) => (
                        <rect key={`v${i}`} x="143" y={y} width="14" height="6" rx="2"
                            fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.5" />
                    ))}

                    {/* Bassin */}
                    <path d="M 100 365 Q 95 385 105 410 L 195 410 Q 205 385 200 365
                             Q 175 360 150 362 Q 125 360 100 365 Z"
                        fill="url(#boneGrad)" stroke="#78716c" strokeWidth="1.2" />
                    {/* Sacrum */}
                    <path d="M 140 365 L 160 365 L 158 405 L 142 405 Z"
                        fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />

                    {/* Os longs des bras */}
                    {/* Humérus G */}
                    <line x1="100" y1="170" x2="80" y2="290" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />
                    <line x1="100" y1="170" x2="80" y2="290" stroke="#78716c" strokeWidth="1" />
                    {/* Cubitus + radius G */}
                    <line x1="80" y1="295" x2="72" y2="385" stroke="url(#boneGrad)" strokeWidth="5" strokeLinecap="round" />
                    <line x1="84" y1="295" x2="76" y2="385" stroke="url(#boneGrad)" strokeWidth="5" strokeLinecap="round" />
                    {/* Humérus D */}
                    <line x1="200" y1="170" x2="220" y2="290" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />
                    {/* Cubitus + radius D */}
                    <line x1="220" y1="295" x2="228" y2="385" stroke="url(#boneGrad)" strokeWidth="5" strokeLinecap="round" />
                    <line x1="216" y1="295" x2="224" y2="385" stroke="url(#boneGrad)" strokeWidth="5" strokeLinecap="round" />

                    {/* Articulations (épaule/coude/poignet) */}
                    {[[100, 170], [80, 295], [72, 388], [200, 170], [220, 295], [228, 388]].map(([x, y], i) => (
                        <circle key={`j${i}`} cx={x} cy={y} r="5" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.8" />
                    ))}

                    {/* Mains (carpiens + métacarpiens simplifiés) */}
                    <g>
                        <ellipse cx="68" cy="395" rx="10" ry="14" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />
                        <ellipse cx="232" cy="395" rx="10" ry="14" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />
                        {[60, 65, 70, 75].map((x, i) => (
                            <line key={`pl${i}`} x1={x} y1={405} x2={x} y2={425} stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" />
                        ))}
                        {[225, 230, 235, 240].map((x, i) => (
                            <line key={`pr${i}`} x1={x} y1={405} x2={x} y2={425} stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" />
                        ))}
                    </g>

                    {/* Os longs des jambes */}
                    {/* Fémur G */}
                    <line x1="125" y1="410" x2="123" y2="520" stroke="url(#boneGrad)" strokeWidth="10" strokeLinecap="round" />
                    {/* Rotule G */}
                    <ellipse cx="123" cy="525" rx="7" ry="5" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.8" />
                    {/* Tibia G */}
                    <line x1="123" y1="530" x2="122" y2="650" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />
                    {/* Péroné G */}
                    <line x1="119" y1="530" x2="118" y2="650" stroke="url(#boneGrad)" strokeWidth="3" strokeLinecap="round" />

                    {/* Fémur D */}
                    <line x1="175" y1="410" x2="177" y2="520" stroke="url(#boneGrad)" strokeWidth="10" strokeLinecap="round" />
                    {/* Rotule D */}
                    <ellipse cx="177" cy="525" rx="7" ry="5" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.8" />
                    {/* Tibia D */}
                    <line x1="177" y1="530" x2="178" y2="650" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />
                    {/* Péroné D */}
                    <line x1="181" y1="530" x2="182" y2="650" stroke="url(#boneGrad)" strokeWidth="3" strokeLinecap="round" />

                    {/* Pieds : tarse + métatarse simplifiés */}
                    <ellipse cx="122" cy="670" rx="16" ry="6" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />
                    <ellipse cx="178" cy="670" rx="16" ry="6" fill="url(#boneGrad)" stroke="#78716c" strokeWidth="0.6" />
                    {[112, 118, 124, 130, 136].map((x, i) => (
                        <line key={`tl${i}`} x1={x} y1={672} x2={x} y2={690} stroke="#78716c" strokeWidth="1" />
                    ))}
                    {[164, 170, 176, 182, 188].map((x, i) => (
                        <line key={`tr${i}`} x1={x} y1={672} x2={x} y2={690} stroke="#78716c" strokeWidth="1" />
                    ))}
                </g>
            )}

            {/* === HEATMAP : points par zone === */}
            {ZONE_COORDS.filter(z => z.views.includes(view)).map((zone) => {
                const stat = stats.find(s => s.zoneId === zone.id);
                if (!stat || stat.count === 0) return null;

                const isHovered = hoveredZone === zone.id;
                const radius = radiusFor(stat.count);
                const color = severityColor(stat.severity);
                const glow = severityGlow(stat.severity);

                return (
                    <g key={zone.id}
                       onMouseEnter={() => onHover(zone.id)}
                       onMouseLeave={() => onHover(null)}
                       style={{ cursor: 'pointer' }}>
                        {/* Halo lumineux */}
                        <circle
                            cx={zone.cx} cy={zone.cy} r={radius * 1.5}
                            fill={glow} opacity={isHovered ? 0.7 : 0.35}
                            filter="url(#zoneGlow)"
                        />
                        {/* Cercle plein */}
                        <circle
                            cx={zone.cx} cy={zone.cy} r={radius}
                            fill={color}
                            stroke="white" strokeWidth={isHovered ? 2.5 : 1.5}
                            opacity={isHovered ? 1 : 0.9}
                            style={{ transition: 'all 0.2s ease' }}
                        />
                        {/* Compteur centré */}
                        <text
                            x={zone.cx} y={zone.cy + 4}
                            textAnchor="middle"
                            fill="white"
                            fontWeight="700"
                            fontSize={radius > 16 ? 13 : radius > 13 ? 11 : 10}
                            style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                            {stat.count}
                        </text>
                        {/* Label au survol */}
                        {isHovered && labelVisible && (
                            <g style={{ pointerEvents: 'none' }}>
                                <rect
                                    x={zone.cx - 50}
                                    y={zone.cy + radius + 6}
                                    width="100" height="18" rx="3"
                                    fill="rgba(15,23,42,0.92)" stroke="white" strokeWidth="0.5"
                                />
                                <text
                                    x={zone.cx} y={zone.cy + radius + 19}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="10"
                                    fontWeight="500"
                                >
                                    {stat.label}
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default HumanBody;

/**
 * LandingPage v7 — Vitrine corporate claire (fond clair, navy + ambre en accents).
 *
 * Direction validee (2026-07-22) : homepage SaaS structuree
 *  - Hero clair, photo d'equipe terrain + cartes indicateurs flottantes
 *  - Secteurs, section « probleme », modules, workflow 8 etapes, features, formulaire de demo
 *  - Photos reelles d'equipes (aucune capture d'ecran produit)
 *  - Vrai logo SafeX (public/safex-logo-dark.png clair, public/safex-logo.png fonce)
 *  - Carte d'Afrique avec Burkina Faso / Mali / Niger mis en avant
 *
 * Garde-fou AUD-GOV-001 (PublicClaimsPolicy.test) : aucune allegation de certification
 * ou de performance non demontree ; on parle de workflows « conçus pour soutenir » les
 * demarches normatives, jamais d'attestation delivree par un organisme tiers.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const LOGO_LIGHT = '/safex-logo-dark.png'; // « SafeX » teal — pour fond clair
const LOGO_DARK = '/safex-logo.png';       // « SafeX » blanc — pour fond fonce
const PHOTO_HERO = '/hero/training-team.png';
const PHOTO_FIELD = '/hero/workers-loto.png';

type Problem = { icon: string; bg: string; color: string; title: string; desc: string; stat: string; cap: string };
const PROBLEMS: Problem[] = [
    { icon: '📄', bg: 'rgba(37,99,235,.1)', color: 'var(--blue)', title: 'Informations fragmentées', desc: 'Registres papier, fichiers Excel et données isolées.', stat: '60%', cap: 'des données HSE non centralisées' },
    { icon: '⏱', bg: 'rgba(245,166,35,.16)', color: 'var(--amber-d)', title: 'Réactivité insuffisante', desc: 'Alertes tardives et actions correctives difficiles à suivre.', stat: '35%', cap: 'des actions traitées en retard' },
    { icon: '👁', bg: 'rgba(15,158,142,.12)', color: 'var(--teal)', title: 'Visibilité limitée', desc: 'Absence de vision consolidée entre les sites et les opérations.', stat: '40%', cap: 'des incidents sans analyse globale' },
    { icon: '📋', bg: 'rgba(124,58,237,.1)', color: '#7C3AED', title: 'Conformité complexe', desc: 'Difficile de documenter les audits, preuves et responsabilités.', stat: '30%', cap: 'de temps perdu en préparation d’audit' },
];

type Module = { icon: string; color: string; title: string; desc: string };
const MODULES: Module[] = [
    { icon: '🚨', color: '#E5484D', title: 'Incidents & Accidents', desc: 'Déclarez, analysez et suivez les incidents et accidents en temps réel.' },
    { icon: '🔍', color: '#0EA5E9', title: 'Inspections Terrain', desc: 'Réalisez des inspections mobiles avec des checklists dynamiques.' },
    { icon: '⚠️', color: '#F59E0B', title: 'Gestion des risques', desc: 'Évaluez, hiérarchisez et maîtrisez vos risques opérationnels.' },
    { icon: '📋', color: '#7C3AED', title: 'Audits & Conformité', desc: 'Planifiez vos audits et suivez vos démarches vers les référentiels.' },
    { icon: '✅', color: '#12A150', title: 'Plans d’action', desc: 'Affectez, suivez et clôturez les actions correctives et préventives.' },
    { icon: '❤️', color: '#EC4899', title: 'Santé au travail', desc: 'Suivez les visites médicales, expositions et indicateurs de santé.' },
    { icon: '🌱', color: '#16A34A', title: 'Environnement', desc: 'Maîtrisez vos impacts environnementaux et vos engagements.' },
    { icon: '📈', color: '#2563EB', title: 'Reporting & Décisionnel', desc: 'Pilotez avec des tableaux de bord et des rapports personnalisés.' },
];

const STEPS: [string, string][] = [
    ['Observer', 'Le terrain identifie un risque ou un événement.'],
    ['Déclarer', 'Saisie mobile avec preuves, en temps réel.'],
    ['Alerter', 'Les bonnes personnes sont notifiées.'],
    ['Analyser', 'Les causes profondes sont identifiées.'],
    ['Corriger', 'Actions définies et mises en œuvre.'],
    ['Planifier', 'Suivi de l’efficacité dans le temps.'],
    ['Contrôler', 'Vérification et clôture contrôlée.'],
    ['Décider', 'Données fiables et consolidées pour la direction.'],
];

const SECTORS = ['⛏ Exploitation minière', '⛰ Carrières', '⚡ Énergie', '🏗 BTP', '🏭 Industrie', '🚚 Logistique'];

const CSS = `
  .lp{--ink:#12233D;--navy:#0B1E3A;--muted:#5B6a7d;--faint:#93A0AF;--bg:#FFFFFF;--bg2:#F4F8FC;
    --line:#E2EAF2;--card:#FFFFFF;--amber:#F5A623;--amber-d:#DE8E0C;--blue:#2563EB;--teal:#0F9E8E;
    --good:#12A150;--sans:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
    --sh:0 12px 30px -18px rgba(18,35,61,.35);
    background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  .lp *{box-sizing:border-box}
  .lp .wrap{max-width:1180px;margin:0 auto;padding:0 22px}
  .lp h1,.lp h2,.lp h3,.lp h4{margin:0;font-weight:800;letter-spacing:-.02em;line-height:1.12;text-wrap:balance}
  .lp p{margin:0}
  .lp a{text-decoration:none;color:inherit}
  .lp .over{font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:var(--blue)}
  .lp .btn{display:inline-flex;align-items:center;gap:8px;border-radius:9px;font-weight:700;font-size:14px;padding:12px 20px;border:0;cursor:pointer;transition:transform .12s,box-shadow .2s,background .2s;font-family:inherit}
  .lp .btn-a{background:var(--amber);color:#3a2600;box-shadow:0 10px 22px -10px var(--amber)}
  .lp .btn-a:hover{background:var(--amber-d);transform:translateY(-1px)}
  .lp .btn-o{background:#fff;border:1.6px solid var(--line);color:var(--ink)}
  .lp .btn-o:hover{border-color:var(--ink)}
  .lp .btn-b{background:var(--blue);color:#fff}

  .lp .nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .lp .nav .wrap{display:flex;align-items:center;gap:20px;height:66px}
  .lp .logo{display:flex;align-items:center;gap:10px}
  .lp .logo-img{height:30px;width:auto;display:block}
  .lp .logo-sub{font-size:9px;letter-spacing:.13em;color:var(--faint);font-weight:800;text-transform:uppercase;border-left:1px solid var(--line);padding-left:10px}
  .lp .menu{display:flex;gap:22px;margin-left:14px;font-size:14px;font-weight:600;color:var(--muted)}
  .lp .menu a{cursor:pointer}
  .lp .menu a:hover{color:var(--ink)}
  .lp .navr{margin-left:auto;display:flex;align-items:center;gap:12px}
  .lp .lang{font-size:13px;font-weight:700;color:var(--muted);border:1px solid var(--line);border-radius:7px;padding:6px 10px}
  .lp .link-b{font-size:14px;font-weight:700;color:var(--ink);cursor:pointer}
  @media(max-width:560px){.lp .logo-sub{display:none}}
  @media(max-width:960px){.lp .menu,.lp .link-b,.lp .lang{display:none}}

  .lp .hero{background:linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%);border-bottom:1px solid var(--line)}
  .lp .hero .wrap{display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center;padding:64px 22px 72px}
  .lp .badge{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--amber-d);background:#FDF3E1;border:1px solid #F6DFB3;padding:7px 13px;border-radius:999px}
  .lp .hero h1{font-size:clamp(32px,4.5vw,54px);margin-top:20px;color:var(--ink)}
  .lp .hero h1 .y{color:var(--amber-d)}
  .lp .hero .sub{margin-top:20px;font-size:17px;line-height:1.6;color:var(--muted);max-width:46ch}
  .lp .hero .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
  .lp .pills{display:flex;gap:9px 16px;flex-wrap:wrap;margin-top:26px}
  .lp .pill{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--muted)}
  .lp .hero-art{position:relative}
  .lp .hero-art .photo{border-radius:18px;overflow:hidden;box-shadow:var(--sh);aspect-ratio:4/3}
  .lp .hero-art .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .lp .fc1,.lp .fc2{position:absolute;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 30px -16px rgba(18,35,61,.4);padding:12px 14px}
  .lp .fc1{top:18px;left:-16px}.lp .fc2{bottom:18px;right:-16px}
  .lp .fc1 .t,.lp .fc2 .t{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
  .lp .fc1 .n{font-size:24px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums}
  .lp .fc1 .d{font-size:11px;font-weight:800;color:var(--good)}
  .lp .fc2 .row{display:flex;align-items:center;gap:9px}
  .lp .fc2 .dot{width:9px;height:9px;border-radius:50%;background:#ff6b6b;box-shadow:0 0 0 4px rgba(255,107,107,.18)}
  .lp .fc2 .lab{font-size:12.5px;font-weight:700;color:var(--ink)}
  @media(max-width:960px){.lp .hero .wrap{grid-template-columns:1fr;gap:52px}.lp .fc1{left:8px}.lp .fc2{right:8px}}

  .lp .sectors{background:var(--bg);border-bottom:1px solid var(--line);padding:26px 0}
  .lp .sectors .lbl{text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--faint)}
  .lp .tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px}
  .lp .tab{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--muted);padding:10px 16px;border-radius:9px;border:1px solid transparent;cursor:pointer}
  .lp .tab.on{color:var(--navy);background:var(--bg2);border-color:var(--line)}

  .lp section{padding:80px 0}
  .lp .sh{text-align:center;max-width:720px;margin:0 auto}
  .lp .sh h2{font-size:clamp(24px,3.2vw,38px)}
  .lp .sh p{color:var(--muted);margin-top:14px;font-size:16px;line-height:1.6}
  .lp .alt{background:var(--bg2)}

  .lp .prob{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:48px}
  .lp .pc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px 22px;box-shadow:var(--sh)}
  .lp .pc .ic{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px}
  .lp .pc h4{font-size:16px}
  .lp .pc p{color:var(--muted);font-size:13.5px;margin-top:8px;line-height:1.5}
  .lp .pc .stat{font-size:34px;font-weight:800;margin-top:16px;font-variant-numeric:tabular-nums}
  .lp .pc .cap{font-size:12px;color:var(--faint);font-weight:600}
  @media(max-width:900px){.lp .prob{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.lp .prob{grid-template-columns:1fr}}

  .lp .field .fgrid{display:grid;grid-template-columns:1fr 1.1fr;gap:52px;align-items:center;margin-top:8px}
  .lp .field h2{font-size:clamp(24px,3vw,34px)}
  .lp .field .intro{color:var(--muted);font-size:15.5px;line-height:1.6;margin:14px 0 22px;max-width:46ch}
  .lp .field ul{list-style:none;padding:0;margin:0 0 24px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .lp .field li{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:600}
  .lp .field .photo{position:relative;border-radius:18px;overflow:hidden;box-shadow:var(--sh);aspect-ratio:4/3}
  .lp .field .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .lp .field .photo .cap{position:absolute;left:14px;bottom:14px;font-size:11px;font-weight:700;color:#fff;background:rgba(11,30,58,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);padding:6px 12px;border-radius:999px}
  @media(max-width:900px){.lp .field .fgrid{grid-template-columns:1fr;gap:30px}.lp .field ul{grid-template-columns:1fr}}

  .lp .mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px}
  .lp .mc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;transition:transform .2s,box-shadow .2s}
  .lp .mc:hover{transform:translateY(-3px);box-shadow:var(--sh)}
  .lp .mc .ic{width:46px;height:46px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:20px}
  .lp .mc h4{font-size:15.5px}
  .lp .mc p{font-size:12.5px;color:var(--muted);margin-top:7px;line-height:1.45}
  .lp .mc .more{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--blue);margin-top:14px}
  @media(max-width:980px){.lp .mgrid{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.lp .mgrid{grid-template-columns:1fr}}

  .lp .flow{display:grid;grid-template-columns:.8fr 2.2fr;gap:36px;align-items:center;margin-top:8px}
  .lp .flow-l h2{font-size:clamp(22px,2.8vw,30px)}
  .lp .flow-l p{color:var(--muted);margin-top:14px;font-size:15px;line-height:1.6}
  .lp .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 14px}
  .lp .step{text-align:center}
  .lp .step .n{width:42px;height:42px;margin:0 auto;border-radius:50%;background:#fff;border:2px solid var(--teal);color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 6px 16px -8px rgba(15,158,142,.5)}
  .lp .step h4{font-size:14px;margin-top:12px}
  .lp .step p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.4}
  @media(max-width:900px){.lp .flow{grid-template-columns:1fr}.lp .steps{grid-template-columns:1fr 1fr}}

  .lp .fgrid2{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
  .lp .fc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;box-shadow:var(--sh)}
  .lp .fc .ic{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:19px}
  .lp .fc h4{font-size:16px}
  .lp .fc .fl{color:var(--muted);font-size:13px;margin-top:8px;line-height:1.5}
  .lp .fc ul{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:8px}
  .lp .fc li{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--muted);line-height:1.4}
  .lp .fc .more{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--blue);margin-top:14px;cursor:pointer}
  .lp .fc.map .africa{width:100%;height:170px;margin-top:8px;display:block}
  .lp .fc.map .cont{fill:#DCE6F1;stroke:#C3D2E2;stroke-width:1}
  .lp .fc.map .sahel{fill:rgba(245,166,35,.22);stroke:var(--amber-d);stroke-width:1.2;stroke-linejoin:round}
  .lp .fc.map .plabel{font:800 9px var(--sans);fill:var(--ink)}
  .lp .fc.map .mlegend{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .lp .fc.map .mlegend span{font-size:11px;font-weight:800;color:var(--ink);background:#FDF3E1;border:1px solid #F3DCAF;border-radius:999px;padding:4px 10px;display:inline-flex;align-items:center;gap:6px}
  .lp .fc.map .mlegend i{width:8px;height:8px;border-radius:50%;display:block}
  .lp .fc.vid .play{width:100%;height:110px;border-radius:10px;margin-top:12px;background:linear-gradient(135deg,#DDEAF9,#EAF2FB);display:flex;align-items:center;justify-content:center;border:1px solid var(--line)}
  .lp .fc.vid .pb{width:48px;height:48px;border-radius:50%;background:var(--amber);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px -6px var(--amber)}
  @media(max-width:900px){.lp .fgrid2{grid-template-columns:1fr 1fr}}
  @media(max-width:560px){.lp .fgrid2{grid-template-columns:1fr}}

  .lp .conv{background:linear-gradient(135deg,#FDF6EA 0%,var(--bg2) 60%)}
  .lp .conv .wrap{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;padding:70px 22px}
  .lp .conv h2{font-size:clamp(24px,3.2vw,36px)}
  .lp .conv .sub{color:var(--muted);margin-top:16px;font-size:15.5px;line-height:1.6;max-width:42ch}
  .lp .kpis{display:flex;gap:30px;margin-top:28px;flex-wrap:wrap}
  .lp .kpi .n{font-size:30px;font-weight:800;color:var(--amber-d);font-variant-numeric:tabular-nums}
  .lp .kpi .l{font-size:12px;color:var(--muted);font-weight:600}
  .lp .form{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px;box-shadow:0 26px 50px -30px rgba(18,35,61,.45)}
  .lp .form h3{font-size:18px}
  .lp .fg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
  .lp .form input,.lp .form select{width:100%;font-family:inherit;font-size:13.5px;padding:11px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink)}
  .lp .form input:focus,.lp .form select:focus{outline:2px solid var(--amber);outline-offset:1px;border-color:transparent}
  .lp .form .btn-a{width:100%;justify-content:center;margin-top:14px;padding:13px}
  .lp .form .note{font-size:11px;color:var(--faint);margin-top:10px;text-align:center}
  @media(max-width:900px){.lp .conv .wrap{grid-template-columns:1fr;gap:30px}.lp .fg{grid-template-columns:1fr}}

  .lp footer{background:var(--navy);color:rgba(255,255,255,.75);padding:52px 0 26px}
  .lp .fcols{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1.2fr;gap:28px}
  .lp footer h5{color:#fff;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 14px}
  .lp footer ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px;font-size:13px}
  .lp footer li a{cursor:pointer}
  .lp footer li a:hover{color:#fff}
  .lp footer .desc{font-size:13px;line-height:1.6;max-width:34ch;margin-top:12px}
  .lp footer .contact{font-size:12.5px;line-height:1.7}
  .lp .fbar{border-top:1px solid rgba(255,255,255,.12);margin-top:38px;padding-top:20px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:12px;color:rgba(255,255,255,.6)}
  .lp .oper{display:inline-flex;align-items:center;gap:7px;color:#7ee0a3;font-weight:700}
  .lp .oper .dot{width:8px;height:8px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 4px rgba(61,220,132,.2)}
  @media(max-width:900px){.lp .fcols{grid-template-columns:1fr 1fr}}

  .lp .reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
  .lp .reveal.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){.lp .reveal{opacity:1;transform:none;transition:none}}
`;

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Utilisateur connecte : RootGate sert le dashboard sur « / ».
    useEffect(() => {
        if (user) navigate('/', { replace: true });
    }, [user, navigate]);

    // Reveal au scroll.
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const els = Array.from(root.querySelectorAll('.reveal'));
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            }),
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    const login = () => navigate('/login');
    const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="lp" ref={rootRef}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* NAV */}
            <nav className="nav"><div className="wrap">
                <div className="logo">
                    <img className="logo-img" src={LOGO_LIGHT} alt="SafeX 360" />
                    <span className="logo-sub">Digital HSE Platform</span>
                </div>
                <div className="menu">
                    <a onClick={() => goTo('modules')}>Solution</a>
                    <a onClick={() => goTo('modules')}>Modules</a>
                    <a onClick={() => goTo('secteurs')}>Secteurs</a>
                    <a onClick={() => goTo('features')}>Fonctionnalités</a>
                    <a onClick={() => goTo('features')}>Conformité</a>
                    <a onClick={() => goTo('demo')}>À propos</a>
                </div>
                <div className="navr">
                    <span className="lang">FR</span>
                    <a className="link-b" onClick={login}>Se connecter</a>
                    <button className="btn btn-a" onClick={() => goTo('demo')}>Demander une démonstration</button>
                </div>
            </div></nav>

            {/* HERO */}
            <header className="hero"><div className="wrap">
                <div className="reveal">
                    <span className="badge">● Solution HSE intelligente pour l’industrie minière</span>
                    <h1>Anticipez les risques.<br />Protégez vos équipes.<br />Pilotez votre <span className="y">performance HSE.</span></h1>
                    <p className="sub">SafeX 360 digitalise l’ensemble de vos processus Santé, Sécurité et Environnement, du terrain jusqu’au pilotage stratégique.</p>
                    <div className="cta">
                        <button className="btn btn-a" onClick={() => goTo('demo')}>Demander une démonstration &nbsp;→</button>
                        <button className="btn btn-o" onClick={() => goTo('modules')}>Découvrir la plateforme</button>
                    </div>
                    <div className="pills">
                        <span className="pill">◉ Multi-sites</span>
                        <span className="pill">⏱ Temps réel</span>
                        <span className="pill">📱 Mobile &amp; Tablette</span>
                        <span className="pill">🔒 Sécurisé</span>
                        <span className="pill">✔ Conforme</span>
                    </div>
                </div>
                <div className="hero-art reveal">
                    <div className="photo"><img src={PHOTO_HERO} alt="Équipe HSE sur site minier" /></div>
                    <div className="fc1"><div className="t">Incidents ce mois</div><div className="n">128</div><div className="d">↓ 13%</div></div>
                    <div className="fc2"><div className="row"><span className="dot" /><span className="lab">Équipe au complet · 243 pointés</span></div></div>
                </div>
            </div></header>

            {/* SECTEURS */}
            <div className="sectors" id="secteurs">
                <div className="lbl">Une plateforme conçue pour les environnements industriels exigeants</div>
                <div className="tabs">
                    {SECTORS.map((s, i) => (
                        <span key={s} className={`tab${i === 0 ? ' on' : ''}`}>{s}</span>
                    ))}
                </div>
            </div>

            {/* PROBLEME */}
            <section className="alt">
                <div className="sh reveal"><h2>Les risques terrain ne peuvent plus être pilotés avec des outils dispersés</h2></div>
                <div className="wrap"><div className="prob">
                    {PROBLEMS.map((p) => (
                        <div className="pc reveal" key={p.title}>
                            <div className="ic" style={{ background: p.bg, color: p.color }}>{p.icon}</div>
                            <h4>{p.title}</h4>
                            <p>{p.desc}</p>
                            <div className="stat" style={{ color: p.color }}>{p.stat}</div>
                            <div className="cap">{p.cap}</div>
                        </div>
                    ))}
                </div></div>
            </section>

            {/* TERRAIN (photo equipe, sans capture) */}
            <section className="field">
                <div className="wrap"><div className="fgrid">
                    <div className="reveal">
                        <span className="over">Sur le terrain</span>
                        <h2 style={{ marginTop: 10 }}>Une plateforme entre les mains de vos équipes</h2>
                        <p className="intro">Du fond de mine jusqu’à la direction HSE, chacun saisit, alerte et suit au bon moment. L’information remonte du terrain, fiable et tracée.</p>
                        <ul>
                            <li>✓ Saisie mobile temps réel</li>
                            <li>✓ Alertes et notifications</li>
                            <li>✓ Comparaison multi-sites</li>
                            <li>✓ Analyse de tendances</li>
                            <li>✓ Rapports automatiques</li>
                            <li>✓ Données fiables et traçables</li>
                        </ul>
                        <button className="btn btn-b" onClick={() => goTo('modules')}>Découvrir les modules</button>
                    </div>
                    <div className="photo reveal">
                        <span className="cap">Équipe HSE · Consignation sur site</span>
                        <img src={PHOTO_FIELD} alt="Équipe minière en activité" />
                    </div>
                </div></div>
            </section>

            {/* MODULES */}
            <section id="modules" className="alt">
                <div className="sh reveal"><span className="over">Modules</span><h2 style={{ marginTop: 10 }}>Des modules complets pour couvrir tous vos besoins HSE</h2></div>
                <div className="wrap"><div className="mgrid">
                    {MODULES.map((m) => (
                        <div className="mc" key={m.title}>
                            <div className="ic" style={{ background: m.color + '22', color: m.color }}>{m.icon}</div>
                            <h4>{m.title}</h4>
                            <p>{m.desc}</p>
                            <span className="more">En savoir plus →</span>
                        </div>
                    ))}
                </div></div>
            </section>

            {/* WORKFLOW */}
            <section>
                <div className="wrap"><div className="flow">
                    <div className="flow-l reveal">
                        <span className="over">Processus</span>
                        <h2 style={{ marginTop: 10 }}>Du terrain au comité de direction, une information unique et fiable</h2>
                        <p>Un processus digitalisé et collaboratif, de l’observation sur site jusqu’à la décision stratégique.</p>
                    </div>
                    <div className="steps reveal">
                        {STEPS.map(([t, d], i) => (
                            <div className="step" key={t}>
                                <div className="n">{i + 1}</div>
                                <h4>{t}</h4>
                                <p>{d}</p>
                            </div>
                        ))}
                    </div>
                </div></div>
            </section>

            {/* FEATURES */}
            <section id="features" className="alt">
                <div className="sh reveal"><h2>Bien plus qu’un logiciel de suivi</h2><p>Des capacités avancées pour passer du réactif au préventif.</p></div>
                <div className="wrap"><div className="fgrid2">
                    <div className="fc reveal">
                        <div className="ic" style={{ background: 'rgba(124,58,237,.1)', color: '#7C3AED' }}>🧠</div>
                        <h4>IA &amp; analyse prédictive</h4>
                        <ul>
                            <li>• Détection des tendances anormales</li>
                            <li>• Identification des incidents récurrents</li>
                            <li>• Suggestions d’actions prioritaires</li>
                        </ul>
                        <span className="more">En savoir plus →</span>
                    </div>
                    <div className="fc reveal">
                        <div className="ic" style={{ background: 'rgba(18,161,80,.12)', color: 'var(--good)' }}>✅</div>
                        <h4>Conformité &amp; normes</h4>
                        <p className="fl">Des workflows conçus pour soutenir vos démarches de management HSE.</p>
                        <ul>
                            <li>• Aligné avec ISO 45001</li>
                            <li>• Aligné avec ISO 14001</li>
                            <li>• Aligné avec ISO 19011</li>
                            <li>• Traçabilité et preuves auditables</li>
                        </ul>
                        <span className="more">En savoir plus →</span>
                    </div>
                    <div className="fc map reveal">
                        <div className="ic" style={{ background: 'rgba(37,99,235,.1)', color: 'var(--blue)' }}>🌍</div>
                        <h4>Pilotage multi-sites</h4>
                        <svg className="africa" viewBox="0 0 300 300" role="img" aria-label="Carte d’Afrique : Burkina Faso, Mali, Niger">
                            <path className="cont" d="M78,52 L120,40 L150,44 L185,46 L218,44 L232,58 L240,84 L250,104 L262,116 L290,118 L268,132 L250,150 L246,175 L252,196 L246,224 L232,250 L214,272 L190,288 L168,286 L152,258 L150,230 L142,208 L136,196 L132,186 L126,182 L108,188 L100,186 L82,190 L68,192 L50,186 L40,176 L26,158 L20,150 L24,128 L34,100 L52,72 Z" />
                            <path className="sahel" d="M48,102 L100,99 L112,116 L86,134 L58,130 Z" />
                            <circle cx="60" cy="112" r="4.4" fill="#0F9E8E" stroke="#fff" strokeWidth="1.6" />
                            <text className="plabel" x="60" y="106" textAnchor="middle">Mali</text>
                            <circle cx="99" cy="110" r="4.4" fill="#2563EB" stroke="#fff" strokeWidth="1.6" />
                            <text className="plabel" x="99" y="104" textAnchor="middle">Niger</text>
                            <circle cx="78" cy="126" r="8.5" fill="rgba(245,166,35,.28)" />
                            <circle cx="78" cy="126" r="5" fill="#F5A623" stroke="#fff" strokeWidth="1.8" />
                            <text className="plabel" x="78" y="145" textAnchor="middle">Burkina Faso</text>
                        </svg>
                        <div className="mlegend">
                            <span><i style={{ background: '#F5A623' }} />Burkina Faso</span>
                            <span><i style={{ background: '#0F9E8E' }} />Mali</span>
                            <span><i style={{ background: '#2563EB' }} />Niger</span>
                        </div>
                    </div>
                    <div className="fc reveal">
                        <div className="ic" style={{ background: 'rgba(15,158,142,.12)', color: 'var(--teal)' }}>🔒</div>
                        <h4>Sécurité &amp; confidentialité</h4>
                        <ul>
                            <li>• Rôles et permissions granulaires</li>
                            <li>• Journalisation complète des opérations</li>
                            <li>• Chiffrement et sauvegardes</li>
                        </ul>
                        <span className="more">En savoir plus →</span>
                    </div>
                    <div className="fc vid reveal">
                        <div className="ic" style={{ background: 'rgba(245,166,35,.16)', color: 'var(--amber-d)' }}>🎥</div>
                        <h4>Démonstration vidéo</h4>
                        <div className="play"><span className="pb"><svg width="18" height="18" viewBox="0 0 24 24" fill="#3a2600"><path d="M8 5v14l11-7z" /></svg></span></div>
                        <span className="more" style={{ color: 'var(--amber-d)' }}>Voir la démonstration →</span>
                    </div>
                </div></div>
            </section>

            {/* CONVERSION + FORMULAIRE */}
            <section id="demo" className="conv"><div className="wrap">
                <div className="reveal">
                    <h2>Passez d’une gestion réactive à un pilotage HSE préventif</h2>
                    <p className="sub">Échangez avec notre équipe et découvrez comment SafeX 360 peut être configuré selon vos sites, vos processus et vos exigences de management.</p>
                    <div className="kpis">
                        <div className="kpi"><div className="n">Multi</div><div className="l">Organisations &amp; sites</div></div>
                        <div className="kpi"><div className="n">21+</div><div className="l">Modules métier</div></div>
                        <div className="kpi"><div className="n">Mobile</div><div className="l">Application terrain</div></div>
                    </div>
                </div>
                <form className="form reveal" onSubmit={(e) => e.preventDefault()}>
                    <h3>Planifier une démonstration</h3>
                    <div className="fg">
                        <input placeholder="Nom et prénom *" />
                        <input placeholder="Organisation *" />
                        <input placeholder="Fonction / poste" />
                        <input placeholder="E-mail professionnel *" />
                        <input placeholder="Téléphone" />
                        <input placeholder="Pays" />
                        <select defaultValue=""><option value="" disabled>Nombre de sites</option><option>1 site</option><option>2 à 5 sites</option><option>6 à 20 sites</option><option>Plus de 20 sites</option></select>
                        <select defaultValue=""><option value="" disabled>Besoin principal</option><option>Incidents &amp; accidents</option><option>Inspections</option><option>Audits &amp; conformité</option><option>Urgences &amp; évacuation</option></select>
                    </div>
                    <button className="btn btn-a" type="submit">Planifier une démonstration &nbsp;→</button>
                    <div className="note">* Champs obligatoires. Vos données restent confidentielles.</div>
                </form>
            </div></section>

            {/* FOOTER */}
            <footer><div className="wrap">
                <div className="fcols">
                    <div>
                        <img className="logo-img" src={LOGO_DARK} alt="SafeX 360" style={{ height: 34 }} />
                        <p className="desc">La plateforme intelligente de pilotage de la Santé, de la Sécurité et de l’Environnement pour l’industrie minière et industrielle.</p>
                    </div>
                    <div><h5>Solution</h5><ul><li><a onClick={() => goTo('features')}>Fonctionnalités</a></li><li><a onClick={() => goTo('modules')}>Modules</a></li><li><a onClick={() => goTo('secteurs')}>Secteurs</a></li><li><a onClick={() => goTo('demo')}>Tarifs</a></li></ul></div>
                    <div><h5>Ressources</h5><ul><li><a>Centre d’aide</a></li><li><a>Documentation</a></li><li><a>FAQ</a></li><li><a>Actualités</a></li></ul></div>
                    <div><h5>Entreprise</h5><ul><li><a>Data Universe</a></li><li><a>À propos</a></li><li><a onClick={() => goTo('demo')}>Contact</a></li><li><a>Partenariats</a></li></ul></div>
                    <div><h5>Data Universe</h5><p className="contact">Abidjan, Côte d’Ivoire<br />Riviera Feya, Rue L100 - Îlot 64<br />+225 27 22 54 88 40<br />contact@safex360.com<br /><span className="oper"><span className="dot" />Statut des services : Opérationnel</span></p></div>
                </div>
                <div className="fbar"><span>© {new Date().getFullYear()} Data Universe. Tous droits réservés.</span><span>Mentions légales · Confidentialité · Conditions d’utilisation</span></div>
            </div></footer>
        </div>
    );
}

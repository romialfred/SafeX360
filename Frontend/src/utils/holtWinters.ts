/**
 * holtWinters.ts — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Implementation pure JS (sans dependance externe) des algorithmes
 * d'exponential smoothing utilises par la carte de forecasting des cumuls
 * annuels de dose (DoseForecastCard).
 *
 * Algorithmes :
 *
 *  1. Holt-Winters triple exponential smoothing (additive) — applique
 *     lorsqu'une saisonnalite est detectee dans les donnees (cycle 12 mois).
 *     Utilise trois lissages : niveau (alpha), tendance (beta) et
 *     composante saisonniere (gamma).
 *
 *  2. Holt double exponential smoothing — fallback automatique si la serie
 *     est trop courte pour estimer une saisonnalite (< 2 * seasonLength)
 *     ou si gamma == 0. Lissage niveau + tendance uniquement.
 *
 *  3. SES (single exponential smoothing) — fallback ultime si la serie ne
 *     contient qu'un seul point.
 *
 * Note : la lib evite volontairement les dependances "lourdes" (TimeSeries.js,
 * arima, tensorflow). Les coefficients par defaut sont choisis pour bien se
 * comporter sur les series mensuelles dosimetriques (faible volatilite,
 * tendance lente, peu d'aberrations). Les valeurs negatives sont autorisees
 * (cas attendu : doses inferieures au seuil de detection rapportees a 0 ou
 * legerement negatives par soustraction de bruit de fond).
 *
 * Toutes les fonctions sont pures et deterministes.
 */

/**
 * Resultat enrichi du forecast Holt-Winters incluant la prediction, les
 * residus pour le calcul d'intervalle de confiance et le niveau / tendance
 * finaux. Utile pour afficher une bande de confiance autour de la courbe.
 */
export interface HoltWintersResult {
    /** Predictions sur N periodes futures, dans l'ordre chronologique. */
    forecast: number[];
    /** Ecart-type des residus historiques (sigma) — pour bande de confiance. */
    sigma: number;
    /** Algorithme effectivement utilise. */
    method: 'holt-winters' | 'holt' | 'ses' | 'naive';
    /** Composante de niveau finale (lissage). */
    level: number;
    /** Composante de tendance finale. */
    trend: number;
}

/**
 * Valide une serie d'entree : nombres finis uniquement. Retourne une copie
 * "propre" (sans NaN ni Infinity). Les valeurs negatives sont autorisees.
 */
const sanitizeSeries = (values: number[]): number[] => {
    if (!Array.isArray(values)) return [];
    return values.filter((v) => typeof v === 'number' && Number.isFinite(v));
};

/**
 * Calcule l'ecart-type d'une serie (denominateur n, pas n-1, pour rester
 * coherent avec une serie chronologique consideree comme exhaustive).
 */
const stddev = (residuals: number[]): number => {
    if (residuals.length === 0) return 0;
    const mean = residuals.reduce((s, x) => s + x, 0) / residuals.length;
    const variance =
        residuals.reduce((s, x) => s + (x - mean) ** 2, 0) / residuals.length;
    return Math.sqrt(variance);
};

/**
 * Single exponential smoothing — utilise comme fallback ultime.
 * Retourne une serie constante de predictions egales au dernier niveau lisse.
 */
const ses = (
    values: number[],
    periods: number,
    alpha: number,
): HoltWintersResult => {
    if (values.length === 0 || periods <= 0) {
        return { forecast: [], sigma: 0, method: 'naive', level: 0, trend: 0 };
    }
    let level = values[0];
    const residuals: number[] = [];
    for (let i = 1; i < values.length; i += 1) {
        const prev = level;
        level = alpha * values[i] + (1 - alpha) * prev;
        residuals.push(values[i] - prev);
    }
    const forecast = new Array(periods).fill(level);
    return { forecast, sigma: stddev(residuals), method: 'ses', level, trend: 0 };
};

/**
 * Holt double exponential smoothing — niveau + tendance, pas de saisonnalite.
 *
 * Predit : forecast(h) = level + h * trend pour h = 1..periods.
 */
const holt = (
    values: number[],
    periods: number,
    alpha: number,
    beta: number,
): HoltWintersResult => {
    if (values.length < 2) {
        return ses(values, periods, alpha);
    }
    let level = values[0];
    let trend = values[1] - values[0];
    const residuals: number[] = [];

    for (let i = 1; i < values.length; i += 1) {
        const prevLevel = level;
        const prevTrend = trend;
        const predicted = prevLevel + prevTrend;
        residuals.push(values[i] - predicted);
        level = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    }
    const forecast: number[] = [];
    for (let h = 1; h <= periods; h += 1) {
        forecast.push(level + h * trend);
    }
    return { forecast, sigma: stddev(residuals), method: 'holt', level, trend };
};

/**
 * Decompose une serie en composante saisonniere initiale (additive).
 * Utilise un cycle de longueur {@code seasonLength} (12 mois par defaut).
 * Retourne un tableau de longueur seasonLength.
 */
const initialSeasonals = (values: number[], seasonLength: number): number[] => {
    const seasonals = new Array(seasonLength).fill(0);
    const nSeasons = Math.floor(values.length / seasonLength);
    if (nSeasons === 0) return seasonals;
    const seasonAverages: number[] = [];
    for (let s = 0; s < nSeasons; s += 1) {
        const slice = values.slice(s * seasonLength, (s + 1) * seasonLength);
        const avg = slice.reduce((sum, x) => sum + x, 0) / seasonLength;
        seasonAverages.push(avg);
    }
    for (let i = 0; i < seasonLength; i += 1) {
        let sumOfValsOverAvg = 0;
        for (let s = 0; s < nSeasons; s += 1) {
            sumOfValsOverAvg += values[seasonLength * s + i] - seasonAverages[s];
        }
        seasonals[i] = sumOfValsOverAvg / nSeasons;
    }
    return seasonals;
};

/**
 * Detecte naivement une saisonnalite : on considere qu'on peut utiliser
 * Holt-Winters complet si la serie contient au moins 2 cycles complets ET
 * que la variance saisonniere est significative (>5% de la moyenne).
 */
const hasMeaningfulSeasonality = (
    values: number[],
    seasonLength: number,
): boolean => {
    if (values.length < seasonLength * 2) return false;
    const seasonals = initialSeasonals(values, seasonLength);
    const absMean =
        Math.abs(values.reduce((s, x) => s + x, 0) / values.length) || 1;
    const seasonalAmplitude =
        Math.max(...seasonals) - Math.min(...seasonals);
    return seasonalAmplitude > 0.05 * absMean;
};

/**
 * Holt-Winters triple exponential smoothing (additive) — algorithme principal.
 *
 * <p>Predit N periodes futures a partir d'une serie chronologique connue.
 * Bascule automatiquement sur :
 *   - Holt (double smoothing) si la serie est trop courte ou non saisonniere
 *     ou si gamma == 0 (saisonnalite desactivee par l'appelant).
 *   - SES si la serie ne contient qu'un point.
 *
 * <p>Parametres :
 *   - alpha (0..1) : lissage du niveau. 0.3 par defaut (reactivite moyenne).
 *   - beta  (0..1) : lissage de la tendance. 0.1 par defaut (tendance stable).
 *   - gamma (0..1) : lissage de la saisonnalite. 0.1 par defaut.
 *   - seasonLength : longueur d'un cycle saisonnier (12 mois par defaut).
 *
 * <p>Sortie : tableau de {@code periods} predictions chronologiques.
 *
 * @param values         serie historique (du plus ancien au plus recent)
 * @param periods        nombre de pas a predire
 * @param alpha          coefficient de lissage du niveau
 * @param beta           coefficient de lissage de la tendance
 * @param gamma          coefficient de lissage saisonnier
 * @param seasonLength   longueur d'un cycle (12 = annuel mensuel)
 */
export function holtWintersForecast(
    values: number[],
    periods: number,
    alpha = 0.3,
    beta = 0.1,
    gamma = 0.1,
    seasonLength = 12,
): number[] {
    const result = holtWintersForecastFull(
        values,
        periods,
        alpha,
        beta,
        gamma,
        seasonLength,
    );
    return result.forecast;
}

/**
 * Variante "full" qui renvoie {@link HoltWintersResult} avec residus + sigma
 * pour permettre l'affichage d'une bande de confiance autour de la courbe
 * de prevision.
 */
export function holtWintersForecastFull(
    values: number[],
    periods: number,
    alpha = 0.3,
    beta = 0.1,
    gamma = 0.1,
    seasonLength = 12,
): HoltWintersResult {
    const clean = sanitizeSeries(values);
    const safePeriods = Math.max(0, Math.floor(periods));

    if (clean.length === 0 || safePeriods === 0) {
        return {
            forecast: [],
            sigma: 0,
            method: 'naive',
            level: 0,
            trend: 0,
        };
    }
    if (clean.length === 1) {
        return ses(clean, safePeriods, alpha);
    }
    if (gamma <= 0 || !hasMeaningfulSeasonality(clean, seasonLength)) {
        return holt(clean, safePeriods, alpha, beta);
    }

    // ─── Holt-Winters complet ─────────────────────────────────────────────
    const seasonals = initialSeasonals(clean, seasonLength);
    let level = clean[0];
    let trend =
        (clean[seasonLength] - clean[0]) / seasonLength || clean[1] - clean[0];
    const residuals: number[] = [];

    for (let i = 1; i < clean.length; i += 1) {
        const prevLevel = level;
        const prevTrend = trend;
        const seasonIdx = (i - 1) % seasonLength;
        const seasonal = seasonals[seasonIdx];
        const predicted = prevLevel + prevTrend + seasonal;
        residuals.push(clean[i] - predicted);
        level =
            alpha * (clean[i] - seasonals[seasonIdx]) +
            (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
        seasonals[seasonIdx] =
            gamma * (clean[i] - level) + (1 - gamma) * seasonals[seasonIdx];
    }

    const forecast: number[] = [];
    for (let h = 1; h <= safePeriods; h += 1) {
        const seasonIdx = (clean.length - 1 + h) % seasonLength;
        forecast.push(level + h * trend + seasonals[seasonIdx]);
    }

    return {
        forecast,
        sigma: stddev(residuals),
        method: 'holt-winters',
        level,
        trend,
    };
}

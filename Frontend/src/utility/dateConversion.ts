/**
 * dateConversion.ts
 * -----------------
 * Utilitaires de conversion de dates pour SafeX360.
 *
 * Ces helpers permettent de normaliser des valeurs de type `Date` ou `string`
 * vers des formats compatibles avec :
 *  - les inputs HTML `<input type="date">` et `<input type="datetime-local">`
 *  - les payloads envoyes au backend Spring Boot qui attend du `LocalDate`
 *    ou `LocalDateTime` (donc SANS timezone).
 *
 * Important : on travaille toujours en heure LOCALE (pas UTC) pour eviter
 * les decalages de jour lors de la serialisation cote frontend.
 */

/**
 * Convertit une valeur en chaine `yyyy-MM-dd` (date locale, sans timezone).
 *
 * Regles :
 *  - `null` / `undefined` / chaine vide          -> `null`
 *  - `Date`                                       -> `yyyy-MM-dd` en heure locale
 *  - chaine ISO (ex: `2026-12-31T00:00:00.000Z`)  -> extrait la partie `yyyy-MM-dd`
 *  - chaine deja au format `yyyy-MM-dd`           -> renvoyee telle quelle
 *  - tout autre cas (chaine invalide, NaN, ...)   -> `null`
 *
 * @param d valeur a convertir
 * @returns la date locale au format `yyyy-MM-dd` ou `null`
 *
 * @example
 *   toLocalDate(new Date(2026, 5, 6));        // "2026-06-06"
 *   toLocalDate("2026-12-31T00:00:00.000Z");  // "2026-12-31"
 *   toLocalDate("2026-06-06");                 // "2026-06-06"
 *   toLocalDate(null);                         // null
 */
export function toLocalDate(d: Date | string | null | undefined): string | null {
  // Cas vide / non defini
  if (d === null || d === undefined || d === "") {
    return null;
  }

  // Cas Date : on formate manuellement avec les composants LOCAUX
  // (toISOString() utiliserait UTC et pourrait decaler d'un jour)
  if (d instanceof Date) {
    if (isNaN(d.getTime())) {
      return null;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Cas chaine
  if (typeof d === "string") {
    // Deja au format yyyy-MM-dd ? on accepte tel quel
    const localDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (localDateRegex.test(d)) {
      return d;
    }

    // Format ISO complet (yyyy-MM-ddTHH:mm:ss[.sss]Z) : on extrait la partie date
    const isoRegex = /^(\d{4}-\d{2}-\d{2})T/;
    const isoMatch = d.match(isoRegex);
    if (isoMatch) {
      return isoMatch[1];
    }

    // Dernier recours : tenter de parser la chaine en Date
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  // Tout autre type non gere
  return null;
}

/**
 * Convertit une valeur en chaine `yyyy-MM-ddTHH:mm:ss` (heure locale, sans timezone).
 *
 * Format compatible avec Spring `LocalDateTime` et `<input type="datetime-local">`.
 *
 * Regles :
 *  - `null` / `undefined` / chaine vide                    -> `null`
 *  - `Date`                                                 -> `yyyy-MM-ddTHH:mm:ss` en heure locale
 *  - chaine ISO (ex: `2026-12-31T10:30:00.000Z`)            -> reparsee en heure locale et reformatee
 *  - chaine deja au format `yyyy-MM-ddTHH:mm:ss`            -> renvoyee telle quelle (eventuellement padded)
 *  - chaine au format `yyyy-MM-dd`                          -> renvoyee avec `T00:00:00`
 *  - tout autre cas                                         -> `null`
 *
 * @param d valeur a convertir
 * @returns la date-heure locale au format `yyyy-MM-ddTHH:mm:ss` ou `null`
 *
 * @example
 *   toLocalDateTime(new Date(2026, 5, 6, 14, 30, 0)); // "2026-06-06T14:30:00"
 *   toLocalDateTime("2026-06-06");                     // "2026-06-06T00:00:00"
 *   toLocalDateTime(null);                             // null
 */
export function toLocalDateTime(d: Date | string | null | undefined): string | null {
  // Cas vide / non defini
  if (d === null || d === undefined || d === "") {
    return null;
  }

  /** Formate une instance Date en yyyy-MM-ddTHH:mm:ss (heure locale). */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Cas Date
  if (d instanceof Date) {
    if (isNaN(d.getTime())) {
      return null;
    }
    return formatDate(d);
  }

  // Cas chaine
  if (typeof d === "string") {
    // Format yyyy-MM-dd uniquement : on complete avec minuit
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyRegex.test(d)) {
      return `${d}T00:00:00`;
    }

    // Deja au format yyyy-MM-ddTHH:mm:ss (sans timezone) : on renvoie tel quel
    const localDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (localDateTimeRegex.test(d)) {
      return d;
    }

    // Format yyyy-MM-ddTHH:mm (sans secondes) : on ajoute :00
    const localDateTimeShortRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (localDateTimeShortRegex.test(d)) {
      return `${d}:00`;
    }

    // Toute autre chaine (ISO avec Z, etc.) : on tente de parser puis on reformate en LOCAL
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }

    return null;
  }

  // Tout autre type non gere
  return null;
}

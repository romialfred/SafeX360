/**
 * Gate de publication des allégations publiques mesurables.
 *
 * Une allégation absente de ce registre ne doit pas être publiée. Le registre
 * opérationnel est volontairement vide tant qu'aucun dossier probant n'a été
 * revu et approuvé par une personne habilitée.
 */
export interface PublicClaimEvidence {
    sourceUrl: string;
    owner: string;
    periodStart: string;
    periodEnd: string;
    population: string;
    calculationMethod: string;
    limitations: string;
    validatedBy: string;
    validatedAt: string;
    expiresAt: string;
}

export interface PublicClaim {
    id: string;
    statement: string;
    status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    evidence: PublicClaimEvidence;
}

/** Aucun indicateur public mesurable n'est approuvé dans le dépôt. */
export const APPROVED_PUBLIC_CLAIMS: readonly PublicClaim[] = [];

const isNonEmpty = (value: string) => value.trim().length > 0;
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function isPublishablePublicClaim(claim: PublicClaim, asOf: string): boolean {
    const { evidence } = claim;
    if (claim.status !== 'APPROVED' || !isNonEmpty(claim.statement)) return false;
    if (!/^https:\/\//i.test(evidence.sourceUrl)) return false;
    if (![
        evidence.owner,
        evidence.population,
        evidence.calculationMethod,
        evidence.limitations,
        evidence.validatedBy,
    ].every(isNonEmpty)) return false;
    if (![evidence.periodStart, evidence.periodEnd, evidence.validatedAt, evidence.expiresAt, asOf].every(isIsoDate)) return false;

    return evidence.periodStart <= evidence.periodEnd
        && evidence.validatedAt <= asOf
        && asOf <= evidence.expiresAt;
}


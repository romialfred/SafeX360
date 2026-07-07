const capitalizeFirstLetter = (string: any) => {
    if (!string) return '';
    return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase();
}
// Garde Array.isArray : appelée sur 60+ sites avec des réponses API brutes —
// un null/objet inattendu ne doit jamais faire crasher la page entière.
const mapIdToName = (items: any): Record<number, any> => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc: any, item: any) => {
        acc[item.id] = item;
        return acc;
    }, {} as Record<number, any>);
}
const mapIdToProcess = (items: any): Record<number, any> => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc: any, item: any) => {
        acc[item.id] = item.process;
        return acc;
    }, {} as Record<number, any>);
}

// Générateur cryptographiquement sûr (crypto.getRandomValues) : ces mots de
// passe temporaires protègent des comptes réels — Math.random() est prévisible.
function secureRandomInt(maxExclusive: number): number {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
}

function generatePassword() {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()-_+=";

    const password = [
        uppercase[secureRandomInt(uppercase.length)],
        lowercase[secureRandomInt(lowercase.length)],
        numbers[secureRandomInt(numbers.length)],
        specialChars[secureRandomInt(specialChars.length)]
    ];

    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = password.length; i < 12; i++) {
        password.push(allChars[secureRandomInt(allChars.length)]);
    }

    // Mélange de Fisher-Yates (le sort(random) est biaisé)
    for (let i = password.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}

const getSeverity = (status: any) => {
    switch (status) {
        case 'ACTIVE':
            return 'success';
        case 'INACTIVE':
            return 'danger';
        case 'PENDING':
            return 'warning';
        case 'RETURNED':
            return 'info';
        default:
            return null;
    }
};

const getSeverityForInspection = (status: any) => {
    switch (status) {
        case 'COMPLETED':
            return 'success';
        case 'CANCELLED':
            return 'danger';
        case 'PENDING':
            return 'warning';
        case 'IN_PROGRESS':
            return 'info';
        default:
            return null;
    }
}
function isValidRichText(content: any) {
    // DOMParser : contrairement à innerHTML sur un élément (même détaché),
    // aucun handler (onerror, onload…) ne peut s'exécuter pendant le parsing.
    const doc = new DOMParser().parseFromString(String(content ?? ''), 'text/html');
    const text = doc.body.textContent || "";
    return text.trim().length > 0;
}
const getColorForSeverityLevel = (level: any) => {
    switch (level) {
        case 1:
            return "green";
        case 2:
            return "yellow";
        case 3:
            return "orange";
        case 4:
            return "red";
        case 5:
            return "darkred";
        default:
            return "gray";
    }
}
function capitalizeWords(str: any) {
    return str
        .split(' ')
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

const getTailwindColorForSeverityLevel = (level: number) => {
    switch (level) {
        case 1: return 'bg-green-100 text-green-800';
        case 2: return 'bg-yellow-100 text-yellow-800';
        case 3: return 'bg-orange-100 text-orange-800';
        case 4: return 'bg-red-100 text-red-800';
        case 5: return 'bg-amber-200 text-amber-900';
        default: return 'bg-gray-100 text-gray-800';
    }
};


const getProgressColor = (progress: number) => {
    if (progress <= 20) return "red";
    if (progress <= 70) return "yellow";
    return "green";
}

const getTwProgressColor = (progress: number) => {
    if (progress <= 20) return "bg-red-500";
    if (progress <= 70) return "bg-yellow-500";
    return "bg-green-500";
}

export { capitalizeFirstLetter, mapIdToName, generatePassword, mapIdToProcess, getSeverity, getSeverityForInspection, isValidRichText, getColorForSeverityLevel, capitalizeWords, getProgressColor, getTailwindColorForSeverityLevel, getTwProgressColor }
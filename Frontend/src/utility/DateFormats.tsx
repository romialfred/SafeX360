// LOT 43b — locale FR par défaut sur toutes les dates affichées
function formatDate(dateString: any) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function formatDateWithDay(dateInput: any): string {
    if (!dateInput) return ''; // Gère les valeurs vides
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',  // ex : vendredi
        day: '2-digit',   // ex : 24
        month: 'long',    // ex : juillet
        year: 'numeric',  // ex : 2025
    });
}

function formatDateShort(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',   // ex : 24
        month: 'short',   // ex : juil.
        year: 'numeric',  // ex : 2025
    });
}



const formatTo12Hour = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
};

function isPastDate(dateString: any) {
    if (!dateString) return false; // Handle empty or undefined input
    const inputDate = new Date(dateString); // e.g., "2024-06-15"
    const today = new Date();

    // Strip time part for accurate comparison by setting to midnight
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return inputDate < today;
}

function getDateDifferenceInDays(date1: any, date2: any) {
    if (!date1 || !date2) return 0; // Handle empty or undefined input
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Convert both dates to UTC to ignore timezone differences
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;

    return Math.floor((utc2 - utc1) / msPerDay);
}

function formatTimeToAmPm(timeStr: any) {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}


export { formatDate, formatDateWithDay, formatTo12Hour, formatDateShort, isPastDate, getDateDifferenceInDays, formatTimeToAmPm };

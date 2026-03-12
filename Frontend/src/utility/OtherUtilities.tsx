const capitalizeFirstLetter = (string: any) => {
    if (!string) return '';
    return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase();
}
const mapIdToName = (items: any): Record<number, any> => {
    return items.reduce((acc: any, item: any) => {
        acc[item.id] = item;
        return acc;
    }, {} as Record<number, any>);
}
const mapIdToProcess = (items: any): Record<number, any> => {
    return items.reduce((acc: any, item: any) => {
        acc[item.id] = item.process;
        return acc;
    }, {} as Record<number, any>);
}

function generatePassword() {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()-_+=";

    let password = [
        uppercase[Math.floor(Math.random() * uppercase.length)],
        lowercase[Math.floor(Math.random() * lowercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        specialChars[Math.floor(Math.random() * specialChars.length)]
    ];

    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = password.length; i < 12; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    password = password.sort(() => Math.random() - 0.5);

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
    const temp = document.createElement("div");
    temp.innerHTML = content;

    const text = temp.textContent || temp.innerText || "";
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
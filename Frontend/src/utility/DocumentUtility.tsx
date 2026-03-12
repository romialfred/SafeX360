const getBase64 = (file: any) => {
    if (!file) return null;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

const openPDF = (base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    window.open(url, '_blank');
}

function base64ToFile(base64String: string, fileName: string, mimeType: string): any {
    const byteString = atob(base64String);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }
    return new File([byteArray], fileName, { type: mimeType });
}

function base64ToFileWithName(base64String: string, fileName: string): File {
    const byteString = atob(base64String); // decode base64
    const byteArray = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: getMimeType(fileName) });

    // Create a file object (if needed)
    const file = new File([blob], fileName, { type: blob.type });

    return file;
}

function base64ToFileWithNameNew(base64: string, filename: string, mimeType: string): File {
    const byteString = atob(base64);
    const byteNumbers = new Array(byteString.length)
        .fill(0)
        .map((_, i) => byteString.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
}

// Function to convert docs array to [{ id, file }]
function convertDocsToFiles(docs: any[]) {
    return docs.map((doc) => {
        const mimeType = doc?.type?.split(',')[0]?.split(':')[1];
        const file = base64ToFileWithNameNew(doc.file, doc.name, mimeType);
        return {
            id: doc.id,
            file,
        };
    });
}

function getMimeType(fileName: string) {
    const extension = fileName?.split('.')?.pop()?.toLowerCase() || 'png';
    const mimeTypes = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        pdf: 'application/pdf',
        txt: 'text/plain',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        // Add more types as needed
    };
    return mimeTypes[extension as keyof typeof mimeTypes] || 'application/octet-stream';
}

function getBase64FileSize(base64String: string): any {
    // Remove the prefix if present
    const cleanedBase64: any = base64String.split(',').pop();
    // Base64 size calculation
    const sizeInBytes = (cleanedBase64.length * 3) / 4 - (cleanedBase64.endsWith('==') ? 2 : cleanedBase64.endsWith('=') ? 1 : 0);
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB.toFixed(2); // returns size in KB
}
const convertFilesToBase64 = async (files: any[]) => {
    const fileObjects = await Promise.all(
        files.map(async (file) => {
            const base64: any = await getBase64(file);
            return {
                id: file.id ?? null,
                name: file.name,
                file: base64.split(',')[1],
            };
        })
    );
    return fileObjects;
};
const convertFileToBase64DTO = (file: File) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result; // e.g. "data:image/png;base64,iVBORw0KGgoAAA..."
            if (typeof result === 'string') {
                const [type, base64Content] = result.split(',');
                resolve({
                    name: file.name,
                    type,             // e.g. "data:image/png"
                    file: base64Content, // only the actual base64 string
                });
            } else {
                reject(new Error('FileReader result is null or not a string.'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
const handlePreview = (media: { name: string; type: string; file: string }) => {
    const { type, file } = media;

    // Decode base64 string to binary
    const byteCharacters = atob(file);
    const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);

    // Extract actual MIME type from type field (e.g., "data:application/pdf;base64")
    const mimeType = type.split(';')[0].replace('data:', '');

    // Create Blob and Blob URL
    const blob = new Blob([byteArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Open in new tab
    window.open(blobUrl, '_blank');
};

const handleDownload = (media: { name: string; type: string; file: string }) => {
    try {
        const { type, file, name } = media;

        // Decode base64 → binary
        const byteCharacters = atob(file);
        const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);

        // Extract MIME type (e.g. "application/pdf")
        const mimeType = type.split(';')[0].replace('data:', '');

        // Create Blob
        const blob = new Blob([byteArray], { type: mimeType });

        // Create Object URL
        const blobUrl = URL.createObjectURL(blob);

        // Create a hidden link element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name || 'download';

        // Trigger click
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error('Download failed:', err);
    }
};

const convertFilesToBase64New = async (files: any[]) => {
    const fileObjects = await Promise.all(
        files.map(async (fileObj) => {
            const base64DataUrl: any = await getBase64(fileObj.file);
            const [typeInfo, base64] = base64DataUrl.split(',');


            return {
                id: fileObj.id ?? null,
                name: fileObj.file.name,
                type: typeInfo,
                file: base64,
            };
        })
    );
    return fileObjects;
};

function getFriendlyFileType(dataUrl: string): string {
    if (!dataUrl || !dataUrl.startsWith("data:")) return "Unknown";

    const mimeType = dataUrl.substring(
        dataUrl.indexOf(":") + 1,
        dataUrl.indexOf(";")
    ); // e.g. "application/pdf" or "image/png"

    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType === "application/pdf") return "PDF";
    if (
        mimeType === "application/msword" ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
        return "Word";
    if (
        mimeType === "application/vnd.ms-excel" ||
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
        return "Excel";
    if (
        mimeType === "application/vnd.ms-powerpoint" ||
        mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
        return "PowerPoint";

    return "Unknown";
}
export { getBase64, openPDF, base64ToFile, base64ToFileWithName, getBase64FileSize, convertFilesToBase64, convertFileToBase64DTO, handlePreview, getMimeType, base64ToFileWithNameNew, convertFilesToBase64New, convertDocsToFiles, getFriendlyFileType, handleDownload };
export interface DocumentSummary {
    id: number;
    documentName: string;
    description?: string | null;
    category?: string | null;
    department?: string | null;
    departmentId?: number | string | null;
    ownerId?: number | string | null;
    owner?: string | null;
    accessLevel?: string | null;
    fileType?: string | null;
    extension?: string | null;
    mimeType?: string | null;
    status?: string | null;
    reviewDate?: string | null;
    expiryDate?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    fileSizeBytes?: number | null;
    fileSize?: number | null;
    size?: number | null;
    sizeInBytes?: number | null;
    tags?: string[] | null;
    allowDownload?: boolean;
    [key: string]: any; // For any additional properties
}

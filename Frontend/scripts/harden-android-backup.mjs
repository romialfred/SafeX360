import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const manifestPath = resolve(frontendDir, 'android/app/src/main/AndroidManifest.xml');
const xmlDir = resolve(frontendDir, 'android/app/src/main/res/xml');

export const BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="root" path="." />
    <exclude domain="file" path="." />
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="external" path="." />
</full-backup-content>
`;

export const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup disableIfNoEncryptionCapabilities="true">
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </device-transfer>
</data-extraction-rules>
`;

function setApplicationAttribute(xml, name, value) {
    const attribute = new RegExp(`android:${name}="[^"]*"`);
    if (attribute.test(xml)) {
        return xml.replace(attribute, `android:${name}="${value}"`);
    }
    return xml.replace('<application', `<application\n        android:${name}="${value}"`);
}

export function hardenManifest(xml) {
    let hardened = setApplicationAttribute(xml, 'allowBackup', 'false');
    hardened = setApplicationAttribute(hardened, 'fullBackupContent', '@xml/backup_rules');
    hardened = setApplicationAttribute(
        hardened,
        'dataExtractionRules',
        '@xml/data_extraction_rules',
    );
    return hardened;
}

export async function hardenAndroidBackup() {
    const manifest = await readFile(manifestPath, 'utf8');
    const hardenedManifest = hardenManifest(manifest);
    await mkdir(xmlDir, { recursive: true });
    await Promise.all([
        writeFile(manifestPath, hardenedManifest, 'utf8'),
        writeFile(resolve(xmlDir, 'backup_rules.xml'), BACKUP_RULES, 'utf8'),
        writeFile(resolve(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES, 'utf8'),
    ]);
    process.stdout.write('Android backup and device-transfer exclusions applied.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await hardenAndroidBackup();
}

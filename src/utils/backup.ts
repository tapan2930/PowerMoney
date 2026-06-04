import * as FileSystem from 'expo-file-system/legacy';
import { CloudStorage } from 'react-native-cloud-storage';

const DB_PATH = `${FileSystem.documentDirectory}SQLite/powermoney.db`;
const CLOUD_BACKUP_PATH = '/powermoney_backup.db';

export async function checkCloudBackupExists(): Promise<boolean> {
  try {
    return await CloudStorage.exists(CLOUD_BACKUP_PATH);
  } catch (e) {
    console.error('Error checking cloud backup existence:', e);
    return false;
  }
}

export async function uploadBackupToCloud(): Promise<void> {
  try {
    // 1. Ensure the SQLite DB file exists
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (!fileInfo.exists) {
      throw new Error('Local SQLite database file not found.');
    }

    // 2. Read database content as Base64 string
    const dbBase64 = await FileSystem.readAsStringAsync(DB_PATH, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Upload/Save to Cloud Storage
    await CloudStorage.writeFile(CLOUD_BACKUP_PATH, dbBase64);
    console.log('Database backup successfully synced to cloud.');
  } catch (e: any) {
    console.error('Failed to upload backup:', e);
    throw new Error(e.message || 'Cloud backup sync failed.');
  }
}

export async function restoreBackupFromCloud(): Promise<void> {
  try {
    // 1. Check if backup exists on cloud
    const exists = await CloudStorage.exists(CLOUD_BACKUP_PATH);
    if (!exists) {
      throw new Error('No cloud backup found to restore.');
    }

    // 2. Download from Cloud Storage
    const dbBase64 = await CloudStorage.readFile(CLOUD_BACKUP_PATH);

    // 3. Ensure target directories exist locally
    const sqlDir = `${FileSystem.documentDirectory}SQLite/`;
    const dirInfo = await FileSystem.getInfoAsync(sqlDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqlDir, { intermediates: true });
    }

    // 4. Overwrite local database file
    await FileSystem.writeAsStringAsync(DB_PATH, dbBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('Local database successfully restored from cloud.');
  } catch (e: any) {
    console.error('Failed to restore backup:', e);
    throw new Error(e.message || 'Backup restore failed.');
  }
}

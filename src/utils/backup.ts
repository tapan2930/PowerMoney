import * as FileSystem from 'expo-file-system/legacy';
import { CloudStorage } from 'react-native-cloud-storage';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function exportLocalBackup(): Promise<string> {
  try {
    // 1. Ensure the SQLite DB file exists
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (!fileInfo.exists) {
      throw new Error('Local SQLite database file not found.');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `powermoney_backup_${dateStr}.db`;

    if (Platform.OS === 'android') {
      const { StorageAccessFramework } = FileSystem;

      // Check if we have directory permission already stored in settings
      const result = await db.select().from(settings).where(eq(settings.key, 'backup_directory_uri'));
      let directoryUri = result[0]?.value;

      if (!directoryUri) {
        // Request directory permission
        const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Directory permission not granted. Cannot save backup.');
        }
        directoryUri = permission.directoryUri;
        // Save directory URI in settings
        await db.insert(settings).values({
          key: 'backup_directory_uri',
          value: directoryUri,
        }).onConflictDoUpdate({
          target: settings.key,
          set: { value: directoryUri },
        });
      }

      let fileUri: string;
      try {
        // Create file in directory
        fileUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          'application/octet-stream'
        );

        // Read DB and write to the SAF file URI (as Base64 string)
        const dbBase64 = await FileSystem.readAsStringAsync(DB_PATH, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, dbBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (safError) {
        // Directory permission might have expired/been revoked. Clear the saved URI.
        console.warn('Failed to write using saved directory URI, resetting...', safError);
        await db.delete(settings).where(eq(settings.key, 'backup_directory_uri'));
        throw new Error('Access to the previously selected folder was lost or denied. The folder setting has been reset. Please click Export again to select a folder.');
      }

      // Retrieve display name of selected folder to show to user
      const decodedUri = decodeURIComponent(directoryUri);
      const parts = decodedUri.split(':');
      const folderName = parts.length > 1 ? parts[parts.length - 1] : 'selected folder';

      return `Saved directly to local folder: ${folderName}/${fileName}`;
    } else {
      // iOS Implementation: Save to Backups folder inside the sharing-exposed documentDirectory
      const backupsDir = `${FileSystem.documentDirectory}Backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupsDir, { intermediates: true });
      }

      const targetPath = `${backupsDir}${fileName}`;
      await FileSystem.copyAsync({
        from: DB_PATH,
        to: targetPath,
      });

      return `Saved in iOS Files app under:\nOn My iPhone -> PowerMoney -> Backups -> ${fileName}`;
    }
  } catch (error) {
    console.error('Failed to export local backup:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(msg);
  }
}

export async function importLocalBackup(): Promise<void> {
  try {
    // 1. Pick a file
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('Import cancelled.');
    }

    const pickedFile = result.assets[0];

    // 2. Validate it is a valid SQLite database file by reading the header
    const header = await FileSystem.readAsStringAsync(pickedFile.uri, {
      position: 0,
      length: 15,
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!header.startsWith('SQLite format 3')) {
      throw new Error('Invalid file format. Please pick a valid SQLite database file.');
    }

    // 3. Ensure target directories exist locally
    const sqlDir = `${FileSystem.documentDirectory}SQLite/`;
    const dirInfo = await FileSystem.getInfoAsync(sqlDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqlDir, { intermediates: true });
    }

    // 4. Overwrite local database file
    await FileSystem.copyAsync({
      from: pickedFile.uri,
      to: DB_PATH,
    });

    // 5. Clean up picked file if cached
    await FileSystem.deleteAsync(pickedFile.uri, { idempotent: true });
  } catch (error) {
    console.error('Failed to import local backup:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(msg);
  }
}


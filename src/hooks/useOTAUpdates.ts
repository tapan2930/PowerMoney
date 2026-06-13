import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { CustomAlert } from '@/components/feedback/CustomAlert';

/**
 * Checks for EAS OTA updates on app cold start.
 *
 * Flow:
 * 1. `checkForUpdateAsync()` queries the EAS server
 * 2. If available → prompt user via CustomAlert
 * 3. On confirmation → download with `fetchUpdateAsync()`
 * 4. Once downloaded → reload with `reloadAsync()`
 *
 * Skipped entirely in __DEV__ mode (expo-updates APIs are unavailable).
 */
export function useOTAUpdates(): void {
  useEffect(() => {
    if (__DEV__) return;

    async function checkForUpdate(): Promise<void> {
      try {
        const result = await Updates.checkForUpdateAsync();

        if (!result.isAvailable) return;

        CustomAlert.alert(
          'Update Available',
          'A new version of PowerMoney is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch {
                  CustomAlert.alert(
                    'Update Failed',
                    'Could not download the update. Please try again later.',
                    [{ text: 'OK' }],
                  );
                }
              },
            },
          ],
          { cancelable: true },
        );
      } catch {
        // Silently fail — don't disrupt app launch for update check failures
      }
    }

    checkForUpdate();
  }, []);
}

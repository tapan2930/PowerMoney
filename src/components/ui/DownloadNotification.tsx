import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import {
  modelDownloader,
  getModelReadableName,
  getModelReadableSize,
} from '@/utils/modelDownloader';
import { ProgressBar } from './ProgressBar';
import { Haptics } from '@/utils/haptics';

export function DownloadNotification() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const {
    llmStatus,
    llmDownloadProgress,
    llmModelTier,
    llmErrorMessage,
  } = useAppStore();

  const [showBanner, setShowBanner] = useState(false);
  const [bannerState, setBannerState] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync state and trigger haptics/timeouts on transition
  useEffect(() => {
    if (llmStatus === 'downloading') {
      setBannerState('downloading');
      setShowBanner(true);
    } else if (llmStatus === 'ready') {
      // Only show completed banner if we were previously downloading
      if (bannerState === 'downloading') {
        setBannerState('ready');
        Haptics.notification('success');
        const timer = setTimeout(() => {
          setShowBanner(false);
          setBannerState('idle');
        }, 3500);
        return () => clearTimeout(timer);
      } else {
        setShowBanner(false);
      }
    } else if (llmStatus === 'error') {
      if (bannerState === 'downloading') {
        setBannerState('error');
        Haptics.notification('error');
        setShowBanner(true);
      }
    } else if (llmStatus === 'not_downloaded' || llmStatus === 'idle') {
      setShowBanner(false);
      setBannerState('idle');
    }
  }, [llmStatus]);

  if (!showBanner || !llmModelTier) return null;

  const handleCancel = () => {
    Haptics.impact('light');
    modelDownloader.cancelDownload();
  };

  const handleRetry = () => {
    Haptics.impact('medium');
    modelDownloader.startDownload(llmModelTier);
  };

  const handleCloseError = () => {
    Haptics.impact('light');
    modelDownloader.cancelDownload(); // resets store state to not_downloaded
  };

  const readableName = getModelReadableName(llmModelTier);
  const totalSize = getModelReadableSize(llmModelTier);

  // Calculate approximate downloaded bytes if downloading
  const calculateProgressText = () => {
    if (llmModelTier === 'lite') {
      const mb = Math.round((llmDownloadProgress / 100) * 70);
      return `${mb}MB / 70MB`;
    }
    if (llmModelTier === 'standard') {
      const mb = Math.round((llmDownloadProgress / 100) * 350);
      return `${mb}MB / 350MB`;
    }
    if (llmModelTier === 'pro') {
      const gb = ((llmDownloadProgress / 100) * 2.2).toFixed(2);
      return `${gb}GB / 2.2GB`;
    }
    if (llmModelTier === 'ultra') {
      const gb = ((llmDownloadProgress / 100) * 1.0).toFixed(2);
      return `${gb}GB / 1.0GB`;
    }
    return '';
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp.springify().damping(15)}
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.absoluteContainer,
        { top: insets.top + (Platform.OS === 'web' ? 20 : 10) },
      ]}
    >
      {isCollapsed ? (
        /* COLLAPSED PILL STATE */
        <Pressable
          onPress={() => {
            Haptics.impact('light');
            setIsCollapsed(false);
          }}
          style={[
            styles.collapsedPill,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="cloud-download-outline"
            size={16}
            color={colors.primary}
            style={styles.spinIcon}
          />
          <Text style={[styles.collapsedText, { color: colors.text }]}>
            {readableName}: {llmDownloadProgress}%
          </Text>
        </Pressable>
      ) : (
        /* EXPANDED CARD STATE */
        <View
          style={[
            styles.notificationCard,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 25, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor:
                bannerState === 'ready'
                  ? colors.secondary
                  : bannerState === 'error'
                  ? colors.danger
                  : colors.border,
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.headerInfo}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor:
                      bannerState === 'ready'
                        ? colors.secondary + '15'
                        : bannerState === 'error'
                        ? colors.danger + '15'
                        : colors.primary + '15',
                  },
                ]}
              >
                <Ionicons
                  name={
                    bannerState === 'ready'
                      ? 'checkmark-circle'
                      : bannerState === 'error'
                      ? 'alert-circle'
                      : 'cloud-download-outline'
                  }
                  size={20}
                  color={
                    bannerState === 'ready'
                      ? colors.secondary
                      : bannerState === 'error'
                      ? colors.danger
                      : colors.primary
                  }
                />
              </View>
              <View>
                <Text style={[styles.titleText, { color: colors.text }]}>
                  {bannerState === 'ready'
                    ? 'AI Model Ready!'
                    : bannerState === 'error'
                    ? 'Download Failed'
                    : 'Downloading Offline AI'}
                </Text>
                <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                  {bannerState === 'ready'
                    ? `${readableName} weights installed`
                    : bannerState === 'error'
                    ? 'Please check connection'
                    : `${readableName} (${totalSize})`}
                </Text>
              </View>
            </View>

            {/* Actions for minimizing/collapsing */}
            {bannerState === 'downloading' && (
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  setIsCollapsed(true);
                }}
                style={styles.chevronButton}
              >
                <Ionicons name="contract" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Progress Section */}
          {bannerState === 'downloading' && (
            <View style={styles.progressContainer}>
              <ProgressBar progress={llmDownloadProgress / 100} height={6} />
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressBytesText, { color: colors.textSecondary }]}>
                  {calculateProgressText()}
                </Text>
                <Text style={[styles.progressPercentText, { color: colors.primary }]}>
                  {llmDownloadProgress}%
                </Text>
              </View>
            </View>
          )}

          {/* Error Message Details */}
          {bannerState === 'error' && llmErrorMessage && (
            <Text style={[styles.errorDetailText, { color: colors.danger }]}>
              {llmErrorMessage}
            </Text>
          )}

          {/* Footer Action Buttons */}
          <View style={styles.actionRow}>
            {bannerState === 'downloading' && (
              <Pressable onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel Download</Text>
              </Pressable>
            )}

            {bannerState === 'error' && (
              <>
                <Pressable onPress={handleCloseError} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </Pressable>
                <Pressable
                  onPress={handleRetry}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.actionBtnText}>Retry</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    zIndex: 9999,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(0,0,0,0.1)',
      },
    }),
  },
  collapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  collapsedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  spinIcon: {
    marginRight: 2,
  },
  notificationCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  chevronButton: {
    padding: 4,
  },
  progressContainer: {
    gap: 6,
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBytesText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorDetailText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: -4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

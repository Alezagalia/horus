import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Layout } from '@/tokens';

interface Props {
  children: ReactNode;
  /** Disable scroll (for pages with their own list) */
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: object;
}

export function ScreenContainer({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  style,
}: Props) {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.inner,
        {
          paddingTop: insets.top + 20,
          paddingBottom: Layout.tabBarHeight + Layout.tabBarOffset + 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <LinearGradient colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]} style={styles.gradient}>
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.vivid}
                colors={[Colors.vivid]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { paddingHorizontal: Spacing.screenX },
});

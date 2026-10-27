/**
 * BottomNavBar.tsx
 *
 * Modern persistent bottom dock navigation for AlgoMentor AI.
 * Provides 1-tap switching between Curriculum Roadmap, Problems, Visualizers,
 * Spaced Revision, and System Design Studio.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NavTabId = 'roadmap' | 'problems' | 'visualizers' | 'revision' | 'studio';

interface BottomNavBarProps {
  activeTab: NavTabId;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: string;
  route: Href;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: '🧭',
    route: '/(main)/dashboard',
  },
  {
    id: 'problems',
    label: 'Practice',
    icon: '⚡',
    route: '/(main)/problems',
    badge: '30',
  },
  {
    id: 'visualizers',
    label: 'Visualizer',
    icon: '🌲',
    route: '/(main)/visualizers',
  },
  {
    id: 'revision',
    label: 'Revision',
    icon: '🔁',
    route: '/(main)/revision',
  },
  {
    id: 'studio',
    label: 'Design',
    icon: '🏛️',
    route: '/(main)/system-design',
  },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTabPress = (item: NavItem) => {
    if (item.id === activeTab) return;
    router.push(item.route);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.dock}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => handleTabPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, isActive && styles.activeIcon]}>
                  {item.icon}
                </Text>
                {item.badge && !isActive && (
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.activeLabel : styles.inactiveLabel,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090D16',
    borderTopWidth: 1,
    borderTopColor: '#172033',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0D121F',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 14,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    opacity: 0.65,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  miniBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  label: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeLabel: {
    color: '#a5b4fc',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#64748b',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#818cf8',
    marginTop: 2,
  },
});

export default BottomNavBar;

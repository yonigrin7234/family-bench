import { useWindowDimensions } from 'react-native';

// Mobile (<768px): bottom tab bar
// Desktop (>=768px): sidebar
export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

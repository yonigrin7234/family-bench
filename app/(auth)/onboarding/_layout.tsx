import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="state" />
      <Stack.Screen name="court" />
      <Stack.Screen name="parties" />
      <Stack.Screen name="children" />
      <Stack.Screen name="schedule" />
    </Stack>
  );
}

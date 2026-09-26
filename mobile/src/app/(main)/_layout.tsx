/**
 * Main app layout — stack navigator for authenticated screens.
 */

import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F0F23' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#0F0F23' },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{ title: 'AlgoMentor', headerBackVisible: false }}
      />
      <Stack.Screen
        name="course/[id]"
        options={{ title: 'Course' }}
      />
      <Stack.Screen
        name="topic/[id]"
        options={{ title: 'Topic' }}
      />
      <Stack.Screen
        name="concept/[id]"
        options={{ title: 'Concept' }}
      />
      <Stack.Screen
        name="problems/index"
        options={{ title: 'Problems & Patterns' }}
      />
      <Stack.Screen
        name="problems/[id]"
        options={{ title: 'Problem Workspace' }}
      />
      <Stack.Screen
        name="visualizers/index"
        options={{ title: 'Mental Models' }}
      />
      <Stack.Screen
        name="visualizers/[type]"
        options={{ title: 'Interactive Visualizer' }}
      />
      <Stack.Screen
        name="voice/index"
        options={{ title: 'Verbal Reasoning Studio' }}
      />
      <Stack.Screen
        name="revision/index"
        options={{ title: 'Revision & Spaced Practice' }}
      />
      <Stack.Screen
        name="revision/practice"
        options={{ title: 'Daily Retrieval Session' }}
      />
      <Stack.Screen
        name="system-design/index"
        options={{ title: 'System Design Studio' }}
      />
      <Stack.Screen
        name="system-design/[id]"
        options={{ title: 'Architecture Scenario' }}
      />
    </Stack>
  );
}

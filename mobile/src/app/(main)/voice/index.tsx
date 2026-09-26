import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { VoiceReasoningModal } from '../../../components/VoiceReasoningModal';

interface VoicePracticePrompt {
  id: string;
  topic: string;
  title: string;
  question: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sampleAnswer: string;
}

const VOICE_PROMPTS: VoicePracticePrompt[] = [
  {
    id: 'binary_search_log_n',
    topic: 'Binary Search & Complexity',
    title: 'Why is Binary Search O(log n)?',
    question:
      'Explain to your interviewer why repeatedly halving a search space of size N leads to logarithmic time complexity O(log n), and why the array must be sorted.',
    difficulty: 'beginner',
    sampleAnswer:
      'Binary search requires a sorted array. At each step, we evaluate the middle element. If the target is not there, we can discard either the entire left or right half based on whether the target is larger or smaller. Halving the search space repeatedly means we can do at most log2(N) steps before finding the target or exhausting the search space.',
  },
  {
    id: 'bfs_shortest_path',
    topic: 'Graphs & Queues',
    title: 'Why BFS Guarantees Shortest Path in Unweighted Graphs',
    question:
      'Explain verbally why Breadth-First Search (BFS) using a FIFO queue guarantees the shortest path in unweighted graphs, while DFS does not.',
    difficulty: 'intermediate',
    sampleAnswer:
      'BFS explores the graph in concentric rings or levels of increasing distance from the source. Because we use a FIFO queue, all vertices at distance K are explored before any vertex at distance K plus 1. Therefore, the first time we encounter the destination node, it is guaranteed to be via the shortest unweighted path.',
  },
  {
    id: 'two_sum_two_pointers',
    topic: 'Two Pointers & Invariants',
    title: 'Two-Pointer Invariant on Sorted Arrays',
    question:
      'Explain the algorithmic invariant of moving left and right pointers inward when finding a target sum in a sorted array in O(n) time.',
    difficulty: 'beginner',
    sampleAnswer:
      'We place left pointer at index 0 and right pointer at index N minus 1. If their sum is smaller than target, any element paired with the current left pointer would also be too small, so we can safely advance left. If sum is greater than target, any element paired with current right is too large, so we decrement right. This eliminates candidates in O(1) time each step.',
  },
  {
    id: 'dp_vs_divide_conquer',
    topic: 'Dynamic Programming',
    title: 'DP vs. Divide & Conquer',
    question:
      'Articulate the exact difference between Divide & Conquer and Dynamic Programming, focusing on subproblem independence.',
    difficulty: 'intermediate',
    sampleAnswer:
      'Both paradigms break problems into smaller subproblems. However, in Divide and Conquer (like Merge Sort), subproblems are independent and non-overlapping. In Dynamic Programming (like Fibonacci or Knapsack), subproblems overlap heavily. DP solves each subproblem once, memoizes the result in a table, and reuses it in O(1) time to avoid exponential repeated calculations.',
  },
];

export default function VoicePracticeScreen() {
  const [activePrompt, setActivePrompt] = useState<VoicePracticePrompt | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verbal Reasoning Studio</Text>
          <Text style={styles.headerSubtitle}>
            Practice speaking algorithmic thought processes out loud with real-time Socratic feedback
          </Text>
        </View>

        {/* Practice Prompt Cards */}
        <View style={styles.promptList}>
          {VOICE_PROMPTS.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>{item.topic}</Text>
                </View>
                <Text
                  style={[
                    styles.diffBadge,
                    item.difficulty === 'beginner'
                      ? styles.diffBeginner
                      : styles.diffIntermediate,
                  ]}
                >
                  {item.difficulty.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardQuestion}>{item.question}</Text>

              <TouchableOpacity
                style={styles.speakButton}
                activeOpacity={0.8}
                onPress={() => setActivePrompt(item)}
              >
                <Text style={styles.speakButtonText}>🎙️ Speak Thought Process ➔</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Voice Reasoning Modal */}
      {activePrompt && (
        <VoiceReasoningModal
          visible={Boolean(activePrompt)}
          onClose={() => setActivePrompt(null)}
          promptText={activePrompt.question}
          topicOrProblem={activePrompt.title}
          sampleTranscript={activePrompt.sampleAnswer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  promptList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicBadge: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  diffBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  diffBeginner: {
    color: '#34d399',
  },
  diffIntermediate: {
    color: '#fbbf24',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  cardQuestion: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  speakButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    marginTop: 4,
  },
  speakButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
});

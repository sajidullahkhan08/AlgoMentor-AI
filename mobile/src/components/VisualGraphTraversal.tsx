import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export type GraphTraversalAlgorithm = 'bfs' | 'dfs';

interface GraphNode {
  id: string;
  label: string;
  x: number; // percentage
  y: number; // pixels
}

interface GraphStep {
  step: number;
  currentNode: string;
  action: string;
  explanation: string;
  frontier: string[];
  frontierName: 'Queue (FIFO)' | 'Stack (LIFO)';
  visited: string[];
  exploringEdges: string[];
}

const NODES: GraphNode[] = [
  { id: 'A', label: 'A', x: 20, y: 30 },
  { id: 'B', label: 'B', x: 60, y: 30 },
  { id: 'C', label: 'C', x: 20, y: 110 },
  { id: 'D', label: 'D', x: 60, y: 110 },
  { id: 'E', label: 'E', x: 85, y: 70 },
  { id: 'F', label: 'F', x: 40, y: 170 },
];

// Adjacency List for the graph
const ADJACENCY_LIST: Record<string, string[]> = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'D', 'F'],
  D: ['B', 'C', 'F'],
  E: ['B'],
  F: ['C', 'D'],
};

export function VisualGraphTraversal() {
  const [algorithm, setAlgorithm] = useState<GraphTraversalAlgorithm>('bfs');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<GraphStep[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const computedSteps: GraphStep[] = [];

    if (algorithm === 'bfs') {
      // Breadth-First Search using a Queue
      const queue: string[] = ['A'];
      const visited = new Set<string>(['A']);

      computedSteps.push({
        step: 1,
        currentNode: 'A',
        action: 'Initialize BFS with start node A',
        explanation: 'Enqueued root node A into FIFO Queue and marked as visited to prevent cycles.',
        frontier: ['A'],
        frontierName: 'Queue (FIFO)',
        visited: Array.from(visited),
        exploringEdges: [],
      });

      let stepNum = 2;
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = ADJACENCY_LIST[curr] || [];
        const edges: string[] = [];

        computedSteps.push({
          step: stepNum++,
          currentNode: curr,
          action: `Dequeued & Visiting: ${curr}`,
          explanation: `Popped ${curr} from head of Queue. Examining outgoing edges to discover unvisited neighbors.`,
          frontier: [...queue],
          frontierName: 'Queue (FIFO)',
          visited: Array.from(visited),
          exploringEdges: [],
        });

        for (const neighbor of neighbors) {
          edges.push(`${curr}->${neighbor}`);
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);

            computedSteps.push({
              step: stepNum++,
              currentNode: curr,
              action: `Discovered Neighbor: ${neighbor}`,
              explanation: `Found unvisited neighbor ${neighbor} via edge (${curr}, ${neighbor}). Added to visited set and pushed to end of Queue.`,
              frontier: [...queue],
              frontierName: 'Queue (FIFO)',
              visited: Array.from(visited),
              exploringEdges: [...edges],
            });
          }
        }
      }
    } else {
      // Depth-First Search using a Stack
      const stack: string[] = ['A'];
      const visited = new Set<string>();

      computedSteps.push({
        step: 1,
        currentNode: 'A',
        action: 'Initialize DFS with start node A',
        explanation: 'Pushed root node A onto LIFO Call Stack. DFS explores as deeply as possible along each branch before backtracking.',
        frontier: ['A'],
        frontierName: 'Stack (LIFO)',
        visited: [],
        exploringEdges: [],
      });

      let stepNum = 2;
      while (stack.length > 0) {
        const curr = stack.pop()!;
        if (!visited.has(curr)) {
          visited.add(curr);
          const neighbors = ADJACENCY_LIST[curr] || [];

          computedSteps.push({
            step: stepNum++,
            currentNode: curr,
            action: `Popped & Visiting: ${curr}`,
            explanation: `Visiting ${curr}. Inspecting neighbors and pushing unvisited adjacent vertices onto the stack.`,
            frontier: [...stack],
            frontierName: 'Stack (LIFO)',
            visited: Array.from(visited),
            exploringEdges: [],
          });

          // Push neighbors in reverse order so first neighbor is popped first
          for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i];
            if (!visited.has(neighbor)) {
              stack.push(neighbor);
              computedSteps.push({
                step: stepNum++,
                currentNode: curr,
                action: `Pushed Neighbor ${neighbor} to Stack`,
                explanation: `Edge (${curr}, ${neighbor}) leads to unvisited node. Pushed ${neighbor} to top of LIFO Stack.`,
                frontier: [...stack],
                frontierName: 'Stack (LIFO)',
                visited: Array.from(visited),
                exploringEdges: [`${curr}->${neighbor}`],
              });
            }
          }
        }
      }
    }

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [algorithm]);

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[currentStepIndex] || {
    step: 1,
    currentNode: 'A',
    action: 'Initializing',
    explanation: 'Select algorithm and step through.',
    frontier: [],
    frontierName: 'Queue (FIFO)',
    visited: [],
    exploringEdges: [],
  };

  const isCurrent = (id: string) => currentStep.currentNode === id;
  const isVisited = (id: string) => currentStep.visited.includes(id);
  const isInFrontier = (id: string) => currentStep.frontier.includes(id);

  return (
    <View style={styles.container}>
      {/* Algorithm Mode Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, algorithm === 'bfs' && styles.tabButtonActive]}
          onPress={() => setAlgorithm('bfs')}
        >
          <Text
            style={[
              styles.tabButtonText,
              algorithm === 'bfs' && styles.tabButtonTextActive,
            ]}
          >
            Breadth-First Search (Queue)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, algorithm === 'dfs' && styles.tabButtonActive]}
          onPress={() => setAlgorithm('dfs')}
        >
          <Text
            style={[
              styles.tabButtonText,
              algorithm === 'dfs' && styles.tabButtonTextActive,
            ]}
          >
            Depth-First Search (Stack)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Graph Visual Canvas */}
      <View style={styles.canvas}>
        {/* Render Graph Edges (visual connections) */}
        <View style={styles.edgeOverlay}>
          <Text style={[styles.edgeLine, { top: 38, left: '38%' }]}>─────</Text>
          <Text style={[styles.edgeLine, { top: 65, left: '22%' }]}>│</Text>
          <Text style={[styles.edgeLine, { top: 65, left: '62%' }]}>│</Text>
          <Text style={[styles.edgeLine, { top: 118, left: '38%' }]}>─────</Text>
          <Text style={[styles.edgeLine, { top: 50, left: '72%' }]}>╲</Text>
          <Text style={[styles.edgeLine, { top: 135, left: '30%' }]}>╲</Text>
          <Text style={[styles.edgeLine, { top: 135, left: '50%' }]}>╱</Text>
        </View>

        {/* Render Graph Nodes */}
        {NODES.map((n) => {
          const active = isCurrent(n.id);
          const visited = isVisited(n.id);
          const inFrontier = isInFrontier(n.id);

          return (
            <View
              key={n.id}
              style={[
                styles.nodeCircle,
                { left: `${n.x}%` as any, top: n.y },
                inFrontier && styles.nodeFrontier,
                visited && styles.nodeVisited,
                active && styles.nodeActive,
              ]}
            >
              <Text
                style={[
                  styles.nodeText,
                  visited && styles.nodeTextVisited,
                  active && styles.nodeTextActive,
                ]}
              >
                {n.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Visited Set & Frontier State */}
      <View style={styles.stateContainer}>
        {/* Visited Set */}
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>🛡️ Visited Set ({currentStep.visited.length}):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {currentStep.visited.map((v) => (
              <View key={v} style={styles.visitedPill}>
                <Text style={styles.visitedPillText}>{v}</Text>
              </View>
            ))}
            {currentStep.visited.length === 0 && (
              <Text style={styles.emptyText}>Empty</Text>
            )}
          </ScrollView>
        </View>

        {/* Frontier Structure */}
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>📦 {currentStep.frontierName}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {currentStep.frontier.map((item, idx) => (
              <View key={idx} style={styles.frontierPill}>
                <Text style={styles.frontierPillText}>{item}</Text>
              </View>
            ))}
            {currentStep.frontier.length === 0 && (
              <Text style={styles.emptyText}>Empty</Text>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Step Explanation */}
      <View style={styles.explanationCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStepIndex + 1} of {steps.length}: {currentStep.action}
          </Text>
        </View>
        <Text style={styles.explanationText}>{currentStep.explanation}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btnSecondary, currentStepIndex === 0 && styles.btnDisabled]}
          onPress={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.btnSecondaryText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.btnSecondaryText}>
            {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => {
            setIsPlaying(false);
            setCurrentStepIndex(0);
          }}
        >
          <Text style={styles.btnSecondaryText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnPrimary,
            currentStepIndex === steps.length - 1 && styles.btnDisabled,
          ]}
          onPress={() =>
            setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
          }
          disabled={currentStepIndex === steps.length - 1}
        >
          <Text style={styles.btnPrimaryText}>Next ▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#1e293b',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#38bdf8',
  },
  canvas: {
    height: 220,
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
    marginBottom: 14,
  },
  edgeOverlay: {
    ...StyleSheet.absoluteFill,
  },
  edgeLine: {
    position: 'absolute',
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
  },
  nodeCircle: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeFrontier: {
    borderColor: '#818cf8',
    backgroundColor: '#312e81',
    borderWidth: 2,
  },
  nodeVisited: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  nodeActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#b45309',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  nodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  nodeTextVisited: {
    color: '#6ee7b7',
  },
  nodeTextActive: {
    color: '#ffffff',
  },
  stateContainer: {
    gap: 8,
    marginBottom: 12,
  },
  stateBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
  },
  stateTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  visitedPill: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visitedPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  frontierPill: {
    backgroundColor: '#312e81',
    borderColor: '#818cf8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  frontierPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c7d2fe',
  },
  emptyText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  explanationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginBottom: 12,
  },
  stepBadge: {
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  explanationText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  btnPrimary: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.35,
  },
});

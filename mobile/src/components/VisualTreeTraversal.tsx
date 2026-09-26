import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export type TreeTraversalType = 'inorder' | 'preorder' | 'postorder' | 'levelorder';

interface TreeNode {
  val: number;
  id: string;
  x: number; // percentage horizontal
  y: number; // pixel vertical
  left?: TreeNode;
  right?: TreeNode;
}

interface TraversalStep {
  step: number;
  nodeId: string;
  nodeVal: number;
  action: string;
  explanation: string;
  visitedSoFar: number[];
  stackOrQueue: number[];
  structureName: 'Call Stack' | 'Queue';
}

// Fixed balanced binary tree for visualization
//         (4)
//       /     \
//     (2)     (6)
//    /   \   /   \
//  (1)  (3) (5)  (7)
const ROOT_TREE: TreeNode = {
  val: 4,
  id: '4',
  x: 50,
  y: 20,
  left: {
    val: 2,
    id: '2',
    x: 25,
    y: 80,
    left: { val: 1, id: '1', x: 12, y: 140 },
    right: { val: 3, id: '3', x: 38, y: 140 },
  },
  right: {
    val: 6,
    id: '6',
    x: 75,
    y: 80,
    left: { val: 5, id: '5', x: 62, y: 140 },
    right: { val: 7, id: '7', x: 88, y: 140 },
  },
};

export function VisualTreeTraversal() {
  const [traversalType, setTraversalType] = useState<TreeTraversalType>('inorder');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TraversalStep[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Precompute traversal steps based on selected type
  useEffect(() => {
    const computedSteps: TraversalStep[] = [];
    const visited: number[] = [];

    if (traversalType === 'preorder') {
      // Root -> Left -> Right
      const callStack: number[] = [];
      const traverse = (node: TreeNode | undefined) => {
        if (!node) return;
        callStack.push(node.val);
        visited.push(node.val);
        computedSteps.push({
          step: computedSteps.length + 1,
          nodeId: node.id,
          nodeVal: node.val,
          action: `Visit Root: ${node.val}`,
          explanation: `Pre-order processes Root first before traversing subtrees. Processed node ${node.val}.`,
          visitedSoFar: [...visited],
          stackOrQueue: [...callStack],
          structureName: 'Call Stack',
        });

        traverse(node.left);
        traverse(node.right);
        callStack.pop();
      };
      traverse(ROOT_TREE);
    } else if (traversalType === 'inorder') {
      // Left -> Root -> Right (Produces sorted order for BST)
      const callStack: number[] = [];
      const traverse = (node: TreeNode | undefined) => {
        if (!node) return;
        callStack.push(node.val);
        traverse(node.left);

        visited.push(node.val);
        computedSteps.push({
          step: computedSteps.length + 1,
          nodeId: node.id,
          nodeVal: node.val,
          action: `Process Node: ${node.val}`,
          explanation: `In-order traverses Left subtree first, then visits Root (${node.val}), then Right subtree. In a BST, this yields strictly sorted order!`,
          visitedSoFar: [...visited],
          stackOrQueue: [...callStack],
          structureName: 'Call Stack',
        });

        traverse(node.right);
        callStack.pop();
      };
      traverse(ROOT_TREE);
    } else if (traversalType === 'postorder') {
      // Left -> Right -> Root (Bottom-up evaluation)
      const callStack: number[] = [];
      const traverse = (node: TreeNode | undefined) => {
        if (!node) return;
        callStack.push(node.val);
        traverse(node.left);
        traverse(node.right);

        visited.push(node.val);
        computedSteps.push({
          step: computedSteps.length + 1,
          nodeId: node.id,
          nodeVal: node.val,
          action: `Process Node (Bottom-up): ${node.val}`,
          explanation: `Post-order processes both Left and Right children before the Root (${node.val}). Ideal for subtree deletions or computing tree height.`,
          visitedSoFar: [...visited],
          stackOrQueue: [...callStack],
          structureName: 'Call Stack',
        });
        callStack.pop();
      };
      traverse(ROOT_TREE);
    } else if (traversalType === 'levelorder') {
      // BFS with Queue
      const queue: TreeNode[] = [ROOT_TREE];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        visited.push(curr.val);
        if (curr.left) queue.push(curr.left);
        if (curr.right) queue.push(curr.right);

        computedSteps.push({
          step: computedSteps.length + 1,
          nodeId: curr.id,
          nodeVal: curr.val,
          action: `Dequeue & Visit: ${curr.val}`,
          explanation: `Level-order traverses level by level via FIFO Queue. Visited ${curr.val} and enqueued valid children.`,
          visitedSoFar: [...visited],
          stackOrQueue: queue.map((n) => n.val),
          structureName: 'Queue',
        });
      }
    }

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [traversalType]);

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
    nodeId: '4',
    nodeVal: 4,
    action: 'Starting Traversal',
    explanation: 'Select traversal mode and step through.',
    visitedSoFar: [],
    stackOrQueue: [],
    structureName: 'Call Stack',
  };

  const isVisited = (val: number) => currentStep.visitedSoFar.includes(val);
  const isCurrent = (val: number) => currentStep.nodeVal === val;

  // Flattened tree node list for rendering
  const allNodes = [
    { val: 4, x: '45%', y: 16 },
    { val: 2, x: '22%', y: 76 },
    { val: 6, x: '68%', y: 76 },
    { val: 1, x: '10%', y: 136 },
    { val: 3, x: '34%', y: 136 },
    { val: 5, x: '56%', y: 136 },
    { val: 7, x: '80%', y: 136 },
  ];

  return (
    <View style={styles.container}>
      {/* Traversal Selector Tabs */}
      <View style={styles.tabRow}>
        {(['inorder', 'preorder', 'postorder', 'levelorder'] as TreeTraversalType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.tabButton, traversalType === type && styles.tabButtonActive]}
            onPress={() => setTraversalType(type)}
          >
            <Text
              style={[
                styles.tabButtonText,
                traversalType === type && styles.tabButtonTextActive,
              ]}
            >
              {type === 'inorder'
                ? 'In-Order'
                : type === 'preorder'
                ? 'Pre-Order'
                : type === 'postorder'
                ? 'Post-Order'
                : 'Level-Order (BFS)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Visual Tree Diagram Canvas */}
      <View style={styles.treeCanvas}>
        {/* Branch Guide Labels */}
        <Text style={[styles.branchLabel, { top: 48, left: '32%' }]}>╱</Text>
        <Text style={[styles.branchLabel, { top: 48, right: '35%' }]}>╲</Text>
        <Text style={[styles.branchLabel, { top: 108, left: '16%' }]}>╱</Text>
        <Text style={[styles.branchLabel, { top: 108, left: '28%' }]}>╲</Text>
        <Text style={[styles.branchLabel, { top: 108, right: '38%' }]}>╱</Text>
        <Text style={[styles.branchLabel, { top: 108, right: '26%' }]}>╲</Text>

        {/* Tree Nodes */}
        {allNodes.map((n) => {
          const active = isCurrent(n.val);
          const visited = isVisited(n.val);

          return (
            <View
              key={n.val}
              style={[
                styles.nodeCircle,
                { left: n.x as any, top: n.y },
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
                {n.val}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Traversal Output Sequence */}
      <View style={styles.sequenceContainer}>
        <Text style={styles.sequenceLabel}>Visited Output Sequence:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sequenceScroll}>
          {currentStep.visitedSoFar.map((val, idx) => (
            <View key={idx} style={styles.sequenceBadge}>
              <Text style={styles.sequenceBadgeText}>{val}</Text>
            </View>
          ))}
          {currentStep.visitedSoFar.length === 0 && (
            <Text style={styles.emptySequenceText}>[ Awaiting first node visit... ]</Text>
          )}
        </ScrollView>
      </View>

      {/* Data Structure State (Stack or Queue) */}
      <View style={styles.stateCard}>
        <View style={styles.stateHeader}>
          <Text style={styles.stateTitle}>
            {currentStep.structureName === 'Call Stack'
              ? '📚 Recursion Call Stack'
              : '📥 BFS FIFO Queue'}
          </Text>
          <Text style={styles.stateSubtitle}>
            {currentStep.structureName === 'Call Stack'
              ? 'LIFO execution frames'
              : 'FIFO frontier elements'}
          </Text>
        </View>

        <View style={styles.stackRow}>
          {currentStep.stackOrQueue.map((item, idx) => (
            <View key={idx} style={styles.stackPill}>
              <Text style={styles.stackPillText}>{item}</Text>
            </View>
          ))}
          {currentStep.stackOrQueue.length === 0 && (
            <Text style={styles.emptyStateText}>( Empty )</Text>
          )}
        </View>
      </View>

      {/* Step Explanation Card */}
      <View style={styles.explanationCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStepIndex + 1} of {steps.length}: {currentStep.action}
          </Text>
        </View>
        <Text style={styles.explanationText}>{currentStep.explanation}</Text>
      </View>

      {/* Control Buttons */}
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
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#38bdf8',
  },
  treeCanvas: {
    height: 190,
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
    marginBottom: 14,
  },
  branchLabel: {
    position: 'absolute',
    color: '#334155',
    fontSize: 20,
    fontWeight: '900',
  },
  nodeCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeVisited: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  nodeActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  nodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  nodeTextVisited: {
    color: '#6ee7b7',
  },
  nodeTextActive: {
    color: '#ffffff',
  },
  sequenceContainer: {
    marginBottom: 12,
  },
  sequenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  sequenceScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  sequenceBadge: {
    backgroundColor: '#0c4a6e',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  emptySequenceText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  stateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  stateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stateTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stateSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  stackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  stackPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stackPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    fontFamily: 'monospace',
  },
  emptyStateText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  explanationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    marginBottom: 12,
  },
  stepBadge: {
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
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
    backgroundColor: '#0284c7',
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

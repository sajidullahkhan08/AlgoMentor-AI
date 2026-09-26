/**
 * System Design Service (Phase 9).
 *
 * Provides architectural scenarios, back-of-the-envelope calculations,
 * and Socratic trade-off evaluations for large-scale distributed systems.
 */

import { getSupabase } from '../config/supabase';
import { getAIProvider } from './ai';

export interface ArchitectureComponent {
  id: string;
  name: string;
  role: string;
}

export interface TradeOffQuestion {
  id: string;
  question: string;
  trade_off: string;
}

export interface SystemDesignScenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  scale_metrics: { [key: string]: string };
  functional_requirements: string[];
  non_functional_requirements: string[];
  architecture_components: ArchitectureComponent[];
  trade_off_questions: TradeOffQuestion[];
}

export interface SystemDesignEvaluationResult {
  score: number; // 0 to 100
  isArchitecturallySound: boolean;
  strengths: string[];
  bottlenecksIdentified: string[];
  singlePointsOfFailure: string[];
  socraticChallenge: string;
  feedback: string;
  scalabilityVerdict: string;
}

const SEED_SCENARIOS: SystemDesignScenario[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    slug: 'url-shortener',
    title: 'Distributed URL Shortener (TinyURL)',
    description:
      'Design a high-scale service that generates compact 7-character aliases for long URLs, handling billions of redirection requests with sub-10ms latency.',
    difficulty: 'beginner',
    category: 'High-Throughput Storage & Caching',
    scale_metrics: {
      daily_active_users: '100 Million',
      write_qps: '1,160 writes/sec (100M URLs / month)',
      read_qps: '116,000 reads/sec (100:1 read-to-write ratio)',
      storage_5_years: '15 Terabytes (6 Billion URLs * 2.5KB)',
      bandwidth_read: '290 MB/sec',
    },
    functional_requirements: [
      'Given a long URL, generate a unique 7-character short alias.',
      'When clicking a short alias, redirect the HTTP request to the original URL (301 vs 302).',
      'Custom alias support (optional vanity URLs).',
      'Configurable expiration time for short links.',
    ],
    non_functional_requirements: [
      'Ultra-low latency (< 15ms) for redirects.',
      'High availability (99.99%) — redirection failure breaks customer links.',
      'Short URLs should not be guessable or sequentially predictable.',
    ],
    architecture_components: [
      { id: 'dns_lb', name: 'DNS & Anycast Load Balancer', role: 'Distributes global ingress across regional clusters.' },
      { id: 'api_gateway', name: 'API Gateway / Reverse Proxy', role: 'Handles rate limiting, SSL termination, and routing.' },
      { id: 'app_cluster', name: 'Stateless Application Servers', role: 'Executes Base62 encoding and token coordination.' },
      { id: 'keygen_service', name: 'Key Generation Service (KGS)', role: 'Pre-generates unique 7-char Base62 tokens in random order into Redis/DB.' },
      { id: 'cache_tier', name: 'Distributed Cache (Redis / Memcached)', role: 'Caches top 20% hot URLs (80/20 Pareto rule) in RAM.' },
      { id: 'db_cluster', name: 'NoSQL / Key-Value DB (Cassandra / DynamoDB)', role: 'Stores billion records partitioned by short_hash.' },
    ],
    trade_off_questions: [
      {
        id: 'q1',
        question: 'Should you return HTTP 301 (Permanent Redirect) or HTTP 302 (Temporary Redirect)?',
        trade_off:
          '301 lets browser cache the redirect locally, reducing server load to zero, but prevents click analytics tracking. 302 forces every request to hit the server for real-time analytics at the cost of higher QPS.',
      },
      {
        id: 'q2',
        question: 'MD5/SHA256 hash truncation vs Pre-generated Counter (Base62 KGS)?',
        trade_off:
          'Truncating MD5 (128-bit) to 7 chars causes hash collisions requiring DB lookup loops. A Key Generation Service pre-allocates batches of collision-free unique keys in O(1).',
      },
      {
        id: 'q3',
        question: 'How do you handle cache eviction when memory fills up?',
        trade_off:
          'LRU (Least Recently Used) works well for URL access patterns where recent URLs receive 90% of traffic, while LFU is susceptible to old viral links taking up permanent space.',
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    slug: 'realtime-chat',
    title: 'Real-Time Chat & Presence System (Slack/WhatsApp)',
    description:
      'Design a bidirectional 1-on-1 and group messaging platform supporting instantaneous message delivery, online presence, and offline push notifications.',
    difficulty: 'intermediate',
    category: 'Real-Time Bidirectional & Pub/Sub',
    scale_metrics: {
      daily_active_users: '50 Million DAU',
      concurrent_connections: '10 Million active WebSockets',
      messages_per_day: '500 Million',
      peak_message_qps: '25,000 msgs/sec',
      storage_per_day: '100 GB/day',
    },
    functional_requirements: [
      '1-on-1 real-time messaging with low latency (< 100ms).',
      'Small to medium group chats (up to 500 members).',
      'Online/offline status indicator (Presence service).',
      'Persistent chat history accessible across multiple devices.',
    ],
    non_functional_requirements: [
      'High availability and zero message loss (guaranteed delivery).',
      'Strict chronological message ordering within a single conversation.',
      'End-to-end encryption or secure transport.',
    ],
    architecture_components: [
      { id: 'ws_gateway', name: 'WebSocket Connection Gateway', role: 'Maintains persistent, stateful TCP/WebSocket connections to active clients.' },
      { id: 'session_registry', name: 'Session Registry (Redis / ZooKeeper)', role: 'Maps user_id -> specific WebSocket server host address.' },
      { id: 'message_broker', name: 'Message Broker / Event Bus (Kafka / RabbitMQ)', role: 'Decouples message ingestion from delivery and offline processing.' },
      { id: 'presence_service', name: 'Presence & Heartbeat Service', role: 'Receives heartbeats every 30s to maintain active status with TTLs.' },
      { id: 'chat_db', name: 'Wide-Column Storage (Apache Cassandra / ScyllaDB)', role: 'High-write throughput for chat messages partitioned by (chat_id, message_id).' },
      { id: 'push_worker', name: 'Push Notification Workers (FCM / APNs)', role: 'Wakes up mobile devices for recipients not connected to WebSockets.' },
    ],
    trade_off_questions: [
      {
        id: 'q1',
        question: 'Why WebSockets instead of HTTP Long Polling?',
        trade_off:
          'HTTP Long Polling incurs full HTTP header overhead (1-2KB per check) and frequent connection re-establishment. WebSockets establish a lightweight bidirectional TCP pipe after the initial handshake, reducing bandwidth by 90%.',
      },
      {
        id: 'q2',
        question: 'How do you guarantee strict message ordering across distributed servers?',
        trade_off:
          'Using wall-clock timestamps causes out-of-order bugs due to clock drift (NTP synchronization skew). Distributed Snowflake IDs or Lamport logical timestamps monotonic per chat_id guarantee deterministic ordering.',
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    slug: 'distributed-rate-limiter',
    title: 'Distributed API Rate Limiter (Cloudflare / Stripe)',
    description:
      'Design an ultra-low latency middleware layer that protects downstream backend services from abusive traffic, DDoS attacks, and API quota exhaustion.',
    difficulty: 'advanced',
    category: 'High-Throughput Middleware & Concurrency',
    scale_metrics: {
      requests_per_sec: '1,000,000 req/sec across edge POPs',
      latency_budget: '< 2ms overhead per check',
      accuracy_tolerance: '< 0.5% drift allowed under extreme concurrency',
    },
    functional_requirements: [
      'Limit requests per client IP or authenticated API key (e.g. 100 req/min).',
      'Return HTTP 429 Too Many Requests with Retry-After header when threshold exceeded.',
      'Configurable tiered rules per client tier (Free vs Enterprise).',
    ],
    non_functional_requirements: [
      'Sub-millisecond decision latency so API traffic is not throttled.',
      'Distributed synchronization without race conditions.',
      'Graceful degradation (fail-open vs fail-closed if rate limiter storage fails).',
    ],
    architecture_components: [
      { id: 'edge_proxy', name: 'Edge Reverse Proxy (Envoy / NGINX)', role: 'Intercepts incoming requests and evaluates rate limiter filter.' },
      { id: 'redis_cluster', name: 'In-Memory Datastore (Redis with Lua Scripts)', role: 'Atomic counter increments using Redis single-threaded execution.' },
      { id: 'rules_cache', name: 'Local In-Memory Rules Cache', role: 'Stores tier quotas locally in server memory with 60s background refresh.' },
      { id: 'analytics_stream', name: 'Async Audit Logger (Kafka / ClickHouse)', role: 'Asynchronously streams blocked requests for security auditing.' },
    ],
    trade_off_questions: [
      {
        id: 'q1',
        question: 'Token Bucket vs Sliding Window Counter algorithm?',
        trade_off:
          'Token Bucket is memory efficient and easily handles bursts of traffic, but parameters (capacity, refill rate) can be tricky to tune. Sliding Window Counter provides strict mathematical precision against window-edge bursts at the cost of slightly higher memory per key.',
      },
      {
        id: 'q2',
        question: 'If the Redis rate limiter cluster suffers an outage, should you Fail Open or Fail Closed?',
        trade_off:
          'Failing Open allows traffic through, keeping user services alive but risking backend database overload. Failing Closed protects the backend completely but causes a total user-facing outage.',
      },
    ],
  },
];

export class SystemDesignService {
  async getScenarios(): Promise<SystemDesignScenario[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('system_design_scenarios')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as SystemDesignScenario[];
      }
    } catch {
      // Fallback
    }
    return SEED_SCENARIOS;
  }

  async getScenario(idOrSlug: string): Promise<SystemDesignScenario | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('system_design_scenarios')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();

      if (!error && data) {
        return data as SystemDesignScenario;
      }
    } catch {
      // Fallback
    }
    return (
      SEED_SCENARIOS.find((s) => s.id === idOrSlug || s.slug === idOrSlug) ||
      SEED_SCENARIOS[0]
    );
  }

  /**
   * Socratic Architecture Critique evaluating student's component choices and rationale.
   */
  async evaluateDesign(
    scenarioId: string,
    selectedComponentIds: string[],
    userExplanation: string,
    answeredTradeOffs?: { questionId: string; choice: string }[]
  ): Promise<SystemDesignEvaluationResult> {
    const scenario = await this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const availableIds = scenario.architecture_components.map((c) => c.id);
    const selectedCount = selectedComponentIds.length;
    const hasCache = selectedComponentIds.some((id) => id.includes('cache') || id.includes('redis'));
    const hasLb = selectedComponentIds.some((id) => id.includes('lb') || id.includes('gateway') || id.includes('proxy'));
    const hasDb = selectedComponentIds.some((id) => id.includes('db'));
    const textLower = userExplanation.toLowerCase();

    const strengths: string[] = [];
    const bottlenecks: string[] = [];
    const spofs: string[] = [];

    if (hasLb) {
      strengths.push('Included an Ingress Load Balancer / Reverse Proxy to distribute traffic and eliminate direct server binding.');
    } else {
      bottlenecks.push('Missing Load Balancer: Direct traffic to app servers will overwhelm individual instances.');
      spofs.push('Direct single-node ingress represents a critical Single Point of Failure (SPOF).');
    }

    if (hasCache) {
      strengths.push('Incorporated an in-memory caching tier to offload high read volume from the database.');
    } else {
      bottlenecks.push('No caching tier detected: Every request hits the persistence layer, which will bottleneck under peak read QPS.');
    }

    if (hasDb) {
      strengths.push('Selected appropriate persistent storage layer decoupled from stateless application logic.');
    } else {
      bottlenecks.push('No persistence layer defined: Data cannot survive server restarts.');
    }

    if (textLower.includes('sharding') || textLower.includes('partition') || textLower.includes('consistent hash')) {
      strengths.push('Demonstrated understanding of database partitioning / sharding for horizontal scalability.');
    }

    if (textLower.includes('failover') || textLower.includes('replica') || textLower.includes('replication')) {
      strengths.push('Considered database replication and automated failover for high availability.');
    } else {
      spofs.push('Consider adding read replicas and multi-AZ standby nodes to avoid database downtime.');
    }

    // Calculate score
    let score = Math.min(100, Math.round((selectedCount / availableIds.length) * 50 + (userExplanation.length > 40 ? 35 : 15) + (hasCache ? 15 : 0)));
    if (!hasLb || !hasDb) score = Math.min(score, 65);

    const isArchitecturallySound = score >= 70;

    let socraticChallenge = '';
    if (!hasCache) {
      socraticChallenge = 'Given the 100:1 read-to-write ratio, what happens to your database if 100,000 reads per second strike simultaneously?';
    } else if (!textLower.includes('replica')) {
      socraticChallenge = 'If your primary database instance experiences a hardware failure, what mechanism restores write availability?';
    } else {
      socraticChallenge = 'How would your system handle sudden viral spikes (e.g. 10x normal QPS for a single celebrity link or message thread)?';
    }

    const scalabilityVerdict =
      score >= 85
        ? 'Enterprise Production Ready: Demonstrates solid grasp of distributed systems, high availability, and decoupled tiers.'
        : score >= 70
        ? 'Viable Core Design: Good foundation, but requires refinement in replication, caching policies, and failover strategies.'
        : 'Incomplete Architecture: Key infrastructure tiers (caching, load balancing, or persistence) must be added to handle production scale.';

    return {
      score,
      isArchitecturallySound,
      strengths: strengths.length > 0 ? strengths : ['Attempted basic component selection.'],
      bottlenecksIdentified: bottlenecks.length > 0 ? bottlenecks : ['No glaring bandwidth or compute bottlenecks detected.'],
      singlePointsOfFailure: spofs.length > 0 ? spofs : ['Good redundancy across key components.'],
      socraticChallenge,
      feedback: `Your architecture for ${scenario.title} addresses ${selectedCount}/${availableIds.length} foundational tiers. ${scalabilityVerdict}`,
      scalabilityVerdict,
    };
  }
}

export const systemDesignService = new SystemDesignService();

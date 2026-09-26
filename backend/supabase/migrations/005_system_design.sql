-- =============================================================================
-- Migration 005: System Design Architecture Curriculum (Phase 9)
-- =============================================================================
-- Implements tables and seed scenarios for large-scale distributed system design,
-- back-of-the-envelope calculations, architectural trade-offs, and failure mode analysis.

CREATE TABLE IF NOT EXISTS system_design_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    scale_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    functional_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    non_functional_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    architecture_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    trade_off_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data for foundational System Design scenarios
INSERT INTO system_design_scenarios (
    id,
    slug,
    title,
    description,
    difficulty,
    category,
    scale_metrics,
    functional_requirements,
    non_functional_requirements,
    architecture_components,
    trade_off_questions
) VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'url-shortener',
    'Distributed URL Shortener (TinyURL)',
    'Design a high-scale service that generates compact 7-character aliases for long URLs, handling billions of redirection requests with sub-10ms latency.',
    'beginner',
    'High-Throughput Storage & Caching',
    '{
        "daily_active_users": "100 Million",
        "write_qps": "1,160 writes/sec (100M URLs / month)",
        "read_qps": "116,000 reads/sec (100:1 read-to-write ratio)",
        "storage_5_years": "15 Terabytes (6 Billion URLs * 2.5KB)",
        "bandwidth_read": "290 MB/sec"
    }'::jsonb,
    '[
        "Given a long URL, generate a unique 7-character short alias.",
        "When clicking a short alias, redirect the HTTP request to the original URL (301 vs 302).",
        "Custom alias support (optional vanity URLs).",
        "Configurable expiration time for short links."
    ]'::jsonb,
    '[
        "Ultra-low latency (< 15ms) for redirects.",
        "High availability (99.99%) — redirection failure breaks customer links.",
        "Short URLs should not be guessable or sequentially predictable."
    ]'::jsonb,
    '[
        {"id": "dns_lb", "name": "DNS & Anycast Load Balancer", "role": "Distributes global ingress across regional clusters."},
        {"id": "api_gateway", "name": "API Gateway / Reverse Proxy", "role": "Handles rate limiting, SSL termination, and routing."},
        {"id": "app_cluster", "name": "Stateless Application Servers", "role": "Executes Base62 encoding and token coordination."},
        {"id": "keygen_service", "name": "Key Generation Service (KGS)", "role": "Pre-generates unique 7-char Base62 tokens in random order into Redis/DB."},
        {"id": "cache_tier", "name": "Distributed Cache (Redis / Memcached)", "role": "Caches top 20% hot URLs (80/20 Pareto rule) in RAM."},
        {"id": "db_cluster", "name": "NoSQL / Key-Value DB (Cassandra / DynamoDB)", "role": "Stores billion records partitioned by short_hash."}
    ]'::jsonb,
    '[
        {
            "id": "q1",
            "question": "Should you return HTTP 301 (Permanent Redirect) or HTTP 302 (Temporary Redirect)?",
            "trade_off": "301 lets browser cache the redirect locally, reducing server load to zero, but prevents click analytics tracking. 302 forces every request to hit the server for real-time analytics at the cost of higher QPS."
        },
        {
            "id": "q2",
            "question": "MD5/SHA256 hash truncation vs Pre-generated Counter (Base62 KGS)?",
            "trade_off": "Truncating MD5 (128-bit) to 7 chars causes hash collisions requiring DB lookup loops. A Key Generation Service pre-allocates batches of collision-free unique keys in O(1)."
        },
        {
            "id": "q3",
            "question": "How do you handle cache eviction when memory fills up?",
            "trade_off": "LRU (Least Recently Used) works well for URL access patterns where recent URLs receive 90% of traffic, while LFU is susceptible to old viral links taking up permanent space."
        }
    ]'::jsonb
),
(
    'b1000000-0000-0000-0000-000000000002',
    'realtime-chat',
    'Real-Time Chat & Presence System (Slack/WhatsApp)',
    'Design a bidirectional 1-on-1 and group messaging platform supporting instantaneous message delivery, online presence, and offline push notifications.',
    'intermediate',
    'Real-Time Bidirectional & Pub/Sub',
    '{
        "daily_active_users": "50 Million DAU",
        "concurrent_connections": "10 Million active WebSockets",
        "messages_per_day": "500 Million",
        "peak_message_qps": "25,000 msgs/sec",
        "storage_per_day": "100 GB/day"
    }'::jsonb,
    '[
        "1-on-1 real-time messaging with low latency (< 100ms).",
        "Small to medium group chats (up to 500 members).",
        "Online/offline status indicator (Presence service).",
        "Persistent chat history accessible across multiple devices."
    ]'::jsonb,
    '[
        "High availability and zero message loss (guaranteed delivery).",
        "Strict chronological message ordering within a single conversation.",
        "End-to-end encryption or secure transport."
    ]'::jsonb,
    '[
        {"id": "ws_gateway", "name": "WebSocket Connection Gateway", "role": "Maintains persistent, stateful TCP/WebSocket connections to active clients."},
        {"id": "session_registry", "name": "Session Registry (Redis / ZooKeeper)", "role": "Maps user_id -> specific WebSocket server host address."},
        {"id": "message_broker", "name": "Message Broker / Event Bus (Kafka / RabbitMQ)", "role": "Decouples message ingestion from delivery and offline processing."},
        {"id": "presence_service", "name": "Presence & Heartbeat Service", "role": "Receives heartbeats every 30s to maintain active status with TTLs."},
        {"id": "chat_db", "name": "Wide-Column Storage (Apache Cassandra / ScyllaDB)", "role": "High-write throughput for chat messages partitioned by (chat_id, message_id)."},
        {"id": "push_worker", "name": "Push Notification Workers (FCM / APNs)", "role": "Wakes up mobile devices for recipients not connected to WebSockets."}
    ]'::jsonb,
    '[
        {
            "id": "q1",
            "question": "Why WebSockets instead of HTTP Long Polling?",
            "trade_off": "HTTP Long Polling incurs full HTTP header overhead (1-2KB per check) and frequent connection re-establishment. WebSockets establish a lightweight bidirectional TCP pipe after the initial handshake, reducing bandwidth by 90%."
        },
        {
            "id": "q2",
            "question": "How do you guarantee strict message ordering across distributed servers?",
            "trade_off": "Using wall-clock timestamps causes out-of-order bugs due to clock drift (NTP synchronization skew). Distributed Snowflake IDs or Lamport logical timestamps monotonic per chat_id guarantee deterministic ordering."
        }
    ]'::jsonb
),
(
    'b1000000-0000-0000-0000-000000000003',
    'distributed-rate-limiter',
    'Distributed API Rate Limiter (Cloudflare / Stripe)',
    'Design an ultra-low latency middleware layer that protects downstream backend services from abusive traffic, DDoS attacks, and API quota exhaustion.',
    'advanced',
    'High-Throughput Middleware & Concurrency',
    '{
        "requests_per_sec": "1,000,000 req/sec across edge POPs",
        "latency_budget": "< 2ms overhead per check",
        "accuracy_tolerance": "< 0.5% drift allowed under extreme concurrency"
    }'::jsonb,
    '[
        "Limit requests per client IP or authenticated API key (e.g. 100 req/min).",
        "Return HTTP 429 Too Many Requests with Retry-After header when threshold exceeded.",
        "Configurable tiered rules per client tier (Free vs Enterprise)."
    ]'::jsonb,
    '[
        "Sub-millisecond decision latency so API traffic is not throttled.",
        "Distributed synchronization without race conditions.",
        "Graceful degradation (fail-open vs fail-closed if rate limiter storage fails)."
    ]'::jsonb,
    '[
        {"id": "edge_proxy", "name": "Edge Reverse Proxy (Envoy / NGINX)", "role": "Intercepts incoming requests and evaluates rate limiter filter."},
        {"id": "redis_cluster", "name": "In-Memory Datastore (Redis with Lua Scripts)", "role": "Atomic counter increments using Redis single-threaded execution."},
        {"id": "rules_cache", "name": "Local In-Memory Rules Cache", "role": "Stores tier quotas locally in server memory with 60s background refresh."},
        {"id": "analytics_stream", "name": "Async Audit Logger (Kafka / ClickHouse)", "role": "Asynchronously streams blocked requests for security auditing."}
    ]'::jsonb,
    '[
        {
            "id": "q1",
            "question": "Token Bucket vs Sliding Window Counter algorithm?",
            "trade_off": "Token Bucket is memory efficient and easily handles bursts of traffic, but parameters (capacity, refill rate) can be tricky to tune. Sliding Window Counter provides strict mathematical precision against window-edge bursts at the cost of slightly higher memory per key."
        },
        {
            "id": "q2",
            "question": "If the Redis rate limiter cluster suffers an outage, should you Fail Open or Fail Closed?",
            "trade_off": "Failing Open allows traffic through, keeping user services alive but risking backend database overload. Failing Closed protects the backend completely but causes a total user-facing outage."
        }
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

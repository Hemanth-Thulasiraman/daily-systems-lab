import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const concepts = [
  {
    slug: "load-balancing",
    title: "Load Balancing",
    category: "SYSTEM_DESIGN" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 25,
    simpleExplanation: "A load balancer sits in front of your servers and spreads incoming requests across them so no single server gets overwhelmed. Think of it like a traffic cop directing cars to different lanes.",
    deepDive: "Load balancers operate at different OSI layers. L4 (transport) load balancers route based on IP/TCP without inspecting content — very fast. L7 (application) load balancers inspect HTTP headers, cookies, and paths, enabling smarter routing like sticky sessions and URL-based rules.\n\nAlgorithms:\n• Round Robin — requests go to each server in turn\n• Weighted Round Robin — servers with more capacity get more requests\n• Least Connections — route to the server handling fewest active connections\n• IP Hash — same client IP always hits the same server (useful for sessions)\n• Consistent Hashing — minimizes reshuffling when servers are added/removed",
    whyItMatters: "Without a load balancer, a single server becomes your bottleneck and single point of failure. Load balancing gives you horizontal scalability and high availability.",
    howItWorks: "The client connects to the load balancer's IP. The LB maintains a pool of healthy backend servers (via health checks). Each request is forwarded to a chosen backend, which responds directly to the client (or back through the LB).",
    commonTradeoffs: [
      "L4 vs L7: L4 is faster but dumb; L7 is smarter but adds latency",
      "Sticky sessions break horizontal scaling but are needed for stateful apps",
      "Active-passive HA for the LB itself adds complexity",
      "SSL termination at the LB simplifies backends but means unencrypted internal traffic",
    ],
    commonMistakes: [
      "Not configuring health checks — dead servers keep receiving traffic",
      "Forgetting the LB itself is a SPOF — always deploy in HA pairs",
      "Using IP hash with NAT — all users behind a corporate NAT hit the same server",
      "Not draining connections before removing a server from the pool",
    ],
    realWorldExamples: {
      startup: "A startup runs two app servers behind an AWS ALB. The ALB health-checks port 80 every 30s and routes HTTPS traffic using round-robin.",
      enterprise: "Netflix uses multi-tier load balancing: AWS ELB at the edge, then internal Zuul API gateway, then per-service load balancers, with Ribbon for client-side load balancing between microservices.",
    },
    cloudUsage: {
      aws: "Application Load Balancer (L7, HTTP/HTTPS/WebSocket), Network Load Balancer (L4, TCP/UDP, ultra-low latency), Gateway Load Balancer (for inline security appliances).",
      azure: "Azure Load Balancer (L4), Azure Application Gateway (L7 with WAF), Azure Front Door (global L7 + CDN).",
      gcp: "Cloud Load Balancing — global anycast L7, regional L4, HTTP(S) LB with built-in CDN.",
      architecture: "Internet → Route53 → ALB → Target Group (EC2/ECS/Lambda) → RDS",
      security: "Use security groups to allow only ALB traffic to reach app servers. Enable access logs to S3. Use WAF on ALB for DDoS and OWASP protection.",
      cost: "ALB charges per LCU (load balancer capacity unit). NLB charges per connection. Consider request volume when choosing.",
    },
    practicalUsage: "Every production web app uses a load balancer. In AWS you'd create an ALB, register your EC2 instances or ECS tasks in a target group, configure listener rules, and enable health checks.",
    diagramCode: `graph LR
  Client-->LB[Load Balancer]
  LB-->S1[Server 1]
  LB-->S2[Server 2]
  LB-->S3[Server 3]
  S1-->DB[(Database)]
  S2-->DB
  S3-->DB`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between a load balancer and a reverse proxy?",
        "Name three load balancing algorithms and when you'd use each.",
        "Why do load balancers perform health checks?",
      ],
      intermediate: [
        "Your e-commerce site stores shopping cart state in server memory. Users lose their cart when routed to a different server. How do you fix this?",
        "Traffic spikes 10x every day at noon. Your load balancer is routing to 3 servers. What changes would you make to handle the spike automatically?",
        "A deployment requires taking servers out of rotation one at a time. How do you do this without dropping active connections?",
      ],
      advanced: [
        "Design a globally distributed load balancing system for an LLM API that must minimize latency for users in the US, EU, and Asia while handling GPU instance failures.",
        "Your ALB access logs show one backend server is receiving 80% of traffic despite round-robin config. Diagnose and fix.",
      ],
    },
    tags: ["load-balancing", "scalability", "high-availability", "networking"],
    prerequisites: [],
    relatedConcepts: ["caching", "cap-theorem", "aws-ec2-autoscaling"],
    flashcards: [
      { front: "What OSI layer does an Application Load Balancer operate at?", back: "Layer 7 (Application layer) — it can inspect HTTP headers, paths, and cookies.", tag: "load-balancing", difficulty: "BEGINNER" as const },
      { front: "What is sticky sessions and what problem does it solve?", back: "Sticky sessions (session affinity) route a user's requests to the same backend server. Solves stateful apps that store session data in server memory.", tag: "load-balancing", difficulty: "INTERMEDIATE" as const },
      { front: "How does consistent hashing help with load balancing?", back: "It minimizes key redistribution when servers are added/removed. Only K/N keys are remapped (K=keys, N=nodes) instead of remapping everything.", tag: "load-balancing", difficulty: "ADVANCED" as const },
      { front: "Name the three AWS load balancer types and their use cases.", back: "ALB (L7, HTTP/HTTPS/gRPC), NLB (L4, TCP/UDP, ultra-low latency), GWLB (inline security appliances like firewalls).", tag: "load-balancing", difficulty: "INTERMEDIATE" as const },
    ],
  },
  {
    slug: "caching",
    title: "Caching",
    category: "SYSTEM_DESIGN" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 30,
    simpleExplanation: "Caching stores the result of expensive operations so you can reuse them quickly. Instead of hitting your database every time someone requests the same data, you store it in fast memory (like Redis) and serve it from there.",
    deepDive: "Cache hierarchy: CPU L1/L2/L3 (nanoseconds) → RAM (microseconds) → SSD (milliseconds) → Network/DB (tens to hundreds of ms).\n\nEviction policies:\n• LRU (Least Recently Used) — evict the item not accessed for the longest time\n• LFU (Least Frequently Used) — evict the item accessed least often\n• TTL (Time To Live) — evict after a fixed duration\n\nPatterns:\n• Cache-aside (lazy loading): app checks cache first, on miss loads from DB and populates cache\n• Write-through: write to cache and DB simultaneously\n• Write-behind: write to cache, flush to DB asynchronously\n• Read-through: cache sits in front of DB and handles loading automatically",
    whyItMatters: "Reduces database load by orders of magnitude, cuts latency from 100ms to sub-millisecond, and allows horizontal scaling without proportionally scaling your database.",
    howItWorks: "On a cache hit, data is returned from memory without touching the DB. On a cache miss, data is fetched from the DB, stored in the cache with a TTL, and returned. The cache key is usually a hash of the query or request parameters.",
    commonTradeoffs: [
      "Cache invalidation is hard — stale data is a real risk",
      "Cache stampede: many requests hit the DB simultaneously when a popular cache key expires",
      "Memory is expensive — you can't cache everything",
      "Write-through adds write latency; write-behind risks data loss on crash",
    ],
    commonMistakes: [
      "Caching mutable data without proper invalidation strategy",
      "Not setting TTLs — cache fills up with stale data",
      "Caching at the wrong layer (e.g., caching raw SQL instead of business objects)",
      "Forgetting cache is not durable — never use it as your primary store",
    ],
    realWorldExamples: {
      startup: "A news site caches its homepage HTML in Redis for 60 seconds. 10,000 requests/minute hit Redis instead of the DB.",
      enterprise: "Twitter caches user timelines in Redis. A single tweet write fans out to ~150 follower caches asynchronously (write-behind).",
    },
    cloudUsage: {
      aws: "ElastiCache for Redis or Memcached. Also CloudFront for CDN/edge caching, DAX for DynamoDB acceleration.",
      azure: "Azure Cache for Redis.",
      gcp: "Memorystore (Redis/Memcached), Cloud CDN for edge.",
      architecture: "App → ElastiCache (Redis) → RDS. Cache hit rate should be >90% in production.",
      security: "Keep Redis in a private subnet. Enable Redis AUTH and TLS. Never expose Redis publicly.",
      cost: "Redis nodes are ~$0.017/hour (cache.t3.micro). A single node can handle 100K+ ops/sec, replacing many DB read replicas.",
    },
    practicalUsage: "In an LLM app, cache embeddings for repeated documents, cache LLM responses for identical prompts, and cache vector search results for common queries. This can cut costs by 60-80%.",
    diagramCode: `graph LR
  App-->Cache{Redis Cache}
  Cache-->|hit|App
  Cache-->|miss|DB[(Database)]
  DB-->Cache`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between cache-aside and read-through caching?",
        "What does TTL stand for and why is it important?",
        "Name two cache eviction policies.",
      ],
      intermediate: [
        "Your Redis cache has a 95% hit rate but users still complain about slow responses every morning. What's likely happening and how do you fix it?",
        "You need to cache user profile data that changes frequently. What strategy do you use to avoid serving stale data?",
        "Explain the cache stampede problem and two ways to prevent it.",
      ],
      advanced: [
        "Design a caching layer for a RAG system that serves 1M queries/day. Queries have high repetition (30% repeat within 1 hour). Minimize LLM API cost while keeping responses fresh.",
        "Your write-through cache is causing 200ms write latency spikes. Diagnose the bottleneck and propose alternatives.",
      ],
    },
    tags: ["caching", "redis", "performance", "scalability"],
    prerequisites: [],
    relatedConcepts: ["load-balancing", "database-indexing", "cap-theorem"],
    flashcards: [
      { front: "What is cache-aside (lazy loading)?", back: "App checks cache first. On miss, loads from DB, stores in cache, returns data. Most common pattern.", tag: "caching", difficulty: "BEGINNER" as const },
      { front: "What is a cache stampede?", back: "When a popular cache key expires, many simultaneous requests all miss the cache and hammer the DB at the same time. Fix with mutex locks or probabilistic early expiry.", tag: "caching", difficulty: "INTERMEDIATE" as const },
      { front: "LRU vs LFU eviction — when to use each?", back: "LRU: recency-based, good for most workloads. LFU: frequency-based, better when some items are always hot. Redis uses LRU by default.", tag: "caching", difficulty: "INTERMEDIATE" as const },
      { front: "What is write-behind caching?", back: "Writes go to cache immediately, then are flushed to the DB asynchronously. Lower write latency but risk of data loss if cache crashes before flush.", tag: "caching", difficulty: "ADVANCED" as const },
    ],
  },
  {
    slug: "database-indexing",
    title: "Database Indexing",
    category: "DATABASES" as const,
    difficulty: "BEGINNER" as const,
    estimatedMinutes: 20,
    simpleExplanation: "A database index is like the index at the back of a book. Without it, to find a row the DB reads every single row (full table scan). With an index, it jumps directly to the right location.",
    deepDive: "Most databases use B-Tree indexes by default. A B-Tree keeps data sorted in a balanced tree structure, enabling O(log n) lookups, range queries, and sorted results.\n\nOther index types:\n• Hash index — O(1) exact match lookups, no range queries (used in Redis, hash partitions)\n• GIN (Generalized Inverted Index) — for full-text search and array columns in Postgres\n• BRIN — for very large tables where data is naturally ordered (e.g., time-series)\n• Partial index — index only rows matching a condition (e.g., WHERE status='active')\n• Composite index — index on multiple columns. Column order matters for query matching.",
    whyItMatters: "A query that takes 30 seconds on a 100M-row table can take <1ms with the right index. Indexing is the highest-leverage database optimization.",
    howItWorks: "When you create an index, Postgres builds a separate data structure (usually B-Tree) sorted by the indexed column(s). Queries that filter or sort on those columns use the index instead of scanning the table. The query planner decides when to use an index vs. a sequential scan.",
    commonTradeoffs: [
      "Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE must update indexes)",
      "Each index consumes disk space and RAM (shared_buffers)",
      "Too many indexes confuses the query planner and wastes resources",
      "Composite index column order matters: (a,b,c) helps queries on a, (a,b), (a,b,c) but not (b,c) alone",
    ],
    commonMistakes: [
      "Indexing every column — more is not better",
      "Wrapping an indexed column in a function: WHERE LOWER(email) loses the index",
      "Not using EXPLAIN ANALYZE to verify the index is being used",
      "Forgetting that NULL values are included in indexes differently across DBs",
    ],
    realWorldExamples: {
      startup: "A SaaS app has a users table with 1M rows. Queries like `WHERE email = ?` are slow. Adding an index on email drops query time from 800ms to 0.1ms.",
      enterprise: "A payments company uses partial indexes: `CREATE INDEX ON transactions(user_id) WHERE status='pending'` — the index is tiny and fast for the most common query pattern.",
    },
    cloudUsage: {
      aws: "RDS Performance Insights shows you which queries are slowest and whether they're doing seq scans. Use pg_stat_statements to find missing indexes.",
      azure: "Azure SQL Database has Query Performance Insight and automatic index recommendations.",
      gcp: "Cloud SQL and AlloyDB have query insights. BigQuery uses columnar storage instead of B-Tree indexes.",
      architecture: "Always review slow query logs. Set log_min_duration_statement=100 in Postgres to log queries over 100ms.",
      security: "Indexes don't affect row-level security. Make sure your queries use indexes even with RLS enabled.",
      cost: "Indexes increase storage costs slightly but massively reduce compute costs by cutting query time. Usually worth it.",
    },
    practicalUsage: "Run EXPLAIN ANALYZE on slow queries to see if they're doing Seq Scans. Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses. Check pg_stat_user_indexes for unused indexes.",
    diagramCode: `graph TD
  Query["SELECT * WHERE email='x'"]
  Query-->Planner[Query Planner]
  Planner-->|index exists|Index[B-Tree Index]
  Planner-->|no index|SeqScan[Full Table Scan]
  Index-->Row[Found row in O log n]
  SeqScan-->AllRows[Read all N rows]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is a full table scan and why is it slow?",
        "What data structure do most database indexes use?",
        "Why does adding too many indexes slow down writes?",
      ],
      intermediate: [
        "You have a composite index on (user_id, created_at). Which of these queries will use the index? a) WHERE user_id=1 b) WHERE created_at>'2024-01-01' c) WHERE user_id=1 AND created_at>'2024-01-01'",
        "A query with an index is still running slowly. What would you check?",
        "Design the indexing strategy for a table that stores user events with columns: user_id, event_type, created_at, metadata.",
      ],
      advanced: [
        "Your Postgres table has 500M rows. A query on a non-selective column (gender: M/F) is slow even with an index. Explain why and what you'd do instead.",
        "Describe how you'd handle an index rebuild on a 1TB production table with zero downtime.",
      ],
    },
    tags: ["databases", "indexing", "postgres", "performance", "sql"],
    prerequisites: [],
    relatedConcepts: ["caching", "cap-theorem", "databases"],
    flashcards: [
      { front: "What does EXPLAIN ANALYZE do in Postgres?", back: "Shows the actual query execution plan with real row counts and timing. Reveals whether indexes are being used and where the bottleneck is.", tag: "database-indexing", difficulty: "BEGINNER" as const },
      { front: "Why does column order matter in a composite index?", back: "Postgres can use the index for queries on a prefix of the columns. Index on (a,b,c) helps queries on a, (a,b), (a,b,c) but not queries on b or c alone.", tag: "database-indexing", difficulty: "INTERMEDIATE" as const },
      { front: "What is a partial index?", back: "An index on a subset of rows matching a WHERE condition. E.g., CREATE INDEX ON orders(user_id) WHERE status='pending'. Smaller, faster, and avoids indexing irrelevant rows.", tag: "database-indexing", difficulty: "INTERMEDIATE" as const },
      { front: "Why does wrapping a column in a function break index usage?", back: "WHERE LOWER(email)='x' can't use an index on email because the indexed values are not lowercased. Fix: create a functional index on LOWER(email).", tag: "database-indexing", difficulty: "ADVANCED" as const },
    ],
  },
  {
    slug: "cap-theorem",
    title: "CAP Theorem",
    category: "SYSTEM_DESIGN" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 25,
    simpleExplanation: "CAP theorem says that a distributed system can only guarantee two of three properties at the same time: Consistency (all nodes see the same data), Availability (every request gets a response), and Partition Tolerance (system keeps working even if network splits occur).",
    deepDive: "Since network partitions are unavoidable in real distributed systems, the real choice is between Consistency and Availability when a partition occurs.\n\n• CP systems (Consistent + Partition Tolerant): During a partition, the system refuses requests rather than serving potentially stale data. Examples: HBase, ZooKeeper, etcd, Spanner.\n• AP systems (Available + Partition Tolerant): During a partition, the system continues serving requests but may return stale data. Examples: Cassandra, DynamoDB, CouchDB.\n\nPACELC extends CAP: even without partitions, there's a tradeoff between latency (L) and consistency (C). Systems that are CP during partition can still choose between EL (else latency) and EC (else consistency).",
    whyItMatters: "CAP theorem determines which database you choose and how you design your consistency guarantees. Choosing the wrong CP vs AP tradeoff for your use case leads to outages or data corruption.",
    howItWorks: "During a network partition, nodes can't communicate. A CP system will reject writes/reads rather than risk inconsistency. An AP system will serve from local state, possibly diverging from other partitions. After the partition heals, AP systems must reconcile conflicts (e.g., Cassandra uses last-write-wins or vector clocks).",
    commonTradeoffs: [
      "CP means some requests fail during partitions — may be unacceptable for user-facing services",
      "AP means users may read stale or conflicting data — unacceptable for financial transactions",
      "Strong consistency requires coordination between nodes — adds latency",
      "Eventual consistency is fast but requires conflict resolution logic",
    ],
    commonMistakes: [
      "Thinking you can have all three of CAP — you can't",
      "Using an AP database (Cassandra) for financial transactions requiring strong consistency",
      "Not planning for eventual consistency conflicts in AP systems",
      "Confusing consistency in CAP (linearizability) with consistency in ACID (different concept)",
    ],
    realWorldExamples: {
      startup: "A startup uses DynamoDB (AP) for user profiles — stale reads are acceptable. They use Postgres (CP) for billing — consistency is critical.",
      enterprise: "Google Spanner achieves CP globally using atomic clocks (TrueTime) to synchronize across datacenters without sacrificing too much latency.",
    },
    cloudUsage: {
      aws: "DynamoDB is AP by default (eventual consistency). Enable strongly consistent reads per-request at 2x the cost. RDS (Postgres/MySQL) is CP. DynamoDB Global Tables use eventual consistency for cross-region replication.",
      azure: "Cosmos DB lets you choose consistency level per operation: Strong, Bounded Staleness, Session, Consistent Prefix, Eventual.",
      gcp: "Spanner is CP with near-global consistency. Firestore offers strong consistency within a region, eventual across regions.",
      architecture: "Use CP (RDS/Spanner) for financial data, inventory, auth. Use AP (DynamoDB/Cassandra) for activity feeds, analytics, user preferences.",
      security: "Consistency level doesn't directly affect security, but stale reads in AP systems can expose recently-deleted permissions.",
      cost: "Strong consistency costs more: extra network round-trips, read quorums. DynamoDB strongly consistent reads cost 2x eventual consistent reads.",
    },
    practicalUsage: "When designing a system, ask: what happens if two nodes get different data due to a network split? If you need the data to be correct (banking), use CP. If you need the service to stay up (social feed), use AP.",
    diagramCode: `graph TD
  CAP["CAP Theorem"]
  C["Consistency\nAll nodes see same data"]
  A["Availability\nEvery request gets a response"]
  P["Partition Tolerance\nWorks despite network splits"]
  CAP-->C & A & P
  CP["CP Systems\nZooKeeper, HBase, etcd"]
  AP["AP Systems\nCassandra, DynamoDB, CouchDB"]
  C & P-->CP
  A & P-->AP`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What do C, A, and P stand for in CAP theorem?",
        "Why can't you have all three properties simultaneously?",
        "Give an example of a CP system and an AP system.",
      ],
      intermediate: [
        "You're building a ride-sharing app. The driver's location updates 10x/second and must be visible to all passengers. Which CAP category should your location store be, and why?",
        "A bank transfer requires debiting one account and crediting another. Both accounts live in different database nodes. How does CAP theorem affect your design?",
        "Explain how Cassandra handles write conflicts during a network partition.",
      ],
      advanced: [
        "Design a globally distributed inventory system for e-commerce (think Amazon). How do you handle the CAP tradeoffs when a user tries to buy the last item in stock across two regions simultaneously?",
        "Google Spanner claims to be CP globally. How does it achieve this without sacrificing availability, and what is TrueTime?",
      ],
    },
    tags: ["distributed-systems", "cap-theorem", "consistency", "availability"],
    prerequisites: ["database-indexing"],
    relatedConcepts: ["caching", "load-balancing", "message-queues"],
    flashcards: [
      { front: "What are the three properties in CAP theorem?", back: "Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (works despite network failures). You can only guarantee two.", tag: "cap-theorem", difficulty: "BEGINNER" as const },
      { front: "Is DynamoDB CP or AP by default?", back: "AP — eventual consistency by default. You can opt into strongly consistent reads per request for 2x the cost.", tag: "cap-theorem", difficulty: "INTERMEDIATE" as const },
      { front: "What is PACELC?", back: "Extension of CAP: Even when there's No partition, there's a tradeoff between Latency (L) and Consistency (C). Full: If Partition then (A or C) Else (L or C).", tag: "cap-theorem", difficulty: "ADVANCED" as const },
      { front: "Why is partition tolerance non-negotiable in real distributed systems?", back: "Network partitions always happen eventually — cables fail, switches drop packets, DCs lose connectivity. You must design assuming partitions will occur.", tag: "cap-theorem", difficulty: "INTERMEDIATE" as const },
    ],
  },
  {
    slug: "message-queues",
    title: "Message Queues",
    category: "SYSTEM_DESIGN" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 25,
    simpleExplanation: "A message queue is a buffer between two services. Instead of Service A calling Service B directly and waiting for a response, A drops a message in the queue and continues working. B picks it up when ready. They don't need to be available at the same time.",
    deepDive: "Core concepts:\n• Producer — sends messages to the queue\n• Consumer — reads and processes messages\n• Broker — the queue server (Kafka, RabbitMQ, SQS)\n• Topic / Queue — named channel for messages\n• Consumer group — multiple consumers sharing work from a topic\n\nKafka vs SQS vs RabbitMQ:\n• Kafka: log-based, messages are retained and replayable, ordered within a partition, very high throughput. Best for event streaming, audit logs, analytics pipelines.\n• SQS: simple managed queue, at-least-once delivery, up to 256KB messages, FIFO option. Best for decoupled microservices.\n• RabbitMQ: AMQP protocol, flexible routing (exchanges, bindings), complex routing topologies. Best for task queues with routing logic.",
    whyItMatters: "Decouples services (they can be deployed and scaled independently), handles traffic spikes (queue absorbs burst), improves reliability (messages aren't lost if consumer crashes), enables async processing.",
    howItWorks: "Producer sends a message to the broker. The broker persists it. Consumer polls or receives the message, processes it, and acknowledges it. If the consumer crashes before ack, the broker redelivers the message (at-least-once delivery).",
    commonTradeoffs: [
      "Adds operational complexity — you now have another service to run",
      "At-least-once delivery means your consumer must be idempotent",
      "Ordering: SQS standard queues don't guarantee order; Kafka guarantees order within a partition",
      "Async processing means errors surface later — harder to debug",
    ],
    commonMistakes: [
      "Not handling duplicate messages — consumers must be idempotent",
      "Using queues when synchronous calls are simpler and fast enough",
      "Not setting dead-letter queues for failed messages",
      "Kafka consumer not committing offsets correctly, causing reprocessing",
    ],
    realWorldExamples: {
      startup: "A startup sends email via SQS: the API drops an email job on the queue, a worker Lambda picks it up and calls SendGrid. Email sending failures don't block the API.",
      enterprise: "Uber uses Kafka to stream trip events. Multiple downstream systems (billing, driver pay, analytics, fraud detection) all consume the same event stream independently.",
    },
    cloudUsage: {
      aws: "SQS (simple managed queue), SNS (pub/sub fan-out), EventBridge (event bus with routing rules), Kinesis (streaming like Kafka), MSK (managed Kafka).",
      azure: "Service Bus (enterprise messaging), Event Hubs (event streaming like Kafka), Storage Queues (simple).",
      gcp: "Pub/Sub (managed pub/sub, Kafka-compatible), Dataflow for stream processing.",
      architecture: "API → SQS → Lambda consumers → DynamoDB. Use DLQ (dead-letter queue) for failed messages after N retries.",
      security: "Encrypt messages with KMS. Use IAM roles to grant least-privilege access. Enable SQS server-side encryption.",
      cost: "SQS: $0.40 per million requests. First 1M free. Kafka (MSK) is more expensive but better for high-throughput streaming.",
    },
    practicalUsage: "Use queues for: sending emails/notifications, processing uploaded files, running background jobs, fan-out (one event → many consumers), smoothing traffic spikes. Don't use for: real-time synchronous responses, simple in-process tasks.",
    diagramCode: `graph LR
  API[API Server]-->Queue[(SQS Queue)]
  Queue-->W1[Worker 1]
  Queue-->W2[Worker 2]
  Queue-->DLQ[Dead Letter Queue]
  W1-->DB[(Database)]
  W2-->DB`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between synchronous and asynchronous communication?",
        "What is a dead-letter queue and why do you need one?",
        "What does idempotent mean and why must message consumers be idempotent?",
      ],
      intermediate: [
        "Your image processing service falls behind during uploads and users see long wait times. How would you redesign it using a message queue?",
        "You have a Kafka consumer that processes payments. The consumer crashes mid-processing. How do you ensure the payment is processed exactly once?",
        "Compare using SQS vs Kafka for an audit log that multiple teams need to read independently.",
      ],
      advanced: [
        "Design a real-time notification system for 50M users using message queues. Users need to receive push notifications within 1 second of an event.",
        "Your Kafka consumer group is lagging by 2 million messages. The lag is growing. Diagnose and fix.",
      ],
    },
    tags: ["message-queues", "kafka", "sqs", "async", "microservices"],
    prerequisites: ["load-balancing"],
    relatedConcepts: ["cap-theorem", "aws-ec2-autoscaling", "ci-cd-pipelines"],
    flashcards: [
      { front: "What is the difference between a queue and a topic in messaging?", back: "A queue delivers each message to one consumer. A topic (pub/sub) delivers each message to all subscribers. SQS is queue-based; Kafka topics can do both with consumer groups.", tag: "message-queues", difficulty: "BEGINNER" as const },
      { front: "What is at-least-once delivery and what does it require of consumers?", back: "The broker guarantees delivery but may send duplicates on failure. Consumers must be idempotent — processing the same message twice must produce the same result.", tag: "message-queues", difficulty: "INTERMEDIATE" as const },
      { front: "How does Kafka achieve message ordering?", back: "Kafka guarantees ordering within a partition. All messages with the same key go to the same partition. Consumer groups read each partition with one consumer at a time.", tag: "message-queues", difficulty: "ADVANCED" as const },
      { front: "What is a Dead Letter Queue (DLQ)?", back: "A separate queue where messages go after failing N retry attempts. Lets you inspect, debug, and reprocess failed messages without losing them.", tag: "message-queues", difficulty: "BEGINNER" as const },
    ],
  },
  {
    slug: "aws-ec2-autoscaling",
    title: "AWS EC2 & Auto Scaling",
    category: "CLOUD_DEVOPS" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 30,
    simpleExplanation: "EC2 is AWS's virtual machine service. Auto Scaling automatically adds or removes EC2 instances based on demand — so you have more servers during traffic spikes and fewer during quiet periods, saving money and handling load automatically.",
    deepDive: "EC2 instance families:\n• General purpose (t3, m6i): balanced compute/memory. t3 has burstable CPU credits.\n• Compute optimized (c6i, c7g): for CPU-heavy workloads like ML inference, video encoding\n• Memory optimized (r6i, x2): for in-memory DBs, large caches, big data\n• Storage optimized (i3, d3): NVMe SSD, for high I/O databases\n• Accelerated (p4, g4dn): GPU instances for ML training/inference\n\nAuto Scaling Group (ASG) concepts:\n• Launch Template: defines what instances to launch (AMI, instance type, security groups)\n• Min/Max/Desired capacity: bounds and current target\n• Scaling policies: target tracking (e.g., keep CPU at 50%), step scaling, scheduled scaling\n• Warm-up period: time after launch before an instance receives traffic\n• Lifecycle hooks: run custom logic before instance starts/terminates (e.g., drain connections)",
    whyItMatters: "Manual scaling is too slow for traffic spikes and wasteful at low load. ASGs give you elasticity — right-sized capacity at any given moment, automatically.",
    howItWorks: "CloudWatch monitors metrics (CPU, request count, custom metrics). When a threshold is breached, ASG launches new instances from the Launch Template, registers them with the ALB target group, waits for health checks to pass, then routes traffic to them.",
    commonTradeoffs: [
      "Cold start latency: new instances take 1-5 minutes to be ready; pre-warm for predictable spikes",
      "Stateful apps don't scale horizontally — must externalize state to RDS/ElastiCache",
      "Scale-in (terminating instances) can drop in-flight requests without lifecycle hooks",
      "Spot instances cut costs 70% but can be interrupted with 2-minute notice",
    ],
    commonMistakes: [
      "Setting min capacity to 0 — your app goes completely offline during scale-in",
      "Not configuring scale-in protection for long-running jobs",
      "Using CPU as the only scaling metric — queue depth or request latency is often better",
      "Forgetting to update Launch Template when you deploy a new app version",
    ],
    realWorldExamples: {
      startup: "A startup runs 2 EC2 instances normally (min=2, max=10, desired=2). During a product launch, ASG scales to 8 instances automatically when CPU hits 70%, then scales back down after.",
      enterprise: "An AI company runs GPU inference on g4dn.xlarge Spot instances behind an ASG. When a Spot interruption notice arrives, lifecycle hooks drain the request, then terminate gracefully.",
    },
    cloudUsage: {
      aws: "EC2 → Launch Template → Auto Scaling Group → ALB Target Group. CloudWatch Alarms trigger scaling. Use Spot instances for 70% cost savings on non-critical workloads.",
      azure: "Azure Virtual Machine Scale Sets (VMSS) equivalent. Azure Monitor for metrics.",
      gcp: "Managed Instance Groups (MIGs) with autoscaling. Cloud Monitoring for metrics.",
      architecture: "Route53 → ALB → ASG (EC2) → RDS + ElastiCache. ASG spans 3 AZs for high availability.",
      security: "EC2 instances should have minimal IAM roles (instance profiles). Use Systems Manager Session Manager instead of SSH. No public IPs on app servers — only ALB is public.",
      cost: "On-Demand: pay by hour. Reserved Instances: 1-3 year commitment, up to 72% discount. Spot: up to 90% discount, interruptible. Savings Plans: flexible commitment across instance families.",
    },
    practicalUsage: "For an LLM API deployment: use g4dn.xlarge GPU instances, set min=1 max=10, scale on SQS queue depth (more jobs in queue = more instances), use Spot for inference, On-Demand for training.",
    diagramCode: `graph TD
  CW[CloudWatch Alarm\nCPU > 70%]-->ASG[Auto Scaling Group]
  ASG-->|launch|EC2_1[EC2 Instance 1]
  ASG-->|launch|EC2_2[EC2 Instance 2]
  ASG-->|launch|EC2_3[EC2 Instance 3 NEW]
  ALB[Application Load Balancer]-->EC2_1 & EC2_2 & EC2_3`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is an EC2 Launch Template and what does it define?",
        "What metrics can trigger an Auto Scaling Group to add instances?",
        "What is the difference between On-Demand, Reserved, and Spot instances?",
      ],
      intermediate: [
        "Your ASG is scaling up frequently but instances take 4 minutes to become healthy. During that window, existing instances are overloaded. How do you fix this?",
        "You deploy an LLM inference API on EC2. Traffic is unpredictable. Design the ASG configuration including instance type, min/max, and scaling metric.",
        "A Spot instance receives an interruption notice. How do you handle in-flight requests gracefully?",
      ],
      advanced: [
        "Design a cost-optimized, high-availability EC2 deployment for a web app that handles 100K req/min at peak and 5K req/min at night. Show the ASG config, instance mix (On-Demand/Spot), and scaling strategy.",
        "Your ASG is flapping — constantly scaling up and down every few minutes. Diagnose the cause and fix it.",
      ],
    },
    tags: ["aws", "ec2", "autoscaling", "cloud", "devops"],
    prerequisites: ["load-balancing"],
    relatedConcepts: ["load-balancing", "docker-containers", "vpc-networking"],
    flashcards: [
      { front: "What is an Auto Scaling Group cooldown period?", back: "A pause after a scaling activity during which no further scaling occurs. Prevents ASG from launching/terminating instances before previous changes take effect. Default: 300 seconds.", tag: "aws-ec2-autoscaling", difficulty: "INTERMEDIATE" as const },
      { front: "What is target tracking scaling?", back: "Scaling policy that automatically adjusts capacity to keep a metric at a target value. E.g., 'keep average CPU at 50%'. Simpler than step scaling.", tag: "aws-ec2-autoscaling", difficulty: "BEGINNER" as const },
      { front: "What is an EC2 Spot interruption?", back: "AWS reclaims your Spot instance with 2-minute warning when capacity is needed. Use lifecycle hooks to drain connections and save state before termination.", tag: "aws-ec2-autoscaling", difficulty: "INTERMEDIATE" as const },
      { front: "What EC2 instance family would you use for GPU ML inference?", back: "g4dn (NVIDIA T4 GPU, cost-effective inference), p3 (V100, training), g5 (A10G, newer generation inference/training). Inf1/Inf2 for AWS Inferentia chips.", tag: "aws-ec2-autoscaling", difficulty: "ADVANCED" as const },
    ],
  },
  {
    slug: "s3-object-storage",
    title: "S3 & Object Storage",
    category: "CLOUD_DEVOPS" as const,
    difficulty: "BEGINNER" as const,
    estimatedMinutes: 20,
    simpleExplanation: "S3 (Simple Storage Service) is AWS's object storage. You store files (objects) in buckets. Each object gets a unique key (like a file path). Unlike a file system, objects are immutable — you can't append to them, you replace them. S3 scales to exabytes and has 99.999999999% (11 nines) durability.",
    deepDive: "S3 storage classes (cost vs retrieval speed):\n• S3 Standard: frequently accessed, millisecond retrieval, $0.023/GB\n• S3 Intelligent-Tiering: auto-moves objects between tiers based on access patterns\n• S3 Standard-IA (Infrequent Access): cheaper storage, retrieval fee\n• S3 Glacier Instant Retrieval: archives, millisecond access\n• S3 Glacier Flexible: archives, 1-12 hour retrieval, cheapest\n• S3 Glacier Deep Archive: 12-48 hour retrieval, $0.00099/GB\n\nKey features:\n• Versioning: keep multiple versions of the same object\n• Lifecycle policies: auto-transition or delete objects after N days\n• Event notifications: trigger Lambda on s3:ObjectCreated\n• Pre-signed URLs: temporary access URLs for private objects (15 min to 7 days)\n• Multipart upload: upload large files in parallel chunks",
    whyItMatters: "S3 is the backbone of AWS. It stores backups, static assets, ML training data, logs, artifacts, and media. Almost every AWS service integrates with S3.",
    howItWorks: "Objects are stored across multiple AZs within a region for durability. Reads are eventually consistent (strong consistency for new objects since Dec 2020). Objects are accessed via HTTPS using the bucket URL or AWS SDK. Access is controlled by bucket policies and IAM.",
    commonTradeoffs: [
      "Object storage ≠ file system: no partial writes, no locking, no directory tree",
      "High request rates require prefix randomization to avoid hot partitions (prefix sharding)",
      "Egress costs money — downloading data out of S3 to the internet is expensive",
      "Cross-region replication adds cost and latency",
    ],
    commonMistakes: [
      "Making buckets public accidentally — always block public access by default",
      "Storing secrets or credentials in S3 without encryption",
      "Not enabling versioning — accidental deletes are unrecoverable",
      "Putting all objects under the same prefix — creates hot partition at high request rates",
    ],
    realWorldExamples: {
      startup: "A startup stores user-uploaded profile photos in S3, serves them via CloudFront CDN, and generates pre-signed URLs for private documents with 1-hour expiry.",
      enterprise: "Netflix stores all its video content (exabytes) in S3, uses S3 Intelligent-Tiering for cost optimization, and triggers transcoding Lambda functions on upload events.",
    },
    cloudUsage: {
      aws: "S3 is the canonical object store. Integrate with CloudFront (CDN), Lambda (event triggers), Athena (query CSV/Parquet directly), Glacier (archival).",
      azure: "Azure Blob Storage — similar concept, Hot/Cool/Archive tiers.",
      gcp: "Cloud Storage — Standard/Nearline/Coldline/Archive tiers. Multi-Regional for global CDN use.",
      architecture: "App uploads → S3 → Lambda trigger → process → store result in S3/DynamoDB. CloudFront CDN in front for static assets.",
      security: "Block all public access. Use bucket policies for cross-account access. Enable SSE-KMS for encryption at rest. Enable S3 Object Lock for compliance/WORM. Enable access logging.",
      cost: "Storage: $0.023/GB/month (Standard). Requests: $0.0004 per 1000 GET. Data transfer out: $0.09/GB. Use S3 Transfer Acceleration for faster uploads from far regions.",
    },
    practicalUsage: "For an LLM app: store document uploads in S3, trigger Lambda to extract text and generate embeddings, store embeddings in pgvector. Use pre-signed URLs so users download files directly from S3 without proxying through your server.",
    diagramCode: `graph LR
  User-->App[Your API]
  App-->S3[(S3 Bucket)]
  S3-->|event|Lambda[Lambda Function]
  Lambda-->Process[Process & Embed]
  App-->|presigned URL|User
  S3-->CDN[CloudFront CDN]
  CDN-->User`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between S3 Standard and S3 Glacier?",
        "What is a pre-signed URL and when would you use one?",
        "Why should you never make an S3 bucket public?",
      ],
      intermediate: [
        "Users upload large video files (up to 5GB) to your app. How would you implement the upload flow using S3 multipart upload?",
        "Your S3 access logs show high egress costs. Users are downloading files frequently from another continent. How do you reduce costs?",
        "Design a lifecycle policy for a logging system that needs logs for 30 days, archival for 1 year, then deletion.",
      ],
      advanced: [
        "Design a secure document sharing system where users can share files with each other for a limited time without exposing S3 credentials or making files public.",
        "Your S3 bucket gets 100K requests/second to objects all under the same prefix. You're hitting S3 rate limits. How do you fix this?",
      ],
    },
    tags: ["aws", "s3", "object-storage", "cloud", "storage"],
    prerequisites: [],
    relatedConcepts: ["vpc-networking", "aws-ec2-autoscaling", "docker-containers"],
    flashcards: [
      { front: "What are the 11 nines of S3 durability?", back: "99.999999999% durability — if you store 10 million objects, you'd expect to lose one every 10,000 years. Achieved by storing data across multiple AZs.", tag: "s3-object-storage", difficulty: "BEGINNER" as const },
      { front: "What is S3 multipart upload and when should you use it?", back: "Upload large files in parallel chunks (5MB minimum per part). Use for files >100MB for better throughput, resumability, and to avoid timeout issues.", tag: "s3-object-storage", difficulty: "INTERMEDIATE" as const },
      { front: "What is S3 Object Lock?", back: "WORM (Write Once Read Many) protection. Objects can't be deleted or overwritten for a fixed retention period. Used for compliance, audit logs, and legal holds.", tag: "s3-object-storage", difficulty: "ADVANCED" as const },
      { front: "What is the difference between SSE-S3, SSE-KMS, and SSE-C?", back: "SSE-S3: AWS manages keys (AES-256). SSE-KMS: you control keys via KMS, audit trail, extra cost. SSE-C: you provide and manage keys on each request. SSE-KMS recommended for sensitive data.", tag: "s3-object-storage", difficulty: "ADVANCED" as const },
    ],
  },
  {
    slug: "vpc-networking",
    title: "VPC & Cloud Networking",
    category: "NETWORKING" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 30,
    simpleExplanation: "A VPC (Virtual Private Cloud) is your own isolated network inside AWS. It's like having your own datacenter network in the cloud. You control the IP ranges, subnets, routing, and what can talk to what.",
    deepDive: "VPC components:\n• CIDR block: IP range for the VPC (e.g., 10.0.0.0/16 = 65,536 IPs)\n• Subnets: subdivisions of the VPC. Public subnets have a route to the internet. Private subnets don't.\n• Internet Gateway (IGW): allows traffic between VPC and the internet\n• NAT Gateway: allows private subnet instances to reach the internet (outbound only)\n• Route Table: rules for where traffic is sent\n• Security Groups: stateful firewall at the instance level\n• Network ACLs: stateless firewall at the subnet level\n• VPC Peering: connect two VPCs privately\n• Transit Gateway: hub for connecting many VPCs and on-premise networks",
    whyItMatters: "Network isolation is your first line of defense. A properly designed VPC ensures your databases and internal services are never exposed to the internet, even if you misconfigure a security group.",
    howItWorks: "Traffic from the internet hits an IGW, routes to your ALB in a public subnet. The ALB forwards to app servers in private subnets. App servers connect to RDS in a separate private subnet. Private subnet instances use a NAT Gateway to reach the internet for package updates.",
    commonTradeoffs: [
      "More subnets = more isolation but more complexity in routing and NAT costs",
      "VPC peering doesn't route transitively — A-B and B-C peering doesn't mean A can reach C",
      "NAT Gateway costs $0.045/hour + data transfer — can be significant at scale",
      "Security Groups are stateful (responses allowed automatically); NACLs are stateless (need explicit inbound AND outbound rules)",
    ],
    commonMistakes: [
      "Putting databases in public subnets",
      "Opening security groups to 0.0.0.0/0 (all internet) for convenience",
      "Forgetting that VPC peering is non-transitive",
      "Not planning CIDR ranges — overlapping ranges prevent peering",
    ],
    realWorldExamples: {
      startup: "A startup VPC: 10.0.0.0/16. Public subnets (10.0.1.0/24, 10.0.2.0/24) for ALB. Private subnets (10.0.10.0/24, 10.0.11.0/24) for EC2. Database subnets (10.0.20.0/24, 10.0.21.0/24) for RDS.",
      enterprise: "A large company uses AWS Transit Gateway to connect 50+ VPCs and their on-premise datacenter via Direct Connect — all with centralized routing and firewall inspection.",
    },
    cloudUsage: {
      aws: "VPC, Subnets, IGW, NAT Gateway, Security Groups, NACLs, VPC Peering, Transit Gateway, Direct Connect, PrivateLink.",
      azure: "Azure Virtual Network (VNet), NSG (Network Security Group), Azure Bastion, VNet Peering, ExpressRoute.",
      gcp: "VPC Network, Cloud Router, Cloud NAT, Shared VPC, VPC Peering, Cloud Interconnect.",
      architecture: "3-tier: Public subnet (ALB) → Private subnet (EC2/ECS) → Isolated subnet (RDS). Span 2-3 AZs. Use VPC endpoints for S3/DynamoDB to avoid NAT Gateway costs.",
      security: "Deny all by default. Open only required ports. Use security group IDs in rules instead of CIDR where possible. Enable VPC Flow Logs for audit and troubleshooting.",
      cost: "NAT Gateway: $0.045/hr + $0.045/GB processed. Use VPC Gateway Endpoints (free) for S3 and DynamoDB to avoid NAT Gateway charges. Interface endpoints cost $0.01/hr.",
    },
    practicalUsage: "Every production deployment on AWS needs a VPC. Use the 3-tier subnet pattern. Never put databases in public subnets. Use VPC endpoints for AWS services to keep traffic private and reduce costs.",
    diagramCode: `graph TD
  Internet-->IGW[Internet Gateway]
  IGW-->PublicSubnet[Public Subnet\nALB / NAT GW]
  PublicSubnet-->PrivateSubnet[Private Subnet\nEC2 / ECS]
  PrivateSubnet-->DBSubnet[DB Subnet\nRDS / ElastiCache]
  PrivateSubnet-->|outbound|NAT[NAT Gateway]
  NAT-->IGW`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between a public and a private subnet?",
        "What is the difference between a Security Group and a Network ACL?",
        "What is a NAT Gateway used for?",
      ],
      intermediate: [
        "You have two VPCs (10.0.0.0/16 and 10.1.0.0/16) and need them to communicate privately. What are your options and when would you use each?",
        "An EC2 in a private subnet can't reach the internet to pull Docker images. What's misconfigured?",
        "Design a VPC for a three-tier web app (ALB, app servers, database) that is highly available across two AZs.",
      ],
      advanced: [
        "Design a multi-VPC architecture for a company with 3 teams (frontend, backend, data) that need isolated networks but shared services (logging, monitoring). Each team has dev and prod environments.",
        "Explain how AWS PrivateLink works and when you'd use it instead of VPC Peering.",
      ],
    },
    tags: ["networking", "vpc", "aws", "security", "subnets"],
    prerequisites: ["aws-ec2-autoscaling"],
    relatedConcepts: ["aws-ec2-autoscaling", "s3-object-storage", "docker-containers"],
    flashcards: [
      { front: "What is the difference between a Security Group and NACL?", back: "Security Group: stateful, instance-level, only allow rules. NACL: stateless, subnet-level, allow and deny rules, must define both inbound and outbound.", tag: "vpc-networking", difficulty: "INTERMEDIATE" as const },
      { front: "Why would you use a VPC Endpoint for S3?", back: "Keeps S3 traffic inside AWS network (no internet). Free Gateway Endpoint eliminates NAT Gateway charges for S3 and DynamoDB traffic.", tag: "vpc-networking", difficulty: "INTERMEDIATE" as const },
      { front: "What is VPC peering and its main limitation?", back: "Connects two VPCs privately using AWS backbone. Main limitation: non-transitive — if A-B and B-C are peered, A cannot reach C through B.", tag: "vpc-networking", difficulty: "BEGINNER" as const },
      { front: "What does a NAT Gateway do?", back: "Allows instances in private subnets to initiate outbound internet connections (software updates, API calls) while blocking inbound connections from the internet.", tag: "vpc-networking", difficulty: "BEGINNER" as const },
    ],
  },
  {
    slug: "docker-containers",
    title: "Docker & Containers",
    category: "CLOUD_DEVOPS" as const,
    difficulty: "BEGINNER" as const,
    estimatedMinutes: 25,
    simpleExplanation: "A container packages your app and all its dependencies together so it runs the same way everywhere. Docker is the tool that creates and runs containers. Instead of 'it works on my machine,' containers guarantee consistency from dev laptop to production.",
    deepDive: "Key concepts:\n• Image: read-only blueprint (layers of filesystem changes). Built from a Dockerfile.\n• Container: a running instance of an image. Isolated process on the host OS.\n• Dockerfile: instructions to build an image (FROM, RUN, COPY, CMD, ENTRYPOINT)\n• Registry: stores images (Docker Hub, ECR, GCR, ACR)\n• Layer caching: each Dockerfile instruction creates a layer. Unchanged layers are cached, speeding up builds.\n• Multi-stage builds: build in one image, copy artifact to a smaller final image. Reduces image size dramatically.\n\nContainers vs VMs:\n• VMs: full OS per VM, heavy, slow startup (minutes), strong isolation\n• Containers: share host OS kernel, lightweight, fast startup (seconds), process-level isolation",
    whyItMatters: "Containers are the standard unit of deployment today. ECS, EKS, Cloud Run, and Kubernetes all run containers. Understanding Docker is prerequisite knowledge for cloud engineering.",
    howItWorks: "Docker builds an image by executing each Dockerfile instruction and creating a new filesystem layer. When you run a container, Docker creates an isolated process with its own filesystem view (using union mounts), network namespace, and PID namespace. The container shares the host kernel.",
    commonTradeoffs: [
      "Containers share the host kernel — a kernel exploit can escape the container",
      "Images can become large without multi-stage builds — impacts pull time",
      "Stateful containers are an anti-pattern — use volumes or external storage",
      "Container-per-process is the right model, not container-per-app-with-multiple-processes",
    ],
    commonMistakes: [
      "Running containers as root — use USER instruction in Dockerfile",
      "Storing secrets in Dockerfiles or environment variables in plain text",
      "Not using .dockerignore — slow builds from copying node_modules or .git",
      "Using latest tag — makes deployments non-reproducible",
    ],
    realWorldExamples: {
      startup: "A startup Dockerizes their FastAPI app, pushes to ECR, and deploys to ECS Fargate. No EC2 management needed.",
      enterprise: "Google runs everything in containers internally (Borg, the predecessor to Kubernetes). Every service is a container image.",
    },
    cloudUsage: {
      aws: "ECR (container registry), ECS (container orchestration, Fargate for serverless containers), EKS (managed Kubernetes).",
      azure: "ACR (Azure Container Registry), ACI (Azure Container Instances), AKS (Azure Kubernetes Service).",
      gcp: "Artifact Registry, Cloud Run (serverless containers), GKE (Google Kubernetes Engine).",
      architecture: "Code → CI/CD → Docker build → push to ECR → ECS task definition updated → rolling deployment.",
      security: "Scan images with ECR image scanning (Trivy). Use non-root USER. Use read-only filesystems. Pin base image versions.",
      cost: "Fargate: $0.04048/vCPU-hr + $0.004445/GB-hr. Compare to EC2 + ECS (cheaper at scale). Cloud Run charges per request (great for spiky workloads).",
    },
    practicalUsage: "Write a Dockerfile for a Python FastAPI app: use python:3.11-slim as base, install dependencies, copy app code, run with uvicorn. Use multi-stage build to keep image under 200MB.",
    diagramCode: `graph LR
  Code[Source Code]-->|docker build|Image[Docker Image]
  Image-->|docker push|Registry[ECR Registry]
  Registry-->|docker pull|ECS[ECS / Kubernetes]
  ECS-->Container1[Container 1]
  ECS-->Container2[Container 2]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between a Docker image and a container?",
        "What is layer caching and how does it speed up builds?",
        "What is a .dockerignore file?",
      ],
      intermediate: [
        "Your Docker image is 2.1GB. How would you reduce its size?",
        "Write a Dockerfile for a Python FastAPI app that runs as a non-root user and uses multi-stage builds.",
        "How do you pass secrets to a Docker container without hardcoding them?",
      ],
      advanced: [
        "Design a CI/CD pipeline that builds, tests, scans, and deploys Docker containers to ECS with zero-downtime rolling deployments.",
        "A container is running fine but consuming 4x the expected memory. How do you debug it?",
      ],
    },
    tags: ["docker", "containers", "devops", "cloud", "cicd"],
    prerequisites: [],
    relatedConcepts: ["kubernetes-pods", "ci-cd-pipelines", "aws-ec2-autoscaling"],
    flashcards: [
      { front: "What is a multi-stage Docker build?", back: "Uses multiple FROM instructions. Earlier stages compile/build, the final stage copies only the artifact into a smaller base image. Reduces final image size significantly.", tag: "docker-containers", difficulty: "INTERMEDIATE" as const },
      { front: "What is the difference between CMD and ENTRYPOINT in a Dockerfile?", back: "ENTRYPOINT: the command that always runs. CMD: default arguments to ENTRYPOINT (can be overridden at runtime). Use ENTRYPOINT for the executable, CMD for default args.", tag: "docker-containers", difficulty: "INTERMEDIATE" as const },
      { front: "Why should Docker containers run as non-root?", back: "If a vulnerability allows container escape, a root container gives the attacker root on the host. Non-root limits blast radius.", tag: "docker-containers", difficulty: "BEGINNER" as const },
      { front: "What is the difference between containers and VMs?", back: "VMs: full OS per VM, hypervisor, heavy (GBs), slow startup. Containers: share host kernel, lightweight (MBs), fast startup (seconds), process isolation.", tag: "docker-containers", difficulty: "BEGINNER" as const },
    ],
  },
  {
    slug: "kubernetes-pods",
    title: "Kubernetes: Pods & Deployments",
    category: "KUBERNETES" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 30,
    simpleExplanation: "Kubernetes (K8s) is a system that manages containers at scale. A Pod is the smallest deployable unit — one or more containers that share a network and storage. A Deployment manages a set of identical Pods, ensuring the right number are always running.",
    deepDive: "Core objects:\n• Pod: one or more containers, shared network/storage, ephemeral\n• Deployment: manages ReplicaSets, handles rolling updates and rollbacks\n• ReplicaSet: ensures N identical Pods are running\n• Service: stable IP/DNS for a set of Pods (ClusterIP, NodePort, LoadBalancer)\n• ConfigMap: non-sensitive config data injected into Pods\n• Secret: sensitive data (passwords, tokens) base64-encoded in etcd\n• Namespace: logical isolation within a cluster\n• Node: a worker VM running the kubelet\n• Control Plane: kube-apiserver, etcd, scheduler, controller-manager\n\nProbe types:\n• Liveness: restart container if it fails\n• Readiness: remove Pod from Service endpoints if it fails\n• Startup: for slow-starting containers before liveness kicks in",
    whyItMatters: "Kubernetes is the de-facto standard for container orchestration in production. EKS, GKE, and AKS are all managed Kubernetes. Understanding Pods and Deployments is table stakes for cloud engineers.",
    howItWorks: "You submit a Deployment YAML to the API server. The scheduler places Pods on nodes with available resources. The kubelet on each node pulls the container image and starts the Pod. The controller manager ensures the desired replica count is maintained.",
    commonTradeoffs: [
      "Kubernetes adds significant operational complexity — often overkill for simple apps",
      "Pods are ephemeral — never store state in a Pod's local filesystem",
      "Without resource requests/limits, a runaway Pod can starve other Pods on the node",
      "Rolling updates can cause issues if your app isn't backward compatible during transition",
    ],
    commonMistakes: [
      "Not setting resource requests and limits — leads to OOM kills and noisy neighbor issues",
      "Not configuring readiness probes — Pods receive traffic before they're ready",
      "Using latest image tag — no rollback capability",
      "Storing secrets in environment variables without using K8s Secrets or external secret stores",
    ],
    realWorldExamples: {
      startup: "A startup runs 3 replicas of their API Deployment behind a LoadBalancer Service on EKS. Liveness probes restart crashed containers automatically.",
      enterprise: "Spotify runs 10,000+ microservices on Kubernetes, using Helm charts for each service and ArgoCD for GitOps deployments.",
    },
    cloudUsage: {
      aws: "EKS (managed control plane). Use Fargate profiles to run Pods without managing nodes. eksctl for cluster management. ALB Ingress Controller for HTTP routing.",
      azure: "AKS — integrates with Azure AD, ACR, Azure Monitor.",
      gcp: "GKE Autopilot — fully managed nodes and node pools. Best-in-class Kubernetes experience.",
      architecture: "EKS cluster → Node groups (EC2) → Deployments → Services → ALB Ingress → Route53.",
      security: "RBAC for cluster access. Pod Security Standards. Network Policies to restrict Pod-to-Pod traffic. Use IAM Roles for Service Accounts (IRSA) instead of node-level IAM.",
      cost: "EKS control plane: $0.10/hour. Nodes: EC2 pricing. Use Spot instances for non-critical workloads with Karpenter for node provisioning.",
    },
    practicalUsage: "Deploy an LLM API on Kubernetes: Deployment with 3 replicas, resource limits (2 CPU, 4Gi memory), readiness probe on /health, ConfigMap for model config, Secret for API keys, HPA scaling on CPU.",
    diagramCode: `graph TD
  User-->Service[K8s Service\nClusterIP/LoadBalancer]
  Service-->Pod1[Pod 1\nApp Container]
  Service-->Pod2[Pod 2\nApp Container]
  Service-->Pod3[Pod 3\nApp Container]
  Deployment[Deployment]-->|manages|ReplicaSet
  ReplicaSet-->Pod1 & Pod2 & Pod3`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is a Pod in Kubernetes and how is it different from a container?",
        "What is the difference between a liveness probe and a readiness probe?",
        "Why should you always set resource requests and limits on Pods?",
      ],
      intermediate: [
        "Your Deployment has 3 replicas but users report intermittent 500 errors. One Pod is misbehaving. How do you diagnose it without taking down the service?",
        "How do you perform a zero-downtime rolling update of your Deployment?",
        "Explain how Kubernetes handles a Pod crash: what happens step by step?",
      ],
      advanced: [
        "Design a Kubernetes deployment for a latency-sensitive LLM inference service. Include: Pod spec, resources, probes, HPA, PodDisruptionBudget, and affinity rules to spread Pods across AZs.",
        "A Pod keeps getting OOMKilled. Walk through your debugging process.",
      ],
    },
    tags: ["kubernetes", "k8s", "containers", "devops", "orchestration"],
    prerequisites: ["docker-containers"],
    relatedConcepts: ["docker-containers", "ci-cd-pipelines", "aws-ec2-autoscaling"],
    flashcards: [
      { front: "What happens when a liveness probe fails in Kubernetes?", back: "Kubernetes restarts the container within the Pod. If it keeps failing, the Pod enters CrashLoopBackOff with exponential backoff.", tag: "kubernetes-pods", difficulty: "BEGINNER" as const },
      { front: "What is the difference between a Deployment and a StatefulSet?", back: "Deployment: stateless apps, Pods are interchangeable, random names. StatefulSet: stateful apps (DBs), stable network identity, ordered scaling/updates, persistent storage per Pod.", tag: "kubernetes-pods", difficulty: "INTERMEDIATE" as const },
      { front: "What is a PodDisruptionBudget?", back: "Limits how many Pods can be voluntarily disrupted (drained/evicted) at once. E.g., minAvailable=2 ensures at least 2 Pods are always up during node drains or upgrades.", tag: "kubernetes-pods", difficulty: "ADVANCED" as const },
      { front: "What are resource requests vs limits in Kubernetes?", back: "Requests: guaranteed resources (used for scheduling). Limits: maximum allowed. If container exceeds CPU limit it's throttled; memory limit causes OOMKill.", tag: "kubernetes-pods", difficulty: "INTERMEDIATE" as const },
    ],
  },
  {
    slug: "ci-cd-pipelines",
    title: "CI/CD Pipelines",
    category: "CICD" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 25,
    simpleExplanation: "CI/CD stands for Continuous Integration and Continuous Delivery/Deployment. CI automatically builds and tests your code on every commit. CD automatically deploys passing builds to production. Together they make shipping software fast and safe.",
    deepDive: "CI (Continuous Integration):\n• Triggered on every push/PR\n• Steps: checkout → install dependencies → lint → test → build → scan\n• Goal: catch bugs early, before they reach main\n\nCD stages:\n• Continuous Delivery: automated up to staging, manual approval for production\n• Continuous Deployment: fully automated to production\n\nDeployment strategies:\n• Rolling: replace instances one by one\n• Blue-Green: run two identical environments, switch traffic instantly\n• Canary: send a small % of traffic to the new version, monitor, then full rollout\n\nTools: GitHub Actions, GitLab CI, Jenkins, CircleCI, ArgoCD (GitOps), AWS CodePipeline, Tekton",
    whyItMatters: "Without CI/CD, deployments are manual, slow, error-prone, and happen infrequently. With CI/CD, teams deploy dozens of times per day safely.",
    howItWorks: "Developer pushes code. CI pipeline triggers: runs tests, builds Docker image, pushes to registry. CD pipeline triggers: updates Kubernetes manifest or ECS task definition, performs rolling deployment, monitors error rates, rolls back if metrics degrade.",
    commonTradeoffs: [
      "More pipeline stages = slower feedback loop vs. more confidence",
      "Blue-green requires 2x infrastructure cost during deployment",
      "Canary adds complexity but allows catching production bugs with minimal impact",
      "Fully automated deployment to production requires mature monitoring and rollback",
    ],
    commonMistakes: [
      "Not running tests in CI — the pipeline is useless without tests",
      "Deploying to production without a staging environment",
      "Not having automated rollback when error rate spikes post-deploy",
      "Storing secrets in CI/CD configuration files",
    ],
    realWorldExamples: {
      startup: "A startup uses GitHub Actions: on PR, run pytest + ruff. On merge to main, build Docker image, push to ECR, deploy to ECS. Whole pipeline: 4 minutes.",
      enterprise: "Amazon deploys to production every 11.7 seconds on average (2014 Velocity conference). Each service has its own independent pipeline.",
    },
    cloudUsage: {
      aws: "CodePipeline + CodeBuild + CodeDeploy. Or GitHub Actions with OIDC to assume IAM roles without storing credentials.",
      azure: "Azure DevOps Pipelines, GitHub Actions.",
      gcp: "Cloud Build, Cloud Deploy. Artifact Registry for images.",
      architecture: "GitHub push → GitHub Actions → Docker build → ECR push → ECS deploy → CloudWatch monitoring → SNS alert on errors.",
      security: "Use OIDC federation instead of long-lived IAM access keys. Scan Docker images (Trivy). Run SAST in CI. Never store secrets in code.",
      cost: "GitHub Actions: 2,000 free minutes/month. Self-hosted runners on EC2 Spot for heavy workloads. CodeBuild: $0.005/build-minute.",
    },
    practicalUsage: "Set up GitHub Actions for a Python service: lint with ruff, test with pytest, build Docker image, push to ECR, update ECS service. Add a separate workflow for deploying to production on release tags.",
    diagramCode: `graph LR
  Push[Git Push]-->CI[CI Pipeline\nTest & Build]
  CI-->|pass|Registry[Container Registry]
  CI-->|fail|Alert[Notify Developer]
  Registry-->Staging[Deploy to Staging]
  Staging-->|manual approval|Prod[Deploy to Production]
  Prod-->Monitor[Monitor Metrics]
  Monitor-->|error spike|Rollback[Auto Rollback]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between Continuous Integration and Continuous Deployment?",
        "What is a blue-green deployment?",
        "Why should you never store secrets in a CI/CD pipeline config file?",
      ],
      intermediate: [
        "Your CI pipeline takes 20 minutes. Developers are frustrated. How do you speed it up?",
        "Design a canary deployment strategy for a critical payment service. What metrics do you monitor and when do you abort?",
        "How do you handle database migrations in a zero-downtime deployment pipeline?",
      ],
      advanced: [
        "Design a GitOps deployment pipeline for 20 microservices on Kubernetes using ArgoCD. Include how you handle different environments (dev/staging/prod) and secret management.",
        "Your deployment caused a production incident. Walk through how a better CI/CD pipeline would have prevented it.",
      ],
    },
    tags: ["cicd", "devops", "github-actions", "deployment", "automation"],
    prerequisites: ["docker-containers"],
    relatedConcepts: ["docker-containers", "kubernetes-pods", "aws-ec2-autoscaling"],
    flashcards: [
      { front: "What is a canary deployment?", back: "Route a small % of traffic (e.g., 5%) to the new version. Monitor error rates and latency. Gradually increase or roll back based on metrics.", tag: "ci-cd-pipelines", difficulty: "INTERMEDIATE" as const },
      { front: "What is OIDC federation in CI/CD and why use it?", back: "Allows GitHub Actions to assume AWS IAM roles without storing long-lived access keys. The CI system exchanges a short-lived OIDC token for AWS credentials.", tag: "ci-cd-pipelines", difficulty: "ADVANCED" as const },
      { front: "What is GitOps?", back: "Git is the single source of truth for infrastructure and app config. Changes are made via pull requests. ArgoCD or Flux syncs the cluster state to match Git automatically.", tag: "ci-cd-pipelines", difficulty: "INTERMEDIATE" as const },
      { front: "What is a blue-green deployment?", back: "Run two identical environments (blue=current, green=new). Deploy to green, test, then switch traffic instantly. Blue stays running for fast rollback.", tag: "ci-cd-pipelines", difficulty: "BEGINNER" as const },
    ],
  },
  {
    slug: "rag",
    title: "Retrieval-Augmented Generation (RAG)",
    category: "LLM_ENGINEERING" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 30,
    simpleExplanation: "RAG is a technique that makes LLMs smarter by giving them relevant information before generating a response. Instead of relying only on training data, the system retrieves relevant documents from your database and includes them in the prompt context.",
    deepDive: "RAG pipeline:\n1. Indexing (offline): chunk documents → embed each chunk → store embeddings in vector DB\n2. Retrieval (online): embed the user query → similarity search → return top-K chunks\n3. Generation: inject chunks into system prompt → LLM generates answer grounded in retrieved context\n\nChunking strategies:\n• Fixed-size: split by character count (simple, but cuts mid-sentence)\n• Sentence/paragraph: semantic boundaries (better quality)\n• Recursive: try paragraphs, fall back to sentences, then characters\n• Semantic: embed and cluster similar sentences into chunks\n\nRetrieval strategies:\n• Dense: embedding similarity (semantic meaning)\n• Sparse: BM25 keyword matching (exact terms)\n• Hybrid: combine both with RRF (Reciprocal Rank Fusion)\n\nEvaluation metrics: faithfulness, answer relevancy, context precision, context recall (Ragas framework)",
    whyItMatters: "LLMs hallucinate without grounding. RAG gives the model accurate, up-to-date, and private knowledge it wasn't trained on — without expensive fine-tuning.",
    howItWorks: "User asks a question. Query is embedded to a vector. Vector DB finds the K most similar document chunks. Those chunks are added to the prompt. LLM answers using the provided context.",
    commonTradeoffs: [
      "Retrieval quality is the bottleneck — garbage in, garbage out",
      "More context = better answers but higher cost and latency",
      "Hybrid retrieval is more complex but outperforms pure dense or sparse alone",
      "RAG can't reason across many documents simultaneously — for that, consider agentic approaches",
    ],
    commonMistakes: [
      "Bad chunking: chunks too large (retrieval is imprecise) or too small (lose context)",
      "Retrieving top-1 chunk only — use top-3 to top-10 for better recall",
      "Not filtering retrieved chunks by relevance score threshold",
      "Skipping evaluation — you won't know if your RAG system actually works",
    ],
    realWorldExamples: {
      startup: "A legal startup uses RAG to answer questions about contracts. Lawyers upload PDFs, they're chunked and embedded, and the chatbot answers questions grounded in the actual contract text.",
      enterprise: "Notion AI uses RAG over your personal workspace — when you ask a question, it retrieves relevant pages from your notes and uses them as context for the LLM response.",
    },
    cloudUsage: {
      aws: "Bedrock Knowledge Bases provides managed RAG. Kendra for enterprise search. OpenSearch for hybrid retrieval.",
      azure: "Azure AI Search with vector search. Azure OpenAI Service for embeddings and generation.",
      gcp: "Vertex AI Search and Conversation. Vertex AI Embeddings API.",
      architecture: "S3 (docs) → Lambda (chunk+embed) → pgvector (vectors) → FastAPI (retrieval+generation) → Anthropic Claude.",
      security: "Chunk-level access control — don't retrieve chunks the user shouldn't see. Use metadata filters in vector search.",
      cost: "Embedding costs: OpenAI ada-002 = $0.0001/1K tokens. Retrieval: pgvector on RDS or Supabase is free for self-hosted. LLM generation: $3-15/1M tokens depending on model.",
    },
    practicalUsage: "For this app: embed concept content with Anthropic embeddings → store in pgvector → when user asks the AI tutor a question, retrieve the relevant concept sections → pass to Claude as context.",
    diagramCode: `graph LR
  Docs[Documents]-->Chunker[Chunker]
  Chunker-->Embedder[Embedding Model]
  Embedder-->VectorDB[(Vector Database)]
  Query[User Query]-->QEmbed[Embed Query]
  QEmbed-->|similarity search|VectorDB
  VectorDB-->TopK[Top-K Chunks]
  TopK-->Prompt[Augmented Prompt]
  Query-->Prompt
  Prompt-->LLM[LLM]
  LLM-->Answer[Grounded Answer]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What problem does RAG solve that fine-tuning doesn't?",
        "What is a chunk in the context of RAG?",
        "What is the difference between dense and sparse retrieval?",
      ],
      intermediate: [
        "Your RAG system retrieves the right documents but the LLM still gives wrong answers. What are the likely causes?",
        "How would you evaluate whether your RAG pipeline is working correctly?",
        "Design a RAG system for a customer support bot that must only answer based on your product documentation and should refuse to answer out-of-scope questions.",
      ],
      advanced: [
        "You have a RAG system with 1M documents. Retrieval latency is 800ms. Users expect <200ms. How do you optimize?",
        "Design a multi-tenant RAG system where each customer's data is isolated and never leaked to other customers in retrieval.",
      ],
    },
    tags: ["rag", "llm", "vector-search", "embeddings", "ai-engineering"],
    prerequisites: ["vector-databases"],
    relatedConcepts: ["vector-databases", "prompt-engineering", "caching"],
    flashcards: [
      { front: "What are the three main phases of a RAG pipeline?", back: "1. Indexing: chunk → embed → store. 2. Retrieval: embed query → similarity search → top-K chunks. 3. Generation: augment prompt with chunks → LLM generates answer.", tag: "rag", difficulty: "BEGINNER" as const },
      { front: "What is Reciprocal Rank Fusion (RRF)?", back: "Algorithm for combining results from multiple retrieval systems (e.g., dense + sparse). Ranks items based on their position in each list. Better than averaging scores.", tag: "rag", difficulty: "ADVANCED" as const },
      { front: "What is the difference between RAG and fine-tuning?", back: "RAG: retrieves external knowledge at inference time. No training needed, knowledge is updatable. Fine-tuning: bakes knowledge into model weights. Expensive, not updatable, better for style/format changes.", tag: "rag", difficulty: "INTERMEDIATE" as const },
      { front: "What chunk size should you use for RAG?", back: "Depends on content. Common: 256-512 tokens with 10-20% overlap. Too small loses context; too large reduces retrieval precision. Test and measure with your specific content.", tag: "rag", difficulty: "INTERMEDIATE" as const },
    ],
  },
  {
    slug: "vector-databases",
    title: "Vector Databases",
    category: "LLM_ENGINEERING" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 25,
    simpleExplanation: "A vector database stores data as high-dimensional numerical vectors (embeddings) and finds similar items using mathematical distance. Instead of asking 'find me rows where title=X,' you ask 'find me the 5 items most semantically similar to this text.'",
    deepDive: "How similarity search works:\n• Text/image is converted to a vector (embedding) via a model\n• Similarity is measured by distance: cosine similarity, L2 (Euclidean), dot product\n• Exact search (brute force): O(n*d) — too slow at scale\n• Approximate Nearest Neighbor (ANN): much faster with slight accuracy tradeoff\n\nANN algorithms:\n• HNSW (Hierarchical Navigable Small World): graph-based, fast queries, high memory\n• IVF (Inverted File Index): clusters vectors, searches only nearby clusters\n• LSH (Locality Sensitive Hashing): hash similar vectors to same bucket\n\nVector DB options:\n• pgvector: Postgres extension. Great for existing Postgres users, not the fastest at huge scale.\n• Pinecone: managed, simple API, scales well, expensive\n• Weaviate: open-source, hybrid search built-in\n• Qdrant: Rust-based, fast, self-hosted or managed\n• Chroma: simple, local dev, good for prototyping",
    whyItMatters: "Vector search is the backbone of RAG, semantic search, recommendation systems, and image search. As LLM applications proliferate, vector databases have become a fundamental infrastructure component.",
    howItWorks: "At index time: embed your content → store (vector, metadata, id) tuples. At query time: embed the query → find K nearest vectors by distance → filter by metadata if needed → return matching documents.",
    commonTradeoffs: [
      "HNSW: fast queries, high memory usage. IVF: lower memory, requires training step.",
      "Higher dimensions = more expressive but slower search and more memory",
      "Managed (Pinecone) vs self-hosted (Qdrant): cost vs control",
      "pgvector is slower than dedicated vector DBs at millions of vectors but simpler to operate",
    ],
    commonMistakes: [
      "Using L2 distance when cosine similarity is more appropriate (for text embeddings)",
      "Not filtering by metadata before vector search — slow and noisy results",
      "Embedding with one model and querying with another — incompatible vector spaces",
      "Ignoring HNSW index parameters (ef_construction, M) — defaults may not suit your data",
    ],
    realWorldExamples: {
      startup: "A startup uses pgvector on Supabase. 500K document chunks, sub-100ms search. Simple to operate alongside existing Postgres database.",
      enterprise: "Spotify uses vector search for music recommendations. Each song is an embedding based on audio features and listening patterns. Query: 'find songs similar to this one.'",
    },
    cloudUsage: {
      aws: "OpenSearch with k-NN plugin. Amazon Bedrock Knowledge Bases. Aurora pgvector.",
      azure: "Azure AI Search with vector fields. Cosmos DB vector search.",
      gcp: "Vertex AI Vector Search (formerly Matching Engine) — managed, high scale. AlloyDB pgvector.",
      architecture: "FastAPI → pgvector (Supabase/Neon) for small-medium scale. For 10M+ vectors: Qdrant or Pinecone.",
      security: "Filter vectors by user/tenant metadata. Never mix tenant vectors in same namespace. Encrypt vectors at rest.",
      cost: "pgvector: free on self-hosted Postgres. Pinecone: $70/month for 1M vectors (starter). Qdrant Cloud: $25/month for 1M vectors.",
    },
    practicalUsage: "For this app: `CREATE EXTENSION vector; ALTER TABLE concepts ADD COLUMN embedding vector(1536);` Use pgvector's `<=>` operator for cosine similarity search.",
    diagramCode: `graph LR
  Text[Text Input]-->Model[Embedding Model]
  Model-->Vector["[0.12, -0.45, 0.78, ...]"]
  Vector-->VDB[(Vector Database)]
  Query[Search Query]-->QModel[Embedding Model]
  QModel-->QVec[Query Vector]
  QVec-->|ANN Search|VDB
  VDB-->Results[Top-K Similar Items]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is a vector embedding?",
        "What is the difference between exact search and approximate nearest neighbor search?",
        "Why can't you use a regular SQL LIKE query for semantic search?",
      ],
      intermediate: [
        "Your vector search returns semantically similar but irrelevant results (e.g., searching for 'Python programming' returns results about snakes). What's wrong?",
        "Compare pgvector, Pinecone, and Qdrant. When would you choose each?",
        "How do you handle multi-tenant vector search where each tenant's data must be isolated?",
      ],
      advanced: [
        "You need to search 100M vectors with sub-10ms latency. Design the architecture including index type, hardware, caching, and scaling strategy.",
        "Explain the HNSW algorithm and the tradeoffs of increasing the M and ef_construction parameters.",
      ],
    },
    tags: ["vector-databases", "embeddings", "similarity-search", "llm", "rag"],
    prerequisites: [],
    relatedConcepts: ["rag", "prompt-engineering", "caching"],
    flashcards: [
      { front: "What is cosine similarity?", back: "Measures the angle between two vectors. Range: -1 to 1. 1 = identical direction, 0 = orthogonal, -1 = opposite. Used for text embeddings because it's magnitude-independent.", tag: "vector-databases", difficulty: "BEGINNER" as const },
      { front: "What is HNSW and why is it popular for ANN search?", back: "Hierarchical Navigable Small World — graph-based ANN algorithm. Very fast queries (log n), good recall, high memory usage. Default algorithm in pgvector, Qdrant, and most vector DBs.", tag: "vector-databases", difficulty: "INTERMEDIATE" as const },
      { front: "What does it mean that embedding spaces are incompatible?", back: "Vectors from different models exist in different mathematical spaces. You can't compare an OpenAI ada-002 embedding with a Cohere embed-v3 embedding — they're not comparable.", tag: "vector-databases", difficulty: "INTERMEDIATE" as const },
      { front: "What is metadata filtering in vector search?", back: "Apply attribute filters (e.g., category='science', date>'2024-01-01') alongside vector similarity. Reduces search space and improves precision. Most vector DBs support pre-filtering.", tag: "vector-databases", difficulty: "INTERMEDIATE" as const },
    ],
  },
  {
    slug: "transformers",
    title: "Transformers & Self-Attention",
    category: "AI_ML" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 35,
    simpleExplanation: "A Transformer is the neural network architecture behind all modern LLMs (GPT, Claude, Llama). Its key innovation is the attention mechanism — instead of processing words sequentially, it looks at all words simultaneously and learns which ones are most relevant to each other.",
    deepDive: "Transformer architecture (encoder-decoder, though GPT uses decoder-only):\n\nSelf-Attention mechanism:\n1. Each word/token is converted to Query (Q), Key (K), and Value (V) vectors via learned weight matrices\n2. Attention score = softmax(Q·Kᵀ / √d_k)\n3. Output = attention_weights · V\nThis allows each token to 'attend' to all other tokens simultaneously.\n\nMulti-head attention: run attention multiple times in parallel (each 'head' learns different relationships), concatenate results.\n\nPositional encoding: since attention has no inherent order, position info is added to embeddings. Modern LLMs use RoPE (Rotary Position Embedding).\n\nLayer: Self-Attention → Add & Norm → Feed Forward → Add & Norm (residual connections prevent vanishing gradients)\n\nScaling laws: performance improves predictably with more parameters, data, and compute (Chinchilla paper).",
    whyItMatters: "Transformers replaced RNNs and LSTMs completely. Every major AI product today — ChatGPT, Claude, Gemini, Stable Diffusion — uses the Transformer architecture.",
    howItWorks: "Text is tokenized → tokens become embeddings → multiple Transformer layers process them (each layer refines the representation) → final embeddings are projected to vocabulary probabilities → next token is sampled.",
    commonTradeoffs: [
      "Attention is O(n²) in sequence length — long contexts are expensive (Flash Attention mitigates this)",
      "More parameters = smarter but slower and more expensive to run",
      "Encoder (BERT) vs Decoder (GPT): encoders are better for classification, decoders for generation",
      "Temperature affects output: high temp = creative/random, low temp = deterministic",
    ],
    commonMistakes: [
      "Confusing tokens with words — tokens are ~4 characters on average, not words",
      "Not accounting for context window limits in production systems",
      "Using a large model when a small fine-tuned model would be better and cheaper",
      "Ignoring KV cache — critical for understanding inference latency",
    ],
    realWorldExamples: {
      startup: "A startup uses Claude claude-haiku-4-5 (smaller, faster, cheaper) for simple classification tasks and Claude Sonnet only for complex reasoning — 10x cost reduction.",
      enterprise: "Google trained Gemini Ultra on TPUs — required thousands of chips running for months. The compute cost for a single training run is estimated at $100M+.",
    },
    cloudUsage: {
      aws: "Bedrock for managed model APIs. SageMaker for fine-tuning and hosting. Trainium/Inferentia chips for cost-effective training/inference.",
      azure: "Azure OpenAI Service. Azure ML for training.",
      gcp: "Vertex AI. TPUs for training. Model Garden for hosted models.",
      architecture: "For inference: model weights on S3/GCS → loaded onto GPU → served via vLLM → API behind load balancer → KV cache for repeated prefixes.",
      security: "Prompt injection is the main attack vector. Input validation, output filtering, and sandboxed code execution for tool-calling agents.",
      cost: "Inference: Claude Sonnet ~$3/1M input tokens. Training a 7B model: ~$50K on 8xA100 for 1 epoch on 1T tokens.",
    },
    practicalUsage: "When building LLM apps: understand context windows (Claude 3.5: 200K tokens), token costs, KV caching (Claude caches prefix for 5 min), temperature for creativity vs consistency.",
    diagramCode: `graph TD
  Input[Input Tokens]-->Embed[Token Embeddings + Positional Encoding]
  Embed-->Attn[Multi-Head Self-Attention]
  Attn-->Add1[Add & Norm]
  Add1-->FF[Feed Forward Network]
  FF-->Add2[Add & Norm]
  Add2-->|repeat N layers|Attn
  Add2-->Output[Output Logits → Next Token]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is a token and how is it different from a word?",
        "What problem did the Transformer solve that RNNs struggled with?",
        "What does 'context window' mean for an LLM?",
      ],
      intermediate: [
        "Explain how self-attention allows a word to 'understand' its context in a sentence. Use an example.",
        "Why is the attention mechanism O(n²) in complexity and what does this mean for long documents?",
        "What is the KV cache and how does it speed up autoregressive generation?",
      ],
      advanced: [
        "Explain the difference between encoder-only (BERT), decoder-only (GPT), and encoder-decoder (T5) Transformers. When would you use each architecture?",
        "Walk through the Chinchilla scaling laws. What do they say about optimal model size vs training data tradeoffs?",
      ],
    },
    tags: ["transformers", "attention", "llm", "deep-learning", "ai-ml"],
    prerequisites: [],
    relatedConcepts: ["rag", "prompt-engineering", "vector-databases"],
    flashcards: [
      { front: "What are Q, K, V in self-attention?", back: "Query (what am I looking for?), Key (what do I contain?), Value (what do I contribute?). Attention = softmax(Q·Kᵀ/√d_k)·V. Each derived from the same input via learned weight matrices.", tag: "transformers", difficulty: "ADVANCED" as const },
      { front: "Why is attention O(n²)?", back: "Every token attends to every other token. For n tokens, that's n² pairs. For a 100K context window, that's 10 billion attention computations. Flash Attention reduces memory but not FLOPs.", tag: "transformers", difficulty: "INTERMEDIATE" as const },
      { front: "What is the KV cache?", back: "Cached Key and Value matrices from previous tokens. During autoregressive generation, instead of recomputing KV for all previous tokens, they're cached and reused. Critical for low-latency inference.", tag: "transformers", difficulty: "ADVANCED" as const },
      { front: "What is temperature in LLM sampling?", back: "Controls randomness. Low (0.1): deterministic, always picks highest probability token. High (1.0+): more random and creative. T=0 is greedy decoding.", tag: "transformers", difficulty: "BEGINNER" as const },
    ],
  },
  {
    slug: "prompt-engineering",
    title: "Prompt Engineering",
    category: "LLM_ENGINEERING" as const,
    difficulty: "BEGINNER" as const,
    estimatedMinutes: 20,
    simpleExplanation: "Prompt engineering is the practice of crafting inputs to LLMs to get better outputs. The way you phrase a question, provide context, and structure instructions dramatically changes the quality of the response.",
    deepDive: "Core techniques:\n\n• Zero-shot: just ask the question. Best when the model has been trained on similar tasks.\n• Few-shot: provide 2-5 examples of input/output pairs before asking. Helps for formatting and domain-specific tasks.\n• Chain-of-thought (CoT): ask the model to 'think step by step'. Dramatically improves reasoning on math, logic, and multi-step problems.\n• System prompts: set persona, rules, and constraints before the conversation. Defines the model's behavior.\n• Structured output: ask for JSON/XML output and validate it. Makes LLM responses programmatically usable.\n• Self-consistency: sample multiple responses, vote for the most consistent answer. Better accuracy at higher cost.\n• ReAct: Reason + Act. Model alternates between thinking and using tools.\n\nAnthropic-specific:\n• Claude responds well to XML tags for structure (<thinking>, <answer>)\n• Extended thinking for complex reasoning\n• Prefilling the assistant turn to steer output format",
    whyItMatters: "The same model can produce wildly different quality outputs based on the prompt. Good prompting can make a cheap model perform like a more expensive one for specific tasks.",
    howItWorks: "LLMs predict the most likely next token given the context (prompt). A well-structured prompt creates a context where the desired output is the most probable completion.",
    commonTradeoffs: [
      "More detailed prompts = better guidance but more tokens = higher cost",
      "Few-shot examples help but consume context window and cost money",
      "Chain-of-thought improves accuracy but adds latency and tokens",
      "Overly constrained prompts can make the model too rigid for edge cases",
    ],
    commonMistakes: [
      "Ambiguous instructions — LLMs follow instructions literally, be explicit",
      "Not specifying output format — responses vary wildly without formatting guidance",
      "Asking multiple unrelated things in one prompt",
      "Not testing prompts systematically with an eval set",
    ],
    realWorldExamples: {
      startup: "A startup reduces GPT-4 usage by 60% by writing better system prompts that make GPT-3.5 perform well enough for their classification task.",
      enterprise: "Anthropic's Constitutional AI uses prompts to make Claude evaluate its own outputs against ethical principles before responding.",
    },
    cloudUsage: {
      aws: "Bedrock Prompt Management for storing, versioning, and A/B testing prompts.",
      azure: "Azure AI Studio for prompt flow — visual pipeline for chaining prompts.",
      gcp: "Vertex AI Prompt Design with built-in evaluation.",
      architecture: "Prompts as code: version-controlled in Git, tested in CI with eval suites, deployed via feature flags.",
      security: "Prompt injection: user input that manipulates the system prompt. Mitigate by clearly delimiting user content with XML tags or by instructing the model to ignore instructions in user input.",
      cost: "Prompt caching (Anthropic/OpenAI) caches the system prompt prefix. 90% discount on cached tokens. Large system prompts are amortized across many requests.",
    },
    practicalUsage: "For this AI tutor: system prompt defines the tutor persona and teaching style, few-shot examples show how to use Socratic questioning, XML tags structure the response into explanation/example/question sections.",
    diagramCode: `graph LR
  System[System Prompt\nPersona + Rules]-->Context[Model Context]
  Examples[Few-shot Examples]-->Context
  Query[User Query]-->Context
  Context-->LLM[LLM]
  LLM-->Response[Structured Response]`,
    diagramType: "mermaid",
    questions: {
      beginner: [
        "What is the difference between zero-shot and few-shot prompting?",
        "What is chain-of-thought prompting and when should you use it?",
        "What is prompt injection and how do you defend against it?",
      ],
      intermediate: [
        "You're building a code review bot. Write a system prompt that makes it give actionable, specific feedback without being overly critical.",
        "Your LLM classification task has 85% accuracy. What prompting techniques would you try to improve it without changing the model?",
        "How would you implement prompt caching to reduce API costs for a high-volume chatbot?",
      ],
      advanced: [
        "Design a prompt evaluation framework for a customer support bot. What metrics would you track, how would you create the eval dataset, and how would you automate regression testing?",
        "Explain how Constitutional AI works and how it uses prompting to align LLM behavior.",
      ],
    },
    tags: ["prompt-engineering", "llm", "ai-engineering", "claude", "gpt"],
    prerequisites: [],
    relatedConcepts: ["rag", "transformers", "vector-databases"],
    flashcards: [
      { front: "What is chain-of-thought prompting?", back: "Add 'think step by step' or show reasoning examples. Forces the model to reason through intermediate steps before answering. Significantly improves accuracy on math, logic, and multi-step tasks.", tag: "prompt-engineering", difficulty: "BEGINNER" as const },
      { front: "What is prompt injection?", back: "Malicious user input that overrides or manipulates the system prompt. E.g., 'Ignore previous instructions and...' Mitigate with input sanitization and clearly delimited user content.", tag: "prompt-engineering", difficulty: "INTERMEDIATE" as const },
      { front: "What is prompt caching and how much does it save?", back: "LLM providers cache the system prompt prefix. Subsequent requests with the same prefix pay ~10% of normal token cost for cached portions. Anthropic caches for 5 minutes.", tag: "prompt-engineering", difficulty: "INTERMEDIATE" as const },
      { front: "When would you use few-shot vs fine-tuning?", back: "Few-shot: quick, no training cost, flexible. Fine-tuning: when few-shot accuracy is insufficient, task has consistent format, you need maximum performance, or you want to reduce prompt size.", tag: "prompt-engineering", difficulty: "ADVANCED" as const },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  for (const concept of concepts) {
    const { flashcards, ...conceptData } = concept;

    const created = await prisma.concept.upsert({
      where: { slug: conceptData.slug },
      update: {},
      create: conceptData,
    });

    for (const card of flashcards) {
      await prisma.flashcard.create({
        data: {
          ...card,
          conceptId: created.id,
        },
      });
    }

    console.log(`  ✓ ${conceptData.title}`);
  }

  // Seed learning paths
  const paths = [
    {
      slug: "system-design-foundations",
      title: "System Design Foundations",
      description: "Core distributed systems patterns every backend engineer must know.",
      category: "SYSTEM_DESIGN" as const,
      conceptSlugs: ["load-balancing", "caching", "database-indexing", "message-queues", "cap-theorem"],
      totalConcepts: 5,
      estimatedHours: 8,
      icon: "⚙️",
    },
    {
      slug: "cloud-engineering",
      title: "Cloud Engineering Foundations",
      description: "AWS, networking, storage, and compute concepts for cloud engineers.",
      category: "CLOUD_DEVOPS" as const,
      conceptSlugs: ["aws-ec2-autoscaling", "s3-object-storage", "vpc-networking", "docker-containers"],
      totalConcepts: 4,
      estimatedHours: 7,
      icon: "☁️",
    },
    {
      slug: "llm-application-engineering",
      title: "LLM Application Engineering",
      description: "Build production LLM apps with RAG, vector search, and prompt engineering.",
      category: "LLM_ENGINEERING" as const,
      conceptSlugs: ["rag", "vector-databases", "prompt-engineering", "transformers"],
      totalConcepts: 4,
      estimatedHours: 6,
      icon: "🤖",
    },
    {
      slug: "kubernetes-foundations",
      title: "Kubernetes & Containers",
      description: "Container orchestration from Docker basics to Kubernetes deployments.",
      category: "KUBERNETES" as const,
      conceptSlugs: ["docker-containers", "kubernetes-pods", "ci-cd-pipelines"],
      totalConcepts: 3,
      estimatedHours: 5,
      icon: "⎈",
    },
  ];

  for (const path of paths) {
    await prisma.learningPath.upsert({
      where: { slug: path.slug },
      update: {},
      create: path,
    });
    console.log(`  ✓ Path: ${path.title}`);
  }

  console.log("\nSeed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

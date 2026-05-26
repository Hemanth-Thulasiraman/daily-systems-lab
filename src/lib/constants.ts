export const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  SYSTEM_DESIGN:  { label: "System Design",   color: "text-emerald-400",  bg: "bg-emerald-400/10",  icon: "⚙️" },
  CLOUD_DEVOPS:   { label: "Cloud / DevOps",  color: "text-sky-400",      bg: "bg-sky-400/10",      icon: "☁️" },
  AI_ML:          { label: "AI / ML",          color: "text-amber-400",    bg: "bg-amber-400/10",    icon: "🧠" },
  LLM_ENGINEERING:{ label: "LLM Engineering", color: "text-purple-400",   bg: "bg-purple-400/10",   icon: "🤖" },
  DATABASES:      { label: "Databases",        color: "text-orange-400",   bg: "bg-orange-400/10",   icon: "🗄️" },
  NETWORKING:     { label: "Networking",       color: "text-cyan-400",     bg: "bg-cyan-400/10",     icon: "🌐" },
  KUBERNETES:     { label: "Kubernetes",       color: "text-blue-400",     bg: "bg-blue-400/10",     icon: "⎈" },
  CICD:           { label: "CI/CD",            color: "text-pink-400",     bg: "bg-pink-400/10",     icon: "🔄" },
};

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  BEGINNER:     { label: "Beginner",     color: "text-green-400" },
  INTERMEDIATE: { label: "Intermediate", color: "text-yellow-400" },
  ADVANCED:     { label: "Advanced",     color: "text-red-400" },
};

export const LEARNING_PATHS = [
  {
    slug: "system-design-foundations",
    title: "System Design Foundations",
    description: "Core distributed systems patterns every backend engineer must know.",
    category: "SYSTEM_DESIGN",
    conceptSlugs: ["load-balancing", "caching", "database-indexing", "message-queues", "cap-theorem"],
    totalConcepts: 5,
    estimatedHours: 8,
    icon: "⚙️",
  },
  {
    slug: "cloud-engineering",
    title: "Cloud Engineering Foundations",
    description: "AWS, networking, storage, and compute concepts for cloud engineers.",
    category: "CLOUD_DEVOPS",
    conceptSlugs: ["aws-ec2-autoscaling", "s3-object-storage", "vpc-networking", "docker-containers"],
    totalConcepts: 4,
    estimatedHours: 7,
    icon: "☁️",
  },
  {
    slug: "kubernetes-foundations",
    title: "Kubernetes & Containers",
    description: "Container orchestration from Docker basics to Kubernetes deployments.",
    category: "KUBERNETES",
    conceptSlugs: ["docker-containers", "kubernetes-pods"],
    totalConcepts: 2,
    estimatedHours: 4,
    icon: "⎈",
  },
  {
    slug: "llm-application-engineering",
    title: "LLM Application Engineering",
    description: "Build production LLM apps with RAG, vector search, and prompt engineering.",
    category: "LLM_ENGINEERING",
    conceptSlugs: ["rag", "vector-databases", "prompt-engineering"],
    totalConcepts: 3,
    estimatedHours: 5,
    icon: "🤖",
  },
  {
    slug: "ai-ml-foundations",
    title: "AI / ML Foundations",
    description: "Core machine learning concepts from supervised learning to transformers.",
    category: "AI_ML",
    conceptSlugs: ["transformers", "ci-cd-pipelines"],
    totalConcepts: 2,
    estimatedHours: 4,
    icon: "🧠",
  },
];

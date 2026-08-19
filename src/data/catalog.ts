export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: "tool" | "integration" | "template" | "guide";
  tags: string[];
  provider: string;
  mode: "general" | "hacking" | "both";
  difficulty: "beginner" | "intermediate" | "advanced";
  url?: string;
}

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "gemini-api",
    title: "Google Gemini API",
    description:
      "Multimodal large language model with support for text, images, and code generation. Ideal for general-purpose AI workflows.",
    category: "integration",
    tags: ["api", "llm", "multimodal"],
    provider: "Google",
    mode: "general",
    difficulty: "beginner",
    url: "https://ai.google.dev",
  },
  {
    id: "groq-api",
    title: "Groq Inference Engine",
    description:
      "Ultra-fast LPU-based inference for open-source models. Sub-second response times with high throughput for production workloads.",
    category: "integration",
    tags: ["api", "inference", "speed"],
    provider: "Groq",
    mode: "hacking",
    difficulty: "intermediate",
    url: "https://console.groq.com",
  },
  {
    id: "security-audit-template",
    title: "Security Audit Checklist",
    description:
      "Comprehensive penetration testing checklist covering OWASP Top 10, authentication flows, and API endpoint validation.",
    category: "template",
    tags: ["security", "owasp", "checklist"],
    provider: "Quantum AI",
    mode: "hacking",
    difficulty: "intermediate",
  },
  {
    id: "code-review-prompt",
    title: "Code Review Assistant",
    description:
      "Optimized system prompt for AI-assisted code reviews. Identifies bugs, security issues, and performance improvements.",
    category: "guide",
    tags: ["code-review", "prompt-engineering", "quality"],
    provider: "Quantum AI",
    mode: "general",
    difficulty: "beginner",
  },
  {
    id: "network-scanner",
    title: "Network Analysis Toolkit",
    description:
      "Templates and prompts for analyzing network traffic, identifying open ports, and mapping attack surfaces.",
    category: "tool",
    tags: ["network", "recon", "analysis"],
    provider: "Quantum AI",
    mode: "hacking",
    difficulty: "advanced",
  },
  {
    id: "api-builder",
    title: "REST API Builder",
    description:
      "Generate production-ready REST API scaffolding with authentication, rate limiting, and input validation built in.",
    category: "template",
    tags: ["api", "rest", "scaffold"],
    provider: "Quantum AI",
    mode: "general",
    difficulty: "intermediate",
  },
  {
    id: "vuln-scan",
    title: "Vulnerability Scanner Prompts",
    description:
      "AI-powered vulnerability assessment prompts for web applications, covering SQL injection, XSS, and SSRF.",
    category: "guide",
    tags: ["vulnerability", "scan", "web-security"],
    provider: "Quantum AI",
    mode: "hacking",
    difficulty: "advanced",
  },
  {
    id: "react-boilerplate",
    title: "React Project Starter",
    description:
      "Type-safe React template with Vite, Tailwind, and Convex. Includes auth, routing, and component library setup.",
    category: "template",
    tags: ["react", "vite", "starter"],
    provider: "Quantum AI",
    mode: "general",
    difficulty: "beginner",
  },
  {
    id: "pentest-report",
    title: "Penetration Test Report Generator",
    description:
      "Structured report template for documenting penetration test findings, severity ratings, and remediation steps.",
    category: "template",
    tags: ["pentest", "report", "documentation"],
    provider: "Quantum AI",
    mode: "hacking",
    difficulty: "advanced",
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Cookbook",
    description:
      "Collection of proven prompt patterns for reasoning, chain-of-thought, and structured output generation.",
    category: "guide",
    tags: ["prompts", "techniques", "llm"],
    provider: "Quantum AI",
    mode: "general",
    difficulty: "intermediate",
  },
  {
    id: "auth-security",
    title: "Authentication Security Guide",
    description:
      "Best practices for implementing secure authentication, including OAuth 2.0, session management, and token validation.",
    category: "guide",
    tags: ["auth", "security", "oauth"],
    provider: "Quantum AI",
    mode: "both",
    difficulty: "intermediate",
  },
  {
    id: "docker-hardening",
    title: "Docker Security Hardening",
    description:
      "Templates for securing container deployments with minimal images, non-root users, and runtime security policies.",
    category: "template",
    tags: ["docker", "containers", "security"],
    provider: "Quantum AI",
    mode: "hacking",
    difficulty: "advanced",
  },
];

export const CATEGORIES = [
  { id: "all", label: "All Items", count: CATALOG_ITEMS.length },
  {
    id: "tool",
    label: "Tools",
    count: CATALOG_ITEMS.filter((i) => i.category === "tool").length,
  },
  {
    id: "integration",
    label: "Integrations",
    count: CATALOG_ITEMS.filter((i) => i.category === "integration").length,
  },
  {
    id: "template",
    label: "Templates",
    count: CATALOG_ITEMS.filter((i) => i.category === "template").length,
  },
  {
    id: "guide",
    label: "Guides",
    count: CATALOG_ITEMS.filter((i) => i.category === "guide").length,
  },
] as const;

export const MODE_FILTERS = [
  { id: "all", label: "All Modes" },
  { id: "general", label: "General" },
  { id: "hacking", label: "Hacking" },
  { id: "both", label: "Both" },
] as const;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Shield,
  Zap,
  Globe,
  WifiOff,
  HardDrive,
  Key,
  Lock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Cpu,
  Network,
  Database,
  Terminal,
  Search,
  MessageSquare,
  User,
  Code2,
} from "lucide-react";
import { useNavigate, Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/5 via-blue-500/3 to-transparent rounded-full blur-3xl" />
      {/* Floating dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px w-px rounded-full bg-cyan-400/40"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Quantum AI" className="h-8 w-8 rounded-lg" />
          <Link to="/" className="text-sm font-semibold tracking-tight hover:text-cyan-400 transition-colors">
            Quantum AI
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground min-h-[40px]"
          >
            <User className="h-3.5 w-3.5" />
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/app")}
            className="gap-1.5 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white min-h-[40px]"
          >
            Launch
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center">
        <GridBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="space-y-7"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1 text-[11px] font-medium text-cyan-400">
                <Sparkles className="h-3 w-3" />
                Version 1.0 — Offline-Ready AI Assistant
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                Quantum AI
              </span>
              <br />
              <span className="text-foreground/80">
                Intelligence that follows you everywhere.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="max-w-xl mx-auto text-[15px] text-muted-foreground leading-relaxed"
            >
              A serious AI assistant built for developers and security
              professionals. Works offline, runs on any device, and switches
              between general reasoning and deep cybersecurity expertise on
              command.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-3"
            >
              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-7 shadow-lg shadow-cyan-500/15 transition-all"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="gap-2 border-border/50 hover:bg-muted/50 text-sm"
              >
                <Key className="h-4 w-4" />
                Sign Up
              </Button>
            </motion.div>

            {/* Platform badges */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/70"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                Web
              </span>
              <span className="h-3 w-px bg-border/50" />
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                Windows
              </span>
              <span className="h-3 w-px bg-border/50" />
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                Android
              </span>
              <span className="h-3 w-px bg-border/50" />
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                iOS
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Built for{" "}
              <span className="text-cyan-400">developers</span>, designed for
              everyone.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Every feature is crafted to work reliably — online or offline, on
              any platform, with no compromise on privacy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: WifiOff,
                title: "Offline First",
                description:
                  "Full app shell loads without a connection. Conversations persist locally. AI inference resumes automatically when you reconnect.",
                color: "text-amber-400",
                bg: "bg-amber-500/8",
              },
              {
                icon: Brain,
                title: "General Mode",
                description:
                  "Powered by Google Gemini. Handles creative work, code generation, research, and complex reasoning with multimodal support.",
                color: "text-cyan-400",
                bg: "bg-cyan-500/8",
              },
              {
                icon: Shield,
                title: "Hacking Mode",
                description:
                  "Powered by Groq's LPU for ultra-fast inference. Specialized in penetration testing, vulnerability analysis, and security research.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/8",
              },
              {
                icon: Database,
                title: "Local Storage",
                description:
                  "All conversations stay on your device via IndexedDB. No cloud sync, no analytics, no third-party tracking.",
                color: "text-blue-400",
                bg: "bg-blue-500/8",
              },
              {
                icon: Key,
                title: "Multi-Key Rotation",
                description:
                  "Load-balance across multiple API keys per mode. Higher throughput, reduced rate-limit risk, more consistent uptime.",
                color: "text-purple-400",
                bg: "bg-purple-500/8",
              },
              {
                icon: Network,
                title: "Install Anywhere",
                description:
                  "Progressive Web App — install on Android, iOS, or Windows from your browser. Works like a native app with offline access.",
                color: "text-pink-400",
                bg: "bg-pink-500/8",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-xl border border-border/30 bg-card/40 p-5 hover:border-border/50 transition-colors"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${feature.bg} mb-3.5`}
                >
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Modes Section */}
      <section className="relative z-10 py-20 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {/* General Mode */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.03] to-blue-500/[0.03] p-7"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Brain className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-cyan-400">
                    General Mode
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Powered by Google Gemini
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  "Creative writing, brainstorming, and ideation",
                  "Code generation, review, and debugging",
                  "Research synthesis and analysis",
                  "Multimodal reasoning (text, images, code)",
                  "Multiple API keys for automatic rotation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 text-cyan-400/60 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Hacking Mode */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.03] to-green-500/[0.03] p-7"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400">
                    Hacking Mode
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Powered by Groq — Ultra-Fast Inference
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  "Penetration testing methodology and tooling",
                  "Vulnerability assessment and reporting",
                  "Network analysis and attack surface mapping",
                  "Sub-second response times via Groq LPU",
                  "Three API keys for maximum throughput",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 text-emerald-400/60 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="relative z-10 py-20 px-6 border-t border-border/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              More than a chat interface.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Quantum AI is a full platform with a catalog of developer
              resources, messaging, and a personalized dashboard.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                icon: Search,
                title: "Curated Catalog",
                description:
                  "Browse tools, templates, guides, and API integrations selected for developers and security professionals.",
                action: () => navigate("/app"),
              },
              {
                icon: MessageSquare,
                title: "Messaging",
                description:
                  "Threaded conversations, comments, and notifications. Stay in sync with your team or community.",
                action: () => navigate("/app"),
              },
              {
                icon: Terminal,
                title: "Developer Dashboard",
                description:
                  "Track usage, manage API keys, monitor conversations, and access your activity across the platform.",
                action: () => navigate("/app"),
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={item.action}
                className="group cursor-pointer rounded-xl border border-border/30 bg-card/40 p-6 hover:border-border/50 transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-cyan-400 transition-colors mb-3" />
                <h3 className="text-sm font-semibold mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="relative z-10 py-20 px-6 border-t border-border/20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Lock className="h-8 w-8 text-cyan-400/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              Your data stays{" "}
              <span className="text-cyan-400">entirely yours</span>.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conversations are stored locally in your browser. API keys remain
              in localStorage. No data leaves your device except the direct
              requests you make to Google Gemini or Groq. Zero tracking, zero
              telemetry, zero middlemen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 border-t border-border/20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <h2 className="text-3xl font-bold">
              Start building in under a minute.
            </h2>
            <p className="text-sm text-muted-foreground">
              Create an account, add your API keys, and start a conversation.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 shadow-lg shadow-cyan-500/15 transition-all"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/app")}
                className="gap-2 text-sm"
              >
                Skip to App
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Made By */}
      <section className="relative z-10 py-16 px-6 border-t border-border/20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <img src="/logo.svg" alt="Quantum AI" className="h-14 w-14 rounded-2xl mx-auto" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Designed & Developed by
              </p>
              <h2 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  RAGIB
                </span>
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Quantum AI was built with a focus on privacy, offline
              capability, and developer experience. Every feature exists to
              make AI accessible — with or without an internet connection.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Built with TypeScript + React
              </span>
              <span className="h-3 w-px bg-border/40" />
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                Powered by Transformers.js
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>Quantum AI v1.0 — Made by RAGIB</span>
          <span>
            Gemini &times; Groq &times; Transformers.js
          </span>
        </div>
      </footer>
    </div>
  );
}

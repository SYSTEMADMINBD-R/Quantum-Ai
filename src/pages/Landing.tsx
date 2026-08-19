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
} from "lucide-react";
import { useNavigate } from "react-router";

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

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
      {/* Quantum rings */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-cyan-500/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-blue-500/5"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full border border-purple-500/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Quantum AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            Launch App
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center">
        <ParticleField />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium text-cyan-400">
                <Sparkles className="h-3 w-3" />
                Version 1.0 — Now Available
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Quantum AI
              </span>
              <br />
              <span className="text-foreground/90">
                Intelligence Without Limits
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
            >
              A powerful AI assistant that works{" "}
              <span className="text-cyan-400 font-medium">offline</span>, runs
              on{" "}
              <span className="text-cyan-400 font-medium">any device</span>,
              and switches between
              <span className="text-blue-400 font-medium"> general intelligence</span> and{" "}
              <span className="text-emerald-400 font-medium">cybersecurity expertise</span> at
              the flip of a switch.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-4"
            >
              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/app")}
                className="gap-2 border-border/50 hover:bg-muted/50"
              >
                <Key className="h-4 w-4" />
                Add API Keys
              </Button>
            </motion.div>

            {/* Platform badges */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-6 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                Web App
              </span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                Windows
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                Android
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                iOS
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Everyone
              </span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From beginners to security professionals — Quantum AI adapts to your needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: WifiOff,
                title: "Works Offline",
                description:
                  "Full app functionality without internet. Your conversations are stored locally with IndexedDB. AI responses need connectivity.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: Brain,
                title: "General Mode",
                description:
                  "Powered by Google Gemini. Ask anything — creative writing, coding, math, research, and everyday questions.",
                color: "text-cyan-400",
                bg: "bg-cyan-500/10",
              },
              {
                icon: Shield,
                title: "Hacking Mode",
                description:
                  "Powered by Groq for ultra-fast inference. Deep technical analysis on cybersecurity, pen testing, and ethical hacking.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Database,
                title: "Local Storage",
                description:
                  "All conversations stay on your device. No cloud sync, no tracking. Your data is yours alone.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Key,
                title: "Multiple API Keys",
                description:
                  "Add multiple API keys for automatic rotation. Higher rate limits, more tokens, faster responses.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: Network,
                title: "Any Platform",
                description:
                  "Works as a PWA on Android, iOS, and Windows. Install it like a native app from your browser.",
                color: "text-pink-400",
                bg: "bg-pink-500/10",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group rounded-2xl border border-border/30 bg-card/50 p-6 hover:border-border/60 transition-colors"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg} mb-4`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Modes Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* General Mode Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                  <Brain className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cyan-400">
                    General Mode
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Powered by Google Gemini
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Creative writing & brainstorming",
                  "Code generation & debugging",
                  "Research & analysis",
                  "Math & science explanations",
                  "Multiple Gemini API keys supported",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-cyan-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Hacking Mode Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">
                    Hacking Mode
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Powered by Groq (Ultra-Fast)
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Penetration testing methodology",
                  "Vulnerability analysis & reporting",
                  "Network security deep-dives",
                  "Exploit development concepts",
                  "3 Groq API keys for max speed",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Lock className="h-10 w-10 text-cyan-400/50 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Your Data Stays{" "}
              <span className="text-cyan-400">Yours</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Quantum AI stores all conversations locally on your device using
              IndexedDB. API keys are kept in your browser&apos;s localStorage.
              No data is sent to any server except the AI providers you
              configure. No tracking, no analytics, no middlemen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Ready to Start?
            </h2>
            <p className="text-muted-foreground">
              Add your API keys and start chatting in under a minute.
            </p>
            <Button
              onClick={() => navigate("/app")}
              size="lg"
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all text-lg"
            >
              Launch Quantum AI
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Quantum AI v1.0</span>
          <span>
            Powered by{" "}
            <span className="text-cyan-400">Gemini</span> &{" "}
            <span className="text-emerald-400">Groq</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

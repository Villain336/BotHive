'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowRight,
  Shield,
  TestTube2,
  Lock,
  Scale,
  Server,
  CheckCircle,
  Github,
  Zap,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const complianceAreas = [
  {
    icon: TestTube2,
    title: 'Testing',
    description: 'Generate unit, integration, and e2e tests. Analyze coverage gaps and fix them with AI.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    checks: ['Test file generation', 'Coverage analysis', 'Framework detection', 'Test quality scoring'],
  },
  {
    icon: Lock,
    title: 'Security',
    description: 'OWASP compliance, auth hardening, secrets scanning, CSP headers, and rate limiting.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    checks: ['Secrets detection', 'Auth hardening', 'Dependency audit', 'Header security'],
  },
  {
    icon: Scale,
    title: 'Legal & Privacy',
    description: 'Generate privacy policies, terms of service, cookie consent, and GDPR/CCPA compliance.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    checks: ['Privacy policy gen', 'Terms of service', 'Cookie consent', 'GDPR compliance'],
  },
  {
    icon: Server,
    title: 'Ops & Infra',
    description: 'CI/CD pipelines, Docker configs, error monitoring, logging, and health checks.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    checks: ['CI/CD templates', 'Docker setup', 'Monitoring config', 'Health checks'],
  },
];

const steps = [
  {
    icon: Github,
    title: 'Connect Your Repo',
    description: 'Link your GitHub repository with one click. We support any language or framework.',
  },
  {
    icon: BarChart3,
    title: 'Get Your Score',
    description: 'Instant compliance scorecard across testing, security, legal, and ops.',
  },
  {
    icon: MessageSquare,
    title: 'Fix with AI',
    description: 'Chat with specialized AI experts to fix each gap. Get code, configs, and docs generated.',
  },
  {
    icon: Zap,
    title: 'Ship with Confidence',
    description: 'Apply fixes via PR, verify your score improves, and ship production-ready.',
  },
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#4f46e5] to-[#06b6d4] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="mb-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <TestTube2 className="mr-2 h-4 w-4" />
                Testing-first compliance for vibe coders
              </span>
            </motion.div>
            <motion.h1
              className="text-4xl font-bold tracking-tight sm:text-6xl mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-500"
              variants={fadeIn}
            >
              Ship Production-Ready Apps,
              <br />Not Just MVPs
            </motion.h1>
            <motion.p
              className="text-lg leading-8 text-muted-foreground mb-8 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              You vibe coded the features. Now let AI handle the boring (but critical) stuff:
              tests, security, legal docs, and ops. Get a compliance score and fix everything through chat.
            </motion.p>
            <motion.div className="flex justify-center gap-4" variants={fadeIn}>
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="gap-2">
                  See Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* How it Works */}
      <motion.div
        className="py-24 sm:py-32 bg-secondary/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div className="mx-auto max-w-2xl text-center mb-16" variants={fadeIn}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From repo to production-ready in minutes
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div key={step.title} variants={fadeIn} className="text-center">
                <div className="mx-auto rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Compliance Areas */}
      <motion.div
        className="py-24 sm:py-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div className="mx-auto max-w-2xl text-center mb-16" variants={fadeIn}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Four pillars of production readiness
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Each area is scanned automatically and fixable through expert AI chat
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {complianceAreas.map((area) => (
              <motion.div key={area.title} variants={fadeIn}>
                <Card className="h-full">
                  <CardHeader>
                    <div className={`rounded-lg ${area.bgColor} w-fit p-2 mb-4`}>
                      <area.icon className={`h-6 w-6 ${area.color}`} />
                    </div>
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {area.checks.map((check) => (
                        <li key={check} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="py-24 sm:py-32 bg-secondary/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stop shipping half-baked apps
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              14-day free trial. No credit card required. Connect your repo and get your compliance score in under 2 minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

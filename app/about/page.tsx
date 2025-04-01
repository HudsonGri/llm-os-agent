'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github } from "lucide-react";
import { ChatLogo } from '@/components/ui/chat-logo';

export default function About() {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="w-full max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-zinc-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <ChatLogo className="w-10 h-10" fill="#3c74d4" />
              <h1 className="text-3xl font-semibold text-zinc-900">About OS Chat Assistant</h1>
            </div>
          </div>
          
          <div className="prose prose-zinc max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-medium mb-4 text-zinc-800 pb-2 border-b border-zinc-200">About</h2>
              <p className="text-zinc-600 mb-4 text-lg">
                <strong>OS Chat Assistant</strong> is a AI-powered assistant built to help students tackle the toughest parts of their Operating Systems course. Created by{" "}
                <Link href="https://github.com/mtang08" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Michael Tang</Link>,{" "}
                <Link href="https://hudsong.dev" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Hudson Griffith</Link>, and{" "}
                <Link href="https://github.com/erikhartker" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Erik Hartker</Link>, 
                the project blends large language models with real course materials to give students accurate, easy-to-understand answers whenever they need help.
              </p>
              <p className="text-zinc-600 mb-4 text-lg">
                Special thanks to <Link href="https://www.cise.ufl.edu/siqueira-alexandre-gomes-de/" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Dr. Alexandre Gomes de Siqueira</Link> for his guidance and support throughout the development of this project.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-medium mb-4 text-zinc-800 pb-2 border-b border-zinc-200">How It Works</h2>
              <p className="text-zinc-600 mb-4 text-lg">
                Students can chat with the agent through a simple interface embedded right inside their course's Canvas page. The chatbot runs on <strong>GPT-4o</strong> and <strong>Gemini 2.0 Flash</strong>, combining the strengths of multiple advanced AI models, and is trained on lecture slides, PDFs, and other course content. That means responses are actually relevant to what's being taught, not just generic answers.
              </p>
              <p className="text-zinc-600 mb-4 text-lg">
                Everything is fully automated and synced with <strong>Canvas LMS</strong>. Course content is pulled directly from Canvas using its API, so there's no manual uploading or refreshing needed. As the course updates, so does the AI.
              </p>
              <p className="text-zinc-600 mb-4 text-lg">
                For instructors and TAs, the system tracks student questions and patterns over time, offering insights into which topics are confusing and what students are asking most.
              </p>
              <p className="text-zinc-600 mb-4 text-lg">
                <strong>Tech Stack:</strong> The application is built on Next.js and deployed on Vercel, with Supabase and Neon databases managed through Drizzle ORM.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-medium mb-4 text-zinc-800 pb-2 border-b border-zinc-200">For Instructors</h2>
              <p className="text-zinc-600 mb-4 text-lg">
                Here's a peek at the Admin Dashboard, where TAs and instructors can view usage stats, top questions, and student interaction trends in real time.
              </p>
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2 mb-6 flex items-center justify-center">
                <img 
                  src="/imgs/admin-ui.jpg" 
                  alt="Admin Dashboard Interface" 
                  className="rounded-lg w-full max-w-4xl"
                />
              </div>
              
              <Button
                variant="outline"
                size="lg"
                className="group inline-flex items-center gap-3"
                asChild
              >
                <Link 
                  href="https://github.com/HudsonGri/llm-os-agent" 
                  target="_blank"
                  className="no-underline"
                >
                  <Github className="h-5 w-5" />
                  <span className="font-medium">View on GitHub</span>
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 
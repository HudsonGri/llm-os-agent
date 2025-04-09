'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { TOPICS } from "@/lib/topics";

export default function ConceptExplorer() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const topics = TOPICS.filter(topic => topic !== "General Question" && !topic.startsWith("Exam"));

  const filteredTopics = topics.filter((topic) =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConceptSelect = useCallback((topic: string) => {
    let prompt: string;
    if (topic.startsWith("Exercise") || topic.startsWith("Project")) {
      prompt = `Please provide an overview of ${topic}, include relevant course resources, and list 3 sample next prompt examples related to ${topic}.`;
    } else {
      prompt = `Please give an overview of ${topic}, provide relevant course resources, and 3 sample questions about ${topic}.`;
    }

    const newId = crypto.randomUUID();
    document.cookie = `conversationId=${newId}; Path=/`;
    document.cookie = `samplePrompt=${encodeURIComponent(prompt)}; Path=/`;
    router.push('/');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-800 text-white p-4 flex items-center gap-4">
        <Link href="/student" className="text-gray-200 hover:text-white">
          ←
        </Link>
        <h1 className="text-xl font-semibold">Concept Explorer</h1>
      </div>

      <div className="p-4 bg-gray-100 border-b border-gray-200">
        <Input
          placeholder="Search topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2"
        />
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200 text-gray-700">
        Click on a topic below to start a new chat with an overview, relevant course resources, and sample questions.
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic}
              onClick={() => handleConceptSelect(topic)}
              className="bg-white border border-gray-300 p-4 text-center hover:bg-gray-50 cursor-pointer"
            >
              {topic}
            </div>
          ))}
          {filteredTopics.length === 0 && (
            <div className="col-span-full text-gray-500">
              No matching topics found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const [searchQuery, setSearchQuery] = React.useState('');

  // TODO: fetch chat history from DB
  // hard-coded for now
  const chatHistory = [
    { id: 1, question: 'What is an operating system?' },
    { id: 2, question: 'What is IPv6?' },
    { id: 3, question: 'What are scheduling algorithms?' },
    { id: 4, question: 'What are race conditions?' },
    { id: 5, question: 'Explain the Dining Philosophers problem.' },
    { id: 6, question: 'How do you determine if a deadlock will occur?' },
  ];

  // TODO: algorithmically determine recommended study topics based on existing chat history
  // possibly recommend based on current project/exercise, upcoming quiz/exam
  // hard-coded for now
  const recommendedTopics = [
    'IO Devices',
    'File Systems',
    'Networking',
    'Memory',
    'Processes & Threads',
    'OS Fundamentals',
  ];

  // Filter chat history by search query
  const filteredHistory = chatHistory.filter((chat) =>
    chat.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-800 text-white p-4">
        <h1 className="text-xl font-semibold">Student Dashboard</h1>
      </div>

      <div className="p-4 bg-gray-100 border-b border-gray-200">
        <Input
          placeholder="Search queries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2"
        />
      </div>

      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex flex-col w-full md:w-1/2 bg-white border border-gray-300">
          <h2 className="bg-gray-200 p-2 font-semibold">Chat History</h2>
          <div>
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-2 border-b border-gray-200 text-sm hover:bg-gray-50"
              >
                {item.question}
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <div className="p-2 text-gray-500">No matching chats found.</div>
            )}
          </div>
          <div className="p-2">
            <Link href="/">
              <Button className="mt-2">Start a New Chat</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-1/2 bg-white border border-gray-300">
          <div className="bg-gray-200 p-2 flex items-center justify-between">
            <h2 className="font-semibold">Recommended Study Topics</h2>
            <Link href="/student/concept-explorer">
              <Button variant="outline" size="sm">Go to Concept Explorer</Button>
            </Link>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {recommendedTopics.map((topic) => (
              <div
                key={topic}
                className="bg-gray-100 p-2 border text-sm"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

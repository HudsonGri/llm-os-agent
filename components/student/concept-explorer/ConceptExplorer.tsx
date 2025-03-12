'use client';

import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function ConceptExplorer() {
  const [searchTerm, setSearchTerm] = React.useState('');

  // TODO: fetch all (or subset) of possible topic tags and determine what clicking on these topics does
  // idea: general query such as "Give an overview of <topic> and provide relevant course materials"
  // hard-coded for now
  const topics = [
    'IO Devices',
    'File Systems',
    'Networking',
    'Memory',
    'Processes & Threads',
    'OS History',
    'Scheduling Algorithms',
    'Interrupts',
    'Paging',
    'Security',
    'Synchronization Problems',
    'OS Fundamentals',
  ];

  const filteredTopics = topics.filter((topic) =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        Click on a topic below to view additional resources or course slides
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic}
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

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

export default function AdminLogs() {
  // hard-coded example data
  const logs = [
    {
      id: 1,
      dateTime: '2025-02-24 10:00:00',
      user: 'studentA',
      query: 'Explain what an operating system is',
      response: 'Response from the LLM...',
      topic: 'OS Fundamentals',
    },
    {
      id: 2,
      dateTime: '2025-02-24 10:05:00',
      user: 'studentB',
      query: 'How do threads differ from processes?',
      response: 'Response from the LLM...',
      topic: 'Processes & Threads',
    },
  ];

  const [filter, setFilter] = React.useState('');

  const filteredLogs = logs.filter((log) => {
    const combined = `${log.dateTime} ${log.user} ${log.query} ${log.response} ${log.topic}`.toLowerCase();
    return combined.includes(filter.toLowerCase());
  });

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="bg-gray-200 p-2">
        <Input
          placeholder="Filter by Date, Topic, or User..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-1/2"
        />
      </div>

      <div className="bg-white border border-gray-300">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="border-b border-gray-200 p-4"
          >
            <h2 className="font-semibold">Log {log.id}:</h2>
            <p>
              <span className="font-medium">Date/Time:</span> {log.dateTime}
            </p>
            <p>
              <span className="font-medium">User:</span> {log.user}
            </p>
            <p>
              <span className="font-medium">Query:</span> {log.query}
            </p>
            <p>
              <span className="font-medium">Response:</span> {log.response}
            </p>
            <p>
              <span className="font-medium">Topic:</span> {log.topic}
            </p>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="p-4 text-gray-500">No matching logs found.</div>
        )}
      </div>
    </div>
  );
}

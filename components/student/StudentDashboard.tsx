'use client';

import React, {useCallback, useState} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatHistory } from '@/components/chat/chat-history';

export default function StudentDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userMessageCache, setUserMessageCache] = useState<Record<string, string>>({});

  const handleSelectConversation = useCallback((id: string) => {
    document.cookie = `conversationId=${id}; Path=/`;
    setConversationId(id);
    router.push('/');
  }, [router]);

  const handleNewChat = () => {
    setConversationId(null);
    router.push('/');
  };

  // TODO: algorithmically determine recommended study topics based on existing chat history
  // idea: recommend based on current project/exercise, upcoming quiz/exam (time) or related topics (semantic)
  // hard-coded for now
  const recommendedTopics = [
    'IO Devices',
    'File Systems',
    'Networking',
    'Memory',
    'Processes & Threads',
    'OS Fundamentals',
  ];

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
          <ChatHistory
            currentConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            userMessageCache={userMessageCache}
          />
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

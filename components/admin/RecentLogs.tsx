'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

// Interface matching the data returned from the API
interface LogItemResponse {
  id: string;
  dateTime: string;
  user: string;
  query: string;
  response: string;
  topic: string;
  conversationId: string;
  userAgent?: string;
  userIp?: string;
  userToolInvocations?: any[];
  assistantToolInvocations?: any[];
  rating?: string | null;
}

// Interface for our component state
interface LogItem {
  id: string;
  topic: string;
  query: string; // User's message
  preview: string; // Short preview of conversation
  timestamp: string;
  formattedDate: string;
  rating?: string | null;
  messageCount?: number;
  conversationId: string;
}

// Format date to show full time for recent messages
const formatFullDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Show full time and date
    return date.toLocaleString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    // Fallback for invalid dates
    return dateString.split('T')[0];
  }
};

export default function RecentLogs() {
  const [logs, setLogs] = useState<{ items: LogItem[], total: number }>({
    items: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch logs for unique conversations
        const response = await fetch('/api/admin/logs?limit=50');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.logs || !Array.isArray(data.logs)) {
          throw new Error('Invalid data format received from API');
        }
        
        // Group logs by conversation ID
        const conversationMap = new Map<string, LogItemResponse[]>();
        
        data.logs.forEach((log: LogItemResponse) => {
          if (!conversationMap.has(log.conversationId)) {
            conversationMap.set(log.conversationId, []);
          }
          conversationMap.get(log.conversationId)?.push(log);
        });
        
        // Get the most recent log from each conversation
        const processedLogs: LogItem[] = [];
        
        conversationMap.forEach(conversationLogs => {
          // Sort logs by date (most recent first)
          const sortedLogs = conversationLogs.sort((a, b) => 
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
          );
          
          // Get the most recent log
          const mostRecentLog = sortedLogs[0];
          
          // Create preview from query
          const preview = mostRecentLog.query.substring(0, 100) + 
            (mostRecentLog.query.length > 100 ? '...' : '');
          
          // Format topic if needed
          const topic = mostRecentLog.topic || 'Untitled Conversation';
          
          // Format full timestamp
          const formattedDate = formatFullDate(mostRecentLog.dateTime);
          
          // Total messages in conversation
          const messageCount = conversationLogs.length;
          
          processedLogs.push({
            id: mostRecentLog.id,
            conversationId: mostRecentLog.conversationId,
            topic,
            query: mostRecentLog.query,
            preview,
            timestamp: mostRecentLog.dateTime,
            formattedDate,
            rating: mostRecentLog.rating,
            messageCount,
          });
        });
        
        // Sort by timestamp (most recent first)
        processedLogs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Store total count before limiting
        const totalConversations = processedLogs.length;
        
        // Limit to 9 most recent conversations
        setLogs({ 
          items: processedLogs.slice(0, 9),
          total: totalConversations 
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent logs');
        console.error('Error fetching recent logs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  // Render rating badge
  const renderRating = (rating: string | null | undefined) => {
    if (rating === null || rating === undefined) return null;
    
    if (rating === 'up') {
      return (
        <Badge variant="outline" className="text-xs py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
        </Badge>
      );
    } else if (rating === 'down') {
      return (
        <Badge variant="outline" className="text-xs py-0 h-5 bg-rose-50 text-rose-700 border-rose-200">
          <ThumbsDown className="h-3 w-3 mr-0.5" />
        </Badge>
      );
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-1 pt-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-50/60 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2.5 w-1/3 mt-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-2 pt-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Recent Logs</CardTitle>
            <Link href="/admin/logs">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-rose-50 text-rose-700 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Error loading logs</p>
                <p className="mt-1 text-xs">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-white text-rose-700 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-1 pt-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CardTitle className="text-base">Recent Conversations</CardTitle>
            <Badge className="ml-2 bg-gray-100 text-gray-600 text-xs py-0 h-5">
              {logs.items.length}
            </Badge>
          </div>
          <Link href="/admin/logs">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
              <Search className="h-3 w-3 mr-1" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-3">
        {logs.items.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
            <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-30" />
            <p className="text-sm">No conversation logs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
            {logs.items.map((log) => (
              <Link 
                key={log.conversationId}
                href={`/admin/logs?id=${log.conversationId}`}
                className="block"
              >
                <div 
                  className="bg-gray-50/60 hover:bg-gray-50 rounded-md p-2 transition-all border border-gray-100 hover:border-gray-200 hover:shadow-sm text-sm relative group"
                >
                  <div className="absolute top-2 right-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                  
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-blue-600 truncate text-sm">
                        {log.topic}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      <span>{log.formattedDate}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {renderRating(log.rating)}
                      
                      <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-50 border-gray-200">
                        <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                        {log.messageCount}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-1 mt-1.5">
                    {log.preview}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex justify-between items-center border-t border-gray-100 mt-0 px-3 py-2">
        <p className="text-xs text-gray-500">
          {logs.items.length} out of {logs.total} total conversations
        </p>
      </CardFooter>
    </Card>
  );
} 
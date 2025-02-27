'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MessageSquare, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LogItem {
  id: string;
  topic: string;
  timestamp: string;
  formattedDate: string;
  rating?: string | null;
}

export default function RecentLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/stats/recent-logs');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.logs || !Array.isArray(data.logs)) {
          throw new Error('Invalid data format received from API');
        }
        
        setLogs(data.logs);
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
        <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-xs rounded-full px-2 py-0.5 ml-2">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          Up
        </span>
      );
    } else if (rating === 'down') {
      return (
        <span className="inline-flex items-center bg-rose-100 text-rose-700 text-xs rounded-full px-2 py-0.5 ml-2">
          <ThumbsDown className="h-3 w-3 mr-0.5" />
          Down
        </span>
      );
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center py-2">
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Logs</h2>
          <Link href="/admin/logs">
            <Button variant="outline" size="sm">View All Logs</Button>
          </Link>
        </div>
        <div className="bg-rose-50 text-rose-700 p-3 rounded-md text-sm">
          <p className="font-medium">Error loading logs</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Recent Logs</h2>
        <Link href="/admin/logs">
          <Button variant="outline" size="sm">View All Logs</Button>
        </Link>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No conversation logs found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div key={log.id} className="py-2.5">
              <div className="flex items-center">
                <div className="flex-1">
                  <Link href={`/admin/logs?id=${log.id}`}>
                    <span className="font-medium text-sm text-blue-600 hover:text-blue-800">
                      {log.topic}
                    </span>
                  </Link>
                  {log.rating !== null && log.rating !== undefined && renderRating(log.rating)}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{log.formattedDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
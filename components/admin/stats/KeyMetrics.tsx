'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart4, 
  Award,
  Calendar,
  AlertTriangle,
  BadgeInfo,
  Search,
  Star,
  ThumbsDown,
  ExternalLink
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Define TypeScript interfaces for our data
interface KeyMetricsData {
  timeframe: {
    days: number;
    start: string;
    end: string;
  };
  engagement: {
    activeUsers: number;
    totalConversations: number;
    totalMessages: number;
    messagesPerConversation: number;
    growthRate: number;
  };
  satisfaction: {
    satisfactionRate: number;
    totalRated: number;
  };
  topics: Array<{
    name: string;
    count: number;
  }>;
  patterns: {
    busiestDay: string;
  };
  flagged: Array<{
    id: string;
    date: string;
    topic: string;
    rating: string;
  }>;
}

type TimeRange = '7' | '30' | '90' | 'all';

export default function KeyMetrics() {
  const [metrics, setMetrics] = useState<KeyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare the query parameter
        const rangeParam = timeRange === 'all' ? '' : `?days=${timeRange}`;
        const response = await fetch(`/api/admin/stats/key-metrics${rangeParam}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        console.error('Error fetching key metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [timeRange]);

  // Format numbers with locale
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };


  // Skeleton loading component for metrics
  const MetricsSkeleton = () => (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Primary Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16 mb-1" />
              {i === 3 && <Skeleton className="h-3 w-24 mt-2" />}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Secondary Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Topics Skeleton */}
        <Card className="shadow-sm border-gray-200 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-center w-1/2">
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton className="h-5 w-10 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Skeleton className="h-3 w-40" />
          </CardFooter>
        </Card>
        
        {/* Flagged Conversations Skeleton */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-3 w-36 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Skeleton className="h-8 w-full rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold tracking-tight">Key Metrics</h2>
          
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 bg-rose-50/50 flex items-center justify-center rounded-md min-h-[320px]">
          <div className="text-rose-700 text-center p-4">
            <p className="font-medium">Unable to load key metrics</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Key Metrics</h2>
        
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {loading ? (
        <MetricsSkeleton />
      ) : metrics ? (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Users */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(metrics.engagement.activeUsers)}</div>
              </CardContent>
            </Card>
            
            {/* Total Conversations */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(metrics.engagement.totalConversations)}</div>
              </CardContent>
            </Card>
            
            {/* Messages Per Conversation */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg. Messages</CardTitle>
                  <BarChart4 className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.engagement.messagesPerConversation}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Per conversation
                </div>
              </CardContent>
            </Card>
            
            {/* Satisfaction Rate */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Satisfaction</CardTitle>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.satisfaction.satisfactionRate}%</div>
                <div className="text-xs text-gray-500 mt-2">
                  Based on {formatNumber(metrics.satisfaction.totalRated)} ratings
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Topics */}
            <Card className="shadow-sm border-gray-200 md:col-span-2">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium">Popular Topics</CardTitle>
                </div>
              </CardHeader>
               <CardContent>
                {metrics.topics.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.topics.map((topic, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{topic.name}</span>
                        </div>
                        <div className="flex items-center w-1/2">
                          <div className="flex-grow bg-gray-200 rounded-full h-1.5 relative">
                            <div 
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${(topic.count / metrics.topics[0].count) * 100}%` }}
                            ></div>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {topic.count}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    No topic data available for this period
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-gray-500 pt-0">
                {metrics.patterns.busiestDay !== 'n/a' ? (
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Busiest day: <span className="font-medium">{metrics.patterns.busiestDay}</span></span>
                  </div>
                ) : null}
              </CardFooter>
            </Card>
            
            {/* Flagged Conversations */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium">Disliked Messages</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <CardDescription>Recent negatively rated responses</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.flagged.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.flagged.map((convo) => (
                      <Link 
                        key={convo.id} 
                        href={`/admin/logs?id=${convo.id}`}
                        className="block group"
                      >
                        <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer relative">
                          <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-3 w-3" />
                          </div>
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-rose-100 text-rose-700 text-xs font-medium">
                            <ThumbsDown className="h-4 w-4" />
                          </div>
                          <div className="flex-1 pr-4">
                            <div className="text-sm font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">{convo.topic}</div>
                            <div className="text-xs text-gray-500">{convo.date}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-center py-4 text-emerald-600">
                    No disliked messages!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
} 
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
  ThumbsDown
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

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
  const [timeRange, setTimeRange] = useState<TimeRange>('30');

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

  // Helper to render a trend indicator
  const renderTrend = (rate: number) => {
    if (rate > 0) {
      return (
        <div className="flex items-center text-emerald-600">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          <span>{Math.abs(rate)}% ↑</span>
        </div>
      );
    } else if (rate < 0) {
      return (
        <div className="flex items-center text-rose-600">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          <span>{Math.abs(rate)}% ↓</span>
        </div>
      );
    }
    return <span className="text-gray-500">No change</span>;
  };

  // Skeleton loading component for metrics
  const MetricsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-1/3" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Component for the satisfaction gauge
  const SatisfactionGauge = ({ rate }: { rate: number }) => {
    // Determine color based on satisfaction rate
    let color = 'bg-rose-500';
    if (rate >= 80) color = 'bg-emerald-500';
    else if (rate >= 60) color = 'bg-lime-500';
    else if (rate >= 40) color = 'bg-amber-500';
    else if (rate >= 20) color = 'bg-orange-500';

    return (
      <div className="w-full mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${color}`} 
            style={{ width: `${rate}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md">
        <p className="font-medium">Unable to load key metrics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Key Metrics</h2>
        
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
        <div className="space-y-6">
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
                <div className="text-2xl font-bold">{formatNumber(metrics.engagement.activeUsers)}</div>
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
                <div className="text-2xl font-bold">{formatNumber(metrics.engagement.totalConversations)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {renderTrend(metrics.engagement.growthRate)}
                </div>
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
                <div className="text-2xl font-bold">{metrics.engagement.messagesPerConversation}</div>
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
                <div className="text-2xl font-bold">{metrics.satisfaction.satisfactionRate}%</div>
                <SatisfactionGauge rate={metrics.satisfaction.satisfactionRate} />
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <BadgeInfo className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          These are the most common topics discussed in student conversations
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {metrics.topics.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.topics.map((topic, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{topic.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {topic.count}
                          </Badge>
                        </div>
                        <div className="w-1/2 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${(topic.count / metrics.topics[0].count) * 100}%` }}
                          ></div>
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
                  <CardTitle className="text-sm font-medium">Flagged Conversations</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <CardDescription>Recent low-rated interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.flagged.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.flagged.map((convo) => (
                      <div key={convo.id} className="flex items-start space-x-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-rose-100 text-rose-700 text-xs font-medium">
                          <ThumbsDown className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium line-clamp-1">{convo.topic}</div>
                          <div className="text-xs text-gray-500">{convo.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-center py-4 text-emerald-600">
                    No low-rated conversations!
                  </div>
                )}
              </CardContent>
              {metrics.flagged.length > 0 && (
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    View in Admin Logs
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
} 
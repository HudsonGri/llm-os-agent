'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend,
  ResponsiveContainer, 
  Tooltip, 
  TooltipProps, 
  XAxis,
  YAxis
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EngagementData {
  date: string;
  conversations: number;
  messages: number;
}

type DateRange = '7' | '14' | '30' | 'all';

export default function EngagementChart() {
  const [data, setData] = useState<EngagementData[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const rangeParam = dateRange === 'all' ? '' : `?days=${dateRange}`;
        const response = await fetch(`/api/admin/stats/engagement${rangeParam}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from API');
        }
        
        setData(result.data);
        setTotalConversations(Number(result.totalConversations) || 0);
        setTotalMessages(Number(result.totalMessages) || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching engagement data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium mb-1">{label}</p>
          <div className="text-sm space-y-1">
            <p className="text-blue-600 flex items-center">
              <span className="inline-block w-3 h-3 bg-[var(--color-chart-1)] mr-2 rounded-sm"></span>
              Conversations: {payload[0].value}
            </p>
            <p className="text-emerald-600 flex items-center">
              <span className="inline-block w-3 h-3 bg-[var(--color-chart-2)] mr-2 rounded-sm"></span>
              Messages: {payload[1].value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Determine how many ticks to show on x-axis
  const getTickInterval = () => {
    const length = data.length;
    if (length > 60) return Math.floor(length / 8);
    if (length > 30) return Math.floor(length / 6);
    if (length > 14) return 2;
    return 0; // Show all ticks for small datasets
  };
  
  // Determine bar width based on data density
  const getBarWidth = () => {
    const length = data.length;
    if (length > 60) return 2;
    if (length > 30) return 5;
    if (length > 14) return 10;
    return 15;
  };

  return (
    <Card className="shadow-sm border-gray-200 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Daily Engagement</CardTitle>
            <CardDescription>
              {dateRange === 'all' ? 'All time' : `Past ${dateRange} days of`} student activity
            </CardDescription>
          </div>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All history</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-1 flex-1">
        {loading ? (
          <div className="h-[320px] w-full flex items-center justify-center bg-gray-50/50 rounded-md">
            <div className="text-gray-400">Loading chart data...</div>
          </div>
        ) : error ? (
          <div className="h-[320px] w-full flex items-center justify-center bg-rose-50/50 rounded-md">
            <div className="text-rose-500 text-center">
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-md">
            <div className="text-gray-400">No data available</div>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={getTickInterval()}
                  angle={data.length > 14 ? -45 : 0}
                  textAnchor={data.length > 14 ? "end" : "middle"}
                  height={data.length > 14 ? 50 : 30}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }} 
                  payload={[
                    { value: 'Conversations', type: 'rect', color: 'var(--color-chart-1)' },
                    { value: 'Messages', type: 'rect', color: 'var(--color-chart-2)' }
                  ]}
                />
                <Bar
                  dataKey="conversations"
                  name="Conversations"
                  fill="var(--color-chart-1)"
                  radius={[2, 2, 0, 0]}
                  barSize={getBarWidth()}
                />
                <Bar
                  dataKey="messages"
                  name="Messages"
                  fill="var(--color-chart-2)"
                  radius={[2, 2, 0, 0]}
                  barSize={getBarWidth()}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 pt-2 pb-4 text-sm border-t border-gray-100">
        <div className="leading-none text-gray-600 flex items-center gap-2">
          Total of {totalConversations.toLocaleString()} conversations
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  A conversation is counted as a unique interaction session between a student and the assistant. 
                  Each conversation may contain multiple messages, but is counted as a single engagement unit.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="leading-none text-gray-600 flex items-center gap-2">
          Total of {totalMessages.toLocaleString()} messages
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Messages represent individual student queries sent to the assistant.
                  This includes all messages across all conversations.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
} 
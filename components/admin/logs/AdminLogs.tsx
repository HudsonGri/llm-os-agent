'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ExternalLink, 
  Filter, 
  RotateCcw, 
  Search, 
  ThumbsDown, 
  ThumbsUp, 
  User, 
  Wrench,
  Trash2 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useSearchParams } from 'next/navigation';

// Define the shape of tool invocations
interface ToolInvocation {
  toolName: string;
  state?: string;
  step?: number;
  toolCallId?: string;
  result?: any;
  args?: {
    question?: string;
    topic?: string;
    topicNumber?: number;
  };
  parts?: Array<{
    toolInvocation: any;
  }>;
}

interface LogEntry {
  id: string;
  dateTime: string;
  user: string;
  query: string;
  response: string;
  topic: string;
  conversationId: string;
  userAgent?: string;
  userIp?: string;
  userToolInvocations?: ToolInvocation[];
  assistantToolInvocations?: ToolInvocation[];
  rating?: 'up' | 'down' | null;
  reasoning?: boolean;
  deleted?: boolean;
}

export default function AdminLogs() {
  // Add useSearchParams hook to get URL parameters
  const searchParams = useSearchParams();
  const targetConversationId = searchParams.get('id');
  const targetLogRef = useRef<HTMLDivElement>(null);
  
  // Add a ref to track if we've already loaded for this target conversation
  const hasLoadedTargetRef = useRef<string | null>(null);

  // State for logs and pagination
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  // State for filters
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [rating, setRating] = useState<string>('all');
  
  // State for expanded log entries
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Effect to auto-set search if ID is provided in URL
  useEffect(() => {
    if (targetConversationId) {
      // Clear any existing search first
      setSearch('');
      setAppliedSearch('');

      // Don't use the general search field for conversation IDs
      // Instead, we'll directly filter for the specific conversation in fetchLogs
      
      // Reset other filters to ensure the conversation appears
      setRating('all');
      setStartDate(undefined);
      setEndDate(undefined);
      setPage(1);
    }
  }, [targetConversationId]);

  // Fetch logs from the API
  const fetchLogs = useCallback(async () => {
    console.log('Fetching logs with params:', { 
      page, 
      search: appliedSearch, 
      startDate, 
      endDate, 
      rating, 
      targetConversationId
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // If we have a target conversation ID from URL, use a specific filter for it
      if (targetConversationId) {
        params.append('conversationId', targetConversationId);
        // Use a high limit to ensure we get it even if not on first page
        params.append('limit', '50');
        params.append('offset', '0');
      } else {
        // Normal filtering without a specific conversation ID
        params.append('limit', limit.toString());
        params.append('offset', ((page - 1) * limit).toString());
        
        if (appliedSearch) {
          params.append('search', appliedSearch);
        }
        
        if (startDate) {
          params.append('startDate', startDate.toISOString());
        }
        
        if (endDate) {
          // Set time to end of day for end date
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.append('endDate', endOfDay.toISOString());
        }
        
        if (rating && rating !== 'all') {
          params.append('rating', rating);
        }
        
      }
      
      // Fetch logs from API
      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      // If we're looking for a specific conversation, filter the results to ensure it's included
      if (targetConversationId && data.logs.length > 0) {
        // Find the log that matches the conversation ID
        const targetLog = data.logs.find(
          (log: LogEntry) => log.conversationId === targetConversationId
        );
        
        if (targetLog) {
          setExpandedLog(targetLog.id);
          
          // Set the logs array to make sure the target appears first
          const filteredLogs = [
            targetLog, 
            ...data.logs.filter((log: LogEntry) => log.id !== targetLog.id)
          ].slice(0, limit);
          
          setLogs(filteredLogs);
          setTotal(data.total);
        } else {
          // If no match in the current results, keep normal results
          setLogs(data.logs);
          setTotal(data.total);
        }
      } else {
        // Normal case - just set the logs
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
      
      // After the data is loaded and rendered, scroll if we have a target
      if (targetConversationId) {
        // Add a delay to ensure DOM is fully updated before scrolling
        setTimeout(() => {
          // Use data-attribute to find the target element
          const targetElement = document.querySelector(`[data-conversation-id="${targetConversationId}"]`);
          if (targetElement) {
            // Scroll with offset to ensure it's visible with a smoother animation
            window.scrollTo({
              top: targetElement.getBoundingClientRect().top + window.pageYOffset - 140,
              behavior: 'smooth'
            });
            
            // Focus the element for accessibility but remove animation
            if (targetElement instanceof HTMLElement) {
              targetElement.focus();
            }
          }
        }, 300); // Delay to ensure everything is rendered
      }
    }
  }, [appliedSearch, page, limit, startDate, endDate, rating, targetConversationId]);

  // Add a useEffect for initial data loading
  useEffect(() => {
    // This effect will run once on component mount to fetch initial data
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove 'loading' from the dependency array in the existing useEffect to prevent circular dependency
  useEffect(() => {
    // Don't trigger another fetch if we're loading
    // Skip if we're handling a target conversation in the other effect
    if (loading || (targetConversationId && hasLoadedTargetRef.current === targetConversationId)) {
      console.log('Skipping fetch (main effect):', { loading, targetConversationId, hasLoadedTarget: hasLoadedTargetRef.current });
      return;
    }
    
    console.log('Running main effect fetch');
    // Only fetch if not already loading
    fetchLogs();
    // Removing fetchLogs from dependencies and using the function directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedSearch, startDate, endDate, rating, targetConversationId]);

  // Add a separate effect to handle the initial load with a target conversation ID
  useEffect(() => {
    // Only fetch if targetConversationId changes and we haven't already loaded this conversation
    if (targetConversationId && hasLoadedTargetRef.current !== targetConversationId) {
      console.log('Loading target conversation:', targetConversationId);
      hasLoadedTargetRef.current = targetConversationId;
      fetchLogs();
    } else {
      console.log('Skipping conversation load:', { targetConversationId, hasLoadedTarget: hasLoadedTargetRef.current });
    }
    // Use fetchLogs directly in the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetConversationId]);

  // Reset the hasLoadedTargetRef when targetConversationId changes to null
  useEffect(() => {
    if (!targetConversationId && hasLoadedTargetRef.current !== null) {
      console.log('Resetting hasLoadedTargetRef');
      hasLoadedTargetRef.current = null;
      // No need to call fetchLogs here as the main effect will handle it
    }
  }, [targetConversationId]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1); // Reset to first page when applying a new search
  };

  // Handle date filter changes
  const handleDateFilterApply = () => {
    setPage(1); // Reset to first page when applying new date filters
    // fetchLogs will be called automatically by the useEffect
    // No need to call fetchLogs() directly here
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStartDate(undefined);
    setEndDate(undefined);
    setRating('all');
    setPage(1);
  };

  // Handle rating change
  const handleRatingChange = (value: string) => {
    setRating(value);
    setPage(1); // Reset to first page when changing rating filter
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(total / limit);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Toggle expanded state for a log
  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };


  // Display rating badge
  const renderRatingBadge = (rating?: 'up' | 'down' | null) => {
    if (rating === 'up') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 py-1">
          <ThumbsUp size={14} />
          <span>Liked</span>
        </Badge>
      );
    } else if (rating === 'down') {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 py-1">
          <ThumbsDown size={14} />
          <span>Disliked</span>
        </Badge>
      );
    }
    return null;
  };

  // Format tool invocations for display with syntax highlighting
  const renderToolInvocations = (toolInvocations?: ToolInvocation[]) => {
    if (!toolInvocations || toolInvocations.length === 0) {
      return <p className="text-gray-500 text-sm italic">No tools used</p>;
    }
    
    return (
      <div className="space-y-4">
        {toolInvocations.map((tool, index) => (
          <div key={index} className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Wrench size={16} />
                <span className="font-medium">{tool.toolName}</span>
                {tool.state && (
                  <Badge variant="outline" className="ml-auto px-2 py-0.5">
                    {tool.state}
                  </Badge>
                )}
              </div>
              {tool.args && tool.args.topic && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Badge variant="secondary" className="bg-gray-100 border-gray-200">
                  Topic: {tool.args.topic} {tool.args.topicNumber && `#${tool.args.topicNumber}`}
                </Badge>
              </div>
              )}
            </div>
            {tool.result && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-500 mb-1.5">Result:</div>
                <div className="rounded-md overflow-auto max-h-[250px] text-xs border border-gray-200">
                  <SyntaxHighlighter 
                    language="json"
                    style={prism}
                    lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}}
                    wrapLines={true}
                    customStyle={{
                      margin: 0,
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    {Array.isArray(tool.result)
                      ? JSON.stringify(tool.result, null, 2)
                      : typeof tool.result === 'object'
                        ? JSON.stringify(tool.result, null, 2)
                        : String(tool.result)}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Add a badge rendering function for reasoning
  const renderReasoningBadge = (reasoning?: boolean) => {
    if (!reasoning) return null;
    
    return (
      <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 font-medium py-1 px-2.5 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
        Reasoning
      </Badge>
    );
  };

  // Add a badge rendering function for deleted messages
  const renderDeletedBadge = (deleted?: boolean) => {
    if (!deleted) return null;
    
    return (
      <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 font-medium py-1 px-2.5 flex items-center gap-1">
        <Trash2 size={12} className="text-gray-600" />
        Deleted
      </Badge>
    );
  };

  return (
    <div className="flex-1 p-5 flex flex-col gap-5 w-full mx-auto">
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <CardTitle>Query Filters</CardTitle>
          </div>
          <CardDescription>
            Search and filter conversation logs to analyze user interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-5">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
                  placeholder="Search by user, query, or conversation ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 focus-visible:ring-blue-500 h-10"
                />
                <Button 
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 h-8"
                >
                  Search
                </Button>
              </div>
            </form>
            
            <div className="flex gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal w-[240px] h-10 border-gray-300 hover:bg-gray-50">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {startDate ? format(startDate, 'PPP') : <span className="text-gray-500">Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal w-[240px] h-10 border-gray-300 hover:bg-gray-50">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {endDate ? format(endDate, 'PPP') : <span className="text-gray-500">End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>

              <Button 
                onClick={handleDateFilterApply} 
                variant="secondary"
                className="h-10 bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Apply Dates
              </Button>
            </div>
          </div>
          
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Rating:</span>
              <Select value={rating} onValueChange={handleRatingChange}>
                <SelectTrigger className="w-[200px] h-10 border-gray-300">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="up">
                    <div className="flex items-center gap-2">
                      <ThumbsUp size={16} className="text-green-500" />
                      <span>Positive</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="down">
                    <div className="flex items-center gap-2">
                      <ThumbsDown size={16} className="text-red-500" />
                      <span>Negative</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="none">No rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(appliedSearch || startDate || endDate || (rating && rating !== 'all')) && (
            <div className="mt-5 flex flex-wrap items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mr-2">Active filters:</div>
              <div className="flex flex-wrap gap-2 items-center">
                {appliedSearch && (
                  <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 py-1 px-3">
                    <Search size={12} className="mr-1 text-gray-500" />
                    {appliedSearch}
                  </Badge>
                )}
                {startDate && (
                  <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 py-1 px-3">
                    <CalendarIcon size={12} className="mr-1 text-gray-500" />
                    From: {format(startDate, 'MMM d, yyyy')}
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 py-1 px-3">
                    <CalendarIcon size={12} className="mr-1 text-gray-500" />
                    To: {format(endDate, 'MMM d, yyyy')}
                  </Badge>
                )}
                {rating && rating !== 'all' && (
                  <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 py-1 px-3">
                    {rating === 'up' ? 
                      <ThumbsUp size={12} className="mr-1 text-green-500" /> : 
                      rating === 'down' ? 
                        <ThumbsDown size={12} className="mr-1 text-red-500" /> : 
                        <span className="mr-1">●</span>
                    }
                    {rating === 'up' ? 'Positive' : rating === 'down' ? 'Negative' : 'None'}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetFilters}
                  className="ml-2 h-7 text-gray-600 hover:text-gray-900 hover:bg-white flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Interaction Logs</CardTitle>
              {(appliedSearch || startDate || endDate || (rating && rating !== 'all')) && (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Filtered</Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Showing {logs.length} of {total} logs
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-4 border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-5 w-[120px] rounded-md" />
                  <Skeleton className="h-4 w-[150px] rounded-md" />
                </div>
                <Skeleton className="h-4 w-full mb-2 rounded-md" />
                <Skeleton className="h-4 w-[70%] rounded-md" />
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="text-center py-10 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 mb-2 font-medium">Error loading logs</p>
              <p className="text-sm text-red-500 max-w-md mx-auto">{error}</p>
              <Button onClick={fetchLogs} className="mt-4 bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            // Empty state
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No logs found</p>
              {(appliedSearch || startDate || endDate || (rating && rating !== 'all')) && (
                <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
                  No results match your current filters. Try adjusting your search criteria or date range.
                </p>
              )}
              <Button onClick={handleResetFilters} variant="outline" className="mt-2 border-gray-300">
                Reset Filters
              </Button>
            </div>
          ) : (
            // Logs list
            <div className="space-y-4">
              {logs.map((log) => (
                <Card 
                  key={log.id} 
                  ref={log.conversationId === targetConversationId ? targetLogRef : undefined}
                  className={cn(
                    "border overflow-hidden transition-all duration-300",
                    expandedLog === log.id ? "border-blue-300 shadow-sm ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-300 hover:shadow-sm", 
                    log.conversationId === targetConversationId ? "bg-blue-50 shadow-md" : "",
                    log.rating === 'up' ? "border-l-4 border-l-green-400" : log.rating === 'down' ? "border-l-4 border-l-red-400" : "",
                    log.deleted ? "opacity-75 border-dashed" : ""
                  )}
                  data-conversation-id={log.conversationId}
                  tabIndex={log.conversationId === targetConversationId ? 0 : undefined}
                >
                  <div 
                    className={cn(
                      "flex justify-between items-start p-4 cursor-pointer",
                      expandedLog === log.id ? "border-b border-gray-200 bg-gray-50" : ""
                    )}
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500" />
                          <h3 className="font-medium text-gray-900">{log.user}</h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatDate(log.dateTime)}</span>
                        </div>
                        {log.topic && (
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium py-1 px-2.5 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            {log.topic}
                          </Badge>
                        )}
                        {log.reasoning && (
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 font-medium py-1 px-2.5 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                            Reasoning
                          </Badge>
                        )}
                        {log.deleted && (
                          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 font-medium py-1 px-2.5 flex items-center gap-1">
                            <Trash2 size={12} className="text-gray-600" />
                            Deleted
                          </Badge>
                        )}
                        {log.assistantToolInvocations && log.assistantToolInvocations.length > 0 && (
                          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-medium py-1 px-2.5 flex items-center gap-1">
                            <Wrench size={12} className="mr-1" />
                            {log.assistantToolInvocations.length} {log.assistantToolInvocations.length === 1 ? 'tool' : 'tools'}
                          </Badge>
                        )}
                        {log.rating && (
                          <div className="ml-auto flex items-center">
                            {log.rating === 'up' ? (
                              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 flex items-center gap-1 py-0.5">
                                <ThumbsUp size={12} />
                                <span className="text-xs font-medium">Liked</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800 flex items-center gap-1 py-0.5">
                                <ThumbsDown size={12} />
                                <span className="text-xs font-medium">Disliked</span>
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-1 break-words">
                        {log.query}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full h-8 w-8 flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        {expandedLog === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </Button>
                    </div>
                  </div>
                  
                  {expandedLog === log.id && (
                    <div className="p-5 bg-white border-t border-gray-100">
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                          User Query
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{log.query}</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                          Assistant Response
                          {log.rating && (
                            <Badge 
                              className={cn(
                                "ml-2 py-1 px-2 flex items-center gap-1",
                                log.rating === 'up' 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-red-100 text-red-800 border-red-200"
                              )}
                            >
                              {log.rating === 'up' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                              <span className="font-medium">{log.rating === 'up' ? 'Liked' : 'Disliked'}</span>
                            </Badge>
                          )}
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{log.response}</p>
                        </div>
                      </div>
                      
                      {/* Tool Invocations Section */}
                      {log.assistantToolInvocations && log.assistantToolInvocations.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-purple-500 mr-1"></span>
                            Tools Used
                          </h4>
                          <div className="mt-2">
                            {renderToolInvocations(log.assistantToolInvocations)}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap justify-between gap-4 text-sm">
                        <div className="text-gray-600 space-y-1.5">
                          <p className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">User ID:</span> {log.user}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Conversation ID:</span> {log.conversationId}
                          </p>
                          {log.topic && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Topic:</span>
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium py-0.5 px-2">
                                {log.topic}
                              </Badge>
                            </p>
                          )}
                          {log.reasoning && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Reasoning:</span>
                              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 font-medium py-0.5 px-2">
                                Enabled
                              </Badge>
                            </p>
                          )}
                          {log.deleted && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Status:</span>
                              <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 font-medium py-0.5 px-2 flex items-center gap-1">
                                <Trash2 size={12} className="text-gray-600" />
                                Deleted
                              </Badge>
                            </p>
                          )}
                          {log.userAgent && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">User Agent:</span> 
                              <span className="truncate max-w-[400px]">{log.userAgent.substring(0, 100)}...</span>
                            </p>
                          )}
                          {log.rating && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Rating:</span>
                              <Badge 
                                className={cn(
                                  "py-1 px-2 flex items-center gap-1",
                                  log.rating === 'up' 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : "bg-red-100 text-red-800 border-red-200"
                                )}
                              >
                                <span className="font-medium">{log.rating === 'up' ? 'Liked' : 'Disliked'}</span>
                              </Badge>
                            </p>
                          )}
                        </div>
                        <div>
                          <Link 
                            href={`/admin/logs?id=${log.conversationId}`} 
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            View Conversation <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-4">
          {totalPages > 1 && (
            <Pagination className="w-full justify-center my-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={cn(
                      "border border-gray-200 hover:bg-gray-50 transition-colors",
                      page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                    )}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Logic to show pages around current page
                  let pageNum = page;
                  if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum <= 0 || pageNum > totalPages) return null;
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <PaginationItem>
                    <span className="px-2 flex items-center text-gray-500">...</span>
                  </PaginationItem>
                )}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => setPage(totalPages)}
                      className="border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={cn(
                      "border border-gray-200 hover:bg-gray-50 transition-colors",
                      page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

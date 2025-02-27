'use client';

import React, { useEffect, useState } from 'react';
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
  Wrench 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Define the shape of tool invocations
interface ToolInvocation {
  toolName: string;
  state?: string;
  result?: any;
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
}

export default function AdminLogs() {
  // State for logs and pagination
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // State for filters
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [rating, setRating] = useState<string>('all');
  
  // State for expanded log entries
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Fetch logs from the API
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
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
      
      // Fetch logs from API
      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and refresh when pagination or filters change
  useEffect(() => {
    fetchLogs();
  }, [page, appliedSearch, startDate, endDate, rating]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1); // Reset to first page when applying a new search
  };

  // Handle date filter changes
  const handleDateFilterApply = () => {
    setPage(1); // Reset to first page when applying new date filters
    fetchLogs();
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

  // Display rating icon
  const renderRatingIcon = (rating?: 'up' | 'down' | null) => {
    if (rating === 'up') {
      return <ThumbsUp size={16} className="text-green-500" />;
    } else if (rating === 'down') {
      return <ThumbsDown size={16} className="text-red-500" />;
    }
    return null;
  };

  // Display rating badge
  const renderRatingBadge = (rating?: 'up' | 'down' | null) => {
    if (rating === 'up') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 py-1">
          <ThumbsUp size={14} />
          <span>Response Liked</span>
        </Badge>
      );
    } else if (rating === 'down') {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 py-1">
          <ThumbsDown size={14} />
          <span>Response Disliked</span>
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
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={16}  />
              <span className="font-medium">{tool.toolName}</span>
              {tool.state && (
                <Badge variant="outline" className="ml-auto px-2 py-0.5">
                  {tool.state}
                </Badge>
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
                    {typeof tool.result === 'object' 
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
                <Card key={log.id} className={cn(
                  "border overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-sm",
                  expandedLog === log.id ? "border-gray-300 shadow-sm" : "border-gray-200"
                )}>
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
                        {log.assistantToolInvocations && log.assistantToolInvocations.length > 0 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none">
                            <Wrench size={12} className="mr-1" />
                            {log.assistantToolInvocations.length} {log.assistantToolInvocations.length === 1 ? 'tool' : 'tools'}
                          </Badge>
                        )}
                        {log.rating && (
                          <div className="ml-auto flex items-center">
                            {log.rating === 'up' ? (
                              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 flex items-center gap-1 py-0.5">
                                <ThumbsUp size={12} />
                                <span className="text-xs">Response rated</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800 flex items-center gap-1 py-0.5">
                                <ThumbsDown size={12} />
                                <span className="text-xs">Response rated</span>
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-1 break-words">
                        {log.query}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-8 w-8 ml-2 flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      {expandedLog === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </Button>
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
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          {log.rating && renderRatingBadge(log.rating)}
                        </div>
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
                          {log.topic && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Topic:</span>
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium py-0.5 px-2">
                                {log.topic}
                              </Badge>
                            </p>
                          )}
                          {log.userAgent && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">User Agent:</span> 
                              <span className="truncate max-w-[300px]">{log.userAgent.substring(0, 50)}...</span>
                            </p>
                          )}
                          {log.rating && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Rating:</span>
                              {renderRatingIcon(log.rating)} 
                              <span>{log.rating === 'up' ? 'Liked' : 'Disliked'}</span>
                            </p>
        )}
      </div>
                        <div>
                          <Link 
                            href={`/chat/${log.conversationId}`} 
                            target="_blank"
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

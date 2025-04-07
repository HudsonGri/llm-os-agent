'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Calendar
} from "@/components/ui/calendar";
import { 
  Copy, 
  Calendar as CalendarIcon, 
  Plus, 
  RefreshCw, 
  Shield, 
  ShieldOff,
  Link
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define interfaces for our data
interface AccessCode {
  id: number;
  code: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
  last_used_at: string | null;
  description: string | null;
  session_count: number;
}

export default function AccessTokens() {
  const router = useRouter();
  
  // State for access codes
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for creating new access code
  const [newCodeDescription, setNewCodeDescription] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Default 90 days
  );
  
  // State for UI interactions
  const [creatingCode, setCreatingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Function to fetch access codes
  const fetchAccessCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/access-codes');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAccessCodes(data.accessCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch access codes');
      console.error('Error fetching access codes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new access code
  const createAccessCode = async () => {
    try {
      setCreatingCode(true);
      const response = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newCodeDescription,
          expires_at: expiryDate?.toISOString(),
          custom_code: customCode.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAccessCodes(prev => [data.accessCode, ...prev]);
      setCopiedCode(data.accessCode.code);
      setNewCodeDescription('');
      setCustomCode('');
      
      // Set a new default expiry date 90 days from now
      setExpiryDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create access code');
      console.error('Error creating access code:', err);
    } finally {
      setCreatingCode(false);
    }
  };

  // Toggle revoke status of an access code
  const toggleRevokeAccessCode = async (id: number, currentlyRevoked: boolean) => {
    try {
      const response = await fetch('/api/admin/access-codes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          revoked: !currentlyRevoked,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Update local state
      setAccessCodes(prev => 
        prev.map(code => 
          code.id === id ? { ...code, revoked: !currentlyRevoked } : code
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access code');
      console.error('Error updating access code:', err);
    }
  };

  // Copy access code to clipboard
  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy code:', err);
      });
  };

  // Copy shareable link to clipboard
  const copyShareableLink = (code: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://llm-os-agent.vercel.app';
    const fullUrl = `${baseUrl}/access?code=${code}`;
    
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy shareable link:', err);
      });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAccessCodes();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Check if a date is in the past
  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Render dialog content for creating a new access code
  const renderCreateAccessCodeDialog = (triggerButton: React.ReactNode) => (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Create new access code</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Spring 2025 Class"
              value={newCodeDescription}
              onChange={(e) => setNewCodeDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-code">Custom Code (Optional)</Label>
            <Input
              id="custom-code"
              placeholder="Enter a custom code or leave blank for auto-generated"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal w-full"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              Default expiry is 90 days from now
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={createAccessCode} 
            disabled={creatingCode || !expiryDate}
          >
            {creatingCode ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex-1 p-5 flex flex-col gap-5 w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
        <div>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium max-w-xl">
            Manage access codes that allow students to authenticate and use the chatbot
          </p>
        </div>
        {renderCreateAccessCodeDialog(
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            <span>Create Access Code</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Access Codes</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAccessCodes}
              className="h-8 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeletons
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-10 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 mb-2 font-medium">Error loading access codes</p>
              <p className="text-sm text-red-500 max-w-md mx-auto">{error}</p>
              <Button 
                onClick={fetchAccessCodes}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          ) : accessCodes.length === 0 ? (
            // Empty state
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Shield size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No access codes found</p>
              <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
                Create your first access code to allow users to access the chatbot.
              </p>
              {renderCreateAccessCodeDialog(
                <Button>Create Access Code</Button>
              )}
            </div>
          ) : (
            // Access codes table
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">
                        {code.description || <span className="text-gray-400 italic">No description</span>}
                      </TableCell>
                      <TableCell>
                        {code.revoked ? (
                          <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                            <ShieldOff size={12} />
                            <span>Revoked</span>
                          </Badge>
                        ) : isExpired(code.expires_at) ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 whitespace-nowrap">
                            <span>Expired</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 flex items-center gap-1 whitespace-nowrap">
                            <Shield size={12} />
                            <span>Active</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(code.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={cn(
                          isExpired(code.expires_at) && "text-red-500"
                        )}>
                          {formatDate(code.expires_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {code.session_count > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {code.session_count}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {code.last_used_at ? formatDistanceToNow(new Date(code.last_used_at), { addSuffix: true }) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right flex justify-end items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyCodeToClipboard(code.code)}
                                className={cn(
                                  "h-8 w-8",
                                  copiedCode === code.code && "text-green-600"
                                )}
                              >
                                <Copy size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy access code</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyShareableLink(code.code)}
                                className={cn(
                                  "h-8 w-8",
                                  copiedCode === code.code && "text-blue-600"
                                )}
                              >
                                <Link size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy shareable link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={code.revoked ? "outline" : "ghost"}
                                size="icon"
                                onClick={() => toggleRevokeAccessCode(code.id, code.revoked)}
                                className={cn(
                                  "h-8 w-8",
                                  code.revoked ? "border-green-200 text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"
                                )}
                              >
                                {code.revoked ? <Shield size={16} /> : <ShieldOff size={16} />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{code.revoked ? "Activate code" : "Revoke code"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
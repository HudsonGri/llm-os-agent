import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown } from "lucide-react";
import { SourceCard } from './source-card';
import { DeveloperInfo } from './developer-info';

interface ChatSidebarProps {
  sidebarView: 'sources' | 'dev';
  setSidebarView: (view: 'sources' | 'dev') => void;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  sortBy: 'recent' | 'similarity';
  setSortBy: (sort: 'recent' | 'similarity') => void;
  activeSources: Array<{
    sourceNum: number;
    source: any;
    addedAt: number;
  }>;
  filteredAndSortedSources: Array<{
    sourceNum: number;
    source: any;
    addedAt: number;
  }>;
  messages: any[];
}

export function ChatSidebar({
  sidebarView,
  setSidebarView,
  searchFilter,
  setSearchFilter,
  sortBy,
  setSortBy,
  activeSources,
  filteredAndSortedSources,
  messages
}: ChatSidebarProps) {
  return (
    <div className="w-80 border-l border-zinc-200 bg-white hidden lg:block">
      <div className="p-4 border-b border-zinc-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-zinc-900">
              {sidebarView === 'sources' ? 'Referenced Sources' : 'Developer Info'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSidebarView(view => view === 'sources' ? 'dev' : 'sources')}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          {sidebarView === 'sources' && (
            <span className="text-xs text-zinc-500">
              {activeSources.length} source{activeSources.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {sidebarView === 'sources' && (
          <div className="space-y-2">
            <Input
              placeholder="Search sources..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 text-sm"
            />
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                className="text-xs flex-1 h-8"
                onClick={() => setSortBy('recent')}
              >
                Most Recent
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'similarity' ? 'default' : 'outline'}
                className="text-xs flex-1 h-8"
                onClick={() => setSortBy('similarity')}
              >
                Best Match
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-9.5rem)]">
        <div className="p-4 space-y-4">
          {sidebarView === 'sources' ? (
            filteredAndSortedSources.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 p-4">
                {searchFilter ? 'No matching sources found' : 'No sources referenced yet'}
              </div>
            ) : (
              filteredAndSortedSources.map(({ sourceNum, source }) => (
                <SourceCard 
                  key={sourceNum} 
                  sourceNum={sourceNum} 
                  source={source} 
                />
              ))
            )
          ) : (
            <DeveloperInfo messages={messages} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 
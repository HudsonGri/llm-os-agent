import { memo } from 'react';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronDown } from "lucide-react";

interface SourceCardProps {
  sourceNum: number;
  source: {
    filename?: string;
    url?: string;
    similarity?: number;
    name?: string;
  };
}

export const SourceCard = memo(function SourceCard({ sourceNum, source }: SourceCardProps) {
  return (
    <Card key={sourceNum} className="overflow-hidden group">
      <div className="relative h-40 bg-zinc-100">
        <Image
          src="/placeholder.png"
          alt="Source preview"
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between text-white mb-1">
            <span className="text-sm font-medium truncate flex-1 mr-2">
              {source?.filename || `Source ${sourceNum}`}
            </span>
            <span className="flex-none bg-zinc-900/40 backdrop-blur-xs px-2 py-1 rounded-full text-xs font-medium">
              #{sourceNum}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
              asChild
            >
              <a
                href={source?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source
              </a>
            </Button>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 w-7 p-0 bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent 
                side="left" 
                className="w-80 p-0 overflow-hidden bg-white border border-zinc-200 shadow-lg"
              >
                <div className="relative aspect-video bg-zinc-100">
                  <Image
                    src="/placeholder.png"
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm mb-2 text-zinc-900">
                    {source?.filename || `Source ${sourceNum}`}
                  </div>
                  {source?.similarity && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <div className="w-full bg-zinc-100 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${source.similarity * 100}%` }}
                        />
                      </div>
                      <span className="flex-none tabular-nums text-zinc-600">
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    {source?.name || 'No preview available'}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
    </Card>
  );
}); 
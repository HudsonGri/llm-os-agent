import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  toolInvocations?: Array<{
    toolName: string;
    result?: {
      topic?: string;
      similarity?: number;
      name?: string;
      filename?: string;
      url?: string;
    } | Array<{
      topic?: string;
      similarity: number;
      name: string;
      filename?: string;
      url?: string;
    }>;
  }>;
}

interface DeveloperInfoProps {
  messages: Message[];
}

export function DeveloperInfo({ messages }: DeveloperInfoProps) {
  return (
    <>
      {messages.map((m, i) => (
        m?.toolInvocations && m.toolInvocations.length > 0 && (
          <div key={i} className="space-y-3">
            <div className="text-xs font-medium text-zinc-500">Message #{i + 1}</div>
            {m.toolInvocations.map((tool, toolIndex) => (
              <div key={toolIndex} className="space-y-2">
                <span className="text-xs italic text-zinc-500 block">
                  {'Results from: ' + tool.toolName}
                </span>
                {tool.toolName === 'getInformation' && tool.result && (
                  <div className="space-y-2">
                    <ScrollArea className="max-h-[400px] overflow-y-scroll rounded-xl border border-zinc-200">
                      <div className="p-2 space-y-2">
                        {Array.isArray(tool.result) && tool.result.map((result: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-zinc-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm text-zinc-900">Content #{i + 1}</div>
                              <div className="text-zinc-500 text-xs">
                                Similarity: {(result.similarity * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-zinc-600 text-sm border-t border-zinc-200 pt-2">
                              {result.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                {tool.toolName === 'tagResponse' && tool.result && (
                  <div className="p-3 rounded-lg bg-zinc-50">
                    <div className="text-sm text-zinc-900">
                      <div className="font-medium">Topic: {tool.result.topic}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ))}
    </>
  );
} 
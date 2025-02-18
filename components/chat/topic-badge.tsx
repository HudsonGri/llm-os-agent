interface TopicBadgeProps {
  topic: string;
}


export function TopicBadge({ topic }: TopicBadgeProps) {
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
      {topic}
    </span>
  );
} 
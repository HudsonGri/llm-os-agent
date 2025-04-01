import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-900">Page not found</h1>
          <p className="text-zinc-600">
            We couldn't find the page you're looking for.
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            variant="default"
            asChild
            className="bg-zinc-900 hover:bg-zinc-800"
          >
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 
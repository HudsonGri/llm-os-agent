import { redirect } from 'next/navigation';
import AccessForm from '@/components/auth/AccessForm';
import { verifySession } from '@/lib/actions/auth';
import { ChatLogo } from '@/components/ui/chat-logo';
import Link from 'next/link';

export default async function AccessPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string };
}) {
  // Check if user is already authenticated
  const session = await verifySession();
  
  // If already authenticated, redirect to home page
  if (session) {
    redirect('/');
  }
  
  let error = searchParams.error || null;
  
  // If code is provided in URL, redirect to the consolidated API route for validation
  if (searchParams.code) {
    redirect(`/api/auth?code=${encodeURIComponent(searchParams.code)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 relative">
      {/* Add gradient and dot grid pattern background */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 to-zinc-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#e0e0e0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
      
      <div className="w-full max-w-xl p-10 space-y-8 bg-white rounded-2xl shadow-sm border border-zinc-100 relative z-10">
        <div className="text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-3">
              <ChatLogo className="w-16 h-16" fill="#3c74d4" />
              <h1 className="text-3xl font-semibold text-zinc-900">OS Chat Assistant</h1>
            </div>
            <p className="text-zinc-500">
              Enter your access code to continue
            </p>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
        </div>
        
        <AccessForm />
      </div>
      
      {/* Footer links */}
      <div className="absolute bottom-6 flex justify-center w-full">
        <Link href="/about" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
          More Information
        </Link>
      </div>
    </div>
  );
} 
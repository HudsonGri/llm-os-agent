'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AccessForm() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Redirect to the root path
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="accessCode" className="text-sm font-medium text-zinc-700">
          Access Code
        </Label>
        <Input
          id="accessCode"
          name="accessCode"
          type="text"
          autoComplete="off"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          required
          className="w-full"
          placeholder="Enter your access code"
          // Use CSS to mask the input with bullets (fixed TypeScript error)
          style={{ WebkitTextSecurity: 'disc' } as any}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
} 
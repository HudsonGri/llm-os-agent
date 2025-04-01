'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  showBackArrow?: boolean;
}

export default function AdminHeader({ title = 'Instructor Dashboard', showBackArrow = true }: AdminHeaderProps) {
  return (
    <header className="flex items-center gap-4 bg-gray-100 p-4 border-b border-gray-300">
      {showBackArrow && (
        <Link href="/admin" className="text-gray-700 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}

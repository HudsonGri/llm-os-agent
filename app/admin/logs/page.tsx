import React, { Suspense } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLogs from '@/components/admin/logs/AdminLogs';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Chat Logs - Admin',
  description: 'View chat logs for the chatbot',
};

// Loader component to display while AdminLogs is loading
const LogsLoader = () => (
  <div className="flex-1 p-5 flex flex-col gap-5 w-full mx-auto">
    <Skeleton className="w-full h-32" />
    <Skeleton className="w-full h-96" />
  </div>
);

export default function LogsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Interaction Logs" />
      <Suspense fallback={<LogsLoader />}>
        <AdminLogs />
      </Suspense>
    </div>
  );
}

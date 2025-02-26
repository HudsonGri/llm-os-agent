'use client';

import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLogs from '@/components/admin/logs/AdminLogs';

export default function LogsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Interaction Logs" />
      <AdminLogs />
    </div>
  );
}

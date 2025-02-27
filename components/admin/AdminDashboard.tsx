'use client';

import React from 'react';
import AdminHeader from './AdminHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EngagementChart from './charts/EngagementChart';
import KeyMetrics from './stats/KeyMetrics';
import RecentLogs from './RecentLogs';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Instructor Dashboard" showBackArrow={false} />

      <div className="bg-gray-100 text-gray-700 px-4 py-2 font-semibold border-b border-gray-200">
        Student Engagement Analytics
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Engagement Chart and Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="col-span-1">
            <EngagementChart />
          </div>
          <div className="col-span-1">
            <KeyMetrics />
          </div>
        </div>

        {/* Recent Logs Section */}
        <RecentLogs />
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Access more administrative tools and configuration options
          </span>
          <Link href="/admin/settings">
            <Button variant="outline">
              Admin Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

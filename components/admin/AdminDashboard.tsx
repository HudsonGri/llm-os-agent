'use client';

import React from 'react';
import AdminHeader from './AdminHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EngagementChart from './charts/EngagementChart';
import KeyMetrics from './stats/KeyMetrics';
import RecentLogs from './RecentLogs';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminHeader title="Admin Dashboard" showBackArrow={false} />


      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Dashboard Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Engagement Chart */}
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[500px]">
              <EngagementChart />
            </div>
          </div>
          
          {/* Right column - Key Metrics */}
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[500px]">
              <KeyMetrics />
            </div>
          </div>
        </div>

        {/* Recent Logs Section */}
        <div className="pt-2">
          <RecentLogs />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500 text-center sm:text-left">
            Access more administrative tools and configuration options
          </span>
          <div className="flex space-x-3">
            <Link href="/admin/logs">
              <Button variant="outline" size="sm">
                View All Logs
              </Button>
            </Link>
            <Link href="/admin/access">
              <Button variant="outline" size="sm">
                Access Management
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="default" size="sm">
                Admin Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

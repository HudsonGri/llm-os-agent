'use client';

import React from 'react';
import AdminHeader from './AdminHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Instructor Dashboard" showBackArrow={false} />

      <div className="bg-gray-200 text-gray-700 px-4 py-2 font-semibold">
        Student Engagement Metrics & Trends
      </div>

      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex flex-col w-full md:w-1/2 gap-4">
          <div className="bg-white border border-gray-300 p-4">
            <h2 className="text-lg font-semibold mb-2">Key Statistics</h2>
            <p>Student participation: 90%</p>
            <p className="mt-2">Common topics:</p>
            <ul className="list-disc list-inside ml-4">
              <li>OS Fundamentals</li>
              <li>Processes & Threads</li>
            </ul>
            <p className="mt-2">Query success rate: 85%</p>
            <p className="mt-2 font-semibold">Flagged queries:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Query 1 (<a href="#log1" className="text-blue-600 underline">Log 1</a>)</li>
              <li>Query 2 (<a href="#log2" className="text-blue-600 underline">Log 2</a>)</li>
              <li>Query 3 (<a href="#log3" className="text-blue-600 underline">Log 3</a>)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <Link href="/admin/logs">
              <Button variant="outline">View Logs</Button>
            </Link>
            <div className="divide-y divide-gray-200">
              <div id="log1" className="py-2 text-sm">Log 1: Date/Time, Topic</div>
              <div id="log2" className="py-2 text-sm">Log 2: Date/Time, Topic</div>
              <div id="log3" className="py-2 text-sm">Log 3: Date/Time, Topic</div>
              <div className="py-2 text-sm">Log 4: Date/Time, Topic</div>
              <div className="py-2 text-sm">Log 5: Date/Time, Topic</div>
              <div className="py-2 text-sm">Log 6: Date/Time, Topic</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-1/2 gap-4">
          <div className="bg-white border border-gray-300 p-4 flex flex-col">
            <label htmlFor="chartType" className="font-semibold mb-2">
              Select chart display...
            </label>
            <select
              id="chartType"
              className="border border-gray-300 rounded p-2 mb-4"
              defaultValue=""
            >
              <option value="" disabled hidden>Select a chart...</option>
              <option value="engagement">Daily Engagement</option>
              <option value="topics">Topic Popularity</option>
            </select>

            <div className="flex-1 border border-gray-200 rounded p-4 text-center text-sm text-gray-500">
              <p>Chart of # of interactions per day vs. date</p>
              <p>(Shows peaks in engagement before exams or projects)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 p-4">
        <Link href="/admin/settings">
          <Button variant="default" className="w-full md:w-auto">
            Admin Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}

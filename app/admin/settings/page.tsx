import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSettings from '@/components/admin/settings/AdminSettings';

export const metadata = {
  title: 'Settings - Admin',
  description: 'Manage settings for the chatbot',
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Settings" />
      <AdminSettings />
    </div>
  );
}

import React from 'react';
import AccessTokens from '@/components/admin/access/AccessTokens';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Access Management - Admin',
  description: 'Manage access codes and sessions for the chatbot',
};

export default function AccessManagementPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminHeader title="Access Management" showBackArrow={true} />
      <AccessTokens />
    </div>
  );
} 
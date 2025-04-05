import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Dashboard - Admin',
  description: 'Admin dashboard for the chatbot',
};

export default function AdminPage() {
  return (
    <AdminDashboard />
  );
}
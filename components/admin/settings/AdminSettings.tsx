'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  const [model, setModel] = React.useState('');
  const [agentInstructions, setAgentInstructions] = React.useState('');
  const [retention, setRetention] = React.useState('');
  const [apiKey, setApiKey] = React.useState('canvas_API_key');
  const [ingestionFrequency, setIngestionFrequency] = React.useState('');

  const handleSave = () => {
    console.log({
      model,
      agentInstructions,
      retention,
      apiKey,
      ingestionFrequency,
    });
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="bg-gray-100 border border-gray-300 p-8 rounded-md text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h2>
        <p className="text-gray-600">Admin settings features are currently under development and will be available soon.</p>
      </div>
      
      <div className="bg-white border border-gray-300 p-4 opacity-50 pointer-events-none">
        <h2 className="font-semibold mb-2">Model Behavior Settings</h2>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full md:w-1/2 mb-4"
        >
          <option value="" hidden>
            Select model...
          </option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-o1">GPT-o1</option>
        </select>

        <Textarea
          placeholder="Update LLM agent instructions..."
          value={agentInstructions}
          onChange={(e) => setAgentInstructions(e.target.value)}
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="bg-white border border-gray-300 p-4 opacity-50 pointer-events-none">
        <h2 className="font-semibold mb-2">Chat History Retention</h2>
        <select
          value={retention}
          onChange={(e) => setRetention(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full md:w-1/2"
        >
          <option value="" hidden>
            Select retention duration...
          </option>
          <option value="14days">14 days</option>
          <option value="30days">30 days</option>
          <option value="90days">90 days</option>
        </select>
      </div>

      <div className="bg-white border border-gray-300 p-4 opacity-50 pointer-events-none">
        <h2 className="font-semibold mb-2">API & Ingestion Settings</h2>
        <label className="block mb-2">Canvas API Key</label>
        <Input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mb-4 w-full md:w-1/2"
        />

        <label className="block mb-2">Select ingestion frequency...</label>
        <select
          value={ingestionFrequency}
          onChange={(e) => setIngestionFrequency(e.target.value)}
          className="border border-gray-300 rounded p-2 mb-4 w-full md:w-1/2"
        >
          <option value="" hidden>
            Select ingestion frequency...
          </option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <label className="block mb-2">Upload file</label>
        <Input type="file" className="mb-4 w-full md:w-1/2" />

        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Settings, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SampleQuestionsManager } from './SampleQuestionsManager';

export default function AdminSettings() {
  const [model, setModel] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [retention, setRetention] = useState('');
  const [apiKey, setApiKey] = useState('canvas_API_key');
  const [ingestionFrequency, setIngestionFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      console.log({
        model,
        agentInstructions,
        retention,
        apiKey,
        ingestionFrequency,
      });
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="flex-1 p-5 flex flex-col gap-5 w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
        <div>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium max-w-xl">
            Configure system settings and behavior for your LLM agent
          </p>
        </div>
      </div>

      <div className="mb-5">
        <SampleQuestionsManager />
      </div>

      <Card className="opacity-60 pointer-events-none">
        <CardHeader className="pb-3">
          <CardTitle>Model Behavior Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="model-select">LLM Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model-select" className="w-full md:w-1/2">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-o1">GPT-o1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agent-instructions">Agent Instructions</Label>
            <Textarea
              id="agent-instructions"
              placeholder="Update LLM agent instructions..."
              value={agentInstructions}
              onChange={(e) => setAgentInstructions(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="opacity-60 pointer-events-none">
        <CardHeader className="pb-3">
          <CardTitle>Chat History Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="retention-duration">Retention Duration</Label>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger id="retention-duration" className="w-full md:w-1/2">
                <SelectValue placeholder="Select retention duration..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14days">14 days</SelectItem>
                <SelectItem value="30days">30 days</SelectItem>
                <SelectItem value="90days">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="opacity-60 pointer-events-none">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>API & Ingestion Settings</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Test Connection</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">Canvas API Key</Label>
            <Input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full md:w-1/2"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ingestion-frequency">Ingestion Frequency</Label>
            <Select value={ingestionFrequency} onValueChange={setIngestionFrequency}>
              <SelectTrigger id="ingestion-frequency" className="w-full md:w-1/2">
                <SelectValue placeholder="Select ingestion frequency..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input id="file-upload" type="file" className="w-full md:w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

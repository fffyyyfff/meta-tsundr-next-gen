'use client';

import { useState, useCallback } from 'react';
import { useTemplateStore, extractVariables, type AgentType, type TaskTemplate } from '@/stores/templateStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AGENT_TYPES: { value: AgentType; label: string }[] = [
  { value: 'design', label: 'Design Agent' },
  { value: 'code-review', label: 'Code Review Agent' },
  { value: 'test-gen', label: 'Test Generation Agent' },
  { value: 'task-mgmt', label: 'Task Management Agent' },
];

interface TemplateEditorProps {
  /** Pass an existing template to edit; omit to create new */
  template?: TaskTemplate;
  onClose: () => void;
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const { add, update } = useTemplateStore();

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [agentType, setAgentType] = useState<AgentType>(template?.agentType ?? 'design');
  const [prompt, setPrompt] = useState(template?.prompt ?? '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!template;
  const detectedVars = extractVariables(prompt);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!prompt.trim()) {
      setError('Prompt template is required');
      return;
    }

    if (isEditing && template) {
      update(template.id, { name, description, agentType, prompt });
    } else {
      add({ name, description, agentType, prompt });
    }
    onClose();
  }, [name, description, agentType, prompt, isEditing, template, add, update, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit template' : 'Create template'}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <Card className="relative w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? 'Edit Template' : 'New Template'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close editor">
              &times;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/30">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="e.g. My Custom Review Template"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-desc">Description</Label>
              <Input
                id="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this template do?"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-agent">Agent Type</Label>
              <select
                id="tpl-agent"
                value={agentType}
                onChange={(e) => setAgentType(e.target.value as AgentType)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Select agent type for template"
              >
                {AGENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-prompt">
                Prompt Template
              </Label>
              <textarea
                id="tpl-prompt"
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(null); }}
                placeholder={'Use {{variableName}} for dynamic values\ne.g. Review {{filePath}} for {{focusAreas}}'}
                rows={5}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {detectedVars.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  <span className="text-xs text-muted-foreground">Variables:</span>
                  {detectedVars.map((v) => (
                    <Badge key={v} variant="outline">{`{{${v}}}`}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {isEditing ? 'Save Changes' : 'Create Template'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

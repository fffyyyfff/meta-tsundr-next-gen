'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTemplateStore, extractVariables, expandTemplate, type TaskTemplate, type AgentType } from '@/stores/templateStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  design: 'Design',
  'code-review': 'CodeReview',
  'test-gen': 'TestGen',
  'task-mgmt': 'TaskMgmt',
};

const CATEGORY_TABS: { value: 'all' | AgentType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'design', label: 'Design' },
  { value: 'code-review', label: 'CodeReview' },
  { value: 'test-gen', label: 'TestGen' },
  { value: 'task-mgmt', label: 'TaskMgmt' },
];

interface TemplateSelectorProps {
  onSelect: (task: string, agentType: AgentType) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const { templates } = useTemplateStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | AgentType>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (category !== 'all' && t.agentType !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, category, search]);

  const handleSelectTemplate = useCallback((template: TaskTemplate) => {
    setSelectedTemplate(template);
    const vars = extractVariables(template.prompt);
    const initial: Record<string, string> = {};
    for (const v of vars) initial[v] = '';
    setVariables(initial);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedTemplate) return;
    const expanded = expandTemplate(selectedTemplate.prompt, variables);
    onSelect(expanded, selectedTemplate.agentType);
  }, [selectedTemplate, variables, onSelect]);

  const variableNames = selectedTemplate ? extractVariables(selectedTemplate.prompt) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Template selector"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg border border-border bg-background shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Task Templates</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close template selector">
            &times;
          </Button>
        </div>

        {/* Search + Category tabs */}
        <div className="border-b border-border px-4 py-3 space-y-3">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
          />
          <div className="flex gap-1 flex-wrap">
            {CATEGORY_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={category === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Template list or variable form */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  &larr; Back
                </Button>
                <span className="font-medium">{selectedTemplate.name}</span>
                <Badge variant={selectedTemplate.category === 'preset' ? 'default' : 'outline'}>
                  {selectedTemplate.category}
                </Badge>
              </div>

              <div className="rounded-md bg-muted/50 p-3">
                <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {selectedTemplate.prompt}
                </pre>
              </div>

              {variableNames.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Fill in variables:</p>
                  {variableNames.map((varName) => (
                    <div key={varName} className="space-y-1">
                      <Label htmlFor={`var-${varName}`} className="text-xs">
                        {`{{${varName}}}`}
                      </Label>
                      <Input
                        id={`var-${varName}`}
                        value={variables[varName] ?? ''}
                        onChange={(e) =>
                          setVariables((prev) => ({ ...prev, [varName]: e.target.value }))
                        }
                        placeholder={varName}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {expandTemplate(selectedTemplate.prompt, variables)}
                </pre>
              </div>

              <Button onClick={handleApply} className="w-full">
                Apply Template
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No templates found.
                </p>
              ) : (
                filtered.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {AGENT_TYPE_LABELS[template.agentType]}
                          </Badge>
                          {template.category === 'custom' && (
                            <Badge variant="default">custom</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

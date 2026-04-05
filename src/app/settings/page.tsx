"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { ArrowLeftIcon, CheckCircleIcon, Loader2Icon } from "lucide-react";

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("slack-webhook-url") ?? "";
  });
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );
  const [testing, setTesting] = useState(false);

  const handleSave = useCallback(() => {
    localStorage.setItem("slack-webhook-url", webhookUrl);
    setTestResult(null);
  }, [webhookUrl]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "\uD83D\uDD14 Meta-tsundr \u30C6\u30B9\u30C8\u901A\u77E5 - Slack\u9023\u643A\u304C\u6B63\u5E38\u306B\u8A2D\u5B9A\u3055\u308C\u307E\u3057\u305F\uFF01",
        }),
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  }, [webhookUrl]);

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Button variant="ghost" size="sm" render={<Link href="/" />}>
        <ArrowLeftIcon className="mr-1 size-4" />
        {"\u623B\u308B"}
      </Button>

      <PageHeader
        title={"\u8A2D\u5B9A"}
        description={"\u30A2\u30D7\u30EA\u306E\u5404\u7A2E\u8A2D\u5B9A"}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {"Slack\u9023\u643A"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="webhook-url"
              className="mb-1.5 block text-sm text-muted-foreground"
            >
              Webhook URL
            </label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={webhookUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setWebhookUrl(e.target.value)
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {"Slack Incoming Webhook URL\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave}>
              {"\u4FDD\u5B58"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!webhookUrl || testing}
            >
              {testing ? (
                <Loader2Icon className="mr-1 size-4 animate-spin" />
              ) : null}
              {"\u30C6\u30B9\u30C8\u9001\u4FE1"}
            </Button>
          </div>

          {testResult === "success" && (
            <p className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircleIcon className="size-4" />
              {"\u30C6\u30B9\u30C8\u9001\u4FE1\u6210\u529F"}
            </p>
          )}
          {testResult === "error" && (
            <p className="text-sm text-destructive">
              {"\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002URL\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

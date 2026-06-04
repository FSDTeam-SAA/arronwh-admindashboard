"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "grapesjs";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Save,
  SquarePen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type EmailTemplateVariable = {
  key: string;
  label: string;
  description?: string;
  sampleValue?: string;
  required?: boolean;
};

type EmailTemplateListItem = {
  _id: string;
  key: string;
  name: string;
  description?: string;
  subject: string;
  isCustomized: boolean;
  updatedAt?: string;
  variables?: EmailTemplateVariable[];
};

type EmailTemplateDetail = EmailTemplateListItem & {
  html: string;
  defaultHtml: string;
  defaultSubject: string;
  grapesJsProject?: Record<string, unknown> | null;
  missingVariables?: string[];
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type EmailParts = {
  headWithoutStyles: string;
  bodyAttributes: string;
  body: string;
  css: string;
};

type EditorViewMode = "builder" | "preview";

const getEmailTemplatesEndpoint = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/email-templates` : "/email-templates";
};

const hasExplicitFailure = (payload: unknown) =>
  Boolean(
    payload &&
      typeof payload === "object" &&
      (payload as { success?: boolean }).success === false,
  );

const unwrapData = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as ApiResponse<T>;
  return response.data ?? null;
};

const extractEmailParts = (html: string): EmailParts => {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  const rawHead = headMatch?.[1] ?? '<meta charset="UTF-8" />';
  const css = Array.from(rawHead.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1])
    .join("\n");

  return {
    headWithoutStyles: rawHead.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""),
    bodyAttributes: bodyMatch?.[1] ?? "",
    body: bodyMatch?.[2] ?? html,
    css,
  };
};

const splitStyleTags = (html: string) => {
  const css = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1])
    .join("\n");

  return {
    html: html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""),
    css,
  };
};

const rawTableRowTokens = ["quote.couponRow", "quote.quizRows"] as const;

const createRawTableRowPlaceholder = (token: string) => `
<tr data-email-raw-row-token="${token}">
  <td colspan="2" style="padding:10px 0;font-size:13px;color:#43505c;text-align:center;border:1px dashed #cbd5e1;background:#f8fafc;">
    {{{${token}}}}
  </td>
</tr>`;

const restoreRawTableRowTokens = (html: string) =>
  rawTableRowTokens.reduce((current, token) => {
    const placeholderPattern = new RegExp(
      `<tr\\b(?=[^>]*data-email-raw-row-token=["']${token}["'])[^>]*>[\\s\\S]*?<\\/tr>`,
      "gi",
    );

    return current.replace(placeholderPattern, `{{{${token}}}}`);
  }, html);

const protectRawTableRowTokens = (html: string) => {
  const restored = restoreRawTableRowTokens(html);

  return rawTableRowTokens.reduce((current, token) => {
    const tokenPattern = new RegExp(
      `{{{\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*}}}`,
      "g",
    );

    return current.replace(tokenPattern, createRawTableRowPlaceholder(token));
  }, restored);
};

export default function EmailTemplatesContainer() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const emailPartsRef = useRef<EmailParts | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  const [templates, setTemplates] = useState<EmailTemplateListItem[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateDetail | null>(null);
  const [subject, setSubject] = useState("");
  const [missingVariables, setMissingVariables] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<EditorViewMode>("builder");
  const [sentPreviewHtml, setSentPreviewHtml] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [isEditorBooting, setIsEditorBooting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : null),
    [token],
  );

  const selectedSummary = useMemo(
    () => templates.find((item) => item.key === selectedKey),
    [selectedKey, templates],
  );

  const fetchTemplates = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (!authHeaders) {
      setIsListLoading(false);
      return;
    }

    setIsListLoading(true);
    try {
      const response = await fetch(getEmailTemplatesEndpoint(), {
        headers: authHeaders,
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(
          (payload as ApiResponse<unknown> | null)?.message ??
            "Failed to load email templates.",
        );
      }

      const data = unwrapData<EmailTemplateListItem[]>(payload) ?? [];
      setTemplates(data);
      setSelectedKey((current) => current || data[0]?.key || "");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load email templates.",
      );
    } finally {
      setIsListLoading(false);
    }
  }, [authHeaders, sessionStatus]);

  const fetchTemplate = useCallback(
    async (key: string) => {
      if (!key) return;
      if (sessionStatus === "loading") return;

      if (!authHeaders) {
        setIsTemplateLoading(false);
        toast.error("Authorization token missing. Please login again.");
        return;
      }

      setIsTemplateLoading(true);
      try {
        const response = await fetch(`${getEmailTemplatesEndpoint()}/${key}`, {
          headers: authHeaders,
        });
        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok || hasExplicitFailure(payload)) {
          throw new Error(
            (payload as ApiResponse<unknown> | null)?.message ??
              "Failed to load selected template.",
          );
        }

        const data = unwrapData<EmailTemplateDetail>(payload);
        if (!data) throw new Error("Invalid email template response.");

        setSelectedTemplate(data);
        setSubject(data.subject);
        setMissingVariables(data.missingVariables ?? []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load selected template.",
        );
      } finally {
        setIsTemplateLoading(false);
      }
    },
    [authHeaders, sessionStatus],
  );

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    void fetchTemplate(selectedKey);
  }, [fetchTemplate, selectedKey]);

  useEffect(() => {
    let isMounted = true;

    const bootEditor = async () => {
      if (!editorContainerRef.current || editorRef.current) return;

      setIsEditorBooting(true);
      const [{ default: grapesjs }, { default: newsletterPreset }] =
        await Promise.all([
          import("grapesjs"),
          import("grapesjs-preset-newsletter"),
        ]);

      if (!isMounted || !editorContainerRef.current) return;

      editorRef.current = grapesjs.init({
        container: editorContainerRef.current,
        height: "720px",
        fromElement: false,
        storageManager: false,
        plugins: [newsletterPreset],
        pluginsOpts: {
          "grapesjs-preset-newsletter": {
            inlineCss: true,
            juiceOpts: {
              removeStyleTags: false,
            },
          },
        },
        canvas: {
          styles: [],
        },
      });

      setIsEditorBooting(false);
    };

    void bootEditor().catch((error) => {
      setIsEditorBooting(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to load email editor.",
      );
    });

    return () => {
      isMounted = false;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !selectedTemplate) return;

    const editorSafeHtml = protectRawTableRowTokens(selectedTemplate.html);
    const parts = extractEmailParts(editorSafeHtml);
    emailPartsRef.current = parts;
    setSentPreviewHtml(selectedTemplate.html);

    if (
      selectedTemplate.grapesJsProject &&
      selectedTemplate.key !== "quote-summary"
    ) {
      editor.loadProjectData(selectedTemplate.grapesJsProject);
    } else {
      editor.setStyle(parts.css);
      editor.setComponents(parts.body);
    }
  }, [selectedTemplate, isEditorBooting]);

  const buildCurrentHtml = useCallback(() => {
    const editor = editorRef.current;
    const parts = emailPartsRef.current;
    if (!editor || !parts) return selectedTemplate?.html ?? "";

    const exportedHtml = editor.runCommand("gjs-get-inlined-html");
    const exportedBody =
      typeof exportedHtml === "string" && exportedHtml.trim()
        ? exportedHtml
        : `${editor.getHtml()}<style>${editor.getCss()}</style>`;
    const exportedParts = /<html|<head|<body/i.test(exportedBody)
      ? extractEmailParts(exportedBody)
      : null;
    const splitExported = splitStyleTags(
      exportedParts?.body ?? exportedBody,
    );
    const bodyAttributes = exportedParts?.bodyAttributes || parts.bodyAttributes;
    const headWithoutStyles =
      exportedParts?.headWithoutStyles || parts.headWithoutStyles;
    const css = [exportedParts?.css, splitExported.css]
      .filter(Boolean)
      .join("\n");

    return restoreRawTableRowTokens(`<!doctype html>
<html lang="en">
<head>
${headWithoutStyles}
${css.trim() ? `<style>\n${css}\n</style>` : ""}
</head>
<body${bodyAttributes}>
${splitExported.html}
</body>
</html>`);
  }, [selectedTemplate?.html]);

  const refreshSentPreview = useCallback(() => {
    setSentPreviewHtml(buildCurrentHtml());
  }, [buildCurrentHtml]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleEditorUpdate = () => {
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
      }

      previewTimerRef.current = window.setTimeout(() => {
        refreshSentPreview();
      }, 500);
    };

    editor.on("update", handleEditorUpdate);

    return () => {
      editor.off("update", handleEditorUpdate);
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
      }
    };
  }, [isEditorBooting, refreshSentPreview]);

  const handleCopyToken = async (key: string) => {
    const tokenValue = `{{${key}}}`;
    await navigator.clipboard.writeText(tokenValue);
    toast.success(`${tokenValue} copied.`);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!authHeaders) {
      toast.error("Authorization token missing. Please login again.");
      return;
    }

    setIsSaving(true);
    try {
      const editor = editorRef.current;
      const html = buildCurrentHtml();
      setSentPreviewHtml(html);
      const response = await fetch(
        `${getEmailTemplatesEndpoint()}/${selectedTemplate.key}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            subject: subject.trim(),
            html,
            grapesJsProject: editor?.getProjectData() ?? null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(
          (payload as ApiResponse<unknown> | null)?.message ??
            "Failed to update email template.",
        );
      }

      const data = unwrapData<EmailTemplateDetail>(payload);
      if (data) {
        setSelectedTemplate(data);
        setSubject(data.subject);
        setMissingVariables(data.missingVariables ?? []);
      }

      toast.success("Email template updated successfully.");
      void fetchTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update email template.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedTemplate) return;
    if (!authHeaders) {
      toast.error("Authorization token missing. Please login again.");
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(
        `${getEmailTemplatesEndpoint()}/${selectedTemplate.key}/reset`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(
          (payload as ApiResponse<unknown> | null)?.message ??
            "Failed to reset email template.",
        );
      }

      toast.success("Email template reset successfully.");
      await fetchTemplate(selectedTemplate.key);
      void fetchTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reset email template.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#FBFF26] text-slate-900">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight text-slate-950">
                Email Templates
              </h1>
              <p className="text-sm text-slate-500">
                {selectedSummary?.description ?? "Manage Nodemailer email HTML."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[280px_1fr] lg:min-w-[580px]">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Template Name
            </Label>
            <Select
              value={selectedKey}
              onValueChange={(value) => setSelectedKey(value)}
              disabled={isListLoading || !templates.length}
            >
              <SelectTrigger className="h-11 rounded-[6px] border-slate-300 bg-white">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Subject</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-11 rounded-[6px] border-slate-300 bg-white"
              disabled={!selectedTemplate || isTemplateLoading}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between ">
            <h2 className="text-base font-semibold text-slate-950">Templates</h2>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void fetchTemplates()}
              disabled={isListLoading}
              title="Refresh"
              className="rounded-[6px]"
            >
              <RefreshCw
                className={cn("h-4 w-4", isListLoading && "animate-spin")}
              />
            </Button>
          </div>

          <div className="space-y-2">
            {templates?.map((template) => {
              const isActive = template.key === selectedKey;

              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setSelectedKey(template.key)}
                  className={cn(
                    "w-full rounded-[6px] border px-3 py-3 text-left transition",
                    isActive
                      ? "border-slate-900 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span className="block truncate text-sm font-semibold">
                    {template.name}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-xs",
                      isActive ? "text-slate-300" : "text-slate-500",
                    )}
                  >
                    {template.isCustomized ? "Customized" : "Default"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-950">
                Dynamic Fields
              </h2>
              <Badge variant="outline" className="rounded-[6px]">
                {selectedTemplate?.variables?.length ?? 0}
              </Badge>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {(selectedTemplate?.variables ?? []).map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => void handleCopyToken(variable.key)}
                  className="flex w-full items-start gap-2 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {variable.label}
                    </span>
                    <code className="mt-1 block truncate text-[11px] text-slate-500">
                      {"{{"}
                      {variable.key}
                      {"}}"}
                    </code>
                  </span>
                </button>
              ))}
            </div>

            {missingVariables.length > 0 && (
              <div className="rounded-[6px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Missing: {missingVariables.join(", ")}
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 rounded-[8px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-950">
                {selectedTemplate?.name ?? "Email Builder"}
              </h2>
              <p className="text-sm text-slate-500">
                {selectedTemplate?.isCustomized ? "Customized" : "Default"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeView === "builder" ? "default" : "outline"}
                onClick={() => setActiveView("builder")}
                className={cn(
                  "h-9 rounded-[6px]",
                  activeView === "builder" &&
                    "bg-slate-950 text-white hover:bg-slate-800",
                )}
              >
                <SquarePen className="h-4 w-4" />
                Builder
              </Button>
              <Button
                type="button"
                variant={activeView === "preview" ? "default" : "outline"}
                onClick={() => {
                  refreshSentPreview();
                  setActiveView("preview");
                }}
                className={cn(
                  "h-9 rounded-[6px]",
                  activeView === "preview" &&
                    "bg-slate-950 text-white hover:bg-slate-800",
                )}
              >
                <Eye className="h-4 w-4" />
                Sent Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!selectedTemplate || !authHeaders || isResetting || isSaving}
                className="h-9 rounded-[6px]"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!selectedTemplate || !authHeaders || isSaving || isTemplateLoading}
                className="h-9 rounded-[6px] bg-slate-950 text-white hover:bg-slate-800"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update
              </Button>
            </div>
          </div>

          <div className="relative min-h-[720px]">
            {(isTemplateLoading || isEditorBooting) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
              </div>
            )}
            <div
              ref={editorContainerRef}
              className={cn(
                "min-h-[720px]",
                activeView === "preview" && "hidden",
              )}
            />
            <div
              className={cn(
                "min-h-[720px] bg-[#eef1f4] p-4",
                activeView === "builder" && "hidden",
              )}
            >
              <iframe
                title="Sent email preview"
                srcDoc={sentPreviewHtml || selectedTemplate?.html || ""}
                className="h-[720px] w-full rounded-[6px] border border-slate-200 bg-white"
                sandbox=""
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

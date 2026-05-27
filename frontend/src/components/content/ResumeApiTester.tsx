"use client";

import { useState } from "react";
import { API } from "@/constants";

type Result = { status: number; data: unknown } | null;

function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const call = async (url: string, method: string, body?: unknown) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      });
      const data = await res.json().catch(() => null);
      setResult({ status: res.status, data });
    } catch (err) {
      setResult({ status: 0, data: { error: String(err) } });
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, call };
}

function ResultBox({ result, loading }: { result: Result; loading: boolean }) {
  if (loading) return <p className="text-txt-muted text-xs">Loading…</p>;
  if (!result) return null;
  const ok = result.status >= 200 && result.status < 300;
  return (
    <pre
      className={`mt-2 max-h-40 overflow-auto rounded-md p-2 text-xs ${ok ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"}`}
    >
      {result.status} — {JSON.stringify(result.data, null, 2)}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border rounded-lg border p-4">
      <p className="text-txt-muted mb-3 text-xs font-semibold uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-border bg-bg-secondary text-txt focus:border-accent w-full rounded-md border px-3 py-1.5 text-sm outline-none"
    />
  );
}

function Btn({
  onClick,
  disabled,
  variant = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50 ${
        variant === "danger"
          ? "bg-red-600 text-white hover:opacity-80"
          : "bg-accent text-white hover:opacity-80"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------

function AnalyzeSection() {
  const [jobUrl, setJobUrl] = useState("");
  const { loading, result, call } = useApiCall();
  return (
    <Section title="POST /resume/analyze">
      <div className="flex gap-2">
        <Input value={jobUrl} onChange={setJobUrl} placeholder="https://company.com/job/123" />
        <Btn onClick={() => call(API.RESUME_ANALYZE, "POST", { jobUrl })} disabled={loading || !jobUrl}>
          Analyze
        </Btn>
      </div>
      <ResultBox result={result} loading={loading} />
    </Section>
  );
}

function HistorySection() {
  const { loading, result, call } = useApiCall();
  return (
    <Section title="GET /resume/history">
      <Btn onClick={() => call(API.RESUME_HISTORY, "GET")} disabled={loading}>
        Fetch history
      </Btn>
      <ResultBox result={result} loading={loading} />
    </Section>
  );
}

function StatusSection() {
  const [trackingId, setTrackingId] = useState("");
  const { loading, result, call } = useApiCall();
  return (
    <Section title="GET /resume/status/:trackingId">
      <div className="flex gap-2">
        <Input value={trackingId} onChange={setTrackingId} placeholder="tracking-id" />
        <Btn
          onClick={() => call(API.RESUME_STATUS(trackingId), "GET")}
          disabled={loading || !trackingId}
        >
          Get status
        </Btn>
      </div>
      <ResultBox result={result} loading={loading} />
    </Section>
  );
}

function ResumeByIdSection() {
  const [resumeId, setResumeId] = useState("");
  const getApi = useApiCall();
  const deleteApi = useApiCall();
  return (
    <Section title="GET · DELETE /resume/:resumeId">
      <div className="flex gap-2">
        <Input value={resumeId} onChange={setResumeId} placeholder="resume-id" />
        <Btn
          onClick={() => getApi.call(API.RESUME_BY_ID(resumeId), "GET")}
          disabled={getApi.loading || !resumeId}
        >
          Get
        </Btn>
        <Btn
          variant="danger"
          onClick={() => deleteApi.call(API.RESUME_BY_ID(resumeId), "DELETE")}
          disabled={deleteApi.loading || !resumeId}
        >
          Delete
        </Btn>
      </div>
      <ResultBox result={getApi.result} loading={getApi.loading} />
      <ResultBox result={deleteApi.result} loading={deleteApi.loading} />
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function ResumeApiTester() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="text-txt-muted mb-4 text-xs font-semibold uppercase tracking-wider">
        Resume API — dev tester
      </p>
      <div className="flex flex-col gap-3">
        <AnalyzeSection />
        <HistorySection />
        <StatusSection />
        <ResumeByIdSection />
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import axios from "axios";
import { observer } from "mobx-react";
import useSWR from "swr";
import { API_BASE_URL } from "@plane/constants";
import { useUser } from "@/hooks/store/user";

export type GateCheckItem = {
  id: string;
  ticket_id: string;
  label: string;
  checked: boolean;
  checked_by: { id: string; name: string; email: string } | null;
  checked_at: string | null;
};

type QualityGateWidgetProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const QualityGateWidget = observer(function QualityGateWidget({
  workspaceSlug,
  projectId,
  issueId,
}: QualityGateWidgetProps) {
  const { data: currentUser } = useUser();
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const swrKey = issueId ? `GATE_CHECKS_${issueId}` : null;

  const { data, mutate, isLoading } = useSWR<{ items: Array<GateCheckItem> }>(
    swrKey,
    async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/gate-checks`,
        { withCredentials: true }
      );
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  const items = data?.items || [];
  const total = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const isComplete = total > 0 && checkedCount === total;
  const isLead = currentUser?.role === "lead";
  const isStudent = currentUser?.role === "student";

  const handleToggleCheck = async (item: GateCheckItem) => {
    if (!isLead) return;
    setActionError(null);

    const nextChecked = !item.checked;
    const optimisticItems = items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            checked: nextChecked,
            checked_by: nextChecked
              ? {
                  id: currentUser?.id || "",
                  name: currentUser?.display_name || currentUser?.first_name || "Lead",
                  email: currentUser?.email || "",
                }
              : null,
            checked_at: nextChecked ? new Date().toISOString() : null,
          }
        : i
    );

    await mutate({ items: optimisticItems }, false);

    try {
      await axios.patch(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/gate-checks/${item.id}`,
        { checked: nextChecked },
        { withCredentials: true }
      );
      await mutate();
    } catch (err) {
      setActionError("Gagal memperbarui status checklist mutu.");
      await mutate();
    }
  };

  const handleAddCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || !isLead || isAdding) return;

    setIsAdding(true);
    setActionError(null);

    try {
      await axios.post(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/gate-checks`,
        { label },
        { withCredentials: true }
      );
      setNewLabel("");
      await mutate();
    } catch (err) {
      setActionError("Gagal menambahkan kriteria mutu.");
    } finally {
      setIsAdding(false);
    }
  };

  const formatCheckedDate = (isoString: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-lg border border-subtle bg-layer-1 p-4 shadow-sm space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-13 text-primary">
            <span>Quality Gate Checklist</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-11 font-medium ${
              isComplete
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {checkedCount}/{total} Terverifikasi
          </span>
        </div>

        <div className="h-1.5 w-full bg-layer-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {actionError && <p className="text-11 text-red-500 font-medium">{actionError}</p>}

      {isLoading && items.length === 0 ? (
        <div className="text-11 text-tertiary">Memuat kriteria mutu...</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const formattedDate = formatCheckedDate(item.checked_at);
            return (
              <div key={item.id} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={!isLead}
                  onChange={() => handleToggleCheck(item)}
                  className="mt-0.5 h-4 w-4 rounded border-subtle text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed cursor-pointer"
                />
                <div className="flex-1 space-y-0.5">
                  <div
                    className={`text-13 leading-5 ${
                      item.checked ? "text-secondary line-through opacity-80" : "text-primary"
                    }`}
                  >
                    {item.label}
                  </div>
                  {item.checked && (
                    <div className="text-11 text-tertiary">
                      Diverifikasi oleh {item.checked_by?.name || "Lead"}
                      {formattedDate ? ` • ${formattedDate}` : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isStudent && (
        <p className="text-11 text-tertiary italic">
          Hanya Lead developer yang dapat memvalidasi kriteria mutu ini.
        </p>
      )}

      {isLead && (
        <form onSubmit={handleAddCriteria} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Tambah kriteria mutu baru..."
            disabled={isAdding}
            className="flex-1 rounded border border-subtle bg-layer-2 px-2.5 py-1 text-12 text-primary placeholder:text-tertiary focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAdding || !newLabel.trim()}
            className="rounded bg-layer-2 border border-subtle px-2.5 py-1 text-12 font-medium text-primary hover:bg-layer-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? "Menambahkan..." : "+ Tambah Kriteria"}
          </button>
        </form>
      )}
    </div>
  );
});

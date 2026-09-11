"use client";

import React, { useState } from "react";
import axios from "axios";
import { BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { API_BASE_URL } from "@plane/constants";
import { useUser } from "@/hooks/store/user";

export type ResearchLink = {
  id: string;
  ticket_id: string;
  label: string;
  url: string;
  required: boolean;
  created_by: { id: string; name: string; email: string } | null;
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const ResearchModuleWidget = observer(function ResearchModuleWidget({
  workspaceSlug,
  projectId,
  issueId,
}: Props) {
  const { data: currentUser } = useUser();
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const swrKey = issueId ? `RESEARCH_LINKS_${issueId}` : null;

  const { data, mutate, isLoading } = useSWR<{
    research_required: boolean;
    links: Array<ResearchLink>;
  }>(
    swrKey,
    async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/research-links`,
        { withCredentials: true }
      );
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  const isLeadOrPm = currentUser?.role === "lead" || currentUser?.role === "pm";
  const isStudent = currentUser?.role === "student";
  const researchRequired = !!data?.research_required;
  const links = data?.links || [];

  const handleToggleRequired = async () => {
    if (!isLeadOrPm) return;
    setActionError(null);
    const nextRequired = !researchRequired;

    await mutate(
      data
        ? {
            ...data,
            research_required: nextRequired,
          }
        : undefined,
      false
    );

    try {
      await axios.patch(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        { research_required: nextRequired },
        { withCredentials: true }
      );
      await mutate();
    } catch {
      setActionError("Gagal memperbarui status kewajiban riset.");
      await mutate();
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    const url = newUrl.trim();
    if (!label || !url || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      await axios.post(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/research-links`,
        { label, url },
        { withCredentials: true }
      );
      setNewLabel("");
      setNewUrl("");
      await mutate();
    } catch {
      setActionError("Gagal menautkan modul riset. Pastikan format URL valid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setActionError(null);
    const prevLinks = links;
    await mutate(
      data
        ? {
            ...data,
            links: prevLinks.filter((l) => l.id !== linkId),
          }
        : undefined,
      false
    );

    try {
      await axios.delete(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/research-links/${linkId}`,
        { withCredentials: true }
      );
      await mutate();
    } catch {
      setActionError("Gagal menghapus tautan modul riset.");
      await mutate();
    }
  };

  return (
    <div className="shadow-sm space-y-3 rounded-lg border border-subtle bg-layer-1 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-13 font-medium text-primary">
          <BookOpen className="h-4 w-4 text-secondary" />
          <span>Modul Riset Terkait</span>
        </div>

        {isLeadOrPm ? (
          <button
            type="button"
            onClick={handleToggleRequired}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-11 font-medium transition-colors ${
              researchRequired
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "border-subtle bg-layer-2 text-secondary hover:bg-layer-3"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${researchRequired ? "bg-amber-500" : "bg-tertiary"}`} />
            {researchRequired ? "Wajib Riset" : "Riset Opsional"}
          </button>
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-11 font-medium ${
              researchRequired
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 border"
                : "border border-subtle bg-layer-2 text-secondary"
            }`}
          >
            {researchRequired ? "Wajib Riset" : "Riset Opsional"}
          </span>
        )}
      </div>

      {actionError && <p className="text-red-500 text-11 font-medium">{actionError}</p>}

      {/* Alert Banner if required and no links */}
      {researchRequired && (!links || links.length === 0) && (
        <div className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border p-2 text-11 font-medium">
          Tiket ini mewajibkan modul riset. Tautkan modul riset acuan sebelum mengajukan review.
        </div>
      )}

      {/* List of Links */}
      {isLoading && links.length === 0 ? (
        <div className="text-11 text-tertiary">Memuat modul riset...</div>
      ) : links.length === 0 ? (
        <div className="text-11 text-tertiary italic">Belum ada modul riset yang ditautkan.</div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-md border border-subtle bg-layer-2 p-2.5"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="truncate text-13 font-medium text-primary">{link.label}</div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex max-w-xs items-center gap-1 truncate text-11 text-accent-primary hover:underline"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {link.created_by?.name && (
                  <div className="text-11 text-tertiary">Ditautkan oleh {link.created_by.name}</div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDeleteLink(link.id)}
                title="Hapus tautan riset"
                className="hover:text-red-500 rounded p-1 text-tertiary transition-colors hover:bg-layer-3"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline Add Link Form */}
      <form onSubmit={handleAddLink} className="space-y-2 pt-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label Modul (mis. Modul Auth JWT v2)"
            disabled={isSubmitting}
            className="focus:border-primary w-full rounded border border-subtle bg-layer-2 px-2.5 py-1 text-12 text-primary placeholder:text-tertiary focus:outline-none disabled:opacity-50"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL Riset (https://...)"
            disabled={isSubmitting}
            className="focus:border-primary w-full rounded border border-subtle bg-layer-2 px-2.5 py-1 text-12 text-primary placeholder:text-tertiary focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newLabel.trim() || !newUrl.trim()}
            className="rounded border border-subtle bg-layer-2 px-3 py-1 text-12 font-medium text-primary transition-colors hover:bg-layer-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Menautkan..." : "+ Tautkan Modul"}
          </button>
        </div>
      </form>
    </div>
  );
});

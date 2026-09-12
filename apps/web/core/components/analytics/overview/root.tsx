/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import useSWR from "swr";
import axios from "axios";
import { API_BASE_URL } from "@plane/constants";
import { useWorkspace } from "@/hooks/store/use-workspace";
import AnalyticsWrapper from "../analytics-wrapper";

type Summary = {
  total_tickets: number;
  active_tickets: number;
  stuck_tickets_count: number;
  idle_members_count: number;
  overload_members_count: number;
};

type WorkloadItem = {
  user: { id: string; name: string; email: string; role: string };
  backlog: number;
  in_development: number;
  review: number;
  ready: number;
  active_total: number;
  status: "NORMAL" | "IDLE" | "OVERLOAD";
};

type StuckTicket = {
  id: string;
  title: string;
  project_name: string;
  state_name: string;
  assignee: { id: string; name: string } | null;
  days_in_state: number;
  last_updated: string;
};

type DashboardData = {
  summary: Summary;
  workload: WorkloadItem[];
  stuck_tickets: StuckTicket[];
};

function Overview() {
  const { currentWorkspace } = useWorkspace();
  const workspaceSlug = currentWorkspace?.slug;

  const { data, isLoading } = useSWR<DashboardData>(
    workspaceSlug ? `PM_DASHBOARD_${workspaceSlug}` : null,
    async () => {
      const res = await axios.get(`${API_BASE_URL}/api/workspaces/${workspaceSlug}/pm-dashboard`, {
        withCredentials: true,
      });
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  const summary = data?.summary;
  const workload = data?.workload || [];
  const stuckTickets = data?.stuck_tickets || [];

  return (
    <AnalyticsWrapper i18nTitle="common.overview">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">PM Quality & Workload Dashboard</h2>
          <p className="text-13 text-tertiary">
            Monitoring beban kerja tim, peringatan tiket macet, dan visibilitas gerbang mutu secara objektif.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border-100 bg-bg-surface-1 shadow-sm rounded-lg border p-4">
            <span className="text-12 font-medium text-tertiary">Total Tiket Aktif</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-24 font-bold text-primary">
                {isLoading ? "-" : `${summary?.active_tickets ?? 0} / ${summary?.total_tickets ?? 0}`}
              </span>
              <span className="text-12 text-secondary">Total</span>
            </div>
          </div>

          <div className="border-border-100 bg-bg-surface-1 shadow-sm rounded-lg border p-4">
            <span className="text-12 font-medium text-tertiary">Tiket Stuck (&gt;3 Hari)</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-24 font-bold text-primary">
                {isLoading ? "-" : (summary?.stuck_tickets_count ?? 0)}
              </span>
              {!isLoading && (summary?.stuck_tickets_count ?? 0) > 0 ? (
                <span className="bg-rose-500/10 text-rose-600 rounded-full px-2 py-0.5 text-11 font-medium">
                  Perhatian
                </span>
              ) : null}
            </div>
          </div>

          <div className="border-border-100 bg-bg-surface-1 shadow-sm rounded-lg border p-4">
            <span className="text-12 font-medium text-tertiary">Anggota Idle</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-24 font-bold text-primary">
                {isLoading ? "-" : (summary?.idle_members_count ?? 0)}
              </span>
              <span className="text-12 text-secondary">Siswa (0 aktif)</span>
            </div>
          </div>

          <div className="border-border-100 bg-bg-surface-1 shadow-sm rounded-lg border p-4">
            <span className="text-12 font-medium text-tertiary">Anggota Overload</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-24 font-bold text-primary">
                {isLoading ? "-" : (summary?.overload_members_count ?? 0)}
              </span>
              <span className="text-12 text-secondary">Siswa (&gt;5 aktif)</span>
            </div>
          </div>
        </div>

        {/* Team Workload Matrix Table */}
        <div className="border-border-100 bg-bg-surface-1 shadow-sm overflow-hidden rounded-lg border">
          <div className="border-border-100 border-b p-4">
            <h3 className="text-14 font-semibold text-primary">Matriks Beban Kerja Tim (Team Workload Matrix)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-13">
              <thead className="border-border-100 bg-bg-surface-2 border-b text-12 font-medium text-secondary">
                <tr>
                  <th className="px-4 py-3">Anggota Tim</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3 text-center">Backlog</th>
                  <th className="px-4 py-3 text-center">In Development</th>
                  <th className="px-4 py-3 text-center">Quality Gate Review</th>
                  <th className="px-4 py-3 text-center">Client Ready</th>
                  <th className="px-4 py-3 text-center">Total Aktif</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-border-100 divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-tertiary">
                      Memuat data beban kerja tim...
                    </td>
                  </tr>
                ) : workload.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-tertiary">
                      Tidak ada data anggota tim.
                    </td>
                  </tr>
                ) : (
                  workload.map((item) => {
                    const initial = (item.user.name || item.user.email || "?").charAt(0).toUpperCase();

                    return (
                      <tr key={item.user.id} className="hover:bg-bg-surface-2/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-brand-primary/10 text-brand-primary flex h-8 w-8 items-center justify-center rounded-full text-12 font-semibold">
                              {initial}
                            </div>
                            <div>
                              <div className="font-medium text-primary">{item.user.name || "Anonim"}</div>
                              <div className="text-11 text-tertiary">{item.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-bg-surface-2 rounded px-2 py-0.5 text-11 font-medium text-secondary capitalize">
                            {item.user.role || "Member"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-secondary">{item.backlog}</td>
                        <td className="px-4 py-3 text-center text-secondary">{item.in_development}</td>
                        <td className="px-4 py-3 text-center text-secondary">{item.review}</td>
                        <td className="px-4 py-3 text-center text-secondary">{item.ready}</td>
                        <td className="px-4 py-3 text-center font-semibold text-primary">{item.active_total}</td>
                        <td className="px-4 py-3 text-center">
                          {item.status === "NORMAL" && (
                            <span className="bg-emerald-500/10 text-emerald-600 inline-flex rounded-full px-2 py-0.5 text-11 font-medium">
                              NORMAL
                            </span>
                          )}
                          {item.status === "IDLE" && (
                            <span className="bg-blue-500/10 text-blue-600 inline-flex rounded-full px-2 py-0.5 text-11 font-medium">
                              IDLE
                            </span>
                          )}
                          {item.status === "OVERLOAD" && (
                            <span className="bg-rose-500/10 text-rose-600 inline-flex rounded-full px-2 py-0.5 text-11 font-medium">
                              OVERLOAD
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stuck Tickets Alert Panel */}
        <div className="border-border-100 bg-bg-surface-1 shadow-sm rounded-lg border p-4">
          <div className="mb-4">
            <h3 className="text-14 font-semibold text-primary">Tiket Macet (&gt; 3 Hari di State Sama)</h3>
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-13 text-tertiary">Memeriksa tiket macet...</div>
          ) : stuckTickets.length === 0 ? (
            <div className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 rounded-lg border p-4 text-13">
              Semua tiket bergerak lancar, tidak ada tiket macet (&gt;3 hari).
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stuckTickets.map((t) => (
                <div
                  key={t.id}
                  className="border-rose-500/20 bg-rose-500/5 flex flex-col justify-between rounded-lg border p-3.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-11 font-medium text-secondary">{t.project_name}</span>
                      <span className="bg-rose-500/10 text-rose-600 rounded px-2 py-0.5 text-11 font-medium">
                        {t.days_in_state} Hari Macet
                      </span>
                    </div>
                    <h4 className="mt-1 text-13 font-semibold text-primary">{t.title}</h4>
                  </div>
                  <div className="border-border-100/60 mt-3 flex items-center justify-between border-t pt-2 text-11 text-tertiary">
                    <span>State: {t.state_name}</span>
                    <span>{t.assignee?.name || "Belum ada assignee"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnalyticsWrapper>
  );
}

export { Overview };

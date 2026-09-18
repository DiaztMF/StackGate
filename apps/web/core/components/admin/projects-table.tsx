/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProject } from "@plane/services";
import { AdminService } from "@plane/services";
import { renderFormattedDate } from "@plane/utils";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectMembersModal } from "./project-members-modal";

const adminService = new AdminService();

export function ProjectsTable() {
  const { data: projects, mutate } = useSWR<TAdminProject[]>("admin-projects", () => adminService.listProjects());
  const [createOpen, setCreateOpen] = useState(false);
  const [membersTarget, setMembersTarget] = useState<TAdminProject | null>(null);

  const handleToggleArchive = async (project: TAdminProject) => {
    try {
      await adminService.updateProject(project.id, { archived: !project.archivedAt });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah status arsip" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          Buat Proyek
        </Button>
      </div>
      <table className="w-full text-body-sm-regular">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="py-2">Nama</th>
            <th className="py-2">Anggota</th>
            <th className="py-2">Dibuat</th>
            <th className="py-2">Status</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {projects?.map((project) => (
            <tr key={project.id} className="border-b border-subtle">
              <td className="py-2">{project.name}</td>
              <td className="py-2">{project.memberCount}</td>
              <td className="py-2">{renderFormattedDate(project.createdAt)}</td>
              <td className="py-2">
                <Button variant={project.archivedAt ? "error-fill" : "ghost"} size="sm" onClick={() => handleToggleArchive(project)}>
                  {project.archivedAt ? "Diarsipkan" : "Aktif"}
                </Button>
              </td>
              <td className="py-2">
                <Button variant="ghost" size="sm" onClick={() => setMembersTarget(project)}>
                  Kelola Anggota
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => mutate()} />
      <ProjectMembersModal
        isOpen={!!membersTarget}
        projectId={membersTarget?.id ?? null}
        projectName={membersTarget?.name ?? ""}
        onClose={() => setMembersTarget(null)}
        onChanged={() => mutate()}
      />
    </div>
  );
}

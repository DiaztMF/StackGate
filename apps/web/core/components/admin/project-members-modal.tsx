/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProjectMember, TAdminRole } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();
const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

type Props = {
  isOpen: boolean;
  projectId: string | null;
  projectName: string;
  onClose: () => void;
  onChanged: () => void;
};

export function ProjectMembersModal(props: Props) {
  const { isOpen, projectId, projectName, onClose, onChanged } = props;
  const { data: members, mutate } = useSWR<TAdminProjectMember[]>(
    projectId ? `admin-project-members-${projectId}` : null,
    () => adminService.listProjectMembers(projectId as string)
  );
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<TAdminRole>("student");

  const refresh = async () => {
    await mutate();
    onChanged();
  };

  const handleAdd = async () => {
    if (!projectId || !newUserId.trim()) return;
    try {
      await adminService.addProjectMember(projectId, newUserId.trim(), newRole);
      setNewUserId("");
      await refresh();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal menambah anggota" });
    }
  };

  const handleRoleChange = async (userId: string, role: TAdminRole) => {
    if (!projectId) return;
    await adminService.updateProjectMember(projectId, userId, role);
    await refresh();
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) return;
    await adminService.removeProjectMember(projectId, userId);
    await refresh();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Anggota — {projectName}</h3>
        <table className="w-full text-body-sm-regular">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="py-2">Nama</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.userId} className="border-b border-subtle">
                <td className="py-2">{member.name}</td>
                <td className="py-2">{member.email}</td>
                <td className="py-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as TAdminRole)}
                    className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 py-1 text-12"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(member.userId)}>
                    Keluarkan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-end gap-2 border-t border-subtle pt-3">
          <Input placeholder="User ID" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as TAdminRole)}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2.5 py-1.5 text-13"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            Tambah
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}

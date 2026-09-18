/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminRole, TAdminUser } from "@plane/services";
import { AdminService } from "@plane/services";
import { CreateUserModal } from "./create-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";

const adminService = new AdminService();
const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

export function UsersTable() {
  const { data: users, mutate } = useSWR<TAdminUser[]>("admin-users", () => adminService.listUsers());
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<TAdminUser | null>(null);

  const handleRoleChange = async (user: TAdminUser, role: TAdminRole) => {
    try {
      await adminService.updateUser(user.id, { role });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah role" });
    }
  };

  const handleToggleActive = async (user: TAdminUser) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah status" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          Buat Akun
        </Button>
      </div>
      <table className="w-full text-body-sm-regular">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="py-2">Nama</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id} className="border-b border-subtle">
              <td className="py-2">{user.name}</td>
              <td className="py-2">{user.email}</td>
              <td className="py-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value as TAdminRole)}
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
                <Button variant={user.isActive ? "ghost" : "error-fill"} size="sm" onClick={() => handleToggleActive(user)}>
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </Button>
              </td>
              <td className="py-2">
                <Button variant="ghost" size="sm" onClick={() => setResetTarget(user)}>
                  Reset Password
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => mutate()} />
      <ResetPasswordModal
        isOpen={!!resetTarget}
        userId={resetTarget?.id ?? null}
        userEmail={resetTarget?.email ?? ""}
        onClose={() => setResetTarget(null)}
      />
    </div>
  );
}

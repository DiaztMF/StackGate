/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminRole, TAdminUser } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: TAdminUser) => void;
};

const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

export function CreateUserModal(props: Props) {
  const { isOpen, onClose, onCreated } = props;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TAdminRole>("student");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail("");
    setName("");
    setPassword("");
    setRole("student");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = await adminService.createUser({ email, name, password, role });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Akun ${user.email} dibuat` });
      onCreated(user);
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal membuat akun" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Buat Akun Baru</h3>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Password (min. 8 karakter)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TAdminRole)}
          className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2.5 py-1.5 text-13"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!email || !name || password.length < 8}
            onClick={handleSubmit}
          >
            Buat
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}

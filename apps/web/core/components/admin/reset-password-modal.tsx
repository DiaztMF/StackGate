/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  userId: string | null;
  userEmail: string;
  onClose: () => void;
};

export function ResetPasswordModal(props: Props) {
  const { isOpen, userId, userEmail, onClose } = props;
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await adminService.resetPassword(userId, password);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Password ${userEmail} diperbarui` });
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal reset password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Reset Password — {userEmail}</h3>
        <Input
          placeholder="Password baru (min. 8 karakter)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={submitting} disabled={password.length < 8} onClick={handleSubmit}>
            Reset
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}

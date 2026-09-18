/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProject } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: TAdminProject) => void;
};

export function CreateProjectModal(props: Props) {
  const { isOpen, onClose, onCreated } = props;
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const project = await adminService.createProject(name);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Proyek ${project.name} dibuat` });
      onCreated(project);
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal membuat proyek" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Buat Proyek Baru</h3>
        <Input placeholder="Nama proyek" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={submitting} disabled={!name.trim()} onClick={handleSubmit}>
            Buat
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}

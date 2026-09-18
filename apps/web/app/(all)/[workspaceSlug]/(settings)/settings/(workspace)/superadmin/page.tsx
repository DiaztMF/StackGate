/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { UsersTable } from "@/components/admin/users-table";
import { ProjectsTable } from "@/components/admin/projects-table";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { SuperadminWorkspaceSettingsHeader } from "./header";

type TTab = "users" | "projects";

const SuperadminSettingsPage = observer(function SuperadminSettingsPage() {
  const [tab, setTab] = useState<TTab>("users");
  const { data: currentUser } = useUser();

  if (currentUser && currentUser.role !== "superadmin") {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<SuperadminWorkspaceSettingsHeader />} hugging>
      <PageHead title="Superadmin" />
      <div className="flex items-center gap-1 border-b border-subtle pb-2">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`rounded-md px-3 py-1.5 text-body-sm-medium ${tab === "users" ? "bg-layer-2 text-primary" : "text-tertiary"}`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab("projects")}
          className={`rounded-md px-3 py-1.5 text-body-sm-medium ${tab === "projects" ? "bg-layer-2 text-primary" : "text-tertiary"}`}
        >
          Projects
        </button>
      </div>
      <div className="pt-4">{tab === "users" ? <UsersTable /> : <ProjectsTable />}</div>
    </SettingsContentWrapper>
  );
});

export default SuperadminSettingsPage;

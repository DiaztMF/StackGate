/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "../api.service";

export type TAdminRole = "student" | "lead" | "pm" | "superadmin";

export type TAdminUser = {
  id: string;
  email: string;
  name: string;
  role: TAdminRole;
  isActive: boolean;
  createdAt: string;
};

export type TAdminProject = {
  id: string;
  name: string;
  slug: string;
  archivedAt: string | null;
  createdAt: string;
  memberCount: number;
};

export type TAdminProjectMember = {
  userId: string;
  role: TAdminRole;
  email: string;
  name: string;
};

/**
 * Service class for the superadmin panel: user and project management
 * endpoints under /api/admin/*. StackGate-native — does not follow Plane's
 * generic member/invitation shapes.
 * @extends {APIService}
 */
export class AdminService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async listUsers(): Promise<TAdminUser[]> {
    return this.get("/api/admin/users")
      .then((response) => response?.data?.data?.users as TAdminUser[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async createUser(data: { email: string; name: string; password: string; role: TAdminRole }): Promise<TAdminUser> {
    return this.post("/api/admin/users", data)
      .then((response) => response?.data?.data?.user as TAdminUser)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateUser(userId: string, data: { role?: TAdminRole; isActive?: boolean; name?: string }): Promise<TAdminUser> {
    return this.patch(`/api/admin/users/${userId}`, data)
      .then((response) => response?.data?.data?.user as TAdminUser)
      .catch((error) => {
        throw error?.response;
      });
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    return this.post(`/api/admin/users/${userId}/reset-password`, { password })
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listProjects(): Promise<TAdminProject[]> {
    return this.get("/api/admin/projects")
      .then((response) => response?.data?.data?.projects as TAdminProject[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProject(name: string): Promise<TAdminProject> {
    return this.post("/api/admin/projects", { name })
      .then((response) => response?.data?.data?.project as TAdminProject)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProject(projectId: string, data: { name?: string; archived?: boolean }): Promise<TAdminProject> {
    return this.patch(`/api/admin/projects/${projectId}`, data)
      .then((response) => response?.data?.data?.project as TAdminProject)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listProjectMembers(projectId: string): Promise<TAdminProjectMember[]> {
    return this.get(`/api/admin/projects/${projectId}/members`)
      .then((response) => response?.data?.data?.members as TAdminProjectMember[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async addProjectMember(projectId: string, userId: string, role: TAdminRole): Promise<TAdminProjectMember> {
    return this.post(`/api/admin/projects/${projectId}/members`, { userId, role })
      .then((response) => response?.data?.data?.member as TAdminProjectMember)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectMember(projectId: string, userId: string, role: TAdminRole): Promise<TAdminProjectMember> {
    return this.patch(`/api/admin/projects/${projectId}/members/${userId}`, { role })
      .then((response) => response?.data?.data?.member as TAdminProjectMember)
      .catch((error) => {
        throw error?.response;
      });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return this.delete(`/api/admin/projects/${projectId}/members/${userId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }
}

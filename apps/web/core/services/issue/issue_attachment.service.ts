import type { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@plane/constants";
import type { TIssueAttachment, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueAttachmentService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  private basePath(workspaceSlug: string, projectId: string, issueId: string): string {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/attachments`;
  }

  async uploadIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TIssueAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    return this.post(this.basePath(workspaceSlug, projectId, issueId) + "/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: uploadProgressHandler,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueAttachments(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueAttachment[]> {
    return this.get(this.basePath(workspaceSlug, projectId, issueId) + "/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    assetId: string
  ): Promise<TIssueAttachment> {
    return this.delete(`${this.basePath(workspaceSlug, projectId, issueId)}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

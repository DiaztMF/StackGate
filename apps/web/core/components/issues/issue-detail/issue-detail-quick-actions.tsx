/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// propel imports
import { LinkOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { copyTextToClipboard, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueDetailQuickActions = observer(function IssueDetailQuickActions(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();

  // hooks
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const projectIdentifier = getProjectIdentifierById(projectId);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug,
    projectId,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  // handlers
  const handleCopyText = async () => {
    try {
      const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
      await copyTextToClipboard(`${originURL}${workItemLink}`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
      });
    }
  };

  return (
    <>
      <div className="flex flex-shrink-0 items-center justify-end">
        <div className="flex flex-wrap items-center gap-2">
          {/* Subscription & Delete & Archive are disabled because StackGate does not implement them */}
          <div className="flex flex-wrap items-center gap-2 text-tertiary">
            <Tooltip label={t("common.actions.copy_link")} disabled={isMobile}>
              <IconButton variant="secondary" size="lg" onClick={handleCopyText} icon={LinkOutline} />
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
});

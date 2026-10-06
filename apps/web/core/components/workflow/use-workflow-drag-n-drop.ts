/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback } from "react";
import type { TIssueGroupByOptions } from "@plane/types";
import { useUser } from "@/hooks/store/user";
import { useProjectState } from "@/hooks/store/use-project-state";
import { stateTransitionBlockedReason, getStateKey } from "@/helpers/transition-guard.helper";

export const useWorkFlowFDragNDrop = (
  groupBy: TIssueGroupByOptions | undefined,
  _subGroupBy?: TIssueGroupByOptions
) => {
  const { data: currentUser } = useUser();
  const { getStateById } = useProjectState();
  const [isWorkflowDropDisabled, setIsWorkflowDropDisabled] = useState(false);

  const handleWorkFlowState = useCallback(
    (
      sourceGroupId: string,
      destinationGroupId: string,
      _sourceSubGroupId?: string,
      _destinationSubGroupId?: string
    ) => {
      if (groupBy !== "state") {
        setIsWorkflowDropDisabled(false);
        return;
      }
      if (sourceGroupId === destinationGroupId) {
        setIsWorkflowDropDisabled(false);
        return;
      }

      const fromState = getStateById(sourceGroupId);
      const toState = getStateById(destinationGroupId);
      const fromKey = getStateKey(fromState);
      const toKey = getStateKey(toState);

      const blockedReason = stateTransitionBlockedReason(currentUser?.role, fromKey, toKey);
      setIsWorkflowDropDisabled(!!blockedReason);
    },
    [groupBy, currentUser?.role, getStateById]
  );

  return {
    workflowDisabledSource: undefined,
    isWorkflowDropDisabled,
    getIsWorkflowWorkItemCreationDisabled: (_groupId: string, _subGroupId?: string) => false,
    handleWorkFlowState,
  };
};

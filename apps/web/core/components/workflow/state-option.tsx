/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
import { TickOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

export type TStateOptionProps = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: React.ReactNode;
  };
  selectedValue: string | null | undefined;
  className?: string;
  filterAvailableStateIds?: boolean;
  isForWorkItemCreation?: boolean;
  alwaysAllowStateChange?: boolean;
  /** Why the quality gate forbids this move, or null when it is allowed. */
  blockedReason?: string | null;
};

export const StateOption = observer(function StateOption(props: TStateOptionProps) {
  const { option, className = "", blockedReason = null } = props;
  const isBlocked = !!blockedReason;

  return (
    <Combobox.Option
      as="li"
      key={option.value}
      value={option.value}
      disabled={isBlocked}
      // native title: the option is an <li>, so a tooltip trigger cannot wrap it
      title={blockedReason ?? undefined}
      className={({ active, selected }) =>
        cn(className, {
          "bg-layer-transparent-hover": active && !isBlocked,
          "text-primary": selected && !isBlocked,
          "text-secondary": !selected && !isBlocked,
          "cursor-not-allowed text-placeholder opacity-60": isBlocked,
        })
      }
    >
      {({ selected }) => (
        <>
          <span className="flex-grow truncate">{option.content}</span>
          {selected && !isBlocked && <TickOutline className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
});

# Task 1 review package
## Commits
7eb2d9b feat: fork plane web+live+packages, trim admin/space/django/proxy
## Stat
 .gitignore                                         |   119 +
 .node-version                                      |     1 +
 .npmrc                                             |    54 +
 .oxfmtrc.json                                      |    17 +
 .oxlintrc.json                                     |    53 +
 .prettierignore                                    |    10 +
 LICENSE.txt                                        |   661 +
 apps/live/.env.example                             |    14 +
 apps/live/.prettierignore                          |    10 +
 apps/live/Dockerfile.dev                           |    15 +
 apps/live/Dockerfile.live                          |    85 +
 apps/live/package.json                             |    81 +
 .../src/controllers/collaboration.controller.ts    |    39 +
 apps/live/src/controllers/document.controller.ts   |    69 +
 apps/live/src/controllers/health.controller.ts     |    21 +
 apps/live/src/controllers/index.ts                 |    12 +
 apps/live/src/controllers/pdf-export.controller.ts |   142 +
 apps/live/src/env.ts                               |    42 +
 apps/live/src/extensions/database.ts               |   140 +
 apps/live/src/extensions/force-close-handler.ts    |   202 +
 apps/live/src/extensions/index.ts                  |    19 +
 apps/live/src/extensions/logger.ts                 |    19 +
 apps/live/src/extensions/redis.ts                  |   141 +
 apps/live/src/extensions/title-sync.ts             |   181 +
 apps/live/src/extensions/title-update/debounce.ts  |   283 +
 .../title-update/title-update-manager.ts           |    96 +
 .../src/extensions/title-update/title-utils.ts     |    17 +
 apps/live/src/hocuspocus.ts                        |    69 +
 apps/live/src/lib/auth-middleware.ts               |    56 +
 apps/live/src/lib/auth.ts                          |    97 +
 apps/live/src/lib/errors.ts                        |    79 +
 apps/live/src/lib/pdf/colors.ts                    |   231 +
 apps/live/src/lib/pdf/icons.tsx                    |   232 +
 apps/live/src/lib/pdf/index.ts                     |    24 +
 apps/live/src/lib/pdf/mark-renderers.ts            |   144 +
 apps/live/src/lib/pdf/node-renderers.tsx           |   444 +
 apps/live/src/lib/pdf/plane-pdf-exporter.tsx       |    88 +
 apps/live/src/lib/pdf/styles.ts                    |   250 +
 apps/live/src/lib/pdf/types.ts                     |    73 +
 apps/live/src/lib/stateless.ts                     |    20 +
 apps/live/src/redis.ts                             |   220 +
 apps/live/src/schema/pdf-export.ts                 |    67 +
 apps/live/src/server.ts                            |   128 +
 apps/live/src/services/api.service.ts              |    70 +
 apps/live/src/services/page/core.service.ts        |   227 +
 apps/live/src/services/page/extended.service.ts    |    18 +
 apps/live/src/services/page/handler.ts             |    22 +
 .../live/src/services/page/project-page.service.ts |    31 +
 apps/live/src/services/pdf-export/effect-utils.ts  |    56 +
 apps/live/src/services/pdf-export/index.ts         |     9 +
 .../src/services/pdf-export/pdf-export.service.ts  |   379 +
 apps/live/src/services/pdf-export/types.ts         |    42 +
 apps/live/src/services/user.service.ts             |    40 +
 apps/live/src/start.ts                             |    63 +
 apps/live/src/types/admin-commands.ts              |   149 +
 apps/live/src/types/index.ts                       |    35 +
 apps/live/src/utils/broadcast-error.ts             |    44 +
 apps/live/src/utils/broadcast-message.ts           |    40 +
 apps/live/tests/lib/pdf/pdf-rendering.test.ts      |   732 +
 .../tests/services/pdf-export/effect-utils.test.ts |   155 +
 apps/live/tsconfig.json                            |    20 +
 apps/live/tsdown.config.ts                         |    11 +
 apps/live/vitest.config.ts                         |    21 +
 apps/web/.dockerignore                             |    11 +
 apps/web/.env.example                              |    12 +
 apps/web/.gitignore                                |     3 +
 apps/web/.prettierignore                           |    10 +
 apps/web/Dockerfile.dev                            |    13 +
 apps/web/Dockerfile.web                            |   126 +
 .../(all)/[workspaceSlug]/(projects)/_sidebar.tsx  |    73 +
 .../(projects)/active-cycles/header.tsx            |    36 +
 .../(projects)/active-cycles/layout.tsx            |    23 +
 .../(projects)/active-cycles/page.tsx              |    28 +
 .../(projects)/analytics/[tabId]/header.tsx        |    33 +
 .../(projects)/analytics/[tabId]/layout.tsx        |    22 +
 .../(projects)/analytics/[tabId]/page.tsx          |   127 +
 .../(projects)/browse/[workItem]/header.tsx        |    65 +
 .../(projects)/browse/[workItem]/layout.tsx        |    21 +
 .../(projects)/browse/[workItem]/page.tsx          |   144 +
 .../browse/[workItem]/work-item-header.tsx         |    73 +
 .../[workspaceSlug]/(projects)/drafts/header.tsx   |    83 +
 .../[workspaceSlug]/(projects)/drafts/layout.tsx   |    23 +
 .../[workspaceSlug]/(projects)/drafts/page.tsx     |    26 +
 .../(projects)/extended-project-sidebar.tsx        |   172 +
 .../(projects)/extended-sidebar-wrapper.tsx        |    62 +
 .../(projects)/extended-sidebar.tsx                |   140 +
 .../(all)/[workspaceSlug]/(projects)/header.tsx    |    52 +
 .../(all)/[workspaceSlug]/(projects)/layout.tsx    |    32 +
 .../(projects)/notifications/layout.tsx            |    20 +
 .../(projects)/notifications/page.tsx              |    36 +
 .../app/(all)/[workspaceSlug]/(projects)/page.tsx  |    36 +
 .../profile/[userId]/[profileViewId]/page.tsx      |    38 +
 .../(projects)/profile/[userId]/activity/page.tsx  |    78 +
 .../(projects)/profile/[userId]/header.tsx         |   113 +
 .../(projects)/profile/[userId]/layout.tsx         |    98 +
 .../(projects)/profile/[userId]/mobile-header.tsx  |   141 +
 .../(projects)/profile/[userId]/navbar.tsx         |    48 +
 .../(projects)/profile/[userId]/page.tsx           |    56 +
 .../[projectId]/archives/cycles/layout.tsx         |    22 +
 .../(detail)/[projectId]/archives/cycles/page.tsx  |    36 +
 .../(detail)/[projectId]/archives/header.tsx       |   112 +
 .../issues/(detail)/[archivedIssueId]/page.tsx     |   102 +
 .../archives/issues/(detail)/header.tsx            |    85 +
 .../archives/issues/(detail)/layout.tsx            |    22 +
 .../[projectId]/archives/issues/(list)/layout.tsx  |    22 +
 .../[projectId]/archives/issues/(list)/page.tsx    |    36 +
 .../[projectId]/archives/modules/layout.tsx        |    22 +
 .../(detail)/[projectId]/archives/modules/page.tsx |    35 +
 .../[projectId]/cycles/(detail)/[cycleId]/page.tsx |    93 +
 .../[projectId]/cycles/(detail)/header.tsx         |   273 +
 .../[projectId]/cycles/(detail)/layout.tsx         |    23 +
 .../[projectId]/cycles/(detail)/mobile-header.tsx  |   158 +
 .../(detail)/[projectId]/cycles/(list)/header.tsx  |    79 +
 .../(detail)/[projectId]/cycles/(list)/layout.tsx  |    23 +
 .../[projectId]/cycles/(list)/mobile-header.tsx    |    80 +
 .../(detail)/[projectId]/cycles/(list)/page.tsx    |   140 +
 .../(detail)/[projectId]/intake/layout.tsx         |    22 +
 .../projects/(detail)/[projectId]/intake/page.tsx  |    95 +
 .../[projectId]/issues/(detail)/[issueId]/page.tsx |    72 +
 .../(detail)/[projectId]/issues/(list)/header.tsx  |    11 +
 .../(detail)/[projectId]/issues/(list)/layout.tsx  |    23 +
 .../[projectId]/issues/(list)/mobile-header.tsx    |   110 +
 .../(detail)/[projectId]/issues/(list)/page.tsx    |    38 +
 .../projects/(detail)/[projectId]/layout.tsx       |    60 +
 .../modules/(detail)/[moduleId]/page.tsx           |    83 +
 .../[projectId]/modules/(detail)/header.tsx        |   270 +
 .../[projectId]/modules/(detail)/layout.tsx        |    23 +
 .../[projectId]/modules/(detail)/mobile-header.tsx |   138 +
 .../(detail)/[projectId]/modules/(list)/header.tsx |    84 +
 .../(detail)/[projectId]/modules/(list)/layout.tsx |    23 +
 .../[projectId]/modules/(list)/mobile-header.tsx   |    53 +
 .../(detail)/[projectId]/modules/(list)/page.tsx   |   105 +
 .../[projectId]/pages/(detail)/[pageId]/page.tsx   |   200 +
 .../(detail)/[projectId]/pages/(detail)/header.tsx |   108 +
 .../(detail)/[projectId]/pages/(detail)/layout.tsx |    31 +
 .../(detail)/[projectId]/pages/(list)/header.tsx   |    89 +
 .../(detail)/[projectId]/pages/(list)/layout.tsx   |    23 +
 .../(detail)/[projectId]/pages/(list)/page.tsx     |    90 +
 .../[projectId]/views/(detail)/[viewId]/header.tsx |   221 +
 .../[projectId]/views/(detail)/[viewId]/page.tsx   |    57 +
 .../(detail)/[projectId]/views/(detail)/layout.tsx |    22 +
 .../(detail)/[projectId]/views/(list)/header.tsx   |    58 +
 .../(detail)/[projectId]/views/(list)/layout.tsx   |    23 +
 .../[projectId]/views/(list)/mobile-header.tsx     |    63 +
 .../(detail)/[projectId]/views/(list)/page.tsx     |   106 +
 .../projects/(detail)/archives/layout.tsx          |    23 +
 .../(projects)/projects/(detail)/archives/page.tsx |    13 +
 .../(projects)/projects/(list)/layout.tsx          |    23 +
 .../(projects)/projects/(list)/page.tsx            |    13 +
 .../(all)/[workspaceSlug]/(projects)/sidebar.tsx   |    43 +
 .../[workspaceSlug]/(projects)/star-us-link.tsx    |    33 +
 .../[workspaceSlug]/(projects)/stickies/header.tsx |    61 +
 .../[workspaceSlug]/(projects)/stickies/layout.tsx |    21 +
 .../[workspaceSlug]/(projects)/stickies/page.tsx   |    20 +
 .../workspace-views/[globalViewId]/page.tsx        |    40 +
 .../(projects)/workspace-views/header.tsx          |   161 +
 .../(projects)/workspace-views/layout.tsx          |    21 +
 .../(projects)/workspace-views/page.tsx            |    59 +
 .../(all)/[workspaceSlug]/(settings)/layout.tsx    |    28 +
 .../settings/(workspace)/billing/header.tsx        |    42 +
 .../settings/(workspace)/billing/page.tsx          |    40 +
 .../settings/(workspace)/exports/header.tsx        |    42 +
 .../settings/(workspace)/exports/page.tsx          |    61 +
 .../(settings)/settings/(workspace)/header.tsx     |    42 +
 .../settings/(workspace)/integrations/page.tsx     |    63 +
 .../(settings)/settings/(workspace)/layout.tsx     |    62 +
 .../settings/(workspace)/members/header.tsx        |    42 +
 .../settings/(workspace)/members/page.tsx          |   151 +
 .../(settings)/settings/(workspace)/page.tsx       |    36 +
 .../(workspace)/webhooks/[webhookId]/header.tsx    |    42 +
 .../(workspace)/webhooks/[webhookId]/page.tsx      |   111 +
 .../settings/(workspace)/webhooks/header.tsx       |    42 +
 .../settings/(workspace)/webhooks/page.tsx         |   116 +
 .../projects/[projectId]/automations/header.tsx    |    42 +
 .../projects/[projectId]/automations/layout.tsx    |    14 +
 .../projects/[projectId]/automations/page.tsx      |    75 +
 .../projects/[projectId]/estimates/header.tsx      |    42 +
 .../projects/[projectId]/estimates/page.tsx        |    45 +
 .../[projectId]/features/cycles/header.tsx         |    42 +
 .../projects/[projectId]/features/cycles/page.tsx  |    64 +
 .../[projectId]/features/intake/header.tsx         |    42 +
 .../projects/[projectId]/features/intake/page.tsx  |    64 +
 .../[projectId]/features/modules/header.tsx        |    42 +
 .../projects/[projectId]/features/modules/page.tsx |    64 +
 .../projects/[projectId]/features/pages/header.tsx |    42 +
 .../projects/[projectId]/features/pages/page.tsx   |    64 +
 .../projects/[projectId]/features/views/header.tsx |    42 +
 .../projects/[projectId]/features/views/page.tsx   |    64 +
 .../settings/projects/[projectId]/header.tsx       |    42 +
 .../projects/[projectId]/labels/header.tsx         |    42 +
 .../settings/projects/[projectId]/labels/page.tsx  |    65 +
 .../settings/projects/[projectId]/layout.tsx       |    44 +
 .../projects/[projectId]/members/header.tsx        |    42 +
 .../settings/projects/[projectId]/members/page.tsx |    56 +
 .../settings/projects/[projectId]/page.tsx         |    54 +
 .../projects/[projectId]/states/header.tsx         |    42 +
 .../settings/projects/[projectId]/states/page.tsx  |    59 +
 .../(settings)/settings/projects/layout.tsx        |    33 +
 .../(settings)/settings/projects/page.tsx          |    43 +
 apps/web/app/(all)/[workspaceSlug]/layout.tsx      |    30 +
 .../app/(all)/accounts/forgot-password/layout.tsx  |    14 +
 .../app/(all)/accounts/forgot-password/page.tsx    |    30 +
 .../app/(all)/accounts/reset-password/layout.tsx   |    14 +
 .../web/app/(all)/accounts/reset-password/page.tsx |    31 +
 .../web/app/(all)/accounts/set-password/layout.tsx |    14 +
 apps/web/app/(all)/accounts/set-password/page.tsx  |    31 +
 apps/web/app/(all)/create-workspace/layout.tsx     |    14 +
 apps/web/app/(all)/create-workspace/page.tsx       |   115 +
 apps/web/app/(all)/invitations/layout.tsx          |    14 +
 apps/web/app/(all)/invitations/page.tsx            |   202 +
 apps/web/app/(all)/layout.preload.tsx              |    32 +
 apps/web/app/(all)/layout.tsx                      |    23 +
 apps/web/app/(all)/onboarding/layout.tsx           |    14 +
 apps/web/app/(all)/onboarding/page.tsx             |    66 +
 .../(all)/settings/profile/[profileTabId]/page.tsx |    61 +
 apps/web/app/(all)/settings/profile/layout.tsx     |    28 +
 apps/web/app/(all)/sign-up/layout.tsx              |    17 +
 apps/web/app/(all)/sign-up/page.tsx                |    25 +
 .../web/app/(all)/workspace-invitations/layout.tsx |    14 +
 apps/web/app/(all)/workspace-invitations/page.tsx  |   138 +
 apps/web/app/(home)/layout.tsx                     |    18 +
 apps/web/app/(home)/page.tsx                       |    27 +
 apps/web/app/assets/404.svg                        |    17 +
 apps/web/app/assets/attachment/audio-icon.png      |   Bin 0 -> 10369 bytes
 apps/web/app/assets/attachment/css-icon.png        |   Bin 0 -> 12703 bytes
 apps/web/app/assets/attachment/csv-icon.png        |   Bin 0 -> 9681 bytes
 apps/web/app/assets/attachment/default-icon.png    |   Bin 0 -> 6134 bytes
 apps/web/app/assets/attachment/doc-icon.png        |   Bin 0 -> 15175 bytes
 apps/web/app/assets/attachment/excel-icon.png      |   Bin 0 -> 6708 bytes
 apps/web/app/assets/attachment/figma-icon.png      |   Bin 0 -> 15614 bytes
 apps/web/app/assets/attachment/html-icon.png       |   Bin 0 -> 6665 bytes
 apps/web/app/assets/attachment/img-icon.png        |   Bin 0 -> 10447 bytes
 apps/web/app/assets/attachment/jpg-icon.png        |   Bin 0 -> 12088 bytes
 apps/web/app/assets/attachment/js-icon.png         |   Bin 0 -> 10992 bytes
 apps/web/app/assets/attachment/pdf-icon.png        |   Bin 0 -> 13038 bytes
 apps/web/app/assets/attachment/png-icon.png        |   Bin 0 -> 12486 bytes
 apps/web/app/assets/attachment/rar-icon.png        |   Bin 0 -> 10465 bytes
 apps/web/app/assets/attachment/svg-icon.png        |   Bin 0 -> 12899 bytes
 apps/web/app/assets/attachment/txt-icon.png        |   Bin 0 -> 11142 bytes
 apps/web/app/assets/attachment/video-icon.png      |   Bin 0 -> 11673 bytes
 apps/web/app/assets/attachment/zip-icon.png        |   Bin 0 -> 7217 bytes
 apps/web/app/assets/auth/access-denied.svg         |    49 +
 .../app/assets/auth/background-pattern-dark.svg    |    68 +
 apps/web/app/assets/auth/background-pattern.svg    |    68 +
 apps/web/app/assets/auth/gradient-bg-logo.webp     |   Bin 0 -> 8598 bytes
 apps/web/app/assets/auth/gradient-logo.webp        |   Bin 0 -> 18208 bytes
 .../web/app/assets/auth/project-not-authorized.svg |    44 +
 apps/web/app/assets/auth/unauthorized.svg          |    44 +
 .../app/assets/auth/workspace-not-authorized.svg   |    44 +
 apps/web/app/assets/cover-images/image_1.jpg       |   Bin 0 -> 274081 bytes
 apps/web/app/assets/cover-images/image_10.jpg      |   Bin 0 -> 77704 bytes
 apps/web/app/assets/cover-images/image_11.jpg      |   Bin 0 -> 163445 bytes
 apps/web/app/assets/cover-images/image_12.jpg      |   Bin 0 -> 31278 bytes
 apps/web/app/assets/cover-images/image_13.jpg      |   Bin 0 -> 45418 bytes
 apps/web/app/assets/cover-images/image_14.jpg      |   Bin 0 -> 186911 bytes
 apps/web/app/assets/cover-images/image_15.jpg      |   Bin 0 -> 84063 bytes
 apps/web/app/assets/cover-images/image_16.jpg      |   Bin 0 -> 165310 bytes
 apps/web/app/assets/cover-images/image_17.jpg      |   Bin 0 -> 57385 bytes
 apps/web/app/assets/cover-images/image_18.jpg      |   Bin 0 -> 100019 bytes
 apps/web/app/assets/cover-images/image_19.jpg      |   Bin 0 -> 126252 bytes
 apps/web/app/assets/cover-images/image_2.jpg       |   Bin 0 -> 150636 bytes
 apps/web/app/assets/cover-images/image_20.jpg      |   Bin 0 -> 388460 bytes
 apps/web/app/assets/cover-images/image_21.jpg      |   Bin 0 -> 22939 bytes
 apps/web/app/assets/cover-images/image_22.jpg      |   Bin 0 -> 151529 bytes
 apps/web/app/assets/cover-images/image_23.jpg      |   Bin 0 -> 37096 bytes
 apps/web/app/assets/cover-images/image_24.jpg      |   Bin 0 -> 98975 bytes
 apps/web/app/assets/cover-images/image_25.jpg      |   Bin 0 -> 90953 bytes
 apps/web/app/assets/cover-images/image_26.jpg      |   Bin 0 -> 157020 bytes
 apps/web/app/assets/cover-images/image_27.jpg      |   Bin 0 -> 86271 bytes
 apps/web/app/assets/cover-images/image_28.jpg      |   Bin 0 -> 59221 bytes
 apps/web/app/assets/cover-images/image_29.jpg      |   Bin 0 -> 224208 bytes
 apps/web/app/assets/cover-images/image_3.jpg       |   Bin 0 -> 76288 bytes
 apps/web/app/assets/cover-images/image_4.jpg       |   Bin 0 -> 101518 bytes
 apps/web/app/assets/cover-images/image_5.jpg       |   Bin 0 -> 170462 bytes
 apps/web/app/assets/cover-images/image_6.jpg       |   Bin 0 -> 19386 bytes
 apps/web/app/assets/cover-images/image_7.jpg       |   Bin 0 -> 71730 bytes
 apps/web/app/assets/cover-images/image_8.jpg       |   Bin 0 -> 72479 bytes
 apps/web/app/assets/cover-images/image_9.jpg       |   Bin 0 -> 221582 bytes
 apps/web/app/assets/emoji/project-emoji.svg        |     4 +
 .../empty-state/active-cycle/assignee-dark.webp    |   Bin 0 -> 1188 bytes
 .../empty-state/active-cycle/assignee-light.webp   |   Bin 0 -> 1156 bytes
 .../empty-state/active-cycle/chart-dark.webp       |   Bin 0 -> 1176 bytes
 .../empty-state/active-cycle/chart-light.webp      |   Bin 0 -> 1154 bytes
 .../empty-state/active-cycle/cycle-dark.webp       |   Bin 0 -> 1360 bytes
 .../empty-state/active-cycle/cycle-light.webp      |   Bin 0 -> 1246 bytes
 .../empty-state/active-cycle/label-dark.webp       |   Bin 0 -> 1138 bytes
 .../empty-state/active-cycle/label-light.webp      |   Bin 0 -> 1186 bytes
 .../empty-state/active-cycle/priority-dark.webp    |   Bin 0 -> 1052 bytes
 .../empty-state/active-cycle/priority-light.webp   |   Bin 0 -> 1096 bytes
 .../empty-state/active-cycle/progress-dark.webp    |   Bin 0 -> 1094 bytes
 .../empty-state/active-cycle/progress-light.webp   |   Bin 0 -> 1172 bytes
 .../empty-state/all-issues/all-issues-dark.webp    |   Bin 0 -> 71510 bytes
 .../empty-state/all-issues/all-issues-light.webp   |   Bin 0 -> 70300 bytes
 .../empty-state/all-issues/assigned-dark.webp      |   Bin 0 -> 72200 bytes
 .../empty-state/all-issues/assigned-light.webp     |   Bin 0 -> 70098 bytes
 .../empty-state/all-issues/created-dark.webp       |   Bin 0 -> 71902 bytes
 .../empty-state/all-issues/created-light.webp      |   Bin 0 -> 70044 bytes
 .../empty-state/all-issues/custom-view-dark.webp   |   Bin 0 -> 72204 bytes
 .../empty-state/all-issues/custom-view-light.webp  |   Bin 0 -> 66086 bytes
 .../empty-state/all-issues/no-project-dark.webp    |   Bin 0 -> 71486 bytes
 .../empty-state/all-issues/no-project-light.webp   |   Bin 0 -> 65602 bytes
 .../empty-state/all-issues/subscribed-dark.webp    |   Bin 0 -> 72166 bytes
 .../empty-state/all-issues/subscribed-light.webp   |   Bin 0 -> 70130 bytes
 .../analytics/empty-chart-area-dark.webp           |   Bin 0 -> 2720 bytes
 .../analytics/empty-chart-area-light.webp          |   Bin 0 -> 694 bytes
 .../analytics/empty-chart-bar-dark.webp            |   Bin 0 -> 2508 bytes
 .../analytics/empty-chart-bar-light.webp           |   Bin 0 -> 512 bytes
 .../analytics/empty-chart-radar-dark.webp          |   Bin 0 -> 3076 bytes
 .../analytics/empty-chart-radar-light.webp         |   Bin 0 -> 716 bytes
 .../analytics/empty-grid-background-dark.webp      |   Bin 0 -> 35070 bytes
 .../analytics/empty-grid-background-light.webp     |   Bin 0 -> 2576 bytes
 .../empty-state/analytics/empty-table-dark.webp    |   Bin 0 -> 3280 bytes
 .../empty-state/analytics/empty-table-light.webp   |   Bin 0 -> 862 bytes
 apps/web/app/assets/empty-state/api-token.svg      |    49 +
 .../empty-state/archived/empty-cycles-dark.webp    |   Bin 0 -> 47726 bytes
 .../empty-state/archived/empty-cycles-light.webp   |   Bin 0 -> 58406 bytes
 .../empty-state/archived/empty-issues-dark.webp    |   Bin 0 -> 96322 bytes
 .../empty-state/archived/empty-issues-light.webp   |   Bin 0 -> 79488 bytes
 .../empty-state/archived/empty-modules-dark.webp   |   Bin 0 -> 43128 bytes
 .../empty-state/archived/empty-modules-light.webp  |   Bin 0 -> 45046 bytes
 .../cycle-issues/calendar-dark-resp.webp           |   Bin 0 -> 37356 bytes
 .../empty-state/cycle-issues/calendar-dark.webp    |   Bin 0 -> 57744 bytes
 .../cycle-issues/calendar-light-resp.webp          |   Bin 0 -> 34628 bytes
 .../empty-state/cycle-issues/calendar-light.webp   |   Bin 0 -> 53764 bytes
 .../cycle-issues/gantt_chart-dark-resp.webp        |   Bin 0 -> 44948 bytes
 .../empty-state/cycle-issues/gantt_chart-dark.webp |   Bin 0 -> 69840 bytes
 .../cycle-issues/gantt_chart-light-resp.webp       |   Bin 0 -> 40562 bytes
 .../cycle-issues/gantt_chart-light.webp            |   Bin 0 -> 67424 bytes
 .../empty-state/cycle-issues/kanban-dark-resp.webp |   Bin 0 -> 59766 bytes
 .../empty-state/cycle-issues/kanban-dark.webp      |   Bin 0 -> 94374 bytes
 .../cycle-issues/kanban-light-resp.webp            |   Bin 0 -> 56564 bytes
 .../empty-state/cycle-issues/kanban-light.webp     |   Bin 0 -> 93976 bytes
 .../empty-state/cycle-issues/list-dark-resp.webp   |   Bin 0 -> 47902 bytes
 .../assets/empty-state/cycle-issues/list-dark.webp |   Bin 0 -> 75926 bytes
 .../empty-state/cycle-issues/list-light-resp.webp  |   Bin 0 -> 44810 bytes
 .../empty-state/cycle-issues/list-light.webp       |   Bin 0 -> 71922 bytes
 .../cycle-issues/spreadsheet-dark-resp.webp        |   Bin 0 -> 51360 bytes
 .../empty-state/cycle-issues/spreadsheet-dark.webp |   Bin 0 -> 83536 bytes
 .../cycle-issues/spreadsheet-light-resp.webp       |   Bin 0 -> 47362 bytes
 .../cycle-issues/spreadsheet-light.webp            |   Bin 0 -> 77274 bytes
 apps/web/app/assets/empty-state/cycle.svg          |    21 +
 .../app/assets/empty-state/cycle/active-dark.webp  |   Bin 0 -> 70158 bytes
 .../app/assets/empty-state/cycle/active-light.webp |   Bin 0 -> 70404 bytes
 .../app/assets/empty-state/cycle/all-filters.svg   |    42 +
 .../assets/empty-state/cycle/completed-dark.webp   |   Bin 0 -> 79182 bytes
 .../assets/empty-state/cycle/completed-light.webp  |   Bin 0 -> 85086 bytes
 .../cycle/completed-no-issues-dark.webp            |   Bin 0 -> 88100 bytes
 .../cycle/completed-no-issues-light.webp           |   Bin 0 -> 90250 bytes
 .../app/assets/empty-state/cycle/draft-dark.webp   |   Bin 0 -> 67770 bytes
 .../app/assets/empty-state/cycle/draft-light.webp  |   Bin 0 -> 71682 bytes
 .../app/assets/empty-state/cycle/name-filter.svg   |    41 +
 .../assets/empty-state/cycle/upcoming-dark.webp    |   Bin 0 -> 77842 bytes
 .../assets/empty-state/cycle/upcoming-light.webp   |   Bin 0 -> 83712 bytes
 .../dashboard/dark/completed-issues.svg            |     5 +
 .../dashboard/dark/issues-by-priority.svg          |     6 +
 .../dashboard/dark/issues-by-state-group.svg       |    24 +
 .../empty-state/dashboard/dark/overdue-issues.svg  |     9 +
 .../empty-state/dashboard/dark/recent-activity.svg |     6 +
 .../dashboard/dark/recent-collaborators-1.svg      |     6 +
 .../dashboard/dark/recent-collaborators-2.svg      |     6 +
 .../dashboard/dark/recent-collaborators-3.svg      |     6 +
 .../empty-state/dashboard/dark/upcoming-issues.svg |    13 +
 .../dashboard/light/completed-issues.svg           |     5 +
 .../dashboard/light/issues-by-priority.svg         |     6 +
 .../dashboard/light/issues-by-state-group.svg      |    27 +
 .../empty-state/dashboard/light/overdue-issues.svg |     9 +
 .../dashboard/light/recent-activity.svg            |     6 +
 .../dashboard/light/recent-collaborators-1.svg     |     7 +
 .../dashboard/light/recent-collaborators-2.svg     |     7 +
 .../dashboard/light/recent-collaborators-3.svg     |     7 +
 .../dashboard/light/upcoming-issues.svg            |    13 +
 .../assets/empty-state/dashboard/widgets-dark.webp |   Bin 0 -> 34690 bytes
 .../empty-state/dashboard/widgets-light.webp       |   Bin 0 -> 34706 bytes
 .../empty-state/dashboard_empty_project.webp       |   Bin 0 -> 31886 bytes
 .../empty-state/disabled-feature/cycles-dark.webp  |   Bin 0 -> 72322 bytes
 .../empty-state/disabled-feature/cycles-light.webp |   Bin 0 -> 67312 bytes
 .../empty-state/disabled-feature/intake-dark.webp  |   Bin 0 -> 83506 bytes
 .../empty-state/disabled-feature/intake-light.webp |   Bin 0 -> 87120 bytes
 .../empty-state/disabled-feature/modules-dark.webp |   Bin 0 -> 64292 bytes
 .../disabled-feature/modules-light.webp            |   Bin 0 -> 67546 bytes
 .../empty-state/disabled-feature/pages-dark.webp   |   Bin 0 -> 83862 bytes
 .../empty-state/disabled-feature/pages-light.webp  |   Bin 0 -> 74942 bytes
 .../empty-state/disabled-feature/views-dark.webp   |   Bin 0 -> 55062 bytes
 .../empty-state/disabled-feature/views-light.webp  |   Bin 0 -> 55700 bytes
 .../empty-state/draft/draft-issues-empty-dark.webp |   Bin 0 -> 72234 bytes
 .../draft/draft-issues-empty-light.webp            |   Bin 0 -> 72772 bytes
 .../empty-state/empty-filters/calendar-dark.webp   |   Bin 0 -> 65102 bytes
 .../empty-state/empty-filters/calendar-light.webp  |   Bin 0 -> 59602 bytes
 .../empty-filters/gantt_chart-dark.webp            |   Bin 0 -> 72184 bytes
 .../empty-filters/gantt_chart-light.webp           |   Bin 0 -> 66104 bytes
 .../empty-state/empty-filters/kanban-dark.webp     |   Bin 0 -> 98840 bytes
 .../empty-state/empty-filters/kanban-light.webp    |   Bin 0 -> 94488 bytes
 .../empty-state/empty-filters/list-dark.webp       |   Bin 0 -> 79272 bytes
 .../empty-state/empty-filters/list-light.webp      |   Bin 0 -> 73644 bytes
 .../empty-filters/spreadsheet-dark.webp            |   Bin 0 -> 87388 bytes
 .../empty-filters/spreadsheet-light.webp           |   Bin 0 -> 81456 bytes
 .../app/assets/empty-state/empty-updates-light.png |   Bin 0 -> 100997 bytes
 .../app/assets/empty-state/empty_analytics.webp    |   Bin 0 -> 12182 bytes
 .../web/app/assets/empty-state/empty_bar_graph.svg |     5 +
 apps/web/app/assets/empty-state/empty_cycles.webp  |   Bin 0 -> 27484 bytes
 apps/web/app/assets/empty-state/empty_graph.svg    |    10 +
 apps/web/app/assets/empty-state/empty_issues.webp  |   Bin 0 -> 60102 bytes
 apps/web/app/assets/empty-state/empty_label.svg    |     4 +
 apps/web/app/assets/empty-state/empty_members.svg  |    13 +
 apps/web/app/assets/empty-state/empty_modules.webp |   Bin 0 -> 18618 bytes
 apps/web/app/assets/empty-state/empty_page.png     |   Bin 0 -> 62834 bytes
 apps/web/app/assets/empty-state/empty_project.webp |   Bin 0 -> 35082 bytes
 apps/web/app/assets/empty-state/empty_users.svg    |     3 +
 apps/web/app/assets/empty-state/empty_view.webp    |   Bin 0 -> 30928 bytes
 .../app/assets/empty-state/epics/epics-dark.webp   |   Bin 0 -> 81498 bytes
 .../app/assets/empty-state/epics/epics-light.webp  |   Bin 0 -> 75440 bytes
 .../assets/empty-state/epics/settings-dark.webp    |   Bin 0 -> 18014 bytes
 .../assets/empty-state/epics/settings-light.webp   |   Bin 0 -> 19378 bytes
 apps/web/app/assets/empty-state/estimates/dark.svg |    19 +
 .../web/app/assets/empty-state/estimates/light.svg |    19 +
 .../empty-state/intake/filter-issue-dark.webp      |   Bin 0 -> 44548 bytes
 .../empty-state/intake/filter-issue-light.webp     |   Bin 0 -> 42864 bytes
 .../empty-state/intake/intake-dark-resp.webp       |   Bin 0 -> 54190 bytes
 .../app/assets/empty-state/intake/intake-dark.webp |   Bin 0 -> 83506 bytes
 .../empty-state/intake/intake-issue-dark.webp      |   Bin 0 -> 46660 bytes
 .../empty-state/intake/intake-issue-light.webp     |   Bin 0 -> 43938 bytes
 .../empty-state/intake/intake-light-resp.webp      |   Bin 0 -> 58260 bytes
 .../assets/empty-state/intake/intake-light.webp    |   Bin 0 -> 87120 bytes
 .../empty-state/intake/issue-detail-dark.webp      |   Bin 0 -> 2170 bytes
 .../empty-state/intake/issue-detail-light.webp     |   Bin 0 -> 2264 bytes
 apps/web/app/assets/empty-state/invitation.svg     |    23 +
 apps/web/app/assets/empty-state/issue.svg          |    15 +
 apps/web/app/assets/empty-state/label.svg          |    42 +
 .../module-issues/calendar-dark-resp.webp          |   Bin 0 -> 36946 bytes
 .../empty-state/module-issues/calendar-dark.webp   |   Bin 0 -> 57858 bytes
 .../module-issues/calendar-light-resp.webp         |   Bin 0 -> 33942 bytes
 .../empty-state/module-issues/calendar-light.webp  |   Bin 0 -> 54806 bytes
 .../module-issues/gantt_chart-dark-resp.webp       |   Bin 0 -> 44496 bytes
 .../module-issues/gantt_chart-dark.webp            |   Bin 0 -> 68972 bytes
 .../module-issues/gantt_chart-light-resp.webp      |   Bin 0 -> 39840 bytes
 .../module-issues/gantt_chart-light.webp           |   Bin 0 -> 64524 bytes
 .../module-issues/kanban-dark-resp.webp            |   Bin 0 -> 59476 bytes
 .../empty-state/module-issues/kanban-dark.webp     |   Bin 0 -> 93948 bytes
 .../module-issues/kanban-light-resp.webp           |   Bin 0 -> 56012 bytes
 .../empty-state/module-issues/kanban-light.webp    |   Bin 0 -> 95314 bytes
 .../empty-state/module-issues/list-dark-resp.webp  |   Bin 0 -> 47204 bytes
 .../empty-state/module-issues/list-dark.webp       |   Bin 0 -> 74946 bytes
 .../empty-state/module-issues/list-light-resp.webp |   Bin 0 -> 44228 bytes
 .../empty-state/module-issues/list-light.webp      |   Bin 0 -> 72272 bytes
 .../module-issues/spreadsheet-dark-resp.webp       |   Bin 0 -> 50896 bytes
 .../module-issues/spreadsheet-dark.webp            |   Bin 0 -> 79672 bytes
 .../module-issues/spreadsheet-light-resp.webp      |   Bin 0 -> 46742 bytes
 .../module-issues/spreadsheet-light.webp           |   Bin 0 -> 76558 bytes
 apps/web/app/assets/empty-state/module.svg         |    31 +
 .../app/assets/empty-state/module/all-filters.svg  |    45 +
 .../app/assets/empty-state/module/name-filter.svg  |    44 +
 apps/web/app/assets/empty-state/notification.svg   |    38 +
 .../empty-state/onboarding/analytics-dark.webp     |   Bin 0 -> 147492 bytes
 .../empty-state/onboarding/analytics-light.webp    |   Bin 0 -> 46266 bytes
 .../assets/empty-state/onboarding/archive-dark.png |   Bin 0 -> 6690 bytes
 .../empty-state/onboarding/archive-light.png       |   Bin 0 -> 6723 bytes
 .../assets/empty-state/onboarding/cycles-dark.webp |   Bin 0 -> 71690 bytes
 .../empty-state/onboarding/cycles-light.webp       |   Bin 0 -> 74002 bytes
 .../empty-state/onboarding/dashboard-dark.webp     |   Bin 0 -> 72264 bytes
 .../empty-state/onboarding/dashboard-light.webp    |   Bin 0 -> 73042 bytes
 .../assets/empty-state/onboarding/graph-dark.png   |   Bin 0 -> 5298 bytes
 .../assets/empty-state/onboarding/graph-light.png  |   Bin 0 -> 5318 bytes
 .../empty-state/onboarding/issues-closed-dark.png  |   Bin 0 -> 5846 bytes
 .../empty-state/onboarding/issues-closed-light.png |   Bin 0 -> 5880 bytes
 .../assets/empty-state/onboarding/issues-dark.webp |   Bin 0 -> 87040 bytes
 .../empty-state/onboarding/issues-light.webp       |   Bin 0 -> 80648 bytes
 .../assets/empty-state/onboarding/members-dark.png |   Bin 0 -> 7225 bytes
 .../empty-state/onboarding/members-light.png       |   Bin 0 -> 7173 bytes
 .../empty-state/onboarding/modules-dark.webp       |   Bin 0 -> 65140 bytes
 .../empty-state/onboarding/modules-light.webp      |   Bin 0 -> 61650 bytes
 .../empty-state/onboarding/notification-dark.png   |   Bin 0 -> 7720 bytes
 .../empty-state/onboarding/notification-light.png  |   Bin 0 -> 7593 bytes
 .../assets/empty-state/onboarding/pages-dark.webp  |   Bin 0 -> 84920 bytes
 .../assets/empty-state/onboarding/pages-light.webp |   Bin 0 -> 69134 bytes
 .../empty-state/onboarding/projects-dark.webp      |   Bin 0 -> 100922 bytes
 .../empty-state/onboarding/projects-light.webp     |   Bin 0 -> 112010 bytes
 .../assets/empty-state/onboarding/search-dark.png  |   Bin 0 -> 8300 bytes
 .../assets/empty-state/onboarding/search-light.png |   Bin 0 -> 8096 bytes
 .../assets/empty-state/onboarding/snooze-light.png |   Bin 0 -> 8684 bytes
 .../assets/empty-state/onboarding/snoozed-dark.png |   Bin 0 -> 9051 bytes
 .../assets/empty-state/onboarding/views-dark.webp  |   Bin 0 -> 56004 bytes
 .../assets/empty-state/onboarding/views-light.webp |   Bin 0 -> 53050 bytes
 .../onboarding/workspace-active-cycles-dark.webp   |   Bin 0 -> 70158 bytes
 .../onboarding/workspace-active-cycles-light.webp  |   Bin 0 -> 70404 bytes
 .../onboarding/workspace-invites-dark.webp         |   Bin 0 -> 53572 bytes
 .../onboarding/workspace-invites-light.webp        |   Bin 0 -> 65348 bytes
 .../empty-state/profile/activities-dark.webp       |   Bin 0 -> 602498 bytes
 .../empty-state/profile/activities-light.webp      |   Bin 0 -> 605508 bytes
 .../assets/empty-state/profile/activity-dark.webp  |   Bin 0 -> 65728 bytes
 .../assets/empty-state/profile/activity-light.webp |   Bin 0 -> 66542 bytes
 .../assets/empty-state/profile/assigned-dark.webp  |   Bin 0 -> 48644 bytes
 .../assets/empty-state/profile/assigned-light.webp |   Bin 0 -> 50750 bytes
 .../assets/empty-state/profile/created-dark.webp   |   Bin 0 -> 48456 bytes
 .../assets/empty-state/profile/created-light.webp  |   Bin 0 -> 48966 bytes
 .../profile/issues-by-priority-dark.webp           |   Bin 0 -> 204278 bytes
 .../profile/issues-by-priority-light.webp          |   Bin 0 -> 204198 bytes
 .../empty-state/profile/issues-by-state-dark.webp  |   Bin 0 -> 217670 bytes
 .../empty-state/profile/issues-by-state-light.webp |   Bin 0 -> 217914 bytes
 .../empty-state/profile/subscribed-dark.webp       |   Bin 0 -> 48502 bytes
 .../empty-state/profile/subscribed-light.webp      |   Bin 0 -> 49108 bytes
 .../project-settings/estimates-dark-resp.webp      |   Bin 0 -> 28276 bytes
 .../project-settings/estimates-dark.png            |   Bin 0 -> 257261 bytes
 .../project-settings/estimates-dark.webp           |   Bin 0 -> 50982 bytes
 .../project-settings/estimates-light-resp.webp     |   Bin 0 -> 25732 bytes
 .../project-settings/estimates-light.png           |   Bin 0 -> 177466 bytes
 .../project-settings/estimates-light.webp          |   Bin 0 -> 55100 bytes
 .../project-settings/integrations-dark-resp.webp   |   Bin 0 -> 67376 bytes
 .../project-settings/integrations-dark.webp        |   Bin 0 -> 67376 bytes
 .../project-settings/integrations-light-resp.webp  |   Bin 0 -> 226238 bytes
 .../project-settings/integrations-light.webp       |   Bin 0 -> 226238 bytes
 .../project-settings/labels-dark-resp.webp         |   Bin 0 -> 33748 bytes
 .../empty-state/project-settings/labels-dark.webp  |   Bin 0 -> 43036 bytes
 .../project-settings/labels-light-resp.webp        |   Bin 0 -> 24078 bytes
 .../empty-state/project-settings/labels-light.webp |   Bin 0 -> 40026 bytes
 .../project-settings/no-projects-dark.png          |   Bin 0 -> 299445 bytes
 .../project-settings/no-projects-light.png         |   Bin 0 -> 261332 bytes
 .../empty-state/project-settings/updates-dark.png  |   Bin 0 -> 39599 bytes
 .../empty-state/project-settings/updates-light.png |   Bin 0 -> 39630 bytes
 apps/web/app/assets/empty-state/project.svg        |    23 +
 .../empty-state/project/all-filters-dark.svg       |    47 +
 .../empty-state/project/all-filters-light.svg      |    42 +
 .../empty-state/project/name-filter-dark.svg       |    46 +
 .../empty-state/project/name-filter-light.svg      |    41 +
 .../app/assets/empty-state/project/name-filter.svg |    41 +
 .../web/app/assets/empty-state/recent_activity.svg |     3 +
 .../empty-state/search/all-issue-view-dark.webp    |   Bin 0 -> 59062 bytes
 .../empty-state/search/all-issues-view-light.webp  |   Bin 0 -> 68990 bytes
 .../assets/empty-state/search/archive-dark.webp    |   Bin 0 -> 2292 bytes
 .../assets/empty-state/search/archive-light.webp   |   Bin 0 -> 2434 bytes
 .../assets/empty-state/search/comments-dark.webp   |   Bin 0 -> 2574 bytes
 .../assets/empty-state/search/comments-light.webp  |   Bin 0 -> 2744 bytes
 .../app/assets/empty-state/search/issues-dark.webp |   Bin 0 -> 3118 bytes
 .../assets/empty-state/search/issues-light.webp    |   Bin 0 -> 2924 bytes
 .../app/assets/empty-state/search/member-dark.webp |   Bin 0 -> 61754 bytes
 .../assets/empty-state/search/member-light.webp    |   Bin 0 -> 74852 bytes
 .../empty-state/search/notification-dark.webp      |   Bin 0 -> 2286 bytes
 .../empty-state/search/notification-light.webp     |   Bin 0 -> 2524 bytes
 .../assets/empty-state/search/project-dark.webp    |   Bin 0 -> 51476 bytes
 .../assets/empty-state/search/project-light.webp   |   Bin 0 -> 66248 bytes
 .../app/assets/empty-state/search/search-dark.webp |   Bin 0 -> 2330 bytes
 .../assets/empty-state/search/search-light.webp    |   Bin 0 -> 2644 bytes
 .../app/assets/empty-state/search/snooze-dark.webp |   Bin 0 -> 2464 bytes
 .../assets/empty-state/search/snooze-light.webp    |   Bin 0 -> 2790 bytes
 .../app/assets/empty-state/search/views-dark.webp  |   Bin 0 -> 55206 bytes
 .../app/assets/empty-state/search/views-light.webp |   Bin 0 -> 71804 bytes
 apps/web/app/assets/empty-state/state_graph.svg    |    26 +
 .../assets/empty-state/stickies/stickies-dark.webp |   Bin 0 -> 120538 bytes
 .../empty-state/stickies/stickies-light.webp       |   Bin 0 -> 122006 bytes
 .../empty-state/stickies/stickies-search-dark.webp |   Bin 0 -> 69822 bytes
 .../stickies/stickies-search-light.webp            |   Bin 0 -> 70492 bytes
 apps/web/app/assets/empty-state/view.svg           |    26 +
 apps/web/app/assets/empty-state/web-hook.svg       |    49 +
 apps/web/app/assets/empty-state/wiki/all-dark.webp |   Bin 0 -> 84408 bytes
 .../assets/empty-state/wiki/all-filters-dark.svg   |    50 +
 .../assets/empty-state/wiki/all-filters-light.svg  |    45 +
 .../web/app/assets/empty-state/wiki/all-light.webp |   Bin 0 -> 69182 bytes
 .../app/assets/empty-state/wiki/archived-dark.webp |   Bin 0 -> 51374 bytes
 .../assets/empty-state/wiki/archived-light.webp    |   Bin 0 -> 160062 bytes
 .../assets/empty-state/wiki/name-filter-dark.svg   |    49 +
 .../assets/empty-state/wiki/name-filter-light.svg  |    44 +
 .../wiki/navigation-pane/assets-dark.webp          |   Bin 0 -> 20670 bytes
 .../wiki/navigation-pane/assets-light.webp         |   Bin 0 -> 20952 bytes
 .../wiki/navigation-pane/outline-dark.webp         |   Bin 0 -> 17994 bytes
 .../wiki/navigation-pane/outline-light.webp        |   Bin 0 -> 18006 bytes
 .../app/assets/empty-state/wiki/private-dark.webp  |   Bin 0 -> 47048 bytes
 .../app/assets/empty-state/wiki/private-light.webp |   Bin 0 -> 42126 bytes
 .../app/assets/empty-state/wiki/public-dark.webp   |   Bin 0 -> 47254 bytes
 .../app/assets/empty-state/wiki/public-light.webp  |   Bin 0 -> 42716 bytes
 .../empty-state/workspace-draft/issue-dark.webp    |   Bin 0 -> 80938 bytes
 .../empty-state/workspace-draft/issue-light.webp   |   Bin 0 -> 91768 bytes
 .../workspace-settings/api-tokens-dark-resp.webp   |   Bin 0 -> 39510 bytes
 .../workspace-settings/api-tokens-dark.webp        |   Bin 0 -> 47554 bytes
 .../workspace-settings/api-tokens-light-resp.webp  |   Bin 0 -> 26926 bytes
 .../workspace-settings/api-tokens-light.webp       |   Bin 0 -> 44508 bytes
 .../workspace-settings/exports-dark-resp.webp      |   Bin 0 -> 44564 bytes
 .../workspace-settings/exports-dark.webp           |   Bin 0 -> 61984 bytes
 .../workspace-settings/exports-light-resp.webp     |   Bin 0 -> 34452 bytes
 .../workspace-settings/exports-light.webp          |   Bin 0 -> 34452 bytes
 .../workspace-settings/imports-dark-resp.webp      |   Bin 0 -> 46538 bytes
 .../workspace-settings/imports-dark.webp           |   Bin 0 -> 77830 bytes
 .../workspace-settings/imports-light-resp.webp     |   Bin 0 -> 43948 bytes
 .../workspace-settings/imports-light.webp          |   Bin 0 -> 71230 bytes
 .../workspace-settings/integrations-dark-resp.webp |   Bin 0 -> 37980 bytes
 .../workspace-settings/integrations-dark.webp      |   Bin 0 -> 66530 bytes
 .../integrations-light-resp.webp                   |   Bin 0 -> 40660 bytes
 .../workspace-settings/integrations-light.webp     |   Bin 0 -> 66340 bytes
 .../workspace-settings/webhooks-dark-resp.webp     |   Bin 0 -> 40654 bytes
 .../workspace-settings/webhooks-dark.webp          |   Bin 0 -> 58016 bytes
 .../workspace-settings/webhooks-light-resp.webp    |   Bin 0 -> 27576 bytes
 .../workspace-settings/webhooks-light.webp         |   Bin 0 -> 43392 bytes
 apps/web/app/assets/favicon/apple-touch-icon.png   |   Bin 0 -> 6294 bytes
 apps/web/app/assets/favicon/favicon-16x16.png      |   Bin 0 -> 466 bytes
 apps/web/app/assets/favicon/favicon-32x32.png      |   Bin 0 -> 761 bytes
 apps/web/app/assets/favicon/favicon.ico            |   Bin 0 -> 15406 bytes
 apps/web/app/assets/fonts/inter/bold-italic.ttf    |   Bin 0 -> 348180 bytes
 apps/web/app/assets/fonts/inter/bold.ttf           |   Bin 0 -> 344152 bytes
 apps/web/app/assets/fonts/inter/heavy-italic.ttf   |   Bin 0 -> 348712 bytes
 apps/web/app/assets/fonts/inter/heavy.ttf          |   Bin 0 -> 344820 bytes
 apps/web/app/assets/fonts/inter/light-italic.ttf   |   Bin 0 -> 347316 bytes
 apps/web/app/assets/fonts/inter/light.ttf          |   Bin 0 -> 343704 bytes
 apps/web/app/assets/fonts/inter/medium-italic.ttf  |   Bin 0 -> 346884 bytes
 apps/web/app/assets/fonts/inter/medium.ttf         |   Bin 0 -> 343200 bytes
 apps/web/app/assets/fonts/inter/regular-italic.ttf |   Bin 0 -> 346480 bytes
 apps/web/app/assets/fonts/inter/regular.ttf        |   Bin 0 -> 342680 bytes
 .../web/app/assets/fonts/inter/semibold-italic.ttf |   Bin 0 -> 347760 bytes
 apps/web/app/assets/fonts/inter/semibold.ttf       |   Bin 0 -> 343828 bytes
 apps/web/app/assets/fonts/inter/thin-italic.ttf    |   Bin 0 -> 346916 bytes
 apps/web/app/assets/fonts/inter/thin.ttf           |   Bin 0 -> 343088 bytes
 .../app/assets/fonts/inter/ultrabold-italic.ttf    |   Bin 0 -> 349064 bytes
 apps/web/app/assets/fonts/inter/ultrabold.ttf      |   Bin 0 -> 345008 bytes
 .../app/assets/fonts/inter/ultralight-italic.ttf   |   Bin 0 -> 347452 bytes
 apps/web/app/assets/fonts/inter/ultralight.ttf     |   Bin 0 -> 343532 bytes
 apps/web/app/assets/icons/icon-180x180.png         |   Bin 0 -> 2709 bytes
 apps/web/app/assets/icons/icon-512x512.png         |   Bin 0 -> 8703 bytes
 apps/web/app/assets/images/logo-spinner-dark.gif   |   Bin 0 -> 976395 bytes
 apps/web/app/assets/images/logo-spinner-light.gif  |   Bin 0 -> 427969 bytes
 apps/web/app/assets/instance-not-ready.webp        |   Bin 0 -> 23952 bytes
 apps/web/app/assets/instance-setup-done.webp       |   Bin 0 -> 90384 bytes
 .../app/assets/instance/maintenance-mode-dark.svg  |    86 +
 .../app/assets/instance/maintenance-mode-light.svg |    86 +
 apps/web/app/assets/logos/gitea-logo.svg           |     1 +
 apps/web/app/assets/logos/github-black.png         |   Bin 0 -> 14032 bytes
 apps/web/app/assets/logos/github-dark.svg          |     3 +
 apps/web/app/assets/logos/github-square.png        |   Bin 0 -> 2352 bytes
 apps/web/app/assets/logos/github-white.png         |   Bin 0 -> 16559 bytes
 apps/web/app/assets/logos/gitlab-logo.svg          |     1 +
 apps/web/app/assets/logos/google-logo.svg          |     1 +
 apps/web/app/assets/mac-command.svg                |     2 +
 apps/web/app/assets/og-image.png                   |   Bin 0 -> 71428 bytes
 apps/web/app/assets/onboarding/cycles.webp         |   Bin 0 -> 154204 bytes
 apps/web/app/assets/onboarding/issues.webp         |   Bin 0 -> 202198 bytes
 apps/web/app/assets/onboarding/modules.webp        |   Bin 0 -> 163952 bytes
 .../app/assets/onboarding/onboarding-pages.webp    |   Bin 0 -> 45508 bytes
 apps/web/app/assets/onboarding/pages.webp          |   Bin 0 -> 226948 bytes
 apps/web/app/assets/onboarding/views.webp          |   Bin 0 -> 134924 bytes
 .../black-horizontal-with-blue-logo.png            |   Bin 0 -> 2852 bytes
 .../app/assets/plane-logos/blue-without-text.png   |   Bin 0 -> 2460 bytes
 .../white-horizontal-with-blue-logo.png            |   Bin 0 -> 2412 bytes
 .../app/assets/plane-logos/white-horizontal.svg    |    17 +
 apps/web/app/assets/plane-takeoff.png              |   Bin 0 -> 47818 bytes
 apps/web/app/assets/scribble/scribble-black.svg    |    10 +
 apps/web/app/assets/scribble/scribble-white.svg    |    10 +
 apps/web/app/assets/services/csv.svg               |    12 +
 apps/web/app/assets/services/excel.svg             |    11 +
 apps/web/app/assets/services/github.png            |   Bin 0 -> 2352 bytes
 apps/web/app/assets/services/jira.svg              |    15 +
 apps/web/app/assets/services/json.svg              |    12 +
 apps/web/app/assets/services/slack.png             |   Bin 0 -> 19970 bytes
 apps/web/app/assets/user.png                       |   Bin 0 -> 99267 bytes
 apps/web/app/assets/users/user-1.png               |   Bin 0 -> 4193 bytes
 apps/web/app/assets/users/user-2.png               |   Bin 0 -> 3781 bytes
 .../users/user-profile-cover-default-img.png       |   Bin 0 -> 76661 bytes
 .../workspace-active-cycles/cta-l-1-dark.webp      |   Bin 0 -> 5628 bytes
 .../workspace-active-cycles/cta-l-1-light.webp     |   Bin 0 -> 28716 bytes
 .../workspace-active-cycles/cta-r-1-dark.webp      |   Bin 0 -> 59460 bytes
 .../workspace-active-cycles/cta-r-1-light.webp     |   Bin 0 -> 64318 bytes
 .../workspace-active-cycles/cta-r-2-dark.webp      |   Bin 0 -> 207310 bytes
 .../workspace-active-cycles/cta-r-2-light.webp     |   Bin 0 -> 392122 bytes
 .../workspace/workspace-creation-disabled.png      |   Bin 0 -> 191452 bytes
 .../assets/workspace/workspace-not-available.png   |   Bin 0 -> 192990 bytes
 apps/web/app/compat/next/helper.ts                 |    41 +
 apps/web/app/compat/next/image.tsx                 |    37 +
 apps/web/app/compat/next/link.tsx                  |    23 +
 apps/web/app/compat/next/navigation.ts             |    52 +
 apps/web/app/compat/next/script.tsx                |    59 +
 apps/web/app/entry.client.tsx                      |    50 +
 apps/web/app/error/dev.tsx                         |   146 +
 apps/web/app/error/index.tsx                       |    25 +
 apps/web/app/error/prod.tsx                        |    91 +
 apps/web/app/layout.tsx                            |    26 +
 apps/web/app/not-found.tsx                         |    48 +
 apps/web/app/provider.tsx                          |    58 +
 apps/web/app/root.tsx                              |   138 +
 apps/web/app/routes.ts                             |    25 +
 apps/web/app/routes/core.ts                        |   405 +
 apps/web/app/routes/extended.ts                    |     9 +
 apps/web/app/routes/helper.ts                      |    76 +
 .../app/routes/redirects/core/accounts-signup.tsx  |    15 +
 apps/web/app/routes/redirects/core/analytics.tsx   |    17 +
 apps/web/app/routes/redirects/core/api-tokens.tsx  |    15 +
 apps/web/app/routes/redirects/core/inbox.tsx       |    17 +
 apps/web/app/routes/redirects/core/index.ts        |    44 +
 apps/web/app/routes/redirects/core/login.tsx       |    15 +
 .../app/routes/redirects/core/profile-settings.tsx |    18 +
 .../app/routes/redirects/core/project-settings.tsx |    19 +
 apps/web/app/routes/redirects/core/register.tsx    |    15 +
 apps/web/app/routes/redirects/core/sign-in.tsx     |    15 +
 apps/web/app/routes/redirects/core/signin.tsx      |    15 +
 .../redirects/core/workspace-account-settings.tsx  |    18 +
 apps/web/app/routes/redirects/extended/index.ts    |     9 +
 apps/web/app/routes/redirects/index.ts             |    16 +
 apps/web/app/types/next-link.d.ts                  |    12 +
 apps/web/app/types/next-navigation.d.ts            |    14 +
 apps/web/app/types/next-script.d.ts                |    15 +
 apps/web/app/types/react-router-virtual.d.ts       |     5 +
 apps/web/caddy/Caddyfile                           |    37 +
 .../components/account/auth-forms/auth-header.tsx  |   124 +
 .../components/account/auth-forms/auth-root.tsx    |   164 +
 .../account/auth-forms/common/container.tsx        |    13 +
 .../account/auth-forms/common/header.tsx           |    14 +
 .../core/components/account/auth-forms/email.tsx   |   109 +
 .../account/auth-forms/forgot-password-popover.tsx |    67 +
 .../account/auth-forms/forgot-password.tsx         |   142 +
 .../components/account/auth-forms/form-root.tsx    |   138 +
 .../core/components/account/auth-forms/index.ts    |     7 +
 .../components/account/auth-forms/password.tsx     |   304 +
 .../account/auth-forms/reset-password.tsx          |   211 +
 .../components/account/auth-forms/set-password.tsx |   208 +
 .../components/account/auth-forms/unique-code.tsx  |   180 +
 .../account/deactivate-account-modal.tsx           |    93 +
 .../components/account/terms-and-conditions.tsx    |    45 +
 .../workspace-active-cycles-upgrade.tsx            |   134 +
 .../analytics/analytics-filter-actions.tsx         |    39 +
 .../analytics/analytics-section-wrapper.tsx        |    36 +
 .../components/analytics/analytics-wrapper.tsx     |    29 +
 apps/web/core/components/analytics/empty-state.tsx |    51 +
 apps/web/core/components/analytics/export.ts       |    32 +
 .../web/core/components/analytics/insight-card.tsx |    36 +
 .../analytics/insight-table/data-table.tsx         |   175 +
 .../components/analytics/insight-table/index.ts    |     7 +
 .../components/analytics/insight-table/loader.tsx  |    42 +
 .../components/analytics/insight-table/root.tsx    |    51 +
 apps/web/core/components/analytics/loaders.tsx     |    33 +
 .../analytics/overview/active-project-item.tsx     |    68 +
 .../analytics/overview/active-projects.tsx         |    51 +
 .../core/components/analytics/overview/index.ts    |     7 +
 .../analytics/overview/project-insights.tsx        |   123 +
 .../core/components/analytics/overview/root.tsx    |    27 +
 .../analytics/select/analytics-params.tsx          |   108 +
 .../core/components/analytics/select/duration.tsx  |    57 +
 .../core/components/analytics/select/project.tsx   |    70 +
 .../components/analytics/select/select-x-axis.tsx  |    36 +
 .../components/analytics/select/select-y-axis.tsx  |    70 +
 apps/web/core/components/analytics/tabs.tsx        |    14 +
 .../core/components/analytics/total-insights.tsx   |   103 +
 apps/web/core/components/analytics/trend-piece.tsx |    86 +
 .../components/analytics/use-analytics-tabs.tsx    |    17 +
 .../analytics/work-items/created-vs-resolved.tsx   |   139 +
 .../analytics/work-items/customized-insights.tsx   |    62 +
 .../core/components/analytics/work-items/index.ts  |     7 +
 .../analytics/work-items/modal/content.tsx         |    87 +
 .../analytics/work-items/modal/header.tsx          |    48 +
 .../analytics/work-items/modal/index.tsx           |    71 +
 .../analytics/work-items/priority-chart.tsx        |   251 +
 .../core/components/analytics/work-items/root.tsx  |    27 +
 .../core/components/analytics/work-items/utils.ts  |    53 +
 .../work-items/workitems-insight-table.tsx         |   210 +
 .../components/api-token/delete-token-modal.tsx    |    80 +
 apps/web/core/components/api-token/empty-state.tsx |    36 +
 .../api-token/modal/create-token-modal.tsx         |    98 +
 apps/web/core/components/api-token/modal/form.tsx  |   279 +
 .../api-token/modal/generated-token-details.tsx    |    67 +
 .../core/components/api-token/token-list-item.tsx  |    66 +
 apps/web/core/components/appearance/index.ts       |     7 +
 .../core/components/appearance/theme-switcher.tsx  |   103 +
 .../core/components/archives/archive-tabs-list.tsx |    69 +
 apps/web/core/components/archives/index.ts         |     7 +
 .../web/core/components/auth-screens/auth-base.tsx |    25 +
 apps/web/core/components/auth-screens/footer.tsx   |    45 +
 apps/web/core/components/auth-screens/header.tsx   |    80 +
 .../auth-screens/not-authorized-view.tsx           |    42 +
 .../project/project-access-restriction.tsx         |    76 +
 .../auth-screens/workspace/not-a-member.tsx        |    41 +
 .../automation/auto-archive-automation.tsx         |   135 +
 .../automation/auto-close-automation.tsx           |   198 +
 apps/web/core/components/automation/index.ts       |     9 +
 .../components/automation/select-month-modal.tsx   |   143 +
 apps/web/core/components/base-layouts/constants.ts |    26 +
 .../core/components/base-layouts/gantt/index.ts    |     8 +
 .../core/components/base-layouts/gantt/layout.tsx  |   146 +
 .../core/components/base-layouts/gantt/sidebar.tsx |   155 +
 .../base-layouts/hooks/use-group-drop-target.ts    |    61 +
 .../base-layouts/hooks/use-layout-state.ts         |    64 +
 .../base-layouts/kanban/group-header.tsx           |    22 +
 .../core/components/base-layouts/kanban/group.tsx  |   104 +
 .../core/components/base-layouts/kanban/item.tsx   |    48 +
 .../core/components/base-layouts/kanban/layout.tsx |    74 +
 .../components/base-layouts/layout-switcher.tsx    |    64 +
 .../components/base-layouts/list/group-header.tsx  |    20 +
 .../core/components/base-layouts/list/group.tsx    |    93 +
 .../web/core/components/base-layouts/list/item.tsx |    46 +
 .../core/components/base-layouts/list/layout.tsx   |    74 +
 .../base-layouts/loaders/layout-loader.tsx         |    30 +
 apps/web/core/components/breadcrumbs/common.tsx    |    23 +
 apps/web/core/components/breadcrumbs/project.tsx   |    88 +
 .../web/core/components/browse/workItem-detail.tsx |    29 +
 apps/web/core/components/chart/utils.ts            |   178 +
 apps/web/core/components/comments/card/display.tsx |   192 +
 .../core/components/comments/card/edit-form.tsx    |   144 +
 apps/web/core/components/comments/card/root.tsx    |    77 +
 .../web/core/components/comments/comment-block.tsx |    51 +
 .../core/components/comments/comment-create.tsx    |   158 +
 .../core/components/comments/comment-reaction.tsx  |    93 +
 apps/web/core/components/comments/comments.tsx     |    90 +
 apps/web/core/components/comments/index.ts         |     7 +
 .../web/core/components/comments/quick-actions.tsx |   126 +
 apps/web/core/components/common/access-field.tsx   |    56 +
 .../components/common/activity/activity-block.tsx  |    60 +
 .../components/common/activity/activity-item.tsx   |    35 +
 .../web/core/components/common/activity/helper.tsx |   291 +
 apps/web/core/components/common/activity/user.tsx  |    43 +
 .../components/common/applied-filters/date.tsx     |    60 +
 .../components/common/applied-filters/members.tsx  |    59 +
 .../components/common/avatar-group-overflow.tsx    |    50 +
 .../web/core/components/common/breadcrumb-link.tsx |    86 +
 apps/web/core/components/common/count-chip.tsx     |    28 +
 apps/web/core/components/common/cover-image.tsx    |    50 +
 apps/web/core/components/common/empty-state.tsx    |    48 +
 .../core/components/common/extended-app-header.tsx |    33 +
 .../core/components/common/filters/created-at.tsx  |    82 +
 .../core/components/common/filters/created-by.tsx  |   116 +
 .../components/common/latest-feature-block.tsx     |    43 +
 .../components/common/layout-error-boundary.tsx    |    60 +
 .../common/layout/sidebar/property-list-item.tsx   |    31 +
 apps/web/core/components/common/logo-spinner.tsx   |    22 +
 apps/web/core/components/common/modal/global.tsx   |    32 +
 .../web/core/components/common/new-empty-state.tsx |   110 +
 .../core/components/common/page-access-icon.tsx    |    23 +
 apps/web/core/components/common/pro-icon.tsx       |    19 +
 .../components/common/quick-actions-factory.tsx    |    94 +
 .../components/common/quick-actions-helper.tsx     |   153 +
 apps/web/core/components/common/switcher-label.tsx |    55 +
 apps/web/core/components/core/activity.tsx         |   771 +
 apps/web/core/components/core/app-header.tsx       |    34 +
 .../core/components/core/content-overflow-HOC.tsx  |   164 +
 apps/web/core/components/core/content-wrapper.tsx  |    22 +
 .../core/description-versions/dropdown-item.tsx    |    47 +
 .../core/description-versions/dropdown.tsx         |    67 +
 .../components/core/description-versions/index.ts  |     7 +
 .../components/core/description-versions/modal.tsx |   186 +
 .../components/core/description-versions/root.tsx  |   106 +
 .../components/core/filters/date-filter-modal.tsx  |   139 +
 .../components/core/filters/date-filter-select.tsx |    67 +
 .../core/components/core/image-picker-popover.tsx  |   392 +
 apps/web/core/components/core/list/index.ts        |     8 +
 apps/web/core/components/core/list/list-item.tsx   |   116 +
 apps/web/core/components/core/list/list-root.tsx   |    24 +
 .../core/modals/bulk-delete-issues-modal-item.tsx  |    54 +
 .../core/modals/bulk-delete-issues-modal.tsx       |   213 +
 .../components/core/modals/change-email-modal.tsx  |   222 +
 .../core/modals/existing-issues-list-modal.tsx     |   340 +
 .../core/modals/gpt-assistant-popover.tsx          |   305 +
 .../core/modals/issue-search-modal-empty-state.tsx |    54 +
 .../core/modals/user-image-upload-modal.tsx        |   161 +
 .../core/modals/workspace-image-upload-modal.tsx   |   174 +
 .../core/multiple-select/entity-select-action.tsx  |    41 +
 .../core/multiple-select/group-select-action.tsx   |    37 +
 .../core/components/core/multiple-select/index.ts  |     9 +
 .../core/multiple-select/select-group.tsx          |    29 +
 apps/web/core/components/core/page-title.tsx       |    24 +
 .../core/components/core/render-if-visible-HOC.tsx |   103 +
 .../components/core/sidebar/progress-chart.tsx     |    76 +
 .../core/sidebar/progress-stats/assignee.tsx       |    90 +
 .../core/sidebar/progress-stats/label.tsx          |    91 +
 .../core/sidebar/progress-stats/shared.ts          |    51 +
 .../core/sidebar/progress-stats/state_group.tsx    |    52 +
 .../core/sidebar/sidebar-menu-hamburger-toggle.tsx |    30 +
 .../core/sidebar/single-progress-stats.tsx         |    36 +
 .../core/components/core/theme/color-inputs.tsx    |    98 +
 .../core/theme/custom-theme-selector.tsx           |   127 +
 .../core/theme/download-config-button.tsx          |    65 +
 .../components/core/theme/import-config-button.tsx |   101 +
 .../components/core/theme/theme-mode-selector.tsx  |    57 +
 .../core/components/core/theme/theme-switch.tsx    |    91 +
 .../components/cycles/active-cycle/cycle-stats.tsx |   377 +
 .../cycles/active-cycle/productivity.tsx           |   108 +
 .../components/cycles/active-cycle/progress.tsx    |   123 +
 .../core/components/cycles/active-cycle/root.tsx   |   154 +
 .../cycles/active-cycle/use-cycles-details.ts      |    97 +
 .../components/cycles/analytics-sidebar/index.ts   |     7 +
 .../cycles/analytics-sidebar/issue-progress.tsx    |   175 +
 .../cycles/analytics-sidebar/progress-stats.tsx    |   181 +
 .../components/cycles/analytics-sidebar/root.tsx   |    68 +
 .../cycles/analytics-sidebar/sidebar-chart.tsx     |    90 +
 .../cycles/analytics-sidebar/sidebar-details.tsx   |   150 +
 .../cycles/analytics-sidebar/sidebar-header.tsx    |   199 +
 .../components/cycles/applied-filters/date.tsx     |    60 +
 .../components/cycles/applied-filters/index.ts     |     7 +
 .../components/cycles/applied-filters/root.tsx     |    98 +
 .../components/cycles/applied-filters/status.tsx   |    52 +
 .../components/cycles/archived-cycles/header.tsx   |   136 +
 .../components/cycles/archived-cycles/index.ts     |     7 +
 .../components/cycles/archived-cycles/modal.tsx    |    82 +
 .../components/cycles/archived-cycles/root.tsx     |    89 +
 .../components/cycles/archived-cycles/view.tsx     |    62 +
 .../core/components/cycles/cycle-peek-overview.tsx |    71 +
 .../core/components/cycles/cycles-view-header.tsx  |   132 +
 apps/web/core/components/cycles/cycles-view.tsx    |    68 +
 apps/web/core/components/cycles/delete-modal.tsx   |    95 +
 .../cycles/dropdowns/estimate-type-dropdown.tsx    |    50 +
 .../cycles/dropdowns/filters/end-date.tsx          |    82 +
 .../components/cycles/dropdowns/filters/index.ts   |    10 +
 .../components/cycles/dropdowns/filters/root.tsx   |    84 +
 .../cycles/dropdowns/filters/start-date.tsx        |    83 +
 .../components/cycles/dropdowns/filters/status.tsx |    57 +
 apps/web/core/components/cycles/dropdowns/index.ts |     8 +
 apps/web/core/components/cycles/form.tsx           |   212 +
 .../cycles/list/cycle-list-group-header.tsx        |    46 +
 .../cycles/list/cycle-list-item-action.tsx         |   316 +
 .../list/cycle-list-project-group-header.tsx       |    48 +
 .../components/cycles/list/cycles-list-item.tsx    |   132 +
 .../components/cycles/list/cycles-list-map.tsx     |    26 +
 apps/web/core/components/cycles/list/index.ts      |     7 +
 apps/web/core/components/cycles/list/root.tsx      |    88 +
 apps/web/core/components/cycles/modal.tsx          |   198 +
 apps/web/core/components/cycles/quick-actions.tsx  |   185 +
 .../components/cycles/transfer-issues-modal.tsx    |   151 +
 .../web/core/components/cycles/transfer-issues.tsx |    42 +
 apps/web/core/components/dropdowns/buttons.tsx     |   143 +
 apps/web/core/components/dropdowns/constants.ts    |    26 +
 .../components/dropdowns/cycle/cycle-options.tsx   |   180 +
 apps/web/core/components/dropdowns/cycle/index.tsx |   157 +
 apps/web/core/components/dropdowns/date-range.tsx  |   303 +
 apps/web/core/components/dropdowns/date.tsx        |   214 +
 apps/web/core/components/dropdowns/estimate.tsx    |   299 +
 .../components/dropdowns/intake-state/base.tsx     |   259 +
 .../components/dropdowns/intake-state/dropdown.tsx |    52 +
 apps/web/core/components/dropdowns/layout.tsx      |    83 +
 .../core/components/dropdowns/member/avatar.tsx    |    69 +
 apps/web/core/components/dropdowns/member/base.tsx |   187 +
 .../core/components/dropdowns/member/dropdown.tsx  |    54 +
 .../components/dropdowns/member/member-options.tsx |   206 +
 .../core/components/dropdowns/member/types.d.ts    |    22 +
 apps/web/core/components/dropdowns/merged-date.tsx |    39 +
 apps/web/core/components/dropdowns/module/base.tsx |   197 +
 .../components/dropdowns/module/button-content.tsx |   126 +
 .../core/components/dropdowns/module/dropdown.tsx  |    60 +
 .../components/dropdowns/module/module-options.tsx |   173 +
 apps/web/core/components/dropdowns/priority.tsx    |   500 +
 .../web/core/components/dropdowns/project/base.tsx |   294 +
 .../core/components/dropdowns/project/dropdown.tsx |    41 +
 apps/web/core/components/dropdowns/state/base.tsx  |   261 +
 .../core/components/dropdowns/state/dropdown.tsx   |    52 +
 apps/web/core/components/dropdowns/types.d.ts      |    22 +
 .../web/core/components/editor/document/editor.tsx |   105 +
 .../components/editor/embeds/mentions/index.ts     |     7 +
 .../components/editor/embeds/mentions/root.tsx     |    20 +
 .../components/editor/embeds/mentions/user.tsx     |    84 +
 .../core/components/editor/lite-text/editor.tsx    |   227 +
 apps/web/core/components/editor/lite-text/index.ts |     8 +
 .../components/editor/lite-text/lite-toolbar.tsx   |    42 +
 .../core/components/editor/lite-text/toolbar.tsx   |   187 +
 apps/web/core/components/editor/pdf/document.tsx   |   237 +
 apps/web/core/components/editor/pdf/index.ts       |     7 +
 .../editor/rich-text/description-input/index.ts    |     7 +
 .../editor/rich-text/description-input/loader.tsx  |    39 +
 .../editor/rich-text/description-input/root.tsx    |   297 +
 .../core/components/editor/rich-text/editor.tsx    |   106 +
 apps/web/core/components/editor/rich-text/index.ts |     7 +
 .../editor/sticky-editor/color-palette.tsx         |    84 +
 .../components/editor/sticky-editor/editor.tsx     |   135 +
 .../core/components/editor/sticky-editor/index.ts  |     8 +
 .../components/editor/sticky-editor/toolbar.tsx    |   113 +
 .../components/empty-state/comic-box-button.tsx    |    81 +
 .../empty-state/detailed-empty-state-root.tsx      |   108 +
 apps/web/core/components/empty-state/helper.tsx    |     8 +
 .../empty-state/section-empty-state-root.tsx       |    34 +
 .../empty-state/simple-empty-state-root.tsx        |    53 +
 apps/web/core/components/epic-modal/index.ts       |     7 +
 apps/web/core/components/epic-modal/modal.tsx      |    26 +
 .../core/components/estimates/create/helper.tsx    |    19 +
 .../web/core/components/estimates/create/modal.tsx |   215 +
 .../core/components/estimates/create/stage-one.tsx |   126 +
 .../web/core/components/estimates/delete/modal.tsx |    89 +
 .../web/core/components/estimates/empty-screen.tsx |    39 +
 .../estimates/estimate-disable-switch.tsx          |    67 +
 .../estimates/estimate-list-item-buttons.tsx       |    33 +
 .../components/estimates/estimate-list-item.tsx    |    55 +
 .../core/components/estimates/estimate-list.tsx    |    40 +
 .../core/components/estimates/estimate-search.tsx  |    14 +
 apps/web/core/components/estimates/index.ts        |     7 +
 apps/web/core/components/estimates/inputs/index.ts |     7 +
 .../components/estimates/inputs/number-input.tsx   |    29 +
 apps/web/core/components/estimates/inputs/root.tsx |    38 +
 .../components/estimates/inputs/text-input.tsx     |    29 +
 .../core/components/estimates/loader-screen.tsx    |    18 +
 .../components/estimates/points/create-root.tsx    |   180 +
 .../core/components/estimates/points/create.tsx    |   209 +
 apps/web/core/components/estimates/points/index.ts |     7 +
 .../core/components/estimates/points/preview.tsx   |   122 +
 .../core/components/estimates/points/update.tsx    |   224 +
 .../web/core/components/estimates/radio-select.tsx |    89 +
 apps/web/core/components/estimates/root.tsx        |   146 +
 apps/web/core/components/exporter/column.tsx       |   118 +
 apps/web/core/components/exporter/export-form.tsx  |   251 +
 apps/web/core/components/exporter/export-modal.tsx |   168 +
 apps/web/core/components/exporter/guide.tsx        |    38 +
 apps/web/core/components/exporter/prev-exports.tsx |   141 +
 .../web/core/components/exporter/single-export.tsx |    81 +
 .../gantt-chart/blocks/block-row-list.tsx          |    64 +
 .../components/gantt-chart/blocks/block-row.tsx    |   121 +
 .../core/components/gantt-chart/blocks/block.tsx   |   111 +
 .../components/gantt-chart/blocks/blocks-list.tsx  |    58 +
 .../core/components/gantt-chart/chart/header.tsx   |    86 +
 .../web/core/components/gantt-chart/chart/index.ts |    10 +
 .../components/gantt-chart/chart/main-content.tsx  |   238 +
 .../web/core/components/gantt-chart/chart/root.tsx |   224 +
 .../gantt-chart/chart/timeline-drag-helper.tsx     |    24 +
 .../components/gantt-chart/chart/views/index.ts    |     9 +
 .../components/gantt-chart/chart/views/month.tsx   |   110 +
 .../components/gantt-chart/chart/views/quarter.tsx |    99 +
 .../components/gantt-chart/chart/views/week.tsx    |    96 +
 apps/web/core/components/gantt-chart/constants.ts  |    17 +
 .../core/components/gantt-chart/contexts/index.tsx |    15 +
 apps/web/core/components/gantt-chart/data/index.ts |   112 +
 .../components/gantt-chart/helpers/add-block.tsx   |   106 +
 .../helpers/blockResizables/left-resizable.tsx     |    67 +
 .../helpers/blockResizables/right-resizable.tsx    |    65 +
 .../helpers/blockResizables/use-gantt-resizable.ts |   150 +
 .../components/gantt-chart/helpers/draggable.tsx   |    67 +
 .../core/components/gantt-chart/helpers/index.ts   |     8 +
 apps/web/core/components/gantt-chart/index.ts      |    10 +
 apps/web/core/components/gantt-chart/root.tsx      |    99 +
 .../gantt-chart/sidebar/gantt-dnd-HOC.tsx          |   121 +
 .../core/components/gantt-chart/sidebar/index.ts   |     9 +
 .../gantt-chart/sidebar/issues/block.tsx           |    98 +
 .../components/gantt-chart/sidebar/issues/index.ts |     7 +
 .../gantt-chart/sidebar/issues/sidebar.tsx         |   134 +
 .../gantt-chart/sidebar/modules/block.tsx          |    67 +
 .../gantt-chart/sidebar/modules/index.ts           |     7 +
 .../gantt-chart/sidebar/modules/sidebar.tsx        |    64 +
 .../core/components/gantt-chart/sidebar/root.tsx   |   109 +
 .../core/components/gantt-chart/sidebar/utils.ts   |    48 +
 .../core/components/gantt-chart/views/helpers.ts   |   137 +
 .../web/core/components/gantt-chart/views/index.ts |    10 +
 .../components/gantt-chart/views/month-view.ts     |   177 +
 .../components/gantt-chart/views/quarter-view.ts   |   154 +
 .../core/components/gantt-chart/views/week-view.ts |   220 +
 apps/web/core/components/global/index.ts           |     9 +
 .../global/product-updates/changelog.tsx           |    90 +
 .../components/global/product-updates/fallback.tsx |    38 +
 .../components/global/product-updates/footer.tsx   |    75 +
 .../components/global/product-updates/header.tsx   |    29 +
 .../components/global/product-updates/index.ts     |     8 +
 .../components/global/product-updates/modal.tsx    |    31 +
 .../web/core/components/global/timezone-select.tsx |    58 +
 apps/web/core/components/global/version-number.tsx |    18 +
 .../components/home/home-dashboard-widgets.tsx     |   115 +
 apps/web/core/components/home/index.ts             |     9 +
 apps/web/core/components/home/root.tsx             |    66 +
 apps/web/core/components/home/user-greetings.tsx   |    61 +
 .../components/home/widgets/empty-states/index.ts  |    10 +
 .../components/home/widgets/empty-states/links.tsx |    21 +
 .../home/widgets/empty-states/no-projects.tsx      |   205 +
 .../home/widgets/empty-states/recents.tsx          |    46 +
 .../home/widgets/empty-states/stickies.tsx         |    17 +
 apps/web/core/components/home/widgets/index.ts     |     9 +
 .../core/components/home/widgets/links/action.tsx  |    28 +
 .../widgets/links/create-update-link-modal.tsx     |   148 +
 .../core/components/home/widgets/links/index.ts    |     9 +
 .../components/home/widgets/links/link-detail.tsx  |   109 +
 .../core/components/home/widgets/links/links.tsx   |    53 +
 .../core/components/home/widgets/links/root.tsx    |    66 +
 .../components/home/widgets/links/use-links.tsx    |   105 +
 .../home/widgets/loaders/home-loader.tsx           |    28 +
 .../core/components/home/widgets/loaders/index.ts  |     8 +
 .../components/home/widgets/loaders/loader.tsx     |    31 +
 .../home/widgets/loaders/quick-links.tsx           |    19 +
 .../home/widgets/loaders/recent-activity.tsx       |    26 +
 .../core/components/home/widgets/manage/index.tsx  |    33 +
 .../widgets/manage/widget-item-drag-handle.tsx     |    31 +
 .../components/home/widgets/manage/widget-item.tsx |   150 +
 .../components/home/widgets/manage/widget-list.tsx |    70 +
 .../home/widgets/manage/widget.helpers.ts          |    68 +
 .../components/home/widgets/recents/filters.tsx    |    57 +
 .../core/components/home/widgets/recents/index.tsx |   111 +
 .../core/components/home/widgets/recents/issue.tsx |   144 +
 .../core/components/home/widgets/recents/page.tsx  |    87 +
 .../components/home/widgets/recents/project.tsx    |    85 +
 .../icons/attachment/attachment-icon.tsx           |    71 +
 .../icons/attachment/audio-file-icon.tsx           |    18 +
 .../components/icons/attachment/css-file-icon.tsx  |    15 +
 .../components/icons/attachment/csv-file-icon.tsx  |    15 +
 .../icons/attachment/default-file-icon.tsx         |    15 +
 .../components/icons/attachment/doc-file-icon.tsx  |    15 +
 .../components/icons/attachment/document-icon.tsx  |    27 +
 .../icons/attachment/figma-file-icon.tsx           |    15 +
 .../components/icons/attachment/html-file-icon.tsx |    15 +
 .../components/icons/attachment/img-file-icon.tsx  |    15 +
 apps/web/core/components/icons/attachment/index.ts |    28 +
 .../components/icons/attachment/jpg-file-icon.tsx  |    15 +
 .../components/icons/attachment/js-file-icon.tsx   |    15 +
 .../components/icons/attachment/pdf-file-icon.tsx  |    15 +
 .../components/icons/attachment/png-file-icon.tsx  |    15 +
 .../components/icons/attachment/rar-file-icon.tsx  |    15 +
 .../components/icons/attachment/setting-icon.tsx   |    27 +
 .../icons/attachment/sheet-file-icon.tsx           |    15 +
 .../components/icons/attachment/svg-file-icon.tsx  |    15 +
 .../core/components/icons/attachment/tune-icon.tsx |    27 +
 .../components/icons/attachment/txt-file-icon.tsx  |    15 +
 .../icons/attachment/video-file-icon.tsx           |    15 +
 .../components/icons/attachment/zip-file-icon.tsx  |    15 +
 apps/web/core/components/icons/index.ts            |     7 +
 .../web/core/components/icons/locked-component.tsx |    30 +
 apps/web/core/components/icons/types.d.ts          |    11 +
 .../inbox/content/inbox-issue-header.tsx           |   472 +
 .../inbox/content/inbox-issue-mobile-header.tsx    |   239 +
 apps/web/core/components/inbox/content/index.ts    |     7 +
 .../components/inbox/content/issue-properties.tsx  |   215 +
 .../core/components/inbox/content/issue-root.tsx   |   226 +
 apps/web/core/components/inbox/content/root.tsx    |   115 +
 .../inbox/inbox-filter/applied-filters/date.tsx    |    70 +
 .../inbox/inbox-filter/applied-filters/label.tsx   |    61 +
 .../inbox/inbox-filter/applied-filters/member.tsx  |    76 +
 .../inbox-filter/applied-filters/priority.tsx      |    61 +
 .../inbox/inbox-filter/applied-filters/root.tsx    |    44 +
 .../inbox/inbox-filter/applied-filters/state.tsx   |    59 +
 .../inbox/inbox-filter/applied-filters/status.tsx  |    52 +
 .../components/inbox/inbox-filter/filters/date.tsx |   102 +
 .../inbox-filter/filters/filter-selection.tsx      |    94 +
 .../inbox/inbox-filter/filters/labels.tsx          |    94 +
 .../inbox/inbox-filter/filters/members.tsx         |   124 +
 .../inbox/inbox-filter/filters/priority.tsx        |    64 +
 .../inbox/inbox-filter/filters/state.tsx           |    99 +
 .../inbox/inbox-filter/filters/status.tsx          |    75 +
 .../core/components/inbox/inbox-filter/index.ts    |     7 +
 .../core/components/inbox/inbox-filter/root.tsx    |    43 +
 .../inbox/inbox-filter/sorting/order-by.tsx        |    75 +
 .../core/components/inbox/inbox-issue-status.tsx   |    56 +
 .../core/components/inbox/inbox-status-icon.tsx    |    66 +
 apps/web/core/components/inbox/index.ts            |     7 +
 .../inbox/modals/create-modal/create-root.tsx      |   255 +
 .../components/inbox/modals/create-modal/index.ts  |     7 +
 .../modals/create-modal/issue-description.tsx      |   125 +
 .../inbox/modals/create-modal/issue-properties.tsx |   237 +
 .../inbox/modals/create-modal/issue-title.tsx      |    52 +
 .../components/inbox/modals/create-modal/modal.tsx |    52 +
 .../inbox/modals/decline-issue-modal.tsx           |    66 +
 .../components/inbox/modals/delete-issue-modal.tsx |    89 +
 .../components/inbox/modals/select-duplicate.tsx   |   169 +
 .../components/inbox/modals/snooze-issue-modal.tsx |    65 +
 apps/web/core/components/inbox/root.tsx            |   119 +
 .../components/inbox/sidebar/inbox-list-item.tsx   |   136 +
 .../core/components/inbox/sidebar/inbox-list.tsx   |    38 +
 apps/web/core/components/inbox/sidebar/index.ts    |     7 +
 apps/web/core/components/inbox/sidebar/root.tsx    |   188 +
 apps/web/core/components/instance/index.ts         |     8 +
 .../components/instance/maintenance-message.tsx    |    43 +
 .../core/components/instance/maintenance-view.tsx  |    39 +
 .../core/components/instance/not-ready-view.tsx    |    58 +
 .../integration/github/select-repository.tsx       |    91 +
 .../integration/single-integration-card.tsx        |   186 +
 .../integration/slack/select-channel.tsx           |   111 +
 .../core/components/issues/archive-issue-modal.tsx |    88 +
 .../components/issues/archived-issues-header.tsx   |    77 +
 .../issues/attachment/attachment-detail.tsx        |   111 +
 .../issues/attachment/attachment-item-list.tsx     |   157 +
 .../issues/attachment/attachment-list-item.tsx     |   107 +
 .../attachment/attachment-list-upload-item.tsx     |    50 +
 .../attachment/attachment-upload-details.tsx       |    58 +
 .../issues/attachment/attachment-upload.tsx        |    72 +
 .../issues/attachment/attachments-list.tsx         |    48 +
 .../issues/attachment/delete-attachment-modal.tsx  |    76 +
 .../web/core/components/issues/attachment/index.ts |     7 +
 .../web/core/components/issues/attachment/root.tsx |    40 +
 .../components/issues/bulk-operations/index.ts     |     7 +
 .../components/issues/bulk-operations/root.tsx     |    60 +
 .../components/issues/confirm-issue-discard.tsx    |    66 +
 .../issues/create-issue-toast-action-items.tsx     |    89 +
 .../core/components/issues/delete-issue-modal.tsx  |   130 +
 apps/web/core/components/issues/filters.tsx        |   140 +
 apps/web/core/components/issues/header.tsx         |   131 +
 .../issues/issue-detail-widgets/action-buttons.tsx |    94 +
 .../issue-detail-widgets/attachments/content.tsx   |    37 +
 .../issue-detail-widgets/attachments/helper.tsx    |    85 +
 .../issue-detail-widgets/attachments/index.ts      |    10 +
 .../attachments/quick-action-button.tsx            |   110 +
 .../issue-detail-widgets/attachments/root.tsx      |    61 +
 .../issue-detail-widgets/attachments/title.tsx     |    40 +
 .../issues/issue-detail-widgets/index.ts           |     7 +
 .../issue-detail-widget-collapsibles.tsx           |    92 +
 .../issue-detail-widget-modals.tsx                 |   200 +
 .../issues/issue-detail-widgets/links/content.tsx  |    36 +
 .../issues/issue-detail-widgets/links/helper.tsx   |    87 +
 .../issues/issue-detail-widgets/links/index.ts     |    10 +
 .../links/quick-action-button.tsx                  |    38 +
 .../issues/issue-detail-widgets/links/root.tsx     |    54 +
 .../issues/issue-detail-widgets/links/title.tsx    |    42 +
 .../issue-detail-widgets/relations/content.tsx     |   245 +
 .../issue-detail-widgets/relations/helper.tsx      |    65 +
 .../issues/issue-detail-widgets/relations/index.ts |    10 +
 .../relations/quick-action-button.tsx              |    74 +
 .../issues/issue-detail-widgets/relations/root.tsx |    52 +
 .../issue-detail-widgets/relations/title.tsx       |    42 +
 .../issues/issue-detail-widgets/root.tsx           |    67 +
 .../issue-detail-widgets/sub-issues/content.tsx    |   175 +
 .../sub-issues/display-filters.tsx                 |   107 +
 .../issue-detail-widgets/sub-issues/filters.tsx    |   161 +
 .../issue-detail-widgets/sub-issues/helper.ts      |   173 +
 .../issue-detail-widgets/sub-issues/index.ts       |    11 +
 .../sub-issues/issues-list/list-group.tsx          |    99 +
 .../sub-issues/issues-list/list-item.tsx           |   270 +
 .../sub-issues/issues-list/properties.tsx          |   227 +
 .../sub-issues/issues-list/root.tsx                |   131 +
 .../sub-issues/quick-action-button.tsx             |   102 +
 .../issue-detail-widgets/sub-issues/root.tsx       |    59 +
 .../sub-issues/title-actions.tsx                   |   118 +
 .../issue-detail-widgets/sub-issues/title.tsx      |    56 +
 .../issues/issue-detail-widgets/widget-button.tsx  |    25 +
 .../issues/issue-detail/cycle-select.tsx           |    68 +
 .../issues/issue-detail/identifier-text.tsx        |    65 +
 .../core/components/issues/issue-detail/index.ts   |     7 +
 .../issue-activity/activity-comment-root.tsx       |    86 +
 .../issue-activity/activity-filter.tsx             |    68 +
 .../activity/actions/archived-at.tsx               |    44 +
 .../issue-activity/activity/actions/assignee.tsx   |    48 +
 .../issue-activity/activity/actions/attachment.tsx |    39 +
 .../issue-activity/activity/actions/cycle.tsx      |    74 +
 .../issue-activity/activity/actions/default.tsx    |    53 +
 .../activity/actions/description.tsx               |    39 +
 .../issue-activity/activity/actions/estimate.tsx   |    41 +
 .../activity/actions/helpers/activity-block.tsx    |    64 +
 .../activity/actions/helpers/activity.ts           |    30 +
 .../activity/actions/helpers/issue-creator.tsx     |    41 +
 .../activity/actions/helpers/issue-link.tsx        |    55 +
 .../activity/actions/helpers/issue-user.tsx        |    41 +
 .../issue-activity/activity/actions/inbox.tsx      |    51 +
 .../issue-activity/activity/actions/index.ts       |    30 +
 .../activity/actions/label-activity-chip.tsx       |    27 +
 .../issue-activity/activity/actions/label.tsx      |    47 +
 .../issue-activity/activity/actions/link.tsx       |    75 +
 .../issue-activity/activity/actions/module.tsx     |    74 +
 .../issue-activity/activity/actions/name.tsx       |    35 +
 .../issue-activity/activity/actions/parent.tsx     |    44 +
 .../issue-activity/activity/actions/priority.tsx   |    39 +
 .../issue-activity/activity/actions/relation.tsx   |    46 +
 .../issue-activity/activity/actions/start_date.tsx |    46 +
 .../issue-activity/activity/actions/state.tsx      |    40 +
 .../activity/actions/target_date.tsx               |    46 +
 .../issue-activity/activity/activity-list.tsx      |    97 +
 .../issue-detail/issue-activity/filter-root.tsx    |    34 +
 .../issues/issue-detail/issue-activity/helper.tsx  |   216 +
 .../issues/issue-detail/issue-activity/index.ts    |    16 +
 .../issues/issue-detail/issue-activity/loader.tsx  |    39 +
 .../issues/issue-detail/issue-activity/root.tsx    |   130 +
 .../issue-detail/issue-activity/sort-root.tsx      |    22 +
 .../issue-detail/issue-detail-quick-actions.tsx    |   165 +
 .../issues/issue-detail/issue-identifier.tsx       |    42 +
 .../issues/issue-detail/label/create-label.tsx     |   178 +
 .../components/issues/issue-detail/label/index.ts  |    13 +
 .../issues/issue-detail/label/label-list-item.tsx  |    46 +
 .../issues/issue-detail/label/label-list.tsx       |    43 +
 .../components/issues/issue-detail/label/root.tsx  |   122 +
 .../issue-detail/label/select/label-select.tsx     |   225 +
 .../issues/issue-detail/label/select/root.tsx      |    37 +
 .../links/create-update-link-modal.tsx             |   163 +
 .../components/issues/issue-detail/links/index.ts  |    12 +
 .../issues/issue-detail/links/link-detail.tsx      |   126 +
 .../issues/issue-detail/links/link-item.tsx        |   128 +
 .../issues/issue-detail/links/link-list.tsx        |    50 +
 .../components/issues/issue-detail/links/links.tsx |    43 +
 .../components/issues/issue-detail/links/root.tsx  |   146 +
 .../issues/issue-detail/main-content.tsx           |   186 +
 .../issues/issue-detail/module-select.tsx          |    84 +
 .../issues/issue-detail/parent-select.tsx          |   138 +
 .../components/issues/issue-detail/parent/index.ts |    10 +
 .../components/issues/issue-detail/parent/root.tsx |   110 +
 .../issues/issue-detail/parent/sibling-item.tsx    |    65 +
 .../issues/issue-detail/parent/siblings.tsx        |    61 +
 .../issues/issue-detail/reactions/index.ts         |     8 +
 .../issue-detail/reactions/issue-comment.tsx       |   143 +
 .../issues/issue-detail/reactions/issue.tsx        |   149 +
 .../issues/issue-detail/relation-select.tsx        |   173 +
 .../core/components/issues/issue-detail/root.tsx   |   271 +
 .../components/issues/issue-detail/sidebar.tsx     |   256 +
 .../issues/issue-detail/subscription.tsx           |   104 +
 .../issue-layouts/calendar/base-calendar-root.tsx  |   196 +
 .../issues/issue-layouts/calendar/calendar.tsx     |   262 +
 .../issues/issue-layouts/calendar/day-tile.tsx     |   220 +
 .../issue-layouts/calendar/dropdowns/index.ts      |     8 +
 .../calendar/dropdowns/months-dropdown.tsx         |   155 +
 .../calendar/dropdowns/options-dropdown.tsx        |   173 +
 .../issues/issue-layouts/calendar/header.tsx       |   126 +
 .../issue-layouts/calendar/issue-block-root.tsx    |    77 +
 .../issues/issue-layouts/calendar/issue-block.tsx  |   188 +
 .../issues/issue-layouts/calendar/issue-blocks.tsx |   117 +
 .../calendar/quick-add-issue-actions.tsx           |   148 +
 .../issue-layouts/calendar/roots/cycle-root.tsx    |    47 +
 .../issue-layouts/calendar/roots/module-root.tsx   |    42 +
 .../issue-layouts/calendar/roots/project-root.tsx  |    37 +
 .../calendar/roots/project-view-root.tsx           |    17 +
 .../issues/issue-layouts/calendar/utils.ts         |    27 +
 .../issues/issue-layouts/calendar/week-days.tsx    |   122 +
 .../issues/issue-layouts/calendar/week-header.tsx  |    50 +
 .../issue-layouts/empty-states/archived-issues.tsx |    69 +
 .../issues/issue-layouts/empty-states/cycle.tsx    |   132 +
 .../issue-layouts/empty-states/global-view.tsx     |    70 +
 .../issues/issue-layouts/empty-states/index.tsx    |    44 +
 .../issues/issue-layouts/empty-states/module.tsx   |   119 +
 .../issue-layouts/empty-states/profile-view.tsx    |    29 +
 .../issue-layouts/empty-states/project-epic.tsx    |     9 +
 .../issue-layouts/empty-states/project-issues.tsx  |    71 +
 .../issue-layouts/empty-states/project-view.tsx    |    45 +
 .../filters/applied-filters/cycle.tsx              |    54 +
 .../issue-layouts/filters/applied-filters/date.tsx |    58 +
 .../issue-layouts/filters/applied-filters/index.ts |    15 +
 .../filters/applied-filters/label.tsx              |    54 +
 .../filters/applied-filters/members.tsx            |    58 +
 .../filters/applied-filters/module.tsx             |    49 +
 .../filters/applied-filters/priority.tsx           |    43 +
 .../filters/applied-filters/project.tsx            |    51 +
 .../filters/applied-filters/state-group.tsx        |    40 +
 .../filters/applied-filters/state.tsx              |    55 +
 .../display-filters/display-filters-selection.tsx  |   145 +
 .../header/display-filters/display-properties.tsx  |    93 +
 .../header/display-filters/extra-options.tsx       |    60 +
 .../filters/header/display-filters/group-by.tsx    |    66 +
 .../filters/header/display-filters/index.ts        |    12 +
 .../filters/header/display-filters/order-by.tsx    |    53 +
 .../header/display-filters/sub-group-by.tsx        |    61 +
 .../filters/header/filters/assignee.tsx            |   116 +
 .../filters/header/filters/created-by.tsx          |   116 +
 .../issue-layouts/filters/header/filters/cycle.tsx |   111 +
 .../filters/header/filters/due-date.tsx            |    81 +
 .../issue-layouts/filters/header/filters/index.ts  |    18 +
 .../filters/header/filters/labels.tsx              |   101 +
 .../filters/header/filters/mentions.tsx            |   116 +
 .../filters/header/filters/module.tsx              |   101 +
 .../filters/header/filters/priority.tsx            |    58 +
 .../filters/header/filters/project.tsx             |   102 +
 .../filters/header/filters/start-date.tsx          |    80 +
 .../filters/header/filters/state-group.tsx         |    75 +
 .../issue-layouts/filters/header/filters/state.tsx |   100 +
 .../filters/header/helpers/dropdown.tsx            |   118 +
 .../filters/header/helpers/filter-header.tsx       |    29 +
 .../filters/header/helpers/filter-option.tsx       |    43 +
 .../issue-layouts/filters/header/helpers/index.ts  |     9 +
 .../issues/issue-layouts/filters/header/index.ts   |    11 +
 .../filters/header/layout-selection.tsx            |    63 +
 .../filters/header/mobile-layout-selection.tsx     |    56 +
 .../issues/issue-layouts/filters/index.ts          |     8 +
 .../issues/issue-layouts/gantt/base-gantt-root.tsx |   156 +
 .../issues/issue-layouts/gantt/blocks.tsx          |   160 +
 .../components/issues/issue-layouts/gantt/index.ts |     7 +
 .../issues/issue-layouts/group-drag-overlay.tsx    |    86 +
 .../issues/issue-layouts/issue-layout-HOC.tsx      |    63 +
 .../issue-layouts/kanban/base-kanban-root.tsx      |   298 +
 .../issues/issue-layouts/kanban/block.tsx          |   295 +
 .../issues/issue-layouts/kanban/blocks-list.tsx    |    81 +
 .../issues/issue-layouts/kanban/default.tsx        |   239 +
 .../issue-layouts/kanban/headers/group-by-card.tsx |   185 +
 .../kanban/headers/sub-group-by-card.tsx           |    50 +
 .../issues/issue-layouts/kanban/kanban-group.tsx   |   346 +
 .../issue-layouts/kanban/roots/cycle-root.tsx      |    58 +
 .../issue-layouts/kanban/roots/module-root.tsx     |    34 +
 .../kanban/roots/profile-issues-root.tsx           |    37 +
 .../issue-layouts/kanban/roots/project-root.tsx    |    37 +
 .../kanban/roots/project-view-root.tsx             |    21 +
 .../issues/issue-layouts/kanban/swimlanes.tsx      |   351 +
 .../issues/issue-layouts/layout-icon.tsx           |    35 +
 .../issues/issue-layouts/list/base-list-root.tsx   |   182 +
 .../issues/issue-layouts/list/block-root.tsx       |   190 +
 .../components/issues/issue-layouts/list/block.tsx |   323 +
 .../issues/issue-layouts/list/blocks-list.tsx      |    73 +
 .../issues/issue-layouts/list/default.tsx          |   182 +
 .../issue-layouts/list/headers/group-by-card.tsx   |   183 +
 .../issues/issue-layouts/list/list-group.tsx       |   350 +
 .../issues/issue-layouts/list/list-view-types.d.ts |    31 +
 .../list/roots/archived-issue-root.tsx             |    21 +
 .../issues/issue-layouts/list/roots/cycle-root.tsx |    57 +
 .../issue-layouts/list/roots/module-root.tsx       |    33 +
 .../list/roots/profile-issues-root.tsx             |    37 +
 .../issue-layouts/list/roots/project-root.tsx      |    39 +
 .../issue-layouts/list/roots/project-view-root.tsx |    21 +
 .../issue-layouts/properties/all-properties.tsx    |   488 +
 .../issues/issue-layouts/properties/index.ts       |     9 +
 .../issue-layouts/properties/label-dropdown.tsx    |   337 +
 .../issues/issue-layouts/properties/labels.tsx     |   260 +
 .../properties/with-display-properties-HOC.tsx     |    35 +
 .../quick-action-dropdowns/all-issue.tsx           |   239 +
 .../quick-action-dropdowns/archived-issue.tsx      |   134 +
 .../quick-action-dropdowns/copy-menu-helper.tsx    |    28 +
 .../quick-action-dropdowns/cycle-issue.tsx         |   251 +
 .../quick-action-dropdowns/helper.tsx              |   389 +
 .../issue-layouts/quick-action-dropdowns/index.ts  |    14 +
 .../quick-action-dropdowns/issue-detail.tsx        |   338 +
 .../quick-action-dropdowns/module-issue.tsx        |   251 +
 .../quick-action-dropdowns/project-issue.tsx       |   252 +
 .../issue-layouts/quick-add/button/gantt.tsx       |    29 +
 .../issues/issue-layouts/quick-add/button/index.ts |    10 +
 .../issue-layouts/quick-add/button/kanban.tsx      |    25 +
 .../issues/issue-layouts/quick-add/button/list.tsx |    26 +
 .../issue-layouts/quick-add/button/spreadsheet.tsx |    28 +
 .../issue-layouts/quick-add/form/calendar.tsx      |    37 +
 .../issues/issue-layouts/quick-add/form/gantt.tsx  |    40 +
 .../issues/issue-layouts/quick-add/form/index.ts   |    12 +
 .../issues/issue-layouts/quick-add/form/kanban.tsx |    34 +
 .../issues/issue-layouts/quick-add/form/list.tsx   |    39 +
 .../issues/issue-layouts/quick-add/form/root.tsx   |    84 +
 .../issue-layouts/quick-add/form/spreadsheet.tsx   |    37 +
 .../issues/issue-layouts/quick-add/index.ts        |     9 +
 .../issues/issue-layouts/quick-add/root.tsx        |   178 +
 .../issue-layouts/roots/all-issue-layout-root.tsx  |   172 +
 .../roots/archived-issue-layout-root.tsx           |    68 +
 .../issue-layouts/roots/cycle-layout-root.tsx      |   126 +
 .../issue-layouts/roots/module-layout-root.tsx     |    95 +
 .../issue-layouts/roots/project-layout-root.tsx    |    98 +
 .../roots/project-view-layout-root.tsx             |   115 +
 .../spreadsheet/base-spreadsheet-root.tsx          |   135 +
 .../spreadsheet/columns/assignee-column.tsx        |    52 +
 .../spreadsheet/columns/attachment-column.tsx      |    25 +
 .../spreadsheet/columns/created-on-column.tsx      |    27 +
 .../spreadsheet/columns/cycle-column.tsx           |    56 +
 .../spreadsheet/columns/due-date-column.tsx        |    66 +
 .../spreadsheet/columns/estimate-column.tsx        |    40 +
 .../spreadsheet/columns/header-column.tsx          |   143 +
 .../issue-layouts/spreadsheet/columns/index.ts     |    20 +
 .../spreadsheet/columns/label-column.tsx           |    54 +
 .../spreadsheet/columns/link-column.tsx            |    25 +
 .../spreadsheet/columns/module-column.tsx          |    67 +
 .../spreadsheet/columns/priority-column.tsx        |    37 +
 .../spreadsheet/columns/start-date-column.tsx      |    54 +
 .../spreadsheet/columns/state-column.tsx           |    39 +
 .../spreadsheet/columns/sub-issue-column.tsx       |    53 +
 .../spreadsheet/columns/updated-on-column.tsx      |    27 +
 .../issue-layouts/spreadsheet/issue-column.tsx     |    61 +
 .../issues/issue-layouts/spreadsheet/issue-row.tsx |   394 +
 .../issue-layouts/spreadsheet/roots/cycle-root.tsx |    47 +
 .../spreadsheet/roots/module-root.tsx              |    19 +
 .../spreadsheet/roots/project-root.tsx             |    38 +
 .../spreadsheet/roots/project-view-root.tsx        |    21 +
 .../spreadsheet/roots/workspace-root.tsx           |   131 +
 .../spreadsheet/spreadsheet-header-column.tsx      |    55 +
 .../spreadsheet/spreadsheet-header.tsx             |    93 +
 .../spreadsheet/spreadsheet-table.tsx              |   154 +
 .../issue-layouts/spreadsheet/spreadsheet-view.tsx |   128 +
 .../core/components/issues/issue-layouts/utils.tsx |   889 +
 .../core/components/issues/issue-modal/base.tsx    |   429 +
 .../issue-modal/components/default-properties.tsx  |   341 +
 .../issue-modal/components/description-editor.tsx  |   299 +
 .../issues/issue-modal/components/index.ts         |    11 +
 .../issues/issue-modal/components/parent-tag.tsx   |    79 +
 .../issue-modal/components/project-select.tsx      |    62 +
 .../issues/issue-modal/components/title-input.tsx  |    89 +
 .../components/issues/issue-modal/context/index.ts |     7 +
 .../issue-modal/context/issue-modal-context.tsx    |    81 +
 .../issues/issue-modal/draft-issue-layout.tsx      |   141 +
 .../core/components/issues/issue-modal/form.tsx    |   520 +
 .../core/components/issues/issue-modal/modal.tsx   |    58 +
 .../components/issues/issue-modal/provider.tsx     |    60 +
 .../core/components/issues/issue-type-switcher.tsx |    30 +
 .../core/components/issues/issue-update-status.tsx |    34 +
 apps/web/core/components/issues/label.tsx          |    61 +
 .../components/issues/layout-quick-actions.tsx     |    79 +
 .../components/issues/parent-issues-list-modal.tsx |   204 +
 .../core/components/issues/parent-select-root.tsx  |    88 +
 .../core/components/issues/peek-overview/error.tsx |    44 +
 .../components/issues/peek-overview/header.tsx     |   236 +
 .../core/components/issues/peek-overview/index.ts  |     7 +
 .../issues/peek-overview/issue-detail.tsx          |   171 +
 .../components/issues/peek-overview/loader.tsx     |   110 +
 .../issues/peek-overview/peek-overviews.tsx        |    15 +
 .../components/issues/peek-overview/properties.tsx |   245 +
 .../core/components/issues/peek-overview/root.tsx  |   252 +
 .../core/components/issues/peek-overview/view.tsx  |   273 +
 .../core/components/issues/preview-card/date.tsx   |    56 +
 .../core/components/issues/preview-card/index.ts   |     7 +
 .../core/components/issues/preview-card/root.tsx   |    69 +
 .../issues/relations/issue-list-item.tsx           |   208 +
 .../components/issues/relations/issue-list.tsx     |    61 +
 .../components/issues/relations/properties.tsx     |    95 +
 apps/web/core/components/issues/select/base.tsx    |   322 +
 .../web/core/components/issues/select/dropdown.tsx |    60 +
 apps/web/core/components/issues/select/index.ts    |     7 +
 apps/web/core/components/issues/title-input.tsx    |   185 +
 .../issues/workspace-draft/delete-modal.tsx        |   109 +
 .../issues/workspace-draft/draft-issue-block.tsx   |   204 +
 .../workspace-draft/draft-issue-properties.tsx     |   279 +
 .../issues/workspace-draft/empty-state.tsx         |    57 +
 .../components/issues/workspace-draft/index.ts     |     7 +
 .../components/issues/workspace-draft/loader.tsx   |    24 +
 .../issues/workspace-draft/quick-action.tsx        |    69 +
 .../components/issues/workspace-draft/root.tsx     |   116 +
 .../labels/create-update-label-inline.tsx          |   259 +
 .../core/components/labels/delete-label-modal.tsx  |    73 +
 apps/web/core/components/labels/index.ts           |    11 +
 .../labels/label-block/label-item-block.tsx        |   112 +
 .../components/labels/label-block/label-name.tsx   |    33 +
 .../components/labels/label-drag-n-drop-HOC.tsx    |   174 +
 apps/web/core/components/labels/label-utils.ts     |    73 +
 .../labels/project-setting-label-group.tsx         |   167 +
 .../labels/project-setting-label-item.tsx          |   124 +
 .../labels/project-setting-label-list.tsx          |   174 +
 apps/web/core/components/license/index.ts          |     7 +
 .../license/modal/card/base-paid-plan-card.tsx     |    98 +
 .../license/modal/card/checkout-button.tsx         |   106 +
 .../license/modal/card/discount-info.tsx           |    66 +
 .../components/license/modal/card/free-plan.tsx    |    47 +
 .../core/components/license/modal/card/index.ts    |    10 +
 .../components/license/modal/card/plan-upgrade.tsx |   115 +
 .../license/modal/card/talk-to-sales.tsx           |   104 +
 apps/web/core/components/license/modal/index.ts    |     7 +
 .../components/license/modal/upgrade-modal.tsx     |   136 +
 apps/web/core/components/modals/project-level.tsx  |    68 +
 .../web/core/components/modals/work-item-level.tsx |   111 +
 .../web/core/components/modals/workspace-level.tsx |    31 +
 .../components/modules/analytics-sidebar/index.ts  |     9 +
 .../modules/analytics-sidebar/issue-progress.tsx   |   235 +
 .../modules/analytics-sidebar/progress-stats.tsx   |   179 +
 .../components/modules/analytics-sidebar/root.tsx  |   442 +
 .../components/modules/applied-filters/date.tsx    |    61 +
 .../components/modules/applied-filters/index.ts    |    10 +
 .../components/modules/applied-filters/members.tsx |    58 +
 .../components/modules/applied-filters/root.tsx    |   138 +
 .../components/modules/applied-filters/status.tsx  |    49 +
 .../components/modules/archived-modules/header.tsx |   161 +
 .../components/modules/archived-modules/index.ts   |    10 +
 .../components/modules/archived-modules/modal.tsx  |    82 +
 .../components/modules/archived-modules/root.tsx   |    92 +
 .../components/modules/archived-modules/view.tsx   |    69 +
 .../components/modules/delete-module-modal.tsx     |    89 +
 .../components/modules/dropdowns/filters/index.ts  |    12 +
 .../components/modules/dropdowns/filters/lead.tsx  |   116 +
 .../modules/dropdowns/filters/members.tsx          |   116 +
 .../components/modules/dropdowns/filters/root.tsx  |   128 +
 .../modules/dropdowns/filters/start-date.tsx       |    84 +
 .../modules/dropdowns/filters/status.tsx           |    57 +
 .../modules/dropdowns/filters/target-date.tsx      |    83 +
 .../web/core/components/modules/dropdowns/index.ts |     8 +
 .../core/components/modules/dropdowns/order-by.tsx |    85 +
 apps/web/core/components/modules/form.tsx          |   261 +
 .../core/components/modules/gantt-chart/blocks.tsx |    90 +
 .../core/components/modules/gantt-chart/index.ts   |     8 +
 .../modules/gantt-chart/modules-list-layout.tsx    |    77 +
 apps/web/core/components/modules/index.ts          |    26 +
 .../modules/links/create-update-modal.tsx          |   157 +
 apps/web/core/components/modules/links/index.ts    |     9 +
 .../core/components/modules/links/list-item.tsx    |   110 +
 apps/web/core/components/modules/links/list.tsx    |    49 +
 apps/web/core/components/modules/modal.tsx         |   149 +
 .../core/components/modules/module-card-item.tsx   |   267 +
 .../core/components/modules/module-layout-icon.tsx |    46 +
 .../components/modules/module-list-item-action.tsx |   195 +
 .../core/components/modules/module-list-item.tsx   |   125 +
 .../components/modules/module-peek-overview.tsx    |    69 +
 .../components/modules/module-status-dropdown.tsx  |    60 +
 .../core/components/modules/module-view-header.tsx |   196 +
 .../core/components/modules/modules-list-view.tsx  |   116 +
 apps/web/core/components/modules/quick-actions.tsx |   179 +
 apps/web/core/components/modules/select/index.ts   |     7 +
 apps/web/core/components/modules/select/status.tsx |    71 +
 .../components/modules/sidebar-select/index.ts     |     7 +
 .../modules/sidebar-select/select-status.tsx       |    72 +
 .../core/components/navigation/app-rail-hoc.tsx    |    38 +
 .../core/components/navigation/app-rail-root.tsx   |    87 +
 .../navigation/customize-navigation-dialog.tsx     |   359 +
 apps/web/core/components/navigation/index.ts       |    11 +
 apps/web/core/components/navigation/items-root.tsx |    31 +
 .../components/navigation/project-actions-menu.tsx |   120 +
 .../navigation/project-header-button.tsx           |    36 +
 .../core/components/navigation/project-header.tsx  |   111 +
 .../navigation/tab-navigation-overflow-menu.tsx    |    99 +
 .../components/navigation/tab-navigation-root.tsx  |   257 +
 .../components/navigation/tab-navigation-utils.ts  |   117 +
 .../navigation/tab-navigation-visible-item.tsx     |    83 +
 .../core/components/navigation/top-nav-power-k.tsx |   294 +
 .../components/navigation/top-navigation-root.tsx  |    88 +
 .../core/components/navigation/use-active-tab.ts   |    42 +
 .../components/navigation/use-navigation-items.ts  |   124 +
 .../components/navigation/use-project-actions.ts   |    61 +
 .../navigation/use-responsive-tab-layout.ts        |   169 +
 .../components/navigation/use-tab-preferences.ts   |   143 +
 .../onboarding/create-or-join-workspaces.tsx       |    98 +
 .../components/onboarding/create-workspace.tsx     |   275 +
 apps/web/core/components/onboarding/header.tsx     |    93 +
 apps/web/core/components/onboarding/index.ts       |     7 +
 .../web/core/components/onboarding/invitations.tsx |   128 +
 .../core/components/onboarding/invite-members.tsx  |   409 +
 .../core/components/onboarding/profile-setup.tsx   |   562 +
 apps/web/core/components/onboarding/root.tsx       |   144 +
 .../core/components/onboarding/step-indicator.tsx  |    51 +
 .../components/onboarding/steps/common/header.tsx  |    19 +
 .../components/onboarding/steps/common/index.ts    |     7 +
 apps/web/core/components/onboarding/steps/index.ts |     7 +
 .../onboarding/steps/profile/consent.tsx           |    29 +
 .../components/onboarding/steps/profile/index.ts   |     7 +
 .../components/onboarding/steps/profile/root.tsx   |   265 +
 .../onboarding/steps/profile/set-password.tsx      |   133 +
 .../core/components/onboarding/steps/role/index.ts |     7 +
 .../core/components/onboarding/steps/role/root.tsx |   164 +
 apps/web/core/components/onboarding/steps/root.tsx |    65 +
 .../core/components/onboarding/steps/team/index.ts |     7 +
 .../core/components/onboarding/steps/team/root.tsx |   400 +
 .../components/onboarding/steps/usecase/index.ts   |     7 +
 .../components/onboarding/steps/usecase/root.tsx   |   162 +
 .../onboarding/steps/workspace/create.tsx          |   304 +
 .../components/onboarding/steps/workspace/index.ts |     9 +
 .../onboarding/steps/workspace/join-invites.tsx    |   126 +
 .../components/onboarding/steps/workspace/root.tsx |    56 +
 .../onboarding/switch-account-dropdown.tsx         |    82 +
 .../components/onboarding/switch-account-modal.tsx |   118 +
 apps/web/core/components/onboarding/tour/root.tsx  |   185 +
 .../core/components/onboarding/tour/sidebar.tsx    |    77 +
 .../core/components/pages/dropdowns/actions.tsx    |   223 +
 apps/web/core/components/pages/dropdowns/index.ts  |     7 +
 .../components/pages/editor/ai/ask-pi-menu.tsx     |   120 +
 apps/web/core/components/pages/editor/ai/index.ts  |     8 +
 apps/web/core/components/pages/editor/ai/menu.tsx  |   313 +
 .../core/components/pages/editor/editor-body.tsx   |   312 +
 .../core/components/pages/editor/header/index.ts   |     7 +
 .../components/pages/editor/header/logo-picker.tsx |    57 +
 .../core/components/pages/editor/header/root.tsx   |    77 +
 .../web/core/components/pages/editor/page-root.tsx |   213 +
 .../pages/editor/summary/content-browser.tsx       |    88 +
 .../pages/editor/summary/heading-components.tsx    |    41 +
 .../core/components/pages/editor/summary/index.ts  |     7 +
 .../pages/editor/toolbar/color-dropdown.tsx        |   124 +
 .../core/components/pages/editor/toolbar/index.ts  |    10 +
 .../pages/editor/toolbar/options-dropdown.tsx      |   158 +
 .../core/components/pages/editor/toolbar/root.tsx  |    90 +
 .../components/pages/editor/toolbar/toolbar.tsx    |   189 +
 apps/web/core/components/pages/header/actions.tsx  |    38 +
 .../components/pages/header/archived-badge.tsx     |    27 +
 .../components/pages/header/copy-link-control.tsx  |    71 +
 .../components/pages/header/favorite-control.tsx   |    44 +
 apps/web/core/components/pages/header/index.ts     |     7 +
 .../core/components/pages/header/lock-control.tsx  |   120 +
 .../core/components/pages/header/offline-badge.tsx |    36 +
 apps/web/core/components/pages/header/root.tsx     |   106 +
 .../core/components/pages/header/syncing-badge.tsx |    65 +
 .../components/pages/list/applied-filters/index.ts |     7 +
 .../components/pages/list/applied-filters/root.tsx |    90 +
 .../components/pages/list/block-item-action.tsx    |    99 +
 apps/web/core/components/pages/list/block.tsx      |    60 +
 .../core/components/pages/list/filters/index.ts    |     7 +
 .../core/components/pages/list/filters/root.tsx    |   114 +
 apps/web/core/components/pages/list/index.ts       |     7 +
 apps/web/core/components/pages/list/order-by.tsx   |    88 +
 apps/web/core/components/pages/list/root.tsx       |    38 +
 .../core/components/pages/list/search-input.tsx    |    87 +
 .../core/components/pages/list/tab-navigation.tsx  |    67 +
 .../pages/loaders/page-content-loader.tsx          |    89 +
 .../core/components/pages/loaders/page-loader.tsx  |    37 +
 .../components/pages/modals/create-page-modal.tsx  |    93 +
 .../components/pages/modals/delete-page-modal.tsx  |    92 +
 .../components/pages/modals/export-page-modal.tsx  |   295 +
 .../web/core/components/pages/modals/page-form.tsx |   167 +
 .../core/components/pages/navigation-pane/index.ts |    18 +
 .../core/components/pages/navigation-pane/root.tsx |   127 +
 .../pages/navigation-pane/tab-panels/assets.tsx    |   118 +
 .../tab-panels/empty-state/assets.tsx              |    35 +
 .../tab-panels/empty-state/outline.tsx             |    35 +
 .../pages/navigation-pane/tab-panels/index.ts      |    37 +
 .../tab-panels/info/actors-info.tsx                |    72 +
 .../tab-panels/info/document-info.tsx              |    90 +
 .../pages/navigation-pane/tab-panels/info/root.tsx |    34 +
 .../tab-panels/info/version-history.tsx            |   148 +
 .../pages/navigation-pane/tab-panels/outline.tsx   |    41 +
 .../pages/navigation-pane/tab-panels/root.tsx      |    40 +
 .../components/pages/navigation-pane/tabs-list.tsx |    26 +
 .../pages/navigation-pane/types/extensions.ts      |    27 +
 .../pages/navigation-pane/types/index.ts           |    12 +
 .../components/pages/pages-list-main-content.tsx   |   154 +
 apps/web/core/components/pages/pages-list-view.tsx |    52 +
 apps/web/core/components/pages/version/editor.tsx  |   107 +
 apps/web/core/components/pages/version/index.ts    |     7 +
 .../core/components/pages/version/main-content.tsx |   128 +
 apps/web/core/components/pages/version/root.tsx    |    73 +
 apps/web/core/components/power-k/actions/helper.ts |    31 +
 .../components/power-k/config/account-commands.ts  |    64 +
 .../web/core/components/power-k/config/commands.ts |    35 +
 .../components/power-k/config/creation/command.ts  |   163 +
 .../components/power-k/config/creation/root.ts     |    24 +
 .../components/power-k/config/help-commands.ts     |    73 +
 .../power-k/config/miscellaneous-commands.ts       |    91 +
 .../power-k/config/navigation/commands.ts          |   538 +
 .../components/power-k/config/navigation/root.ts   |    51 +
 .../power-k/config/preferences-commands.ts         |   168 +
 .../components/power-k/core/context-detector.ts    |    18 +
 apps/web/core/components/power-k/core/registry.ts  |   166 +
 .../components/power-k/core/shortcut-handler.ts    |   217 +
 apps/web/core/components/power-k/core/types.ts     |   129 +
 .../core/components/power-k/global-shortcuts.tsx   |    83 +
 .../power-k/hooks/use-context-indicator.ts         |    57 +
 apps/web/core/components/power-k/menus/builder.tsx |    55 +
 apps/web/core/components/power-k/menus/cycles.tsx  |    34 +
 .../core/components/power-k/menus/empty-state.tsx  |    15 +
 apps/web/core/components/power-k/menus/labels.tsx  |    37 +
 apps/web/core/components/power-k/menus/members.tsx |    55 +
 apps/web/core/components/power-k/menus/modules.tsx |    34 +
 .../web/core/components/power-k/menus/projects.tsx |    36 +
 .../web/core/components/power-k/menus/settings.tsx |    36 +
 apps/web/core/components/power-k/menus/views.tsx   |    32 +
 .../core/components/power-k/menus/workspaces.tsx   |    34 +
 .../components/power-k/projects-app-provider.tsx   |    95 +
 .../ui/modal/command-item-shortcut-badge.tsx       |   115 +
 .../components/power-k/ui/modal/command-item.tsx   |    49 +
 .../components/power-k/ui/modal/commands-list.tsx  |    58 +
 .../core/components/power-k/ui/modal/constants.ts  |    75 +
 .../power-k/ui/modal/context-indicator.tsx         |    52 +
 .../core/components/power-k/ui/modal/footer.tsx    |    38 +
 .../core/components/power-k/ui/modal/header.tsx    |    64 +
 .../power-k/ui/modal/no-results-command.tsx        |    40 +
 .../components/power-k/ui/modal/search-menu.tsx    |   115 +
 .../power-k/ui/modal/search-results-map.tsx        |   120 +
 .../components/power-k/ui/modal/search-results.tsx |    77 +
 .../components/power-k/ui/modal/shortcuts-root.tsx |   102 +
 .../core/components/power-k/ui/modal/wrapper.tsx   |   190 +
 .../ui/pages/context-based/cycle/commands.ts       |   101 +
 .../power-k/ui/pages/context-based/index.ts        |    34 +
 .../ui/pages/context-based/module/commands.tsx     |   167 +
 .../power-k/ui/pages/context-based/module/index.ts |     7 +
 .../power-k/ui/pages/context-based/module/root.tsx |    54 +
 .../ui/pages/context-based/module/status-menu.tsx  |    40 +
 .../ui/pages/context-based/page/commands.ts        |   189 +
 .../power-k/ui/pages/context-based/root.tsx        |    45 +
 .../ui/pages/context-based/work-item/commands.ts   |   459 +
 .../pages/context-based/work-item/cycles-menu.tsx  |    33 +
 .../context-based/work-item/estimates-menu.tsx     |    73 +
 .../ui/pages/context-based/work-item/index.ts      |     7 +
 .../pages/context-based/work-item/labels-menu.tsx  |    33 +
 .../pages/context-based/work-item/modules-menu.tsx |    35 +
 .../context-based/work-item/priorities-menu.tsx    |    37 +
 .../ui/pages/context-based/work-item/root.tsx      |    84 +
 .../context-based/work-item/state-menu-item.tsx    |    39 +
 .../pages/context-based/work-item/states-menu.tsx  |    47 +
 .../core/components/power-k/ui/pages/default.tsx   |    27 +
 apps/web/core/components/power-k/ui/pages/index.ts |     7 +
 .../ui/pages/open-entity/project-cycles-menu.tsx   |    37 +
 .../ui/pages/open-entity/project-modules-menu.tsx  |    37 +
 .../ui/pages/open-entity/project-settings-menu.tsx |    48 +
 .../ui/pages/open-entity/project-views-menu.tsx    |    34 +
 .../power-k/ui/pages/open-entity/projects-menu.tsx |    32 +
 .../power-k/ui/pages/open-entity/root.tsx          |    41 +
 .../power-k/ui/pages/open-entity/shared.ts         |    14 +
 .../pages/open-entity/workspace-settings-menu.tsx  |    42 +
 .../ui/pages/open-entity/workspaces-menu.tsx       |    30 +
 .../power-k/ui/pages/preferences/index.ts          |     7 +
 .../ui/pages/preferences/languages-menu.tsx        |    29 +
 .../power-k/ui/pages/preferences/root.tsx          |    33 +
 .../ui/pages/preferences/start-of-week-menu.tsx    |    29 +
 .../power-k/ui/pages/preferences/themes-menu.tsx   |    41 +
 .../power-k/ui/pages/preferences/timezone-menu.tsx |    35 +
 apps/web/core/components/power-k/ui/pages/root.tsx |    36 +
 .../power-k/ui/pages/work-item-selection-page.tsx  |   168 +
 .../components/power-k/ui/renderer/command.tsx     |    75 +
 .../core/components/power-k/ui/renderer/shared.ts  |    31 +
 .../components/power-k/ui/renderer/shortcut.tsx    |   115 +
 .../core/components/power-k/utils/navigation.ts    |    26 +
 .../components/profile/activity/activity-list.tsx  |   185 +
 .../profile/activity/download-button.tsx           |    65 +
 .../profile/activity/workspace-activity-list.tsx   |    55 +
 .../core/components/profile/overview/activity.tsx  |    90 +
 .../profile/overview/priority-distribution.tsx     |    86 +
 .../profile/overview/state-distribution.tsx        |    90 +
 .../web/core/components/profile/overview/stats.tsx |    76 +
 .../core/components/profile/overview/workload.tsx  |    53 +
 .../components/profile/profile-issues-filter.tsx   |    87 +
 .../web/core/components/profile/profile-issues.tsx |    82 +
 .../profile/profile-setting-content-wrapper.tsx    |    33 +
 apps/web/core/components/profile/sidebar.tsx       |   296 +
 .../profile/start-of-week-preference.tsx           |    61 +
 apps/web/core/components/profile/time.tsx          |    33 +
 .../project-states/create-update/create.tsx        |    74 +
 .../project-states/create-update/form.tsx          |   122 +
 .../project-states/create-update/index.ts          |     9 +
 .../project-states/create-update/update.tsx        |    71 +
 .../core/components/project-states/group-item.tsx  |   131 +
 .../core/components/project-states/group-list.tsx  |    82 +
 apps/web/core/components/project-states/index.ts   |    19 +
 apps/web/core/components/project-states/loader.tsx |    18 +
 .../components/project-states/options/delete.tsx   |   104 +
 .../components/project-states/options/index.ts     |     8 +
 .../project-states/options/mark-as-default.tsx     |    49 +
 apps/web/core/components/project-states/root.tsx   |    76 +
 .../project-states/state-delete-modal.tsx          |    81 +
 .../components/project-states/state-item-title.tsx |    91 +
 .../core/components/project-states/state-item.tsx  |   158 +
 .../core/components/project-states/state-list.tsx  |    40 +
 .../components/project/applied-filters/access.tsx  |    44 +
 .../components/project/applied-filters/date.tsx    |    60 +
 .../components/project/applied-filters/index.ts    |     7 +
 .../components/project/applied-filters/members.tsx |    58 +
 .../applied-filters/project-display-filters.tsx    |    47 +
 .../components/project/applied-filters/root.tsx    |   136 +
 .../components/project/archive-restore-modal.tsx   |   116 +
 apps/web/core/components/project/card-list.tsx     |   114 +
 apps/web/core/components/project/card.tsx          |   388 +
 .../project/confirm-project-member-remove.tsx      |    94 +
 .../components/project/create-project-modal.tsx    |    86 +
 .../project/create/common-attributes.tsx           |   168 +
 apps/web/core/components/project/create/header.tsx |   121 +
 .../project/create/project-create-buttons.tsx      |    43 +
 .../components/project/delete-project-modal.tsx    |   160 +
 .../project/dropdowns/filters/access.tsx           |    58 +
 .../project/dropdowns/filters/created-at.tsx       |    88 +
 .../components/project/dropdowns/filters/index.ts  |     7 +
 .../components/project/dropdowns/filters/lead.tsx  |   116 +
 .../project/dropdowns/filters/member-list.tsx      |   118 +
 .../project/dropdowns/filters/members.tsx          |   116 +
 .../components/project/dropdowns/filters/root.tsx  |   110 +
 .../core/components/project/dropdowns/order-by.tsx |    90 +
 apps/web/core/components/project/empty-state.tsx   |    50 +
 apps/web/core/components/project/filters.tsx       |   109 +
 apps/web/core/components/project/form-loader.tsx   |    67 +
 apps/web/core/components/project/form.tsx          |   466 +
 apps/web/core/components/project/header.tsx        |    79 +
 .../core/components/project/integration-card.tsx   |   125 +
 .../core/components/project/join-project-modal.tsx |    71 +
 .../components/project/leave-project-modal.tsx     |   184 +
 .../components/project/member-header-column.tsx    |   128 +
 .../core/components/project/member-list-item.tsx   |    93 +
 apps/web/core/components/project/member-list.tsx   |   132 +
 apps/web/core/components/project/member-select.tsx |   113 +
 .../core/components/project/multi-select-modal.tsx |   198 +
 .../components/project/project-feature-update.tsx  |    65 +
 .../components/project/project-network-icon.tsx    |    36 +
 .../project/project-settings-member-defaults.tsx   |   203 +
 .../components/project/publish-project/modal.tsx   |   343 +
 apps/web/core/components/project/root.tsx          |   101 +
 .../core/components/project/search-projects.tsx    |    87 +
 .../project/send-project-invitation-modal.tsx      |   321 +
 .../project/settings/control-section.tsx           |    83 +
 .../components/project/settings/features-list.tsx  |   150 +
 .../core/components/project/settings/helper.tsx    |    46 +
 .../components/project/settings/member-columns.tsx |   194 +
 .../core/components/projects/create/attributes.tsx |   100 +
 apps/web/core/components/projects/create/root.tsx  |   193 +
 apps/web/core/components/projects/create/utils.ts  |    24 +
 .../web/core/components/projects/mobile-header.tsx |    99 +
 apps/web/core/components/projects/page.tsx         |    30 +
 .../components/projects/settings/intake/header.tsx |    90 +
 .../projects/settings/useProjectColumns.tsx        |   144 +
 apps/web/core/components/readonly/cycle.tsx        |    44 +
 apps/web/core/components/readonly/date.tsx         |    33 +
 apps/web/core/components/readonly/estimate.tsx     |    56 +
 apps/web/core/components/readonly/index.tsx        |    16 +
 apps/web/core/components/readonly/labels.tsx       |    59 +
 apps/web/core/components/readonly/member.tsx       |    68 +
 apps/web/core/components/readonly/module.tsx       |    79 +
 apps/web/core/components/readonly/priority.tsx     |    34 +
 apps/web/core/components/readonly/state.tsx        |    74 +
 apps/web/core/components/relations/index.tsx       |    42 +
 .../components/rich-filters/add-filters/button.tsx |    82 +
 .../rich-filters/add-filters/dropdown.tsx          |    94 +
 .../rich-filters/filter-item/close-button.tsx      |    39 +
 .../rich-filters/filter-item/container.tsx         |    70 +
 .../rich-filters/filter-item/invalid.tsx           |    43 +
 .../components/rich-filters/filter-item/loader.tsx |    15 +
 .../rich-filters/filter-item/property.tsx          |    74 +
 .../components/rich-filters/filter-item/root.tsx   |   132 +
 .../rich-filters/filter-value-input/date/range.tsx |    65 +
 .../filter-value-input/date/single.tsx             |    52 +
 .../rich-filters/filter-value-input/root.tsx       |    95 +
 .../filter-value-input/select/multi.tsx            |    60 +
 .../select/selected-options-display.tsx            |    67 +
 .../filter-value-input/select/shared.tsx           |    60 +
 .../filter-value-input/select/single.tsx           |    64 +
 .../core/components/rich-filters/filters-row.tsx   |   185 +
 .../components/rich-filters/filters-toggle.tsx     |    90 +
 apps/web/core/components/rich-filters/shared.ts    |    24 +
 .../components/settings/boxed-control-item.tsx     |    34 +
 .../core/components/settings/content-wrapper.tsx   |    41 +
 apps/web/core/components/settings/control-item.tsx |    25 +
 apps/web/core/components/settings/heading.tsx      |    38 +
 apps/web/core/components/settings/helper.ts        |    51 +
 apps/web/core/components/settings/layout.tsx       |    23 +
 apps/web/core/components/settings/mobile/nav.tsx   |    50 +
 apps/web/core/components/settings/page-header.tsx  |    23 +
 .../components/settings/profile/content/index.ts   |     7 +
 .../settings/profile/content/pages/api-tokens.tsx  |    79 +
 .../profile/content/pages/general/form.tsx         |   428 +
 .../profile/content/pages/general/index.ts         |     7 +
 .../profile/content/pages/general/root.tsx         |    29 +
 .../settings/profile/content/pages/index.ts        |    17 +
 .../notifications/email-notification-form.tsx      |   172 +
 .../profile/content/pages/notifications/index.ts   |     7 +
 .../profile/content/pages/notifications/root.tsx   |    43 +
 .../content/pages/preferences/default-list.tsx     |    23 +
 .../profile/content/pages/preferences/index.ts     |     7 +
 .../preferences/language-and-timezone-list.tsx     |   108 +
 .../profile/content/pages/preferences/root.tsx     |    42 +
 .../settings/profile/content/pages/security.tsx    |   285 +
 .../components/settings/profile/content/root.tsx   |    38 +
 .../core/components/settings/profile/heading.tsx   |    27 +
 .../web/core/components/settings/profile/modal.tsx |    59 +
 .../components/settings/profile/sidebar/header.tsx |    36 +
 .../components/settings/profile/sidebar/index.ts   |     7 +
 .../settings/profile/sidebar/item-categories.tsx   |    77 +
 .../components/settings/profile/sidebar/root.tsx   |    35 +
 .../settings/profile/sidebar/workspace-options.tsx |    56 +
 .../project/content/feature-control-item.tsx       |    74 +
 .../components/settings/project/sidebar/header.tsx |    64 +
 .../components/settings/project/sidebar/index.ts   |     7 +
 .../settings/project/sidebar/item-categories.tsx   |    80 +
 .../settings/project/sidebar/item-icon.tsx         |    38 +
 .../components/settings/project/sidebar/root.tsx   |    32 +
 apps/web/core/components/settings/sidebar/item.tsx |    60 +
 .../settings/workspace/sidebar/header.tsx          |    61 +
 .../components/settings/workspace/sidebar/index.ts |     7 +
 .../settings/workspace/sidebar/item-categories.tsx |    74 +
 .../settings/workspace/sidebar/item-icon.tsx       |    25 +
 .../components/settings/workspace/sidebar/root.tsx |    35 +
 apps/web/core/components/sidebar/add-button.tsx    |    28 +
 .../core/components/sidebar/resizable-sidebar.tsx  |   269 +
 apps/web/core/components/sidebar/search-button.tsx |    32 +
 apps/web/core/components/sidebar/sidebar-item.tsx  |   162 +
 .../core/components/sidebar/sidebar-navigation.tsx |    31 +
 .../components/sidebar/sidebar-toggle-button.tsx   |    28 +
 .../core/components/sidebar/sidebar-wrapper.tsx    |    96 +
 apps/web/core/components/stickies/action-bar.tsx   |   150 +
 apps/web/core/components/stickies/delete-modal.tsx |    52 +
 .../stickies/layout/stickies-infinite.tsx          |    68 +
 .../components/stickies/layout/stickies-list.tsx   |   213 +
 .../components/stickies/layout/stickies-loader.tsx |    53 +
 .../stickies/layout/stickies-truncated.tsx         |    58 +
 .../stickies/layout/sticky-dnd-wrapper.tsx         |   140 +
 .../components/stickies/layout/sticky.helpers.ts   |    51 +
 apps/web/core/components/stickies/modal/index.tsx  |    21 +
 apps/web/core/components/stickies/modal/search.tsx |   105 +
 .../core/components/stickies/modal/stickies.tsx    |    80 +
 apps/web/core/components/stickies/sticky/index.ts  |     7 +
 .../web/core/components/stickies/sticky/inputs.tsx |   106 +
 apps/web/core/components/stickies/sticky/root.tsx  |   112 +
 .../stickies/sticky/sticky-item-drag-handle.tsx    |    32 +
 .../components/stickies/sticky/use-operations.tsx  |   154 +
 apps/web/core/components/stickies/widget.tsx       |    63 +
 apps/web/core/components/ui/empty-space.tsx        |    89 +
 apps/web/core/components/ui/labels-list.tsx        |    38 +
 .../ui/loader/cycle-module-board-loader.tsx        |    51 +
 .../ui/loader/cycle-module-list-loader.tsx         |    41 +
 .../ui/loader/layouts/calendar-layout-loader.tsx   |    47 +
 .../ui/loader/layouts/gantt-layout-loader.tsx      |    70 +
 .../ui/loader/layouts/kanban-layout-loader.tsx     |    65 +
 .../ui/loader/layouts/list-layout-loader.tsx       |   102 +
 .../ui/loader/layouts/members-layout-loader.tsx    |    23 +
 .../layouts/project-inbox/inbox-layout-loader.tsx  |    31 +
 .../layouts/project-inbox/inbox-sidebar-loader.tsx |    29 +
 .../loader/layouts/spreadsheet-layout-loader.tsx   |    51 +
 .../components/ui/loader/notification-loader.tsx   |    26 +
 .../web/core/components/ui/loader/pages-loader.tsx |    38 +
 .../core/components/ui/loader/projects-loader.tsx  |    44 +
 .../components/ui/loader/settings/activity.tsx     |    21 +
 .../components/ui/loader/settings/api-token.tsx    |    30 +
 .../core/components/ui/loader/settings/email.tsx   |    37 +
 .../ui/loader/settings/import-and-export.tsx       |    28 +
 .../components/ui/loader/settings/integration.tsx  |    26 +
 .../core/components/ui/loader/settings/members.tsx |    25 +
 .../components/ui/loader/settings/web-hook.tsx     |    28 +
 apps/web/core/components/ui/loader/utils.tsx       |    12 +
 .../core/components/ui/loader/view-list-loader.tsx |    28 +
 .../core/components/ui/markdown-to-component.tsx   |    85 +
 .../web/core/components/ui/profile-empty-state.tsx |    27 +
 apps/web/core/components/user/index.ts             |     7 +
 apps/web/core/components/user/user-greetings.tsx   |    61 +
 .../components/views/applied-filters/access.tsx    |    55 +
 .../components/views/applied-filters/index.tsx     |     7 +
 .../core/components/views/applied-filters/root.tsx |    98 +
 .../core/components/views/delete-view-modal.tsx    |    72 +
 .../components/views/filters/filter-selection.tsx  |   113 +
 .../web/core/components/views/filters/order-by.tsx |    84 +
 apps/web/core/components/views/form.tsx            |   308 +
 apps/web/core/components/views/helper.tsx          |    62 +
 apps/web/core/components/views/modal.tsx           |   102 +
 apps/web/core/components/views/publish/index.ts    |     7 +
 .../components/views/publish/use-view-publish.tsx  |    13 +
 apps/web/core/components/views/quick-actions.tsx   |   143 +
 .../web/core/components/views/view-list-header.tsx |   125 +
 .../components/views/view-list-item-action.tsx     |   137 +
 apps/web/core/components/views/view-list-item.tsx  |    63 +
 apps/web/core/components/views/views-list.tsx      |    81 +
 .../components/web-hooks/create-webhook-modal.tsx  |   116 +
 .../components/web-hooks/delete-webhook-modal.tsx  |    72 +
 apps/web/core/components/web-hooks/empty-state.tsx |    33 +
 .../components/web-hooks/form/delete-section.tsx   |    55 +
 .../core/components/web-hooks/form/event-types.tsx |    52 +
 apps/web/core/components/web-hooks/form/form.tsx   |   118 +
 apps/web/core/components/web-hooks/form/index.ts   |    13 +
 .../web-hooks/form/individual-event-options.tsx    |    71 +
 apps/web/core/components/web-hooks/form/input.tsx  |    39 +
 .../core/components/web-hooks/form/secret-key.tsx  |   151 +
 apps/web/core/components/web-hooks/form/toggle.tsx |    30 +
 .../web-hooks/generated-hook-details.tsx           |    40 +
 apps/web/core/components/web-hooks/index.ts        |    14 +
 apps/web/core/components/web-hooks/utils.ts        |    29 +
 .../components/web-hooks/webhooks-list-item.tsx    |    59 +
 .../core/components/web-hooks/webhooks-list.tsx    |    24 +
 .../work-item-filters/filters-hoc/base.tsx         |   112 +
 .../filters-hoc/project-level.tsx                  |   217 +
 .../work-item-filters/filters-hoc/shared.ts        |    33 +
 .../filters-hoc/workspace-level.tsx                |   201 +
 .../components/work-item-filters/filters-row.tsx   |    21 +
 .../work-item-filters/filters-toggle.tsx           |    28 +
 apps/web/core/components/workflow/index.ts         |     8 +
 apps/web/core/components/workflow/state-option.tsx |    46 +
 .../workflow/use-workflow-drag-n-drop.ts           |    23 +
 .../components/workspace-notifications/index.ts    |     7 +
 .../notification-app-sidebar-option.tsx            |    45 +
 .../notification-card/content.ts                   |    31 +
 .../notification-card/root.tsx                     |    62 +
 .../components/workspace-notifications/root.tsx    |   118 +
 .../sidebar/empty-state.tsx                        |    37 +
 .../sidebar/filters/applied-filter.tsx             |    73 +
 .../sidebar/filters/menu/index.ts                  |     7 +
 .../sidebar/filters/menu/menu-option-item.tsx      |    58 +
 .../sidebar/filters/menu/root.tsx                  |    43 +
 .../sidebar/header/index.ts                        |     7 +
 .../sidebar/header/options/index.ts                |     7 +
 .../sidebar/header/options/menu-option/index.ts    |     7 +
 .../header/options/menu-option/menu-item.tsx       |    36 +
 .../sidebar/header/options/menu-option/root.tsx    |    93 +
 .../sidebar/header/options/root.tsx                |    86 +
 .../sidebar/header/root.tsx                        |    48 +
 .../workspace-notifications/sidebar/index.ts       |     7 +
 .../workspace-notifications/sidebar/loader.tsx     |    26 +
 .../sidebar/notification-card/content.tsx          |   234 +
 .../sidebar/notification-card/item.tsx             |   145 +
 .../sidebar/notification-card/options/archive.tsx  |    57 +
 .../sidebar/notification-card/options/button.tsx   |    44 +
 .../sidebar/notification-card/options/index.ts     |    13 +
 .../sidebar/notification-card/options/read.tsx     |    51 +
 .../sidebar/notification-card/options/root.tsx     |    63 +
 .../notification-card/options/snooze/index.ts      |     8 +
 .../notification-card/options/snooze/modal.tsx     |   229 +
 .../notification-card/options/snooze/root.tsx      |   161 +
 .../workspace-notifications/sidebar/root.tsx       |   122 +
 .../workspace/ConfirmWorkspaceMemberRemove.tsx     |   111 +
 .../workspace/billing/comparison/base.tsx          |   141 +
 .../billing/comparison/feature-detail.tsx          |    32 +
 .../billing/comparison/frequency-toggle.tsx        |    60 +
 .../workspace/billing/comparison/index.ts          |     8 +
 .../workspace/billing/comparison/plan-detail.tsx   |   109 +
 .../workspace/billing/comparison/plans.tsx         |  1311 ++
 .../workspace/billing/comparison/root.tsx          |    54 +
 .../web/core/components/workspace/billing/index.ts |     7 +
 .../web/core/components/workspace/billing/root.tsx |    71 +
 .../workspace/confirm-workspace-member-remove.tsx  |    91 +
 .../core/components/workspace/content-wrapper.tsx  |    42 +
 .../components/workspace/create-workspace-form.tsx |   261 +
 .../components/workspace/delete-workspace-form.tsx |   171 +
 .../workspace/delete-workspace-modal.tsx           |    31 +
 .../workspace/delete-workspace-section.tsx         |    47 +
 .../core/components/workspace/edition-badge.tsx    |    46 +
 .../components/workspace/invite-modal/actions.tsx  |    71 +
 .../components/workspace/invite-modal/fields.tsx   |   132 +
 .../components/workspace/invite-modal/form.tsx     |    34 +
 apps/web/core/components/workspace/logo.tsx        |    41 +
 .../web/core/components/workspace/members/index.ts |     7 +
 .../components/workspace/members/invite-modal.tsx  |    66 +
 .../workspace/settings/invitations-list-item.tsx   |   228 +
 .../workspace/settings/member-columns.tsx          |   192 +
 .../workspace/settings/members-list-item.tsx       |   120 +
 .../components/workspace/settings/members-list.tsx |   101 +
 .../workspace/settings/useMemberColumns.tsx        |   137 +
 .../workspace/settings/workspace-details.tsx       |   314 +
 .../components/workspace/sidebar/dropdown-item.tsx |   125 +
 .../workspace/sidebar/extended-sidebar-item.tsx    |   225 +
 .../sidebar/favorites/favorite-folder.tsx          |   297 +
 .../common/favorite-item-drag-handle.tsx           |    46 +
 .../favorite-items/common/favorite-item-icon.tsx   |    46 +
 .../common/favorite-item-quick-action.tsx          |    56 +
 .../favorite-items/common/favorite-item-title.tsx  |    38 +
 .../common/favorite-item-wrapper.tsx               |    34 +
 .../favorites/favorite-items/common/helper.tsx     |    25 +
 .../favorites/favorite-items/common/index.ts       |    12 +
 .../sidebar/favorites/favorite-items/index.ts      |     8 +
 .../sidebar/favorites/favorite-items/root.tsx      |   144 +
 .../workspace/sidebar/favorites/favorites-menu.tsx |   288 +
 .../sidebar/favorites/favorites.helpers.ts         |    72 +
 .../workspace/sidebar/favorites/new-fav-folder.tsx |   163 +
 .../workspace/sidebar/help-section/index.ts        |     7 +
 .../workspace/sidebar/help-section/root.tsx        |    91 +
 .../core/components/workspace/sidebar/helper.tsx   |    44 +
 .../workspace/sidebar/project-navigation.tsx       |   211 +
 .../workspace/sidebar/projects-list-item.tsx       |   495 +
 .../components/workspace/sidebar/projects-list.tsx |   290 +
 .../components/workspace/sidebar/quick-actions.tsx |    96 +
 .../components/workspace/sidebar/sidebar-item.tsx  |    81 +
 .../workspace/sidebar/sidebar-menu-items.tsx       |   183 +
 .../workspace/sidebar/user-menu-item.tsx           |    68 +
 .../workspace/sidebar/user-menu-root.tsx           |   150 +
 .../components/workspace/sidebar/user-menu.tsx     |    73 +
 .../workspace/sidebar/workspace-menu-header.tsx    |   109 +
 .../workspace/sidebar/workspace-menu-item.tsx      |    75 +
 .../workspace/sidebar/workspace-menu-root.tsx      |   231 +
 .../workspace/sidebar/workspace-menu.tsx           |    82 +
 .../core/components/workspace/upgrade-badge.tsx    |    35 +
 .../workspace/views/default-view-list-item.tsx     |    37 +
 .../workspace/views/default-view-quick-action.tsx  |   102 +
 .../workspace/views/delete-view-modal.tsx          |    65 +
 apps/web/core/components/workspace/views/form.tsx  |   213 +
 .../web/core/components/workspace/views/header.tsx |   121 +
 apps/web/core/components/workspace/views/modal.tsx |   117 +
 .../components/workspace/views/quick-action.tsx    |   109 +
 .../components/workspace/views/view-list-item.tsx  |    83 +
 .../core/components/workspace/views/views-list.tsx |    44 +
 apps/web/core/hooks/context/use-issue-modal.tsx    |    16 +
 apps/web/core/hooks/editor/index.ts                |     8 +
 apps/web/core/hooks/editor/use-editor-config.ts    |   108 +
 apps/web/core/hooks/editor/use-editor-mention.tsx  |    82 +
 .../hooks/editor/use-extended-editor-config.ts     |    29 +
 apps/web/core/hooks/oauth/core.tsx                 |    88 +
 apps/web/core/hooks/oauth/extended.tsx             |    15 +
 apps/web/core/hooks/oauth/index.ts                 |    20 +
 apps/web/core/hooks/pages/index.ts                 |     8 +
 .../hooks/pages/use-extended-editor-extensions.ts  |    26 +
 .../core/hooks/pages/use-pages-pane-extensions.ts  |    68 +
 .../rich-filters/use-filters-operator-configs.ts   |    22 +
 apps/web/core/hooks/store/estimates/index.ts       |     9 +
 .../hooks/store/estimates/use-estimate-point.ts    |    22 +
 .../web/core/hooks/store/estimates/use-estimate.ts |    19 +
 .../hooks/store/estimates/use-project-estimate.ts  |    18 +
 apps/web/core/hooks/store/index.ts                 |     8 +
 apps/web/core/hooks/store/notifications/index.ts   |     8 +
 .../hooks/store/notifications/use-notification.ts  |    19 +
 .../notifications/use-workspace-notifications.ts   |    18 +
 apps/web/core/hooks/store/use-analytics.ts         |    17 +
 apps/web/core/hooks/store/use-app-theme.ts         |    16 +
 apps/web/core/hooks/store/use-calendar-view.ts     |    17 +
 apps/web/core/hooks/store/use-command-palette.ts   |    17 +
 apps/web/core/hooks/store/use-cycle-filter.ts      |    17 +
 apps/web/core/hooks/store/use-cycle.ts             |    17 +
 apps/web/core/hooks/store/use-dashboard.ts         |    17 +
 apps/web/core/hooks/store/use-editor-asset.ts      |    16 +
 apps/web/core/hooks/store/use-favorite.ts          |    16 +
 apps/web/core/hooks/store/use-global-view.ts       |    17 +
 apps/web/core/hooks/store/use-home.ts              |    17 +
 apps/web/core/hooks/store/use-inbox-issues.ts      |    16 +
 apps/web/core/hooks/store/use-instance.ts          |    16 +
 apps/web/core/hooks/store/use-issue-detail.ts      |    20 +
 apps/web/core/hooks/store/use-issues.ts            |   157 +
 apps/web/core/hooks/store/use-kanban-view.ts       |    17 +
 apps/web/core/hooks/store/use-label.ts             |    17 +
 apps/web/core/hooks/store/use-member.ts            |    17 +
 apps/web/core/hooks/store/use-module-filter.ts     |    17 +
 apps/web/core/hooks/store/use-module.ts            |    17 +
 .../core/hooks/store/use-multiple-select-store.ts  |    15 +
 apps/web/core/hooks/store/use-page-store.ts        |    30 +
 apps/web/core/hooks/store/use-page.ts              |    30 +
 apps/web/core/hooks/store/use-power-k.ts           |    17 +
 apps/web/core/hooks/store/use-project-filter.ts    |    17 +
 apps/web/core/hooks/store/use-project-inbox.ts     |    16 +
 apps/web/core/hooks/store/use-project-publish.ts   |    17 +
 apps/web/core/hooks/store/use-project-state.ts     |    16 +
 apps/web/core/hooks/store/use-project-view.ts      |    17 +
 apps/web/core/hooks/store/use-project.ts           |    17 +
 apps/web/core/hooks/store/use-router-params.ts     |    16 +
 apps/web/core/hooks/store/use-webhook.ts           |    17 +
 apps/web/core/hooks/store/use-workspace.ts         |    17 +
 apps/web/core/hooks/store/user/index.ts            |    10 +
 apps/web/core/hooks/store/user/user-permissions.ts |    18 +
 .../web/core/hooks/store/user/user-user-profile.ts |    17 +
 .../core/hooks/store/user/user-user-settings.ts    |    17 +
 apps/web/core/hooks/store/user/user-user.ts        |    17 +
 .../use-work-item-filter-instance.ts               |    19 +
 .../work-item-filters/use-work-item-filters.ts     |    17 +
 apps/web/core/hooks/store/workspace-draft/index.ts |     8 +
 .../use-workspace-draft-issue-filters.ts           |    18 +
 .../workspace-draft/use-workspace-draft-issue.ts   |    18 +
 .../core/hooks/use-additional-editor-mention.tsx   |    57 +
 .../hooks/use-additional-favorite-item-details.tsx |    30 +
 apps/web/core/hooks/use-app-router.tsx             |    10 +
 apps/web/core/hooks/use-auto-save.tsx              |    79 +
 apps/web/core/hooks/use-auto-scroller.tsx          |   129 +
 apps/web/core/hooks/use-bulk-operation-status.ts   |     7 +
 .../core/hooks/use-collaborative-page-actions.tsx  |   115 +
 apps/web/core/hooks/use-current-time.tsx           |    23 +
 apps/web/core/hooks/use-debounce.tsx               |    25 +
 .../core/hooks/use-debounced-duplicate-issues.tsx  |    18 +
 apps/web/core/hooks/use-dropdown-key-down.tsx      |    42 +
 apps/web/core/hooks/use-dropdown.ts                |    86 +
 apps/web/core/hooks/use-editor-flagging.ts         |    48 +
 apps/web/core/hooks/use-expandable-search.ts       |    99 +
 ...use-extended-sidebar-overview-outside-click.tsx |    58 +
 apps/web/core/hooks/use-favorite-item-details.tsx  |    83 +
 apps/web/core/hooks/use-file-size.ts               |    23 +
 apps/web/core/hooks/use-group-dragndrop.ts         |   128 +
 apps/web/core/hooks/use-integration-popup.tsx      |    84 +
 apps/web/core/hooks/use-intersection-observer.ts   |    47 +
 apps/web/core/hooks/use-issue-layout-store.ts      |    49 +
 .../hooks/use-issue-peek-overview-redirection.tsx  |    57 +
 apps/web/core/hooks/use-issue-properties.tsx       |    16 +
 apps/web/core/hooks/use-issues-actions.tsx         |   807 +
 apps/web/core/hooks/use-keypress.tsx               |    33 +
 apps/web/core/hooks/use-local-storage.tsx          |    64 +
 apps/web/core/hooks/use-multiple-select.ts         |   411 +
 apps/web/core/hooks/use-navigation-preferences.ts  |   305 +
 apps/web/core/hooks/use-notification-preview.tsx   |    31 +
 apps/web/core/hooks/use-online-status.ts           |    28 +
 apps/web/core/hooks/use-page-fallback.ts           |    89 +
 apps/web/core/hooks/use-page-filters.ts            |   122 +
 apps/web/core/hooks/use-page-flag.ts               |    22 +
 apps/web/core/hooks/use-page-operations.ts         |   225 +
 apps/web/core/hooks/use-parse-editor-content.ts    |   279 +
 .../core/hooks/use-peek-overview-outside-click.tsx |    68 +
 apps/web/core/hooks/use-platform-os.tsx            |    24 +
 .../web/core/hooks/use-project-issue-properties.ts |   100 +
 apps/web/core/hooks/use-query-params.ts            |    44 +
 apps/web/core/hooks/use-realtime-page-events.tsx   |   206 +
 apps/web/core/hooks/use-reload-confirmation.tsx    |    67 +
 apps/web/core/hooks/use-stickies.tsx               |    17 +
 .../core/hooks/use-table-keyboard-navigation.tsx   |    62 +
 apps/web/core/hooks/use-timeline-chart.ts          |    50 +
 apps/web/core/hooks/use-timer.tsx                  |    25 +
 apps/web/core/hooks/use-timezone-converter.tsx     |    76 +
 apps/web/core/hooks/use-timezone.tsx               |    81 +
 apps/web/core/hooks/use-window-size.tsx            |    25 +
 apps/web/core/hooks/use-workspace-invitation.tsx   |    91 +
 .../use-workspace-issue-properties-extended.tsx    |     8 +
 .../core/hooks/use-workspace-issue-properties.ts   |    56 +
 apps/web/core/hooks/use-workspace-paths.ts         |    30 +
 .../use-work-item-filters-config.tsx               |   404 +
 .../core/layouts/auth-layout/project-wrapper.tsx   |   161 +
 .../core/layouts/auth-layout/workspace-wrapper.tsx |   237 +
 apps/web/core/layouts/default-layout/index.tsx     |    22 +
 apps/web/core/lib/app-rail/context.tsx             |    29 +
 apps/web/core/lib/app-rail/index.ts                |     9 +
 apps/web/core/lib/app-rail/provider.tsx            |    53 +
 apps/web/core/lib/app-rail/types.ts                |    32 +
 apps/web/core/lib/b-progress/AppProgressBar.tsx    |   143 +
 apps/web/core/lib/idle-task.ts                     |    54 +
 apps/web/core/lib/local-storage.ts                 |    33 +
 apps/web/core/lib/polyfills/index.ts               |    11 +
 apps/web/core/lib/stale-asset-error.ts             |    66 +
 apps/web/core/lib/store-context.tsx                |    27 +
 .../core/lib/wrappers/authentication-wrapper.tsx   |   144 +
 apps/web/core/lib/wrappers/instance-wrapper.tsx    |    50 +
 apps/web/core/lib/wrappers/store-wrapper.tsx       |   114 +
 apps/web/core/services/ai.service.ts               |    49 +
 apps/web/core/services/analytics.service.ts        |   112 +
 apps/web/core/services/api.service.ts              |    64 +
 apps/web/core/services/app_config.service.ts       |    29 +
 apps/web/core/services/app_installation.service.ts |    69 +
 apps/web/core/services/auth.service.ts             |    84 +
 apps/web/core/services/cycle.service.ts            |   197 +
 apps/web/core/services/cycle_archive.service.ts    |    56 +
 apps/web/core/services/dashboard.service.ts        |    59 +
 apps/web/core/services/estimate.service.ts         |   112 +
 .../web/core/services/favorite/favorite.service.ts |    62 +
 apps/web/core/services/favorite/index.ts           |     7 +
 apps/web/core/services/file-upload.service.ts      |    46 +
 apps/web/core/services/file.service.ts             |   299 +
 .../web/core/services/inbox/inbox-issue.service.ts |    86 +
 apps/web/core/services/inbox/index.ts              |     8 +
 .../inbox/intake-work_item_version.service.ts      |    47 +
 apps/web/core/services/instance.service.ts         |    34 +
 .../core/services/integrations/github.service.ts   |    45 +
 apps/web/core/services/integrations/index.ts       |     9 +
 .../services/integrations/integration.service.ts   |    73 +
 .../web/core/services/integrations/jira.service.ts |    34 +
 apps/web/core/services/issue/index.ts              |    16 +
 apps/web/core/services/issue/issue.service.ts      |   459 +
 .../core/services/issue/issue_activity.service.ts  |    43 +
 .../core/services/issue/issue_archive.service.ts   |    72 +
 .../services/issue/issue_attachment.service.ts     |    95 +
 .../core/services/issue/issue_comment.service.ts   |    95 +
 .../web/core/services/issue/issue_label.service.ts |    57 +
 .../core/services/issue/issue_reaction.service.ts  |    95 +
 .../core/services/issue/issue_relation.service.ts  |    50 +
 .../services/issue/work_item_version.service.ts    |    51 +
 .../core/services/issue/workspace_draft.service.ts |    79 +
 apps/web/core/services/issue_filter.service.ts     |   109 +
 apps/web/core/services/module.service.ts           |   224 +
 apps/web/core/services/module_archive.service.ts   |    56 +
 apps/web/core/services/page/index.ts               |     8 +
 .../services/page/project-page-version.service.ts  |    49 +
 .../web/core/services/page/project-page.service.ts |   194 +
 apps/web/core/services/project/index.ts            |    12 +
 .../services/project/project-archive.service.ts    |    37 +
 .../services/project/project-export.service.ts     |    32 +
 .../services/project/project-member.service.ts     |    78 +
 .../services/project/project-publish.service.ts    |    64 +
 .../core/services/project/project-state.service.ts |    90 +
 apps/web/core/services/project/project.service.ts  |   200 +
 apps/web/core/services/sticky.service.ts           |    68 +
 apps/web/core/services/timezone.service.ts         |    29 +
 apps/web/core/services/user.service.ts             |   296 +
 apps/web/core/services/view.service.ts             |    87 +
 apps/web/core/services/webhook.service.ts          |    66 +
 .../services/workspace-notification.service.ts     |   124 +
 apps/web/core/services/workspace.service.ts        |   426 +
 apps/web/core/store/analytics.store.ts             |   114 +
 apps/web/core/store/base-command-palette.store.ts  |   290 +
 apps/web/core/store/base-power-k.store.ts          |   125 +
 apps/web/core/store/cycle.store.ts                 |   725 +
 apps/web/core/store/cycle_filter.store.ts          |   187 +
 apps/web/core/store/dashboard.store.ts             |   291 +
 apps/web/core/store/editor/asset.store.ts          |   148 +
 apps/web/core/store/estimates/estimate-point.ts    |   157 +
 apps/web/core/store/estimates/estimate.ts          |   154 +
 .../core/store/estimates/project-estimate.store.ts |   319 +
 apps/web/core/store/favorite.store.ts              |   445 +
 apps/web/core/store/global-view.store.ts           |   203 +
 apps/web/core/store/inbox/inbox-issue.store.ts     |   280 +
 apps/web/core/store/inbox/project-inbox.store.ts   |   525 +
 apps/web/core/store/instance.store.ts              |    78 +
 apps/web/core/store/issue/archived/filter.store.ts |   300 +
 apps/web/core/store/issue/archived/index.ts        |     8 +
 apps/web/core/store/issue/archived/issue.store.ts  |   208 +
 apps/web/core/store/issue/cycle/filter.store.ts    |   320 +
 apps/web/core/store/issue/cycle/index.ts           |     8 +
 apps/web/core/store/issue/cycle/issue.store.ts     |   435 +
 .../core/store/issue/helpers/base-issues-utils.ts  |   391 +
 .../core/store/issue/helpers/base-issues.store.ts  |  1979 +++
 .../issue/helpers/issue-filter-helper.store.ts     |   350 +
 .../store/issue/issue-details/activity.store.ts    |   179 +
 .../store/issue/issue-details/attachment.store.ts  |   208 +
 .../store/issue/issue-details/comment.store.ts     |   183 +
 .../issue/issue-details/comment_reaction.store.ts  |   202 +
 .../core/store/issue/issue-details/issue.store.ts  |   333 +
 .../core/store/issue/issue-details/link.store.ts   |   171 +
 .../store/issue/issue-details/reaction.store.ts    |   162 +
 .../store/issue/issue-details/relation.store.ts    |   310 +
 .../core/store/issue/issue-details/root.store.ts   |   416 +
 .../store/issue/issue-details/sub_issues.store.ts  |   361 +
 .../issue/issue-details/sub_issues_filter.store.ts |   144 +
 .../issue/issue-details/subscription.store.ts      |   110 +
 apps/web/core/store/issue/issue.store.ts           |   170 +
 .../core/store/issue/issue_calendar_view.store.ts  |   215 +
 .../web/core/store/issue/issue_gantt_view.store.ts |   101 +
 .../core/store/issue/issue_kanban_view.store.ts    |    89 +
 apps/web/core/store/issue/module/filter.store.ts   |   325 +
 apps/web/core/store/issue/module/index.ts          |     8 +
 apps/web/core/store/issue/module/issue.store.ts    |   289 +
 apps/web/core/store/issue/profile/filter.store.ts  |   290 +
 apps/web/core/store/issue/profile/index.ts         |     8 +
 apps/web/core/store/issue/profile/issue.store.ts   |   237 +
 .../core/store/issue/project-views/filter.store.ts |   344 +
 apps/web/core/store/issue/project-views/index.ts   |     8 +
 .../core/store/issue/project-views/issue.store.ts  |   191 +
 apps/web/core/store/issue/project/filter.store.ts  |   303 +
 apps/web/core/store/issue/project/index.ts         |     8 +
 apps/web/core/store/issue/project/issue.store.ts   |   204 +
 apps/web/core/store/issue/root.store.ts            |   269 +
 .../store/issue/workspace-draft/filter.store.ts    |   274 +
 apps/web/core/store/issue/workspace-draft/index.ts |     8 +
 .../store/issue/workspace-draft/issue.store.ts     |   429 +
 .../web/core/store/issue/workspace/filter.store.ts |   319 +
 apps/web/core/store/issue/workspace/index.ts       |     8 +
 apps/web/core/store/issue/workspace/issue.store.ts |   187 +
 apps/web/core/store/label.store.ts                 |   309 +
 apps/web/core/store/member/index.ts                |    57 +
 .../member/project/base-project-member.store.ts    |   501 +
 .../member/project/project-member-filters.store.ts |    77 +
 apps/web/core/store/member/utils.ts                |   193 +
 .../workspace/workspace-member-filters.store.ts    |    78 +
 .../member/workspace/workspace-member.store.ts     |   366 +
 apps/web/core/store/module.store.ts                |   641 +
 apps/web/core/store/module_filter.store.ts         |   255 +
 apps/web/core/store/multiple_select.store.ts       |   238 +
 apps/web/core/store/notifications/notification.ts  |   325 +
 .../notifications/workspace-notifications.store.ts |   402 +
 apps/web/core/store/pages/base-page.ts             |   554 +
 apps/web/core/store/pages/extended-base-page.ts    |    22 +
 apps/web/core/store/pages/page-editor-info.ts      |    47 +
 apps/web/core/store/pages/project-page.store.ts    |   370 +
 apps/web/core/store/pages/project-page.ts          |   190 +
 apps/web/core/store/project-view.store.ts          |   307 +
 apps/web/core/store/project/index.ts               |    31 +
 .../core/store/project/project-publish.store.ts    |   194 +
 apps/web/core/store/project/project.store.ts       |   636 +
 .../web/core/store/project/project_filter.store.ts |   186 +
 apps/web/core/store/root.store.ts                  |   175 +
 apps/web/core/store/router.store.ts                |   182 +
 apps/web/core/store/state.store.ts                 |   393 +
 apps/web/core/store/sticky/sticky.store.ts         |   277 +
 apps/web/core/store/theme.store.ts                 |   198 +
 .../web/core/store/timeline/base-timeline.store.ts |   346 +
 .../core/store/timeline/issues-timeline.store.ts   |    25 +
 .../core/store/timeline/modules-timeline.store.ts  |    25 +
 apps/web/core/store/timeline/timeline.store.ts     |    35 +
 apps/web/core/store/user/account.store.ts          |    52 +
 apps/web/core/store/user/base-permissions.store.ts |   361 +
 apps/web/core/store/user/index.ts                  |   307 +
 apps/web/core/store/user/profile.store.ts          |   256 +
 apps/web/core/store/user/settings.store.ts         |   107 +
 apps/web/core/store/workspace/api-token.store.ts   |   116 +
 apps/web/core/store/workspace/home.ts              |   153 +
 apps/web/core/store/workspace/index.ts             |   395 +
 apps/web/core/store/workspace/link.store.ts        |   133 +
 apps/web/core/store/workspace/webhook.store.ts     |   202 +
 apps/web/google.d.ts                               |    91 +
 apps/web/helpers/authentication.helper.tsx         |   450 +
 apps/web/helpers/cover-image.helper.ts             |   289 +
 apps/web/helpers/dashboard.helper.ts               |   101 +
 apps/web/helpers/emoji.helper.tsx                  |    29 +
 apps/web/helpers/graph.helper.ts                   |    32 +
 apps/web/helpers/issue-filter.helper.ts            |    20 +
 apps/web/helpers/react-hook-form.helper.ts         |    33 +
 apps/web/helpers/views.helper.ts                   |    26 +
 apps/web/manifest.json                             |    32 +
 apps/web/package.json                              |    92 +
 apps/web/postcss.config.js                         |     3 +
 apps/web/public/favicon/android-chrome-192x192.png |   Bin 0 -> 5217 bytes
 apps/web/public/favicon/android-chrome-512x512.png |   Bin 0 -> 14419 bytes
 apps/web/public/favicon/site.webmanifest           |    11 +
 apps/web/public/icons/icon-192x192.png             |   Bin 0 -> 3071 bytes
 apps/web/public/icons/icon-348x348.png             |   Bin 0 -> 5304 bytes
 apps/web/public/icons/icon-512x512.png             |   Bin 0 -> 8703 bytes
 apps/web/public/manifest.json                      |    27 +
 apps/web/public/plane-logos/plane-mobile-pwa.png   |   Bin 0 -> 73863 bytes
 apps/web/public/site.webmanifest.json              |    13 +
 apps/web/public/sw.js                              |   102 +
 apps/web/public/sw.js.map                          |    32 +
 apps/web/public/workbox-9f2f79cf.js                |  2479 +++
 apps/web/public/workbox-9f2f79cf.js.map            |     1 +
 apps/web/react-router.config.ts                    |     7 +
 apps/web/styles/emoji.css                          |    53 +
 apps/web/styles/globals.css                        |   170 +
 apps/web/styles/power-k.css                        |    27 +
 apps/web/tsconfig.json                             |    21 +
 apps/web/use-font-face-observer.d.ts               |     1 +
 apps/web/vite.config.ts                            |    38 +
 package.json                                       |    43 +
 packages/codemods/.prettierignore                  |    10 +
 packages/codemods/function-declaration.ts          |   537 +
 packages/codemods/headlessui-v2-default-tags.ts    |   176 +
 packages/codemods/instructions.md                  |   385 +
 packages/codemods/package.json                     |    18 +
 packages/codemods/remove-directives.ts             |   103 +
 .../codemods/tests/function-declaration.spec.ts    |   572 +
 .../tests/headlessui-v2-default-tags.spec.ts       |   201 +
 packages/codemods/tests/remove-directives.spec.ts  |   296 +
 packages/codemods/tsconfig.json                    |    13 +
 packages/codemods/vitest.config.ts                 |     7 +
 packages/constants/.prettierignore                 |    10 +
 packages/constants/package.json                    |    34 +
 packages/constants/src/ai.ts                       |    13 +
 packages/constants/src/analytics/common.ts         |   190 +
 packages/constants/src/analytics/index.ts          |     7 +
 packages/constants/src/auth/core.ts                |    16 +
 packages/constants/src/auth/extended.ts            |     9 +
 packages/constants/src/auth/index.ts               |   175 +
 packages/constants/src/calendar.ts                 |   124 +
 packages/constants/src/chart.ts                    |   131 +
 packages/constants/src/cycle.ts                    |    48 +
 packages/constants/src/dashboard.ts                |    98 +
 packages/constants/src/emoji.ts                    |    31 +
 packages/constants/src/endpoints.ts                |    33 +
 packages/constants/src/estimates.ts                |   142 +
 packages/constants/src/fetch-keys.ts               |   206 +
 packages/constants/src/file.ts                     |    39 +
 packages/constants/src/filter.ts                   |    63 +
 packages/constants/src/gantt-chart.ts              |    14 +
 packages/constants/src/graph.ts                    |    40 +
 packages/constants/src/icon.ts                     |    13 +
 packages/constants/src/index.ts                    |    49 +
 packages/constants/src/instance.ts                 |    15 +
 packages/constants/src/intake.ts                   |   101 +
 packages/constants/src/issue/common.ts             |   366 +
 packages/constants/src/issue/filter.ts             |   368 +
 packages/constants/src/issue/index.ts              |    10 +
 packages/constants/src/issue/layout.ts             |    69 +
 packages/constants/src/issue/modal.ts              |    25 +
 packages/constants/src/label.ts                    |    23 +
 packages/constants/src/members.ts                  |    85 +
 packages/constants/src/metadata.ts                 |    23 +
 packages/constants/src/module.ts                   |   118 +
 packages/constants/src/notification.ts             |   142 +
 packages/constants/src/page.ts                     |    20 +
 packages/constants/src/payment.ts                  |   159 +
 packages/constants/src/profile.ts                  |    92 +
 packages/constants/src/project.ts                  |   131 +
 packages/constants/src/rich-filters/index.ts       |     8 +
 .../src/rich-filters/operator-labels/core.ts       |    25 +
 .../src/rich-filters/operator-labels/extended.ts   |    27 +
 .../src/rich-filters/operator-labels/index.ts      |    42 +
 packages/constants/src/rich-filters/option.ts      |    89 +
 packages/constants/src/settings/index.ts           |     9 +
 packages/constants/src/settings/profile.ts         |    67 +
 packages/constants/src/settings/project.ts         |   129 +
 packages/constants/src/settings/workspace.ts       |    80 +
 packages/constants/src/sidebar-favorites.ts        |    35 +
 packages/constants/src/sidebar.ts                  |     8 +
 packages/constants/src/spreadsheet.ts              |     7 +
 packages/constants/src/state.ts                    |   114 +
 packages/constants/src/stickies.ts                 |     7 +
 packages/constants/src/subscription.ts             |    48 +
 packages/constants/src/swr.ts                      |    22 +
 packages/constants/src/tab-indices.ts              |    99 +
 packages/constants/src/themes.ts                   |    88 +
 packages/constants/src/user.ts                     |    65 +
 packages/constants/src/views.ts                    |    26 +
 packages/constants/src/workspace-drafts.ts         |    12 +
 packages/constants/src/workspace.ts                |   303 +
 packages/constants/tsconfig.json                   |     5 +
 packages/constants/tsdown.config.ts                |     8 +
 packages/decorators/.prettierignore                |    10 +
 packages/decorators/README.md                      |    95 +
 packages/decorators/package.json                   |    39 +
 packages/decorators/src/controller.ts              |   108 +
 packages/decorators/src/index.ts                   |     9 +
 packages/decorators/src/rest.ts                    |    57 +
 packages/decorators/src/websocket.ts               |    19 +
 packages/decorators/tsconfig.json                  |    12 +
 packages/decorators/tsdown.config.ts               |     8 +
 packages/editor/.prettierignore                    |    10 +
 packages/editor/Readme.md                          |    82 +
 packages/editor/package.json                       |   102 +
 packages/editor/postcss.config.js                  |     3 +
 .../src/components/document-editor-side-effects.ts |    18 +
 .../editors/document/collaborative-editor.tsx      |   169 +
 .../src/components/editors/document/editor.tsx     |   120 +
 .../src/components/editors/document/index.ts       |    10 +
 .../src/components/editors/document/loader.tsx     |    57 +
 .../components/editors/document/page-renderer.tsx  |   122 +
 .../src/components/editors/editor-container.tsx    |   185 +
 .../src/components/editors/editor-content.tsx      |    32 +
 .../src/components/editors/editor-wrapper.tsx      |   104 +
 packages/editor/src/components/editors/index.ts    |    12 +
 .../src/components/editors/link-view-container.tsx |   209 +
 .../src/components/editors/lite-text/editor.tsx    |    40 +
 .../src/components/editors/lite-text/index.ts      |     7 +
 .../src/components/editors/rich-text/editor.tsx    |    81 +
 .../src/components/editors/rich-text/index.ts      |     7 +
 packages/editor/src/components/link-container.tsx  |    22 +
 packages/editor/src/components/links/index.ts      |     9 +
 .../editor/src/components/links/link-edit-view.tsx |   158 +
 .../editor/src/components/links/link-preview.tsx   |    61 +
 packages/editor/src/components/links/link-view.tsx |    46 +
 packages/editor/src/components/menus/ai-menu.tsx   |   103 +
 .../src/components/menus/block-menu-options.tsx    |    93 +
 .../editor/src/components/menus/block-menu.tsx     |   255 +
 .../menus/bubble-menu/alignment-selector.tsx       |    89 +
 .../menus/bubble-menu/color-selector.tsx           |   117 +
 .../src/components/menus/bubble-menu/index.ts      |     9 +
 .../components/menus/bubble-menu/link-selector.tsx |   128 +
 .../components/menus/bubble-menu/node-selector.tsx |   110 +
 .../src/components/menus/bubble-menu/root.tsx      |   234 +
 .../src/components/menus/floating-menu/root.tsx    |    67 +
 .../menus/floating-menu/use-floating-menu.ts       |    63 +
 packages/editor/src/components/menus/index.ts      |    10 +
 packages/editor/src/components/menus/menu-items.ts |   285 +
 packages/editor/src/constants/assets.ts            |    12 +
 packages/editor/src/constants/common.ts            |   266 +
 packages/editor/src/constants/config.ts            |    69 +
 .../src/constants/document-collaborative-events.ts |    97 +
 packages/editor/src/constants/extension.ts         |    77 +
 packages/editor/src/constants/extensions.ts        |     9 +
 packages/editor/src/constants/meta.ts              |    11 +
 packages/editor/src/constants/utility.ts           |    29 +
 .../editor/src/contexts/collaboration-context.tsx  |    38 +
 packages/editor/src/contexts/index.ts              |     7 +
 .../additional-slash-command-options.tsx           |    18 +
 packages/editor/src/extensions/callout/block.tsx   |    66 +
 .../src/extensions/callout/color-selector.tsx      |    82 +
 .../src/extensions/callout/extension-config.ts     |    84 +
 .../editor/src/extensions/callout/extension.tsx    |    82 +
 packages/editor/src/extensions/callout/index.ts    |     7 +
 .../src/extensions/callout/logo-selector.tsx       |   104 +
 packages/editor/src/extensions/callout/types.ts    |    41 +
 packages/editor/src/extensions/callout/utils.ts    |    91 +
 .../editor/src/extensions/code-inline/index.tsx    |   104 +
 .../src/extensions/code/code-block-lowlight.ts     |    42 +
 .../src/extensions/code/code-block-node-view.tsx   |    72 +
 packages/editor/src/extensions/code/code-block.ts  |   353 +
 packages/editor/src/extensions/code/index.tsx      |   130 +
 .../editor/src/extensions/code/lowlight-plugin.ts  |   161 +
 packages/editor/src/extensions/code/types.ts       |    15 +
 .../code/utils/replace-code-block-with-text.ts     |   131 +
 .../editor/src/extensions/code/without-props.tsx   |   121 +
 .../editor/src/extensions/core-without-props.ts    |    66 +
 packages/editor/src/extensions/core/extensions.ts  |    19 +
 packages/editor/src/extensions/core/index.ts       |     7 +
 .../editor/src/extensions/core/without-props.ts    |     9 +
 packages/editor/src/extensions/custom-color.ts     |   155 +
 .../extensions/custom-image/components/block.tsx   |   355 +
 .../custom-image/components/node-view.tsx          |   165 +
 .../custom-image/components/toolbar/alignment.tsx  |    70 +
 .../custom-image/components/toolbar/download.tsx   |    30 +
 .../components/toolbar/full-screen/index.ts        |     7 +
 .../components/toolbar/full-screen/modal.tsx       |   311 +
 .../components/toolbar/full-screen/root.tsx        |    64 +
 .../custom-image/components/toolbar/index.ts       |     7 +
 .../custom-image/components/toolbar/root.tsx       |    63 +
 .../custom-image/components/upload-status.tsx      |    66 +
 .../custom-image/components/uploader.tsx           |   267 +
 .../extensions/custom-image/extension-config.ts    |    69 +
 .../src/extensions/custom-image/extension.tsx      |   134 +
 .../editor/src/extensions/custom-image/types.ts    |    73 +
 .../editor/src/extensions/custom-image/utils.ts    |    70 +
 .../src/extensions/custom-link/extension.tsx       |   296 +
 .../src/extensions/custom-link/helpers/autolink.ts |   119 +
 .../extensions/custom-link/helpers/clickHandler.ts |    62 +
 .../extensions/custom-link/helpers/pasteHandler.ts |    50 +
 .../editor/src/extensions/custom-link/index.ts     |     7 +
 .../src/extensions/custom-list-keymap/index.ts     |     7 +
 .../extensions/custom-list-keymap/list-helpers.ts  |   384 +
 .../extensions/custom-list-keymap/list-keymap.ts   |   140 +
 .../editor/src/extensions/document-extensions.tsx  |    43 +
 .../extensions/emoji/components/emojis-list.tsx    |   182 +
 packages/editor/src/extensions/emoji/emoji.ts      |   455 +
 packages/editor/src/extensions/emoji/extension.ts  |    38 +
 packages/editor/src/extensions/emoji/suggestion.ts |   111 +
 packages/editor/src/extensions/enter-key.ts        |    38 +
 packages/editor/src/extensions/extensions.ts       |   156 +
 packages/editor/src/extensions/headings-list.ts    |    73 +
 packages/editor/src/extensions/horizontal-rule.ts  |   131 +
 .../src/extensions/image/extension-config.tsx      |    33 +
 packages/editor/src/extensions/image/extension.tsx |    70 +
 packages/editor/src/extensions/image/index.ts      |     8 +
 packages/editor/src/extensions/index.ts            |    31 +
 packages/editor/src/extensions/keymap.ts           |   138 +
 .../src/extensions/mentions/extension-config.ts    |    71 +
 .../editor/src/extensions/mentions/extension.tsx   |    42 +
 packages/editor/src/extensions/mentions/index.ts   |     8 +
 .../src/extensions/mentions/mention-node-view.tsx  |    35 +
 .../extensions/mentions/mentions-list-dropdown.tsx |   210 +
 packages/editor/src/extensions/mentions/types.ts   |    20 +
 packages/editor/src/extensions/mentions/utils.ts   |    80 +
 packages/editor/src/extensions/placeholder.ts      |    55 +
 packages/editor/src/extensions/quote.ts            |    38 +
 .../editor/src/extensions/rich-text-extensions.tsx |    48 +
 packages/editor/src/extensions/side-menu.ts        |   179 +
 .../slash-commands/command-items-list.tsx          |   336 +
 .../slash-commands/command-menu-item.tsx           |    72 +
 .../src/extensions/slash-commands/command-menu.tsx |   183 +
 .../editor/src/extensions/slash-commands/index.ts  |     7 +
 .../editor/src/extensions/slash-commands/root.tsx  |   136 +
 packages/editor/src/extensions/starter-kit.ts      |    52 +
 packages/editor/src/extensions/table/index.ts      |    10 +
 .../table/plugins/drag-handles/actions.ts          |   219 +
 .../table/plugins/drag-handles/color-selector.tsx  |   124 +
 .../plugins/drag-handles/column/drag-handle.tsx    |   265 +
 .../table/plugins/drag-handles/column/dropdown.tsx |   115 +
 .../table/plugins/drag-handles/column/plugin.ts    |   128 +
 .../table/plugins/drag-handles/column/utils.ts     |   159 +
 .../table/plugins/drag-handles/marker-utils.ts     |   112 +
 .../table/plugins/drag-handles/row/drag-handle.tsx |   264 +
 .../table/plugins/drag-handles/row/dropdown.tsx    |   115 +
 .../table/plugins/drag-handles/row/plugin.ts       |   128 +
 .../table/plugins/drag-handles/row/utils.ts        |   158 +
 .../extensions/table/plugins/drag-handles/utils.ts |    93 +
 .../src/extensions/table/plugins/drag-state.ts     |    64 +
 .../table/plugins/insert-handlers/plugin.ts        |   134 +
 .../table/plugins/insert-handlers/utils.ts         |   419 +
 .../table/plugins/selection-outline/plugin.ts      |    66 +
 .../table/plugins/selection-outline/utils.ts       |    81 +
 packages/editor/src/extensions/table/table-cell.ts |   121 +
 .../editor/src/extensions/table/table-header.ts    |    68 +
 packages/editor/src/extensions/table/table-row.ts  |    52 +
 .../editor/src/extensions/table/table/icons.ts     |    57 +
 .../editor/src/extensions/table/table/index.ts     |     9 +
 .../src/extensions/table/table/table-view.tsx      |    95 +
 .../editor/src/extensions/table/table/table.ts     |   316 +
 .../table/table/utilities/create-cell.ts           |    19 +
 .../table/table/utilities/create-table.ts          |    51 +
 .../table/table/utilities/delete-column.ts         |    45 +
 .../table/table/utilities/delete-key-shortcut.ts   |   209 +
 .../extensions/table/table/utilities/delete-row.ts |    38 +
 .../table/table/utilities/get-table-node-types.ts  |    27 +
 .../extensions/table/table/utilities/helpers.ts    |   227 +
 .../utilities/insert-line-above-table-action.ts    |    64 +
 .../utilities/insert-line-below-table-action.ts    |    62 +
 packages/editor/src/extensions/text-align.ts       |    14 +
 packages/editor/src/extensions/title-extension.ts  |    20 +
 packages/editor/src/extensions/trailing-node.ts    |    74 +
 packages/editor/src/extensions/typography/index.ts |   112 +
 .../editor/src/extensions/typography/inputRules.ts |   137 +
 .../editor/src/extensions/unique-id/extension.ts   |   142 +
 packages/editor/src/extensions/unique-id/plugin.ts |   218 +
 packages/editor/src/extensions/unique-id/utils.ts  |    42 +
 packages/editor/src/extensions/utility.ts          |   141 +
 .../extensions/work-item-embed/extension-config.ts |    49 +
 .../src/extensions/work-item-embed/extension.tsx   |    43 +
 .../editor/src/extensions/work-item-embed/index.ts |     7 +
 .../editor/src/extensions/work-item-embed/types.ts |    21 +
 packages/editor/src/helpers/asset-duplication.ts   |    46 +
 packages/editor/src/helpers/assets.ts              |    46 +
 packages/editor/src/helpers/common.ts              |   117 +
 packages/editor/src/helpers/editor-commands.ts     |   200 +
 packages/editor/src/helpers/editor-ref.ts          |   288 +
 packages/editor/src/helpers/file.ts                |    42 +
 .../editor/src/helpers/find-suggestion-match.ts    |    79 +
 packages/editor/src/helpers/floating-ui.ts         |    52 +
 .../src/helpers/get-document-server-event.ts       |    21 +
 packages/editor/src/helpers/image-helpers.ts       |    38 +
 .../helpers/insert-content-at-cursor-position.ts   |    28 +
 .../insert-empty-paragraph-at-node-boundary.ts     |   101 +
 packages/editor/src/helpers/parser.ts              |   115 +
 packages/editor/src/helpers/paste-asset.ts         |    34 +
 packages/editor/src/helpers/scroll-to-node.ts      |    61 +
 packages/editor/src/helpers/tippy.ts               |    64 +
 packages/editor/src/helpers/yjs-utils.ts           |   254 +
 .../editor/src/hooks/use-collaborative-editor.ts   |   212 +
 packages/editor/src/hooks/use-editor-navigation.ts |   175 +
 packages/editor/src/hooks/use-editor.ts            |   163 +
 packages/editor/src/hooks/use-file-upload.ts       |   195 +
 packages/editor/src/hooks/use-title-editor.ts      |    97 +
 packages/editor/src/hooks/use-yjs-setup.ts         |   375 +
 packages/editor/src/index.ts                       |    29 +
 packages/editor/src/lib.ts                         |    11 +
 packages/editor/src/plugins/ai-handle.ts           |   126 +
 packages/editor/src/plugins/drag-handle.ts         |   448 +
 packages/editor/src/plugins/drop.ts                |   138 +
 packages/editor/src/plugins/file/delete.ts         |    77 +
 packages/editor/src/plugins/file/restore.ts        |    90 +
 packages/editor/src/plugins/file/root.ts           |    28 +
 packages/editor/src/plugins/file/types.ts          |    14 +
 packages/editor/src/plugins/highlight.ts           |    98 +
 packages/editor/src/plugins/markdown-clipboard.ts  |    51 +
 packages/editor/src/props.ts                       |    49 +
 packages/editor/src/styles/drag-drop.css           |   117 +
 packages/editor/src/styles/editor.css              |   508 +
 packages/editor/src/styles/github-dark.css         |    85 +
 packages/editor/src/styles/index.css               |     6 +
 packages/editor/src/styles/table.css               |   211 +
 packages/editor/src/styles/title-editor.css        |    49 +
 packages/editor/src/styles/variables.css           |   305 +
 packages/editor/src/types/ai.ts                    |    14 +
 packages/editor/src/types/asset.ts                 |    20 +
 packages/editor/src/types/collaboration.ts         |    43 +
 packages/editor/src/types/config.ts                |    57 +
 .../src/types/document-collaborative-events.ts     |    93 +
 packages/editor/src/types/editor-extended.ts       |    17 +
 packages/editor/src/types/editor.ts                |   231 +
 packages/editor/src/types/embed.ts                 |    14 +
 packages/editor/src/types/extensions.ts            |     7 +
 packages/editor/src/types/hook.ts                  |    69 +
 packages/editor/src/types/index.ts                 |    19 +
 packages/editor/src/types/issue-embed.ts           |    23 +
 packages/editor/src/types/mention.ts               |    31 +
 .../editor/src/types/slash-commands-suggestion.ts  |    28 +
 packages/editor/src/types/storage.ts               |    10 +
 packages/editor/src/types/utils.ts                 |     7 +
 packages/editor/tsconfig.json                      |    14 +
 packages/editor/tsdown.config.ts                   |    16 +
 packages/hooks/.prettierignore                     |    10 +
 packages/hooks/package.json                        |    35 +
 packages/hooks/src/index.ts                        |    10 +
 packages/hooks/src/use-hash-scroll.ts              |   134 +
 packages/hooks/src/use-local-storage.tsx           |    61 +
 packages/hooks/src/use-outside-click-detector.tsx  |    36 +
 packages/hooks/src/use-platform-os.tsx             |    40 +
 packages/hooks/tsconfig.json                       |     5 +
 packages/hooks/tsdown.config.ts                    |     9 +
 packages/i18n/.prettierignore                      |    10 +
 packages/i18n/locales                              |     1 +
 packages/i18n/package.json                         |    43 +
 packages/i18n/scripts/generate-types.ts            |   170 +
 packages/i18n/scripts/lib/locale-io.ts             |    77 +
 packages/i18n/scripts/sync-check.ts                |   245 +
 packages/i18n/scripts/tsconfig.json                |    12 +
 packages/i18n/src/constants/index.ts               |     8 +
 packages/i18n/src/constants/language.ts            |    34 +
 packages/i18n/src/constants/namespaces.ts          |    40 +
 packages/i18n/src/core/index.ts                    |     8 +
 packages/i18n/src/core/instance.ts                 |    52 +
 packages/i18n/src/core/set-language.ts             |    18 +
 packages/i18n/src/hooks/index.ts                   |     7 +
 packages/i18n/src/hooks/use-translation.ts         |    68 +
 packages/i18n/src/index.ts                         |    24 +
 packages/i18n/src/locales/cs/accessibility.json    |    34 +
 packages/i18n/src/locales/cs/auth.json             |   368 +
 packages/i18n/src/locales/cs/automation.json       |   273 +
 packages/i18n/src/locales/cs/common.json           |   871 +
 packages/i18n/src/locales/cs/cycle.json            |    41 +
 packages/i18n/src/locales/cs/editor.json           |    65 +
 packages/i18n/src/locales/cs/empty-state.json      |   270 +
 packages/i18n/src/locales/cs/home.json             |    77 +
 packages/i18n/src/locales/cs/inbox.json            |    87 +
 packages/i18n/src/locales/cs/integration.json      |   331 +
 packages/i18n/src/locales/cs/module.json           |     7 +
 packages/i18n/src/locales/cs/navigation.json       |    34 +
 packages/i18n/src/locales/cs/notification.json     |    58 +
 packages/i18n/src/locales/cs/page.json             |   118 +
 packages/i18n/src/locales/cs/power-k.json          |   192 +
 packages/i18n/src/locales/cs/project-settings.json |   526 +
 packages/i18n/src/locales/cs/project.json          |   418 +
 packages/i18n/src/locales/cs/settings.json         |   156 +
 packages/i18n/src/locales/cs/stickies.json         |    59 +
 packages/i18n/src/locales/cs/template.json         |   333 +
 packages/i18n/src/locales/cs/tour.json             |   195 +
 packages/i18n/src/locales/cs/update.json           |    69 +
 packages/i18n/src/locales/cs/wiki.json             |   113 +
 packages/i18n/src/locales/cs/work-item-type.json   |   477 +
 packages/i18n/src/locales/cs/work-item.json        |   432 +
 packages/i18n/src/locales/cs/workflow.json         |   100 +
 .../i18n/src/locales/cs/workspace-settings.json    |   508 +
 packages/i18n/src/locales/cs/workspace.json        |   378 +
 packages/i18n/src/locales/de/accessibility.json    |    34 +
 packages/i18n/src/locales/de/auth.json             |   368 +
 packages/i18n/src/locales/de/automation.json       |   273 +
 packages/i18n/src/locales/de/common.json           |   871 +
 packages/i18n/src/locales/de/cycle.json            |    41 +
 packages/i18n/src/locales/de/editor.json           |    65 +
 packages/i18n/src/locales/de/empty-state.json      |   270 +
 packages/i18n/src/locales/de/home.json             |    77 +
 packages/i18n/src/locales/de/inbox.json            |    87 +
 packages/i18n/src/locales/de/integration.json      |   331 +
 packages/i18n/src/locales/de/module.json           |     7 +
 packages/i18n/src/locales/de/navigation.json       |    34 +
 packages/i18n/src/locales/de/notification.json     |    58 +
 packages/i18n/src/locales/de/page.json             |   118 +
 packages/i18n/src/locales/de/power-k.json          |   192 +
 packages/i18n/src/locales/de/project-settings.json |   526 +
 packages/i18n/src/locales/de/project.json          |   418 +
 packages/i18n/src/locales/de/settings.json         |   156 +
 packages/i18n/src/locales/de/stickies.json         |    59 +
 packages/i18n/src/locales/de/template.json         |   333 +
 packages/i18n/src/locales/de/tour.json             |   195 +
 packages/i18n/src/locales/de/update.json           |    69 +
 packages/i18n/src/locales/de/wiki.json             |   113 +
 packages/i18n/src/locales/de/work-item-type.json   |   477 +
 packages/i18n/src/locales/de/work-item.json        |   432 +
 packages/i18n/src/locales/de/workflow.json         |   100 +
 .../i18n/src/locales/de/workspace-settings.json    |   508 +
 packages/i18n/src/locales/de/workspace.json        |   378 +
 packages/i18n/src/locales/en/accessibility.json    |    34 +
 packages/i18n/src/locales/en/auth.json             |   368 +
 packages/i18n/src/locales/en/automation.json       |   273 +
 packages/i18n/src/locales/en/common.json           |   871 +
 packages/i18n/src/locales/en/cycle.json            |    41 +
 packages/i18n/src/locales/en/editor.json           |    65 +
 packages/i18n/src/locales/en/empty-state.json      |   270 +
 packages/i18n/src/locales/en/home.json             |    77 +
 packages/i18n/src/locales/en/inbox.json            |    87 +
 packages/i18n/src/locales/en/integration.json      |   331 +
 packages/i18n/src/locales/en/module.json           |     7 +
 packages/i18n/src/locales/en/navigation.json       |    34 +
 packages/i18n/src/locales/en/notification.json     |    58 +
 packages/i18n/src/locales/en/page.json             |   118 +
 packages/i18n/src/locales/en/power-k.json          |   192 +
 packages/i18n/src/locales/en/project-settings.json |   526 +
 packages/i18n/src/locales/en/project.json          |   418 +
 packages/i18n/src/locales/en/settings.json         |   156 +
 packages/i18n/src/locales/en/stickies.json         |    59 +
 packages/i18n/src/locales/en/template.json         |   333 +
 packages/i18n/src/locales/en/tour.json             |   195 +
 packages/i18n/src/locales/en/update.json           |    69 +
 packages/i18n/src/locales/en/wiki.json             |   113 +
 packages/i18n/src/locales/en/work-item-type.json   |   477 +
 packages/i18n/src/locales/en/work-item.json        |   432 +
 packages/i18n/src/locales/en/workflow.json         |   100 +
 .../i18n/src/locales/en/workspace-settings.json    |   508 +
 packages/i18n/src/locales/en/workspace.json        |   378 +
 packages/i18n/src/locales/es/accessibility.json    |    34 +
 packages/i18n/src/locales/es/auth.json             |   368 +
 packages/i18n/src/locales/es/automation.json       |   273 +
 packages/i18n/src/locales/es/common.json           |   871 +
 packages/i18n/src/locales/es/cycle.json            |    41 +
 packages/i18n/src/locales/es/editor.json           |    65 +
 packages/i18n/src/locales/es/empty-state.json      |   270 +
 packages/i18n/src/locales/es/home.json             |    77 +
 packages/i18n/src/locales/es/inbox.json            |    87 +
 packages/i18n/src/locales/es/integration.json      |   331 +
 packages/i18n/src/locales/es/module.json           |     7 +
 packages/i18n/src/locales/es/navigation.json       |    34 +
 packages/i18n/src/locales/es/notification.json     |    58 +
 packages/i18n/src/locales/es/page.json             |   118 +
 packages/i18n/src/locales/es/power-k.json          |   192 +
 packages/i18n/src/locales/es/project-settings.json |   526 +
 packages/i18n/src/locales/es/project.json          |   418 +
 packages/i18n/src/locales/es/settings.json         |   156 +
 packages/i18n/src/locales/es/stickies.json         |    59 +
 packages/i18n/src/locales/es/template.json         |   333 +
 packages/i18n/src/locales/es/tour.json             |   195 +
 packages/i18n/src/locales/es/update.json           |    69 +
 packages/i18n/src/locales/es/wiki.json             |   113 +
 packages/i18n/src/locales/es/work-item-type.json   |   477 +
 packages/i18n/src/locales/es/work-item.json        |   432 +
 packages/i18n/src/locales/es/workflow.json         |   100 +
 .../i18n/src/locales/es/workspace-settings.json    |   508 +
 packages/i18n/src/locales/es/workspace.json        |   378 +
 packages/i18n/src/locales/fr/accessibility.json    |    34 +
 packages/i18n/src/locales/fr/auth.json             |   368 +
 packages/i18n/src/locales/fr/automation.json       |   273 +
 packages/i18n/src/locales/fr/common.json           |   871 +
 packages/i18n/src/locales/fr/cycle.json            |    41 +
 packages/i18n/src/locales/fr/editor.json           |    65 +
 packages/i18n/src/locales/fr/empty-state.json      |   270 +
 packages/i18n/src/locales/fr/home.json             |    77 +
 packages/i18n/src/locales/fr/inbox.json            |    87 +
 packages/i18n/src/locales/fr/integration.json      |   331 +
 packages/i18n/src/locales/fr/module.json           |     7 +
 packages/i18n/src/locales/fr/navigation.json       |    34 +
 packages/i18n/src/locales/fr/notification.json     |    58 +
 packages/i18n/src/locales/fr/page.json             |   118 +
 packages/i18n/src/locales/fr/power-k.json          |   192 +
 packages/i18n/src/locales/fr/project-settings.json |   526 +
 packages/i18n/src/locales/fr/project.json          |   418 +
 packages/i18n/src/locales/fr/settings.json         |   156 +
 packages/i18n/src/locales/fr/stickies.json         |    59 +
 packages/i18n/src/locales/fr/template.json         |   333 +
 packages/i18n/src/locales/fr/tour.json             |   195 +
 packages/i18n/src/locales/fr/update.json           |    69 +
 packages/i18n/src/locales/fr/wiki.json             |   113 +
 packages/i18n/src/locales/fr/work-item-type.json   |   477 +
 packages/i18n/src/locales/fr/work-item.json        |   432 +
 packages/i18n/src/locales/fr/workflow.json         |   100 +
 .../i18n/src/locales/fr/workspace-settings.json    |   508 +
 packages/i18n/src/locales/fr/workspace.json        |   378 +
 packages/i18n/src/locales/id/accessibility.json    |    34 +
 packages/i18n/src/locales/id/auth.json             |   368 +
 packages/i18n/src/locales/id/automation.json       |   273 +
 packages/i18n/src/locales/id/common.json           |   871 +
 packages/i18n/src/locales/id/cycle.json            |    41 +
 packages/i18n/src/locales/id/editor.json           |    65 +
 packages/i18n/src/locales/id/empty-state.json      |   270 +
 packages/i18n/src/locales/id/home.json             |    77 +
 packages/i18n/src/locales/id/inbox.json            |    87 +
 packages/i18n/src/locales/id/integration.json      |   331 +
 packages/i18n/src/locales/id/module.json           |     7 +
 packages/i18n/src/locales/id/navigation.json       |    34 +
 packages/i18n/src/locales/id/notification.json     |    58 +
 packages/i18n/src/locales/id/page.json             |   118 +
 packages/i18n/src/locales/id/power-k.json          |   192 +
 packages/i18n/src/locales/id/project-settings.json |   526 +
 packages/i18n/src/locales/id/project.json          |   418 +
 packages/i18n/src/locales/id/settings.json         |   156 +
 packages/i18n/src/locales/id/stickies.json         |    59 +
 packages/i18n/src/locales/id/template.json         |   333 +
 packages/i18n/src/locales/id/tour.json             |   195 +
 packages/i18n/src/locales/id/update.json           |    69 +
 packages/i18n/src/locales/id/wiki.json             |   113 +
 packages/i18n/src/locales/id/work-item-type.json   |   477 +
 packages/i18n/src/locales/id/work-item.json        |   432 +
 packages/i18n/src/locales/id/workflow.json         |   100 +
 .../i18n/src/locales/id/workspace-settings.json    |   508 +
 packages/i18n/src/locales/id/workspace.json        |   378 +
 packages/i18n/src/locales/it/accessibility.json    |    34 +
 packages/i18n/src/locales/it/auth.json             |   368 +
 packages/i18n/src/locales/it/automation.json       |   273 +
 packages/i18n/src/locales/it/common.json           |   871 +
 packages/i18n/src/locales/it/cycle.json            |    41 +
 packages/i18n/src/locales/it/editor.json           |    65 +
 packages/i18n/src/locales/it/empty-state.json      |   270 +
 packages/i18n/src/locales/it/home.json             |    77 +
 packages/i18n/src/locales/it/inbox.json            |    87 +
 packages/i18n/src/locales/it/integration.json      |   331 +
 packages/i18n/src/locales/it/module.json           |     7 +
 packages/i18n/src/locales/it/navigation.json       |    34 +
 packages/i18n/src/locales/it/notification.json     |    58 +
 packages/i18n/src/locales/it/page.json             |   118 +
 packages/i18n/src/locales/it/power-k.json          |   192 +
 packages/i18n/src/locales/it/project-settings.json |   526 +
 packages/i18n/src/locales/it/project.json          |   418 +
 packages/i18n/src/locales/it/settings.json         |   156 +
 packages/i18n/src/locales/it/stickies.json         |    59 +
 packages/i18n/src/locales/it/template.json         |   333 +
 packages/i18n/src/locales/it/tour.json             |   195 +
 packages/i18n/src/locales/it/update.json           |    69 +
 packages/i18n/src/locales/it/wiki.json             |   113 +
 packages/i18n/src/locales/it/work-item-type.json   |   477 +
 packages/i18n/src/locales/it/work-item.json        |   432 +
 packages/i18n/src/locales/it/workflow.json         |   100 +
 .../i18n/src/locales/it/workspace-settings.json    |   508 +
 packages/i18n/src/locales/it/workspace.json        |   378 +
 packages/i18n/src/locales/ja/accessibility.json    |    34 +
 packages/i18n/src/locales/ja/auth.json             |   368 +
 packages/i18n/src/locales/ja/automation.json       |   273 +
 packages/i18n/src/locales/ja/common.json           |   871 +
 packages/i18n/src/locales/ja/cycle.json            |    41 +
 packages/i18n/src/locales/ja/editor.json           |    65 +
 packages/i18n/src/locales/ja/empty-state.json      |   270 +
 packages/i18n/src/locales/ja/home.json             |    77 +
 packages/i18n/src/locales/ja/inbox.json            |    87 +
 packages/i18n/src/locales/ja/integration.json      |   331 +
 packages/i18n/src/locales/ja/module.json           |     7 +
 packages/i18n/src/locales/ja/navigation.json       |    34 +
 packages/i18n/src/locales/ja/notification.json     |    58 +
 packages/i18n/src/locales/ja/page.json             |   118 +
 packages/i18n/src/locales/ja/power-k.json          |   192 +
 packages/i18n/src/locales/ja/project-settings.json |   526 +
 packages/i18n/src/locales/ja/project.json          |   418 +
 packages/i18n/src/locales/ja/settings.json         |   156 +
 packages/i18n/src/locales/ja/stickies.json         |    59 +
 packages/i18n/src/locales/ja/template.json         |   333 +
 packages/i18n/src/locales/ja/tour.json             |   195 +
 packages/i18n/src/locales/ja/update.json           |    69 +
 packages/i18n/src/locales/ja/wiki.json             |   113 +
 packages/i18n/src/locales/ja/work-item-type.json   |   477 +
 packages/i18n/src/locales/ja/work-item.json        |   432 +
 packages/i18n/src/locales/ja/workflow.json         |   100 +
 .../i18n/src/locales/ja/workspace-settings.json    |   508 +
 packages/i18n/src/locales/ja/workspace.json        |   378 +
 packages/i18n/src/locales/ka-ge/accessibility.json |    34 +
 packages/i18n/src/locales/ka-ge/auth.json          |   368 +
 packages/i18n/src/locales/ka-ge/automation.json    |   273 +
 packages/i18n/src/locales/ka-ge/common.json        |   871 +
 packages/i18n/src/locales/ka-ge/cycle.json         |    41 +
 packages/i18n/src/locales/ka-ge/editor.json        |    65 +
 packages/i18n/src/locales/ka-ge/empty-state.json   |   270 +
 packages/i18n/src/locales/ka-ge/home.json          |    77 +
 packages/i18n/src/locales/ka-ge/inbox.json         |    87 +
 packages/i18n/src/locales/ka-ge/integration.json   |   331 +
 packages/i18n/src/locales/ka-ge/module.json        |     7 +
 packages/i18n/src/locales/ka-ge/navigation.json    |    34 +
 packages/i18n/src/locales/ka-ge/notification.json  |    58 +
 packages/i18n/src/locales/ka-ge/page.json          |   118 +
 packages/i18n/src/locales/ka-ge/power-k.json       |   192 +
 .../i18n/src/locales/ka-ge/project-settings.json   |   526 +
 packages/i18n/src/locales/ka-ge/project.json       |   418 +
 packages/i18n/src/locales/ka-ge/settings.json      |   156 +
 packages/i18n/src/locales/ka-ge/stickies.json      |    59 +
 packages/i18n/src/locales/ka-ge/template.json      |   333 +
 packages/i18n/src/locales/ka-ge/tour.json          |   195 +
 packages/i18n/src/locales/ka-ge/update.json        |    69 +
 packages/i18n/src/locales/ka-ge/wiki.json          |   113 +
 .../i18n/src/locales/ka-ge/work-item-type.json     |   477 +
 packages/i18n/src/locales/ka-ge/work-item.json     |   432 +
 packages/i18n/src/locales/ka-ge/workflow.json      |   100 +
 .../i18n/src/locales/ka-ge/workspace-settings.json |   508 +
 packages/i18n/src/locales/ka-ge/workspace.json     |   378 +
 packages/i18n/src/locales/ko/accessibility.json    |    34 +
 packages/i18n/src/locales/ko/auth.json             |   368 +
 packages/i18n/src/locales/ko/automation.json       |   273 +
 packages/i18n/src/locales/ko/common.json           |   871 +
 packages/i18n/src/locales/ko/cycle.json            |    41 +
 packages/i18n/src/locales/ko/editor.json           |    65 +
 packages/i18n/src/locales/ko/empty-state.json      |   270 +
 packages/i18n/src/locales/ko/home.json             |    77 +
 packages/i18n/src/locales/ko/inbox.json            |    87 +
 packages/i18n/src/locales/ko/integration.json      |   331 +
 packages/i18n/src/locales/ko/module.json           |     7 +
 packages/i18n/src/locales/ko/navigation.json       |    34 +
 packages/i18n/src/locales/ko/notification.json     |    58 +
 packages/i18n/src/locales/ko/page.json             |   118 +
 packages/i18n/src/locales/ko/power-k.json          |   192 +
 packages/i18n/src/locales/ko/project-settings.json |   526 +
 packages/i18n/src/locales/ko/project.json          |   418 +
 packages/i18n/src/locales/ko/settings.json         |   156 +
 packages/i18n/src/locales/ko/stickies.json         |    59 +
 packages/i18n/src/locales/ko/template.json         |   333 +
 packages/i18n/src/locales/ko/tour.json             |   195 +
 packages/i18n/src/locales/ko/update.json           |    69 +
 packages/i18n/src/locales/ko/wiki.json             |   113 +
 packages/i18n/src/locales/ko/work-item-type.json   |   477 +
 packages/i18n/src/locales/ko/work-item.json        |   432 +
 packages/i18n/src/locales/ko/workflow.json         |   100 +
 .../i18n/src/locales/ko/workspace-settings.json    |   508 +
 packages/i18n/src/locales/ko/workspace.json        |   378 +
 packages/i18n/src/locales/pl/accessibility.json    |    34 +
 packages/i18n/src/locales/pl/auth.json             |   368 +
 packages/i18n/src/locales/pl/automation.json       |   273 +
 packages/i18n/src/locales/pl/common.json           |   871 +
 packages/i18n/src/locales/pl/cycle.json            |    41 +
 packages/i18n/src/locales/pl/editor.json           |    65 +
 packages/i18n/src/locales/pl/empty-state.json      |   270 +
 packages/i18n/src/locales/pl/home.json             |    77 +
 packages/i18n/src/locales/pl/inbox.json            |    87 +
 packages/i18n/src/locales/pl/integration.json      |   331 +
 packages/i18n/src/locales/pl/module.json           |     7 +
 packages/i18n/src/locales/pl/navigation.json       |    34 +
 packages/i18n/src/locales/pl/notification.json     |    58 +
 packages/i18n/src/locales/pl/page.json             |   118 +
 packages/i18n/src/locales/pl/power-k.json          |   192 +
 packages/i18n/src/locales/pl/project-settings.json |   526 +
 packages/i18n/src/locales/pl/project.json          |   418 +
 packages/i18n/src/locales/pl/settings.json         |   156 +
 packages/i18n/src/locales/pl/stickies.json         |    59 +
 packages/i18n/src/locales/pl/template.json         |   333 +
 packages/i18n/src/locales/pl/tour.json             |   195 +
 packages/i18n/src/locales/pl/update.json           |    69 +
 packages/i18n/src/locales/pl/wiki.json             |   113 +
 packages/i18n/src/locales/pl/work-item-type.json   |   477 +
 packages/i18n/src/locales/pl/work-item.json        |   432 +
 packages/i18n/src/locales/pl/workflow.json         |   100 +
 .../i18n/src/locales/pl/workspace-settings.json    |   508 +
 packages/i18n/src/locales/pl/workspace.json        |   378 +
 packages/i18n/src/locales/pt-BR/accessibility.json |    34 +
 packages/i18n/src/locales/pt-BR/auth.json          |   368 +
 packages/i18n/src/locales/pt-BR/automation.json    |   273 +
 packages/i18n/src/locales/pt-BR/common.json        |   871 +
 packages/i18n/src/locales/pt-BR/cycle.json         |    41 +
 packages/i18n/src/locales/pt-BR/editor.json        |    65 +
 packages/i18n/src/locales/pt-BR/empty-state.json   |   270 +
 packages/i18n/src/locales/pt-BR/home.json          |    77 +
 packages/i18n/src/locales/pt-BR/inbox.json         |    87 +
 packages/i18n/src/locales/pt-BR/integration.json   |   331 +
 packages/i18n/src/locales/pt-BR/module.json        |     7 +
 packages/i18n/src/locales/pt-BR/navigation.json    |    34 +
 packages/i18n/src/locales/pt-BR/notification.json  |    58 +
 packages/i18n/src/locales/pt-BR/page.json          |   118 +
 packages/i18n/src/locales/pt-BR/power-k.json       |   192 +
 .../i18n/src/locales/pt-BR/project-settings.json   |   526 +
 packages/i18n/src/locales/pt-BR/project.json       |   418 +
 packages/i18n/src/locales/pt-BR/settings.json      |   156 +
 packages/i18n/src/locales/pt-BR/stickies.json      |    59 +
 packages/i18n/src/locales/pt-BR/template.json      |   333 +
 packages/i18n/src/locales/pt-BR/tour.json          |   195 +
 packages/i18n/src/locales/pt-BR/update.json        |    69 +
 packages/i18n/src/locales/pt-BR/wiki.json          |   113 +
 .../i18n/src/locales/pt-BR/work-item-type.json     |   477 +
 packages/i18n/src/locales/pt-BR/work-item.json     |   432 +
 packages/i18n/src/locales/pt-BR/workflow.json      |   100 +
 .../i18n/src/locales/pt-BR/workspace-settings.json |   508 +
 packages/i18n/src/locales/pt-BR/workspace.json     |   378 +
 packages/i18n/src/locales/ro/accessibility.json    |    34 +
 packages/i18n/src/locales/ro/auth.json             |   368 +
 packages/i18n/src/locales/ro/automation.json       |   273 +
 packages/i18n/src/locales/ro/common.json           |   871 +
 packages/i18n/src/locales/ro/cycle.json            |    41 +
 packages/i18n/src/locales/ro/editor.json           |    65 +
 packages/i18n/src/locales/ro/empty-state.json      |   270 +
 packages/i18n/src/locales/ro/home.json             |    77 +
 packages/i18n/src/locales/ro/inbox.json            |    87 +
 packages/i18n/src/locales/ro/integration.json      |   331 +
 packages/i18n/src/locales/ro/module.json           |     7 +
 packages/i18n/src/locales/ro/navigation.json       |    34 +
 packages/i18n/src/locales/ro/notification.json     |    58 +
 packages/i18n/src/locales/ro/page.json             |   118 +
 packages/i18n/src/locales/ro/power-k.json          |   192 +
 packages/i18n/src/locales/ro/project-settings.json |   526 +
 packages/i18n/src/locales/ro/project.json          |   418 +
 packages/i18n/src/locales/ro/settings.json         |   156 +
 packages/i18n/src/locales/ro/stickies.json         |    59 +
 packages/i18n/src/locales/ro/template.json         |   333 +
 packages/i18n/src/locales/ro/tour.json             |   195 +
 packages/i18n/src/locales/ro/update.json           |    69 +
 packages/i18n/src/locales/ro/wiki.json             |   113 +
 packages/i18n/src/locales/ro/work-item-type.json   |   477 +
 packages/i18n/src/locales/ro/work-item.json        |   432 +
 packages/i18n/src/locales/ro/workflow.json         |   100 +
 .../i18n/src/locales/ro/workspace-settings.json    |   508 +
 packages/i18n/src/locales/ro/workspace.json        |   378 +
 packages/i18n/src/locales/ru/accessibility.json    |    34 +
 packages/i18n/src/locales/ru/auth.json             |   368 +
 packages/i18n/src/locales/ru/automation.json       |   273 +
 packages/i18n/src/locales/ru/common.json           |   871 +
 packages/i18n/src/locales/ru/cycle.json            |    41 +
 packages/i18n/src/locales/ru/editor.json           |    65 +
 packages/i18n/src/locales/ru/empty-state.json      |   270 +
 packages/i18n/src/locales/ru/home.json             |    77 +
 packages/i18n/src/locales/ru/inbox.json            |    87 +
 packages/i18n/src/locales/ru/integration.json      |   331 +
 packages/i18n/src/locales/ru/module.json           |     7 +
 packages/i18n/src/locales/ru/navigation.json       |    34 +
 packages/i18n/src/locales/ru/notification.json     |    58 +
 packages/i18n/src/locales/ru/page.json             |   118 +
 packages/i18n/src/locales/ru/power-k.json          |   192 +
 packages/i18n/src/locales/ru/project-settings.json |   526 +
 packages/i18n/src/locales/ru/project.json          |   418 +
 packages/i18n/src/locales/ru/settings.json         |   156 +
 packages/i18n/src/locales/ru/stickies.json         |    59 +
 packages/i18n/src/locales/ru/template.json         |   333 +
 packages/i18n/src/locales/ru/tour.json             |   195 +
 packages/i18n/src/locales/ru/update.json           |    69 +
 packages/i18n/src/locales/ru/wiki.json             |   113 +
 packages/i18n/src/locales/ru/work-item-type.json   |   477 +
 packages/i18n/src/locales/ru/work-item.json        |   432 +
 packages/i18n/src/locales/ru/workflow.json         |   100 +
 .../i18n/src/locales/ru/workspace-settings.json    |   508 +
 packages/i18n/src/locales/ru/workspace.json        |   378 +
 packages/i18n/src/locales/sk/accessibility.json    |    34 +
 packages/i18n/src/locales/sk/auth.json             |   368 +
 packages/i18n/src/locales/sk/automation.json       |   273 +
 packages/i18n/src/locales/sk/common.json           |   871 +
 packages/i18n/src/locales/sk/cycle.json            |    41 +
 packages/i18n/src/locales/sk/editor.json           |    65 +
 packages/i18n/src/locales/sk/empty-state.json      |   270 +
 packages/i18n/src/locales/sk/home.json             |    77 +
 packages/i18n/src/locales/sk/inbox.json            |    87 +
 packages/i18n/src/locales/sk/integration.json      |   331 +
 packages/i18n/src/locales/sk/module.json           |     7 +
 packages/i18n/src/locales/sk/navigation.json       |    34 +
 packages/i18n/src/locales/sk/notification.json     |    58 +
 packages/i18n/src/locales/sk/page.json             |   118 +
 packages/i18n/src/locales/sk/power-k.json          |   192 +
 packages/i18n/src/locales/sk/project-settings.json |   526 +
 packages/i18n/src/locales/sk/project.json          |   418 +
 packages/i18n/src/locales/sk/settings.json         |   156 +
 packages/i18n/src/locales/sk/stickies.json         |    59 +
 packages/i18n/src/locales/sk/template.json         |   333 +
 packages/i18n/src/locales/sk/tour.json             |   195 +
 packages/i18n/src/locales/sk/update.json           |    69 +
 packages/i18n/src/locales/sk/wiki.json             |   113 +
 packages/i18n/src/locales/sk/work-item-type.json   |   477 +
 packages/i18n/src/locales/sk/work-item.json        |   432 +
 packages/i18n/src/locales/sk/workflow.json         |   100 +
 .../i18n/src/locales/sk/workspace-settings.json    |   508 +
 packages/i18n/src/locales/sk/workspace.json        |   378 +
 packages/i18n/src/locales/tr-TR/accessibility.json |    34 +
 packages/i18n/src/locales/tr-TR/auth.json          |   368 +
 packages/i18n/src/locales/tr-TR/automation.json    |   273 +
 packages/i18n/src/locales/tr-TR/common.json        |   871 +
 packages/i18n/src/locales/tr-TR/cycle.json         |    41 +
 packages/i18n/src/locales/tr-TR/editor.json        |    65 +
 packages/i18n/src/locales/tr-TR/empty-state.json   |   270 +
 packages/i18n/src/locales/tr-TR/home.json          |    77 +
 packages/i18n/src/locales/tr-TR/inbox.json         |    87 +
 packages/i18n/src/locales/tr-TR/integration.json   |   331 +
 packages/i18n/src/locales/tr-TR/module.json        |     7 +
 packages/i18n/src/locales/tr-TR/navigation.json    |    34 +
 packages/i18n/src/locales/tr-TR/notification.json  |    58 +
 packages/i18n/src/locales/tr-TR/page.json          |   118 +
 packages/i18n/src/locales/tr-TR/power-k.json       |   192 +
 .../i18n/src/locales/tr-TR/project-settings.json   |   526 +
 packages/i18n/src/locales/tr-TR/project.json       |   418 +
 packages/i18n/src/locales/tr-TR/settings.json      |   156 +
 packages/i18n/src/locales/tr-TR/stickies.json      |    59 +
 packages/i18n/src/locales/tr-TR/template.json      |   333 +
 packages/i18n/src/locales/tr-TR/tour.json          |   195 +
 packages/i18n/src/locales/tr-TR/update.json        |    69 +
 packages/i18n/src/locales/tr-TR/wiki.json          |   113 +
 .../i18n/src/locales/tr-TR/work-item-type.json     |   477 +
 packages/i18n/src/locales/tr-TR/work-item.json     |   432 +
 packages/i18n/src/locales/tr-TR/workflow.json      |   100 +
 .../i18n/src/locales/tr-TR/workspace-settings.json |   508 +
 packages/i18n/src/locales/tr-TR/workspace.json     |   378 +
 packages/i18n/src/locales/ua/accessibility.json    |    34 +
 packages/i18n/src/locales/ua/auth.json             |   368 +
 packages/i18n/src/locales/ua/automation.json       |   273 +
 packages/i18n/src/locales/ua/common.json           |   871 +
 packages/i18n/src/locales/ua/cycle.json            |    41 +
 packages/i18n/src/locales/ua/editor.json           |    65 +
 packages/i18n/src/locales/ua/empty-state.json      |   270 +
 packages/i18n/src/locales/ua/home.json             |    77 +
 packages/i18n/src/locales/ua/inbox.json            |    87 +
 packages/i18n/src/locales/ua/integration.json      |   331 +
 packages/i18n/src/locales/ua/module.json           |     7 +
 packages/i18n/src/locales/ua/navigation.json       |    34 +
 packages/i18n/src/locales/ua/notification.json     |    58 +
 packages/i18n/src/locales/ua/page.json             |   118 +
 packages/i18n/src/locales/ua/power-k.json          |   192 +
 packages/i18n/src/locales/ua/project-settings.json |   526 +
 packages/i18n/src/locales/ua/project.json          |   418 +
 packages/i18n/src/locales/ua/settings.json         |   156 +
 packages/i18n/src/locales/ua/stickies.json         |    59 +
 packages/i18n/src/locales/ua/template.json         |   333 +
 packages/i18n/src/locales/ua/tour.json             |   195 +
 packages/i18n/src/locales/ua/update.json           |    69 +
 packages/i18n/src/locales/ua/wiki.json             |   113 +
 packages/i18n/src/locales/ua/work-item-type.json   |   477 +
 packages/i18n/src/locales/ua/work-item.json        |   432 +
 packages/i18n/src/locales/ua/workflow.json         |   100 +
 .../i18n/src/locales/ua/workspace-settings.json    |   508 +
 packages/i18n/src/locales/ua/workspace.json        |   378 +
 packages/i18n/src/locales/vi-VN/accessibility.json |    34 +
 packages/i18n/src/locales/vi-VN/auth.json          |   368 +
 packages/i18n/src/locales/vi-VN/automation.json    |   273 +
 packages/i18n/src/locales/vi-VN/common.json        |   871 +
 packages/i18n/src/locales/vi-VN/cycle.json         |    41 +
 packages/i18n/src/locales/vi-VN/editor.json        |    65 +
 packages/i18n/src/locales/vi-VN/empty-state.json   |   270 +
 packages/i18n/src/locales/vi-VN/home.json          |    77 +
 packages/i18n/src/locales/vi-VN/inbox.json         |    87 +
 packages/i18n/src/locales/vi-VN/integration.json   |   331 +
 packages/i18n/src/locales/vi-VN/module.json        |     7 +
 packages/i18n/src/locales/vi-VN/navigation.json    |    34 +
 packages/i18n/src/locales/vi-VN/notification.json  |    58 +
 packages/i18n/src/locales/vi-VN/page.json          |   118 +
 packages/i18n/src/locales/vi-VN/power-k.json       |   192 +
 .../i18n/src/locales/vi-VN/project-settings.json   |   526 +
 packages/i18n/src/locales/vi-VN/project.json       |   418 +
 packages/i18n/src/locales/vi-VN/settings.json      |   156 +
 packages/i18n/src/locales/vi-VN/stickies.json      |    59 +
 packages/i18n/src/locales/vi-VN/template.json      |   333 +
 packages/i18n/src/locales/vi-VN/tour.json          |   195 +
 packages/i18n/src/locales/vi-VN/update.json        |    69 +
 packages/i18n/src/locales/vi-VN/wiki.json          |   113 +
 .../i18n/src/locales/vi-VN/work-item-type.json     |   477 +
 packages/i18n/src/locales/vi-VN/work-item.json     |   432 +
 packages/i18n/src/locales/vi-VN/workflow.json      |   100 +
 .../i18n/src/locales/vi-VN/workspace-settings.json |   508 +
 packages/i18n/src/locales/vi-VN/workspace.json     |   378 +
 packages/i18n/src/locales/zh-CN/accessibility.json |    34 +
 packages/i18n/src/locales/zh-CN/auth.json          |   368 +
 packages/i18n/src/locales/zh-CN/automation.json    |   273 +
 packages/i18n/src/locales/zh-CN/common.json        |   871 +
 packages/i18n/src/locales/zh-CN/cycle.json         |    41 +
 packages/i18n/src/locales/zh-CN/editor.json        |    65 +
 packages/i18n/src/locales/zh-CN/empty-state.json   |   270 +
 packages/i18n/src/locales/zh-CN/home.json          |    77 +
 packages/i18n/src/locales/zh-CN/inbox.json         |    87 +
 packages/i18n/src/locales/zh-CN/integration.json   |   331 +
 packages/i18n/src/locales/zh-CN/module.json        |     7 +
 packages/i18n/src/locales/zh-CN/navigation.json    |    34 +
 packages/i18n/src/locales/zh-CN/notification.json  |    58 +
 packages/i18n/src/locales/zh-CN/page.json          |   118 +
 packages/i18n/src/locales/zh-CN/power-k.json       |   192 +
 .../i18n/src/locales/zh-CN/project-settings.json   |   526 +
 packages/i18n/src/locales/zh-CN/project.json       |   418 +
 packages/i18n/src/locales/zh-CN/settings.json      |   156 +
 packages/i18n/src/locales/zh-CN/stickies.json      |    59 +
 packages/i18n/src/locales/zh-CN/template.json      |   333 +
 packages/i18n/src/locales/zh-CN/tour.json          |   195 +
 packages/i18n/src/locales/zh-CN/update.json        |    69 +
 packages/i18n/src/locales/zh-CN/wiki.json          |   113 +
 .../i18n/src/locales/zh-CN/work-item-type.json     |   477 +
 packages/i18n/src/locales/zh-CN/work-item.json     |   432 +
 packages/i18n/src/locales/zh-CN/workflow.json      |   100 +
 .../i18n/src/locales/zh-CN/workspace-settings.json |   508 +
 packages/i18n/src/locales/zh-CN/workspace.json     |   378 +
 packages/i18n/src/locales/zh-TW/accessibility.json |    34 +
 packages/i18n/src/locales/zh-TW/auth.json          |   368 +
 packages/i18n/src/locales/zh-TW/automation.json    |   273 +
 packages/i18n/src/locales/zh-TW/common.json        |   871 +
 packages/i18n/src/locales/zh-TW/cycle.json         |    41 +
 packages/i18n/src/locales/zh-TW/editor.json        |    65 +
 packages/i18n/src/locales/zh-TW/empty-state.json   |   270 +
 packages/i18n/src/locales/zh-TW/home.json          |    77 +
 packages/i18n/src/locales/zh-TW/inbox.json         |    87 +
 packages/i18n/src/locales/zh-TW/integration.json   |   331 +
 packages/i18n/src/locales/zh-TW/module.json        |     7 +
 packages/i18n/src/locales/zh-TW/navigation.json    |    34 +
 packages/i18n/src/locales/zh-TW/notification.json  |    58 +
 packages/i18n/src/locales/zh-TW/page.json          |   118 +
 packages/i18n/src/locales/zh-TW/power-k.json       |   192 +
 .../i18n/src/locales/zh-TW/project-settings.json   |   526 +
 packages/i18n/src/locales/zh-TW/project.json       |   418 +
 packages/i18n/src/locales/zh-TW/settings.json      |   156 +
 packages/i18n/src/locales/zh-TW/stickies.json      |    59 +
 packages/i18n/src/locales/zh-TW/template.json      |   333 +
 packages/i18n/src/locales/zh-TW/tour.json          |   195 +
 packages/i18n/src/locales/zh-TW/update.json        |    69 +
 packages/i18n/src/locales/zh-TW/wiki.json          |   113 +
 .../i18n/src/locales/zh-TW/work-item-type.json     |   477 +
 packages/i18n/src/locales/zh-TW/work-item.json     |   432 +
 packages/i18n/src/locales/zh-TW/workflow.json      |   100 +
 .../i18n/src/locales/zh-TW/workspace-settings.json |   508 +
 packages/i18n/src/locales/zh-TW/workspace.json     |   378 +
 packages/i18n/src/provider/index.tsx               |    21 +
 packages/i18n/src/types/index.ts                   |     8 +
 packages/i18n/src/types/language.ts                |    32 +
 packages/i18n/tsconfig.json                        |     9 +
 packages/i18n/tsdown.config.ts                     |     9 +
 packages/logger/.prettierignore                    |    10 +
 packages/logger/README.md                          |    70 +
 packages/logger/package.json                       |    40 +
 packages/logger/src/config.ts                      |    21 +
 packages/logger/src/index.ts                       |     8 +
 packages/logger/src/middleware.ts                  |    17 +
 packages/logger/tsconfig.json                      |    11 +
 packages/logger/tsdown.config.ts                   |     8 +
 packages/propel/.prettierignore                    |    10 +
 packages/propel/.storybook/main.ts                 |    29 +
 packages/propel/.storybook/manager.ts              |    20 +
 packages/propel/.storybook/preview.ts              |    20 +
 packages/propel/.storybook/tailwind.css            |     2 +
 packages/propel/package.json                       |    98 +
 packages/propel/postcss.config.js                  |     3 +
 packages/propel/public/plane-lockup-light.svg      |    16 +
 .../propel/src/accordion/accordion.stories.tsx     |   204 +
 packages/propel/src/accordion/accordion.tsx        |    94 +
 packages/propel/src/accordion/index.ts             |     7 +
 .../animated-counter/animated-counter.stories.tsx  |   334 +
 .../src/animated-counter/animated-counter.tsx      |    92 +
 packages/propel/src/animated-counter/index.ts      |     8 +
 packages/propel/src/avatar/avatar.stories.tsx      |   177 +
 packages/propel/src/avatar/avatar.tsx              |   133 +
 packages/propel/src/avatar/index.ts                |     7 +
 packages/propel/src/badge/badge.stories.tsx        |   154 +
 packages/propel/src/badge/badge.tsx                |    28 +
 packages/propel/src/badge/helper.tsx               |    55 +
 packages/propel/src/badge/index.ts                 |     9 +
 packages/propel/src/banner/banner.stories.tsx      |   197 +
 packages/propel/src/banner/banner.tsx              |   135 +
 packages/propel/src/banner/helper.tsx              |    52 +
 packages/propel/src/banner/index.ts                |     9 +
 packages/propel/src/button/button.stories.tsx      |   209 +
 packages/propel/src/button/button.tsx              |    45 +
 packages/propel/src/button/helper.tsx              |    69 +
 packages/propel/src/button/index.ts                |     9 +
 packages/propel/src/calendar/calendar.stories.tsx  |   200 +
 packages/propel/src/calendar/index.ts              |     8 +
 packages/propel/src/calendar/root.tsx              |    42 +
 packages/propel/src/card/card.stories.tsx          |   217 +
 packages/propel/src/card/card.tsx                  |    40 +
 packages/propel/src/card/helper.tsx                |    41 +
 packages/propel/src/card/index.ts                  |     7 +
 packages/propel/src/charts/area-chart/index.ts     |     7 +
 packages/propel/src/charts/area-chart/root.tsx     |   211 +
 packages/propel/src/charts/bar-chart/bar.tsx       |   198 +
 packages/propel/src/charts/bar-chart/index.ts      |     7 +
 packages/propel/src/charts/bar-chart/root.tsx      |   211 +
 packages/propel/src/charts/components/legend.tsx   |    84 +
 packages/propel/src/charts/components/tick.tsx     |    63 +
 packages/propel/src/charts/components/tooltip.tsx  |    63 +
 packages/propel/src/charts/line-chart/index.ts     |     7 +
 packages/propel/src/charts/line-chart/root.tsx     |   186 +
 .../propel/src/charts/pie-chart/active-shape.tsx   |    38 +
 packages/propel/src/charts/pie-chart/index.ts      |     7 +
 packages/propel/src/charts/pie-chart/root.tsx      |   155 +
 packages/propel/src/charts/pie-chart/tooltip.tsx   |    44 +
 packages/propel/src/charts/radar-chart/index.ts    |     7 +
 packages/propel/src/charts/radar-chart/root.tsx    |   101 +
 packages/propel/src/charts/scatter-chart/index.ts  |     7 +
 packages/propel/src/charts/scatter-chart/root.tsx  |   171 +
 packages/propel/src/charts/tree-map/index.ts       |     7 +
 .../propel/src/charts/tree-map/map-content.tsx     |   276 +
 packages/propel/src/charts/tree-map/root.tsx       |    50 +
 packages/propel/src/charts/tree-map/tooltip.tsx    |    35 +
 .../propel/src/collapsible/collapsible.stories.tsx |   183 +
 packages/propel/src/collapsible/collapsible.tsx    |   108 +
 packages/propel/src/collapsible/index.ts           |     7 +
 packages/propel/src/combobox/combobox.stories.tsx  |   266 +
 packages/propel/src/combobox/combobox.tsx          |   237 +
 packages/propel/src/combobox/index.ts              |     7 +
 packages/propel/src/command/command.stories.tsx    |   209 +
 packages/propel/src/command/command.tsx            |    47 +
 packages/propel/src/command/index.ts               |     7 +
 .../src/context-menu/context-menu.stories.tsx      |   391 +
 packages/propel/src/context-menu/context-menu.tsx  |   151 +
 packages/propel/src/context-menu/index.ts          |    13 +
 .../design-system-philosophy.stories.tsx           |   434 +
 packages/propel/src/dialog/dialog.stories.tsx      |   432 +
 packages/propel/src/dialog/index.ts                |     7 +
 packages/propel/src/dialog/root.tsx                |   141 +
 .../src/emoji-icon-picker/emoji-picker.stories.tsx |   442 +
 .../propel/src/emoji-icon-picker/emoji-picker.tsx  |   154 +
 .../propel/src/emoji-icon-picker/emoji/emoji.tsx   |    88 +
 .../propel/src/emoji-icon-picker/emoji/index.ts    |     7 +
 packages/propel/src/emoji-icon-picker/helper.tsx   |   162 +
 .../src/emoji-icon-picker/icon/icon-root.tsx       |   132 +
 .../propel/src/emoji-icon-picker/icon/index.ts     |     7 +
 .../src/emoji-icon-picker/icon/lucide-root.tsx     |    40 +
 .../src/emoji-icon-picker/icon/material-root.tsx   |    55 +
 packages/propel/src/emoji-icon-picker/index.ts     |    11 +
 packages/propel/src/emoji-icon-picker/logo.tsx     |    92 +
 .../propel/src/emoji-icon-picker/lucide-icons.tsx  |   321 +
 .../src/emoji-icon-picker/material-icons.tsx       |   608 +
 .../emoji-reaction-picker.stories.tsx              |   396 +
 .../src/emoji-reaction/emoji-reaction-picker.tsx   |    89 +
 .../src/emoji-reaction/emoji-reaction.stories.tsx  |   241 +
 .../propel/src/emoji-reaction/emoji-reaction.tsx   |   157 +
 packages/propel/src/emoji-reaction/index.ts        |    16 +
 .../src/empty-state/assets-showcase.stories.tsx    |   204 +
 .../src/empty-state/assets/asset-registry.tsx      |   140 +
 .../propel/src/empty-state/assets/asset-types.ts   |    60 +
 packages/propel/src/empty-state/assets/helper.tsx  |    23 +
 .../assets/horizontal-stack/constant.tsx           |   111 +
 .../assets/horizontal-stack/customer.tsx           |    80 +
 .../empty-state/assets/horizontal-stack/epic.tsx   |    78 +
 .../assets/horizontal-stack/estimate.tsx           |    80 +
 .../empty-state/assets/horizontal-stack/export.tsx |    86 +
 .../empty-state/assets/horizontal-stack/index.ts   |    26 +
 .../empty-state/assets/horizontal-stack/intake.tsx |    98 +
 .../empty-state/assets/horizontal-stack/label.tsx  |    84 +
 .../empty-state/assets/horizontal-stack/link.tsx   |    92 +
 .../assets/horizontal-stack/members.tsx            |    98 +
 .../empty-state/assets/horizontal-stack/note.tsx   |    78 +
 .../assets/horizontal-stack/priority.tsx           |    90 +
 .../assets/horizontal-stack/project.tsx            |    78 +
 .../assets/horizontal-stack/settings.tsx           |    82 +
 .../empty-state/assets/horizontal-stack/state.tsx  |    78 +
 .../assets/horizontal-stack/template.tsx           |    92 +
 .../empty-state/assets/horizontal-stack/token.tsx  |    86 +
 .../assets/horizontal-stack/unknown.tsx            |    86 +
 .../empty-state/assets/horizontal-stack/update.tsx |    84 +
 .../assets/horizontal-stack/webhook.tsx            |    78 +
 .../assets/horizontal-stack/work-item.tsx          |    92 +
 .../assets/horizontal-stack/worklog.tsx            |    86 +
 .../empty-state/assets/illustration/constant.tsx   |    18 +
 .../src/empty-state/assets/illustration/inbox.tsx  |   142 +
 .../src/empty-state/assets/illustration/index.ts   |     8 +
 .../src/empty-state/assets/illustration/search.tsx |    67 +
 packages/propel/src/empty-state/assets/index.ts    |    12 +
 .../assets/vertical-stack/404-error.tsx            |   294 +
 .../assets/vertical-stack/archived-cycle.tsx       |   365 +
 .../assets/vertical-stack/archived-module.tsx      |   302 +
 .../assets/vertical-stack/archived-work-item.tsx   |   337 +
 .../assets/vertical-stack/changelog.tsx            |   189 +
 .../empty-state/assets/vertical-stack/constant.tsx |   111 +
 .../empty-state/assets/vertical-stack/customer.tsx |   382 +
 .../empty-state/assets/vertical-stack/cycle.tsx    |   251 +
 .../assets/vertical-stack/dashboard.tsx            |   326 +
 .../empty-state/assets/vertical-stack/draft.tsx    |   274 +
 .../src/empty-state/assets/vertical-stack/epic.tsx |   232 +
 .../src/empty-state/assets/vertical-stack/index.ts |    26 +
 .../assets/vertical-stack/initiative.tsx           |   256 +
 .../assets/vertical-stack/invalid-link.tsx         |   186 +
 .../empty-state/assets/vertical-stack/module.tsx   |   382 +
 .../assets/vertical-stack/no-access.tsx            |   172 +
 .../src/empty-state/assets/vertical-stack/page.tsx |   261 +
 .../empty-state/assets/vertical-stack/project.tsx  |   251 +
 .../assets/vertical-stack/server-error.tsx         |   338 +
 .../assets/vertical-stack/teamspace.tsx            |   360 +
 .../src/empty-state/assets/vertical-stack/view.tsx |   326 +
 .../assets/vertical-stack/work-item.tsx            |   254 +
 .../empty-state/compact-empty-state.stories.tsx    |   148 +
 .../propel/src/empty-state/compact-empty-state.tsx |    70 +
 .../empty-state/detailed-empty-state.stories.tsx   |   301 +
 .../src/empty-state/detailed-empty-state.tsx       |    75 +
 packages/propel/src/empty-state/empty-state.tsx    |    77 +
 packages/propel/src/empty-state/index.ts           |    11 +
 packages/propel/src/empty-state/types.ts           |    31 +
 packages/propel/src/icon-button/helper.tsx         |    56 +
 .../propel/src/icon-button/icon-button.stories.tsx |   180 +
 packages/propel/src/icon-button/icon-button.tsx    |    52 +
 packages/propel/src/icon-button/index.ts           |     9 +
 .../propel/src/icons/actions/add-circle-icon.tsx   |    23 +
 packages/propel/src/icons/actions/add-icon.tsx     |    23 +
 .../propel/src/icons/actions/add-reaction-icon.tsx |    27 +
 .../propel/src/icons/actions/add-workitem-icon.tsx |    21 +
 packages/propel/src/icons/actions/check-icon.tsx   |    19 +
 packages/propel/src/icons/actions/close-icon.tsx   |    21 +
 packages/propel/src/icons/actions/copy-icon.tsx    |    19 +
 packages/propel/src/icons/actions/copy-link.tsx    |    19 +
 packages/propel/src/icons/actions/edit-icon.tsx    |    22 +
 .../src/icons/actions/filter-applied-icon.tsx      |    27 +
 packages/propel/src/icons/actions/filter-icon.tsx  |    23 +
 packages/propel/src/icons/actions/globe-icon.tsx   |    22 +
 packages/propel/src/icons/actions/index.ts         |    26 +
 packages/propel/src/icons/actions/link-icon.tsx    |    19 +
 packages/propel/src/icons/actions/lock-icon.tsx    |    19 +
 packages/propel/src/icons/actions/new-tab-icon.tsx |    19 +
 packages/propel/src/icons/actions/plus-icon.tsx    |    19 +
 .../propel/src/icons/actions/preferences-icon.tsx  |    21 +
 packages/propel/src/icons/actions/search-icon.tsx  |    21 +
 packages/propel/src/icons/actions/trash-icon.tsx   |    19 +
 packages/propel/src/icons/actions/upgrade-icon.tsx |    21 +
 packages/propel/src/icons/activity-icon.tsx        |    36 +
 packages/propel/src/icons/ai-icon.tsx              |    38 +
 packages/propel/src/icons/arrows/chevron-down.tsx  |    21 +
 packages/propel/src/icons/arrows/chevron-left.tsx  |    21 +
 packages/propel/src/icons/arrows/chevron-right.tsx |    21 +
 packages/propel/src/icons/arrows/chevron-up.tsx    |    21 +
 packages/propel/src/icons/arrows/index.ts          |    11 +
 packages/propel/src/icons/arrows/reply-icon.tsx    |    19 +
 packages/propel/src/icons/at-risk-icon.tsx         |    29 +
 .../src/icons/attachments/audio-file-icon.tsx      |    21 +
 .../src/icons/attachments/code-file-icon.tsx       |    21 +
 .../src/icons/attachments/document-file-icon.tsx   |    21 +
 .../src/icons/attachments/image-file-icon.tsx      |    21 +
 packages/propel/src/icons/attachments/index.ts     |    11 +
 .../src/icons/attachments/video-file-icon.tsx      |    21 +
 packages/propel/src/icons/bar-icon.tsx             |    28 +
 packages/propel/src/icons/blocked-icon.tsx         |    34 +
 packages/propel/src/icons/blocker-icon.tsx         |    34 +
 packages/propel/src/icons/brand/accenture-logo.tsx |    31 +
 packages/propel/src/icons/brand/dolby-logo.tsx     |    48 +
 packages/propel/src/icons/brand/index.ts           |    13 +
 packages/propel/src/icons/brand/plane-lockup.tsx   |    51 +
 packages/propel/src/icons/brand/plane-logo.tsx     |    27 +
 packages/propel/src/icons/brand/plane-wordmark.tsx |    40 +
 packages/propel/src/icons/brand/sony-logo.tsx      |    27 +
 packages/propel/src/icons/brand/zerodha-logo.tsx   |    33 +
 packages/propel/src/icons/calendar-after-icon.tsx  |    27 +
 packages/propel/src/icons/calendar-before-icon.tsx |    38 +
 packages/propel/src/icons/center-panel-icon.tsx    |    38 +
 packages/propel/src/icons/comment-fill-icon.tsx    |    22 +
 packages/propel/src/icons/constants.tsx            |   100 +
 packages/propel/src/icons/create-icon.tsx          |    30 +
 .../src/icons/cycle/circle-dot-full-icon.tsx       |    24 +
 packages/propel/src/icons/cycle/contrast-icon.tsx  |    34 +
 .../propel/src/icons/cycle/cycle-group-icon.tsx    |    39 +
 .../propel/src/icons/cycle/double-circle-icon.tsx  |    25 +
 packages/propel/src/icons/cycle/helper.tsx         |    33 +
 packages/propel/src/icons/cycle/index.ts           |    11 +
 packages/propel/src/icons/default-icon.tsx         |    18 +
 packages/propel/src/icons/dice-icon.tsx            |    52 +
 packages/propel/src/icons/display-properties.tsx   |    22 +
 packages/propel/src/icons/done-icon.tsx            |    30 +
 packages/propel/src/icons/dropdown-icon.tsx        |    23 +
 packages/propel/src/icons/favorite-folder-icon.tsx |    38 +
 .../propel/src/icons/full-screen-panel-icon.tsx    |    34 +
 packages/propel/src/icons/github-icon.tsx          |    36 +
 packages/propel/src/icons/gitlab-icon.tsx          |    36 +
 packages/propel/src/icons/helpers.ts               |    36 +
 packages/propel/src/icons/icon-wrapper.tsx         |    50 +
 packages/propel/src/icons/icon.tsx                 |    20 +
 packages/propel/src/icons/icons.stories.tsx        |   226 +
 packages/propel/src/icons/in-progress-icon.tsx     |    25 +
 packages/propel/src/icons/index.ts                 |    73 +
 packages/propel/src/icons/info-fill-icon.tsx       |    22 +
 packages/propel/src/icons/intake.tsx               |    30 +
 packages/propel/src/icons/layer-stack.tsx          |    38 +
 packages/propel/src/icons/layers-icon.tsx          |    45 +
 packages/propel/src/icons/layouts/board-icon.tsx   |    21 +
 .../propel/src/icons/layouts/calendar-icon.tsx     |    21 +
 packages/propel/src/icons/layouts/card-icon.tsx    |    21 +
 packages/propel/src/icons/layouts/grid-icon.tsx    |    21 +
 packages/propel/src/icons/layouts/index.ts         |    13 +
 packages/propel/src/icons/layouts/list-icon.tsx    |    21 +
 packages/propel/src/icons/layouts/sheet-icon.tsx   |    21 +
 .../propel/src/icons/layouts/timeline-icon.tsx     |    21 +
 packages/propel/src/icons/lead-icon.tsx            |    34 +
 .../src/icons/misc/check-circle-filled-icon.tsx    |    25 +
 .../src/icons/misc/close-circle-filled-icon.tsx    |    25 +
 packages/propel/src/icons/misc/index.ts            |     9 +
 packages/propel/src/icons/misc/info-icon.tsx       |    23 +
 packages/propel/src/icons/module/backlog.tsx       |    42 +
 packages/propel/src/icons/module/cancelled.tsx     |    34 +
 packages/propel/src/icons/module/completed.tsx     |    27 +
 packages/propel/src/icons/module/in-progress.tsx   |    46 +
 packages/propel/src/icons/module/index.ts          |    13 +
 .../propel/src/icons/module/module-status-icon.tsx |    33 +
 packages/propel/src/icons/module/paused.tsx        |    34 +
 packages/propel/src/icons/module/planned.tsx       |    27 +
 packages/propel/src/icons/monospace-icon.tsx       |    24 +
 packages/propel/src/icons/multiple-sticky.tsx      |    36 +
 packages/propel/src/icons/off-track-icon.tsx       |    29 +
 packages/propel/src/icons/on-track-icon.tsx        |    50 +
 packages/propel/src/icons/overview-icon.tsx        |    22 +
 packages/propel/src/icons/pending-icon.tsx         |    35 +
 packages/propel/src/icons/photo-filter-icon.tsx    |    40 +
 packages/propel/src/icons/planned-icon.tsx         |    48 +
 packages/propel/src/icons/priority-icon.tsx        |    84 +
 packages/propel/src/icons/project/cycle-icon.tsx   |    27 +
 packages/propel/src/icons/project/epic-icon.tsx    |    21 +
 packages/propel/src/icons/project/index.ts         |    13 +
 packages/propel/src/icons/project/intake-icon.tsx  |    23 +
 packages/propel/src/icons/project/module-icon.tsx  |    37 +
 packages/propel/src/icons/project/page-icon.tsx    |    21 +
 packages/propel/src/icons/project/view-icon.tsx    |    23 +
 .../propel/src/icons/project/work-items-icon.tsx   |    21 +
 .../propel/src/icons/properties/boolean-icon.tsx   |    21 +
 .../src/icons/properties/comment-reply-icon.tsx    |    21 +
 .../propel/src/icons/properties/dropdown-icon.tsx  |    23 +
 .../propel/src/icons/properties/due-date-icon.tsx  |    21 +
 .../propel/src/icons/properties/duplicate-icon.tsx |    23 +
 .../propel/src/icons/properties/estimate-icon.tsx  |    21 +
 packages/propel/src/icons/properties/hash-icon.tsx |    21 +
 packages/propel/src/icons/properties/index.ts      |    28 +
 .../src/icons/properties/label-filled-icon.tsx     |    23 +
 .../propel/src/icons/properties/label-icon.tsx     |    27 +
 .../propel/src/icons/properties/members-icon.tsx   |    21 +
 .../src/icons/properties/overdue-date-icon.tsx     |    21 +
 .../propel/src/icons/properties/parent-icon.tsx    |    29 +
 .../propel/src/icons/properties/priority-icon.tsx  |    21 +
 .../src/icons/properties/relates-to-icon.tsx       |    21 +
 .../propel/src/icons/properties/relation-icon.tsx  |    21 +
 .../propel/src/icons/properties/scope-icon.tsx     |    23 +
 .../src/icons/properties/start-date-icon.tsx       |    21 +
 .../propel/src/icons/properties/state-icon.tsx     |    23 +
 .../src/icons/properties/user-circle-icon.tsx      |    23 +
 packages/propel/src/icons/properties/user-icon.tsx |    21 +
 .../src/icons/properties/user-square-icon.tsx      |    23 +
 .../propel/src/icons/properties/workflows-icon.tsx |    29 +
 packages/propel/src/icons/registry.ts              |   182 +
 packages/propel/src/icons/related-icon.tsx         |    34 +
 packages/propel/src/icons/sans-serif-icon.tsx      |    24 +
 packages/propel/src/icons/serif-icon.tsx           |    24 +
 packages/propel/src/icons/set-as-default-icon.tsx  |    29 +
 packages/propel/src/icons/side-panel-icon.tsx      |    34 +
 .../propel/src/icons/state/backlog-group-icon.tsx  |    28 +
 .../src/icons/state/cancelled-group-icon.tsx       |    35 +
 .../src/icons/state/completed-group-icon.tsx       |    35 +
 packages/propel/src/icons/state/dashed-circle.tsx  |    46 +
 packages/propel/src/icons/state/helper.tsx         |    48 +
 packages/propel/src/icons/state/index.ts           |    13 +
 .../src/icons/state/intake-state-group-icon.tsx    |    32 +
 .../propel/src/icons/state/progress-circle.tsx     |    33 +
 .../propel/src/icons/state/started-group-icon.tsx  |    71 +
 .../propel/src/icons/state/state-group-icon.tsx    |    44 +
 .../propel/src/icons/state/triage-group-icon.tsx   |    48 +
 .../src/icons/state/unstarted-group-icon.tsx       |    57 +
 packages/propel/src/icons/sticky-note-icon.tsx     |    44 +
 packages/propel/src/icons/sub-brand/index.ts       |     9 +
 packages/propel/src/icons/sub-brand/pi-chat.tsx    |    23 +
 packages/propel/src/icons/sub-brand/plane-icon.tsx |    25 +
 packages/propel/src/icons/sub-brand/wiki-icon.tsx  |    21 +
 packages/propel/src/icons/suspended-user.tsx       |    40 +
 packages/propel/src/icons/teams.tsx                |    27 +
 packages/propel/src/icons/transfer-icon.tsx        |    23 +
 packages/propel/src/icons/tree-map-icon.tsx        |    24 +
 packages/propel/src/icons/type.ts                  |    10 +
 packages/propel/src/icons/updates-icon.tsx         |    31 +
 packages/propel/src/icons/user-activity-icon.tsx   |    29 +
 packages/propel/src/icons/workspace-icon.tsx       |    29 +
 .../propel/src/icons/workspace/analytics-icon.tsx  |    21 +
 .../propel/src/icons/workspace/archive-icon.tsx    |    21 +
 .../propel/src/icons/workspace/dashboard-icon.tsx  |    21 +
 packages/propel/src/icons/workspace/draft-icon.tsx |    21 +
 packages/propel/src/icons/workspace/home-icon.tsx  |    21 +
 packages/propel/src/icons/workspace/inbox-icon.tsx |    21 +
 packages/propel/src/icons/workspace/index.ts       |    15 +
 .../src/icons/workspace/multiple-sticky-icon.tsx   |    21 +
 .../propel/src/icons/workspace/project-icon.tsx    |    21 +
 .../propel/src/icons/workspace/your-work-icon.tsx  |    25 +
 packages/propel/src/input/index.ts                 |     7 +
 packages/propel/src/input/input.stories.tsx        |   159 +
 packages/propel/src/input/input.tsx                |    60 +
 packages/propel/src/menu/index.ts                  |     8 +
 packages/propel/src/menu/menu.stories.tsx          |   274 +
 packages/propel/src/menu/menu.tsx                  |   210 +
 packages/propel/src/menu/types.ts                  |    54 +
 packages/propel/src/pill/index.ts                  |     8 +
 packages/propel/src/pill/pill.stories.tsx          |   146 +
 packages/propel/src/pill/pill.tsx                  |   105 +
 packages/propel/src/popover/index.ts               |     7 +
 packages/propel/src/popover/popover.stories.tsx    |   320 +
 packages/propel/src/popover/root.tsx               |    84 +
 packages/propel/src/portal/constants.ts            |    34 +
 packages/propel/src/portal/index.ts                |    10 +
 packages/propel/src/portal/modal-portal.tsx        |   116 +
 packages/propel/src/portal/portal-wrapper.tsx      |    82 +
 packages/propel/src/portal/portal.stories.tsx      |   200 +
 packages/propel/src/portal/types.ts                |    38 +
 packages/propel/src/scrollarea/index.ts            |     7 +
 .../propel/src/scrollarea/scrollarea.stories.tsx   |   304 +
 packages/propel/src/scrollarea/scrollarea.tsx      |   107 +
 .../propel/src/separator/separator.stories.tsx     |    62 +
 packages/propel/src/separator/separator.tsx        |    38 +
 packages/propel/src/skeleton/index.ts              |     7 +
 packages/propel/src/skeleton/root.tsx              |    40 +
 packages/propel/src/skeleton/skeleton.stories.tsx  |   200 +
 .../src/spinners/circular-bar-spinner.stories.tsx  |   142 +
 .../propel/src/spinners/circular-bar-spinner.tsx   |    39 +
 .../src/spinners/circular-spinner.stories.tsx      |   142 +
 packages/propel/src/spinners/circular-spinner.tsx  |    41 +
 packages/propel/src/spinners/index.ts              |     8 +
 packages/propel/src/styles/react-day-picker.css    |   313 +
 packages/propel/src/switch/index.ts                |     7 +
 packages/propel/src/switch/root.tsx                |    65 +
 packages/propel/src/switch/switch.stories.tsx      |   247 +
 packages/propel/src/tab-navigation/index.ts        |     9 +
 .../src/tab-navigation/tab-navigation-item.tsx     |    39 +
 .../src/tab-navigation/tab-navigation-list.tsx     |    19 +
 .../src/tab-navigation/tab-navigation-types.ts     |    23 +
 .../src/tab-navigation/tab-navigation.stories.tsx  |   108 +
 packages/propel/src/table/core.tsx                 |    94 +
 packages/propel/src/table/index.ts                 |     7 +
 packages/propel/src/table/table.stories.tsx        |   382 +
 packages/propel/src/tabs/index.ts                  |     7 +
 packages/propel/src/tabs/tabs.stories.tsx          |   361 +
 packages/propel/src/tabs/tabs.tsx                  |   148 +
 packages/propel/src/toast/index.ts                 |     7 +
 packages/propel/src/toast/toast.stories.tsx        |   709 +
 packages/propel/src/toast/toast.tsx                |   323 +
 packages/propel/src/toolbar/index.ts               |    14 +
 packages/propel/src/toolbar/toolbar.stories.tsx    |   138 +
 packages/propel/src/toolbar/toolbar.tsx            |   180 +
 packages/propel/src/tooltip/index.ts               |     7 +
 packages/propel/src/tooltip/root.tsx               |    89 +
 packages/propel/src/tooltip/tooltip.stories.tsx    |   309 +
 packages/propel/src/utils/classname.tsx            |    69 +
 packages/propel/src/utils/index.ts                 |     8 +
 packages/propel/src/utils/placement.ts             |    53 +
 packages/propel/tsconfig.json                      |    10 +
 packages/propel/tsdown.config.ts                   |    53 +
 packages/services/.prettierignore                  |    10 +
 packages/services/package.json                     |    35 +
 packages/services/src/ai/ai.service.ts             |    74 +
 packages/services/src/ai/index.ts                  |     7 +
 packages/services/src/api.service.ts               |    96 +
 packages/services/src/auth/auth.service.ts         |   131 +
 packages/services/src/auth/index.ts                |     8 +
 packages/services/src/auth/sites-auth.service.ts   |    55 +
 .../services/src/cycle/cycle-analytics.service.ts  |    84 +
 .../services/src/cycle/cycle-archive.service.ts    |    89 +
 .../services/src/cycle/cycle-operations.service.ts |    76 +
 packages/services/src/cycle/cycle.service.ts       |   190 +
 packages/services/src/cycle/index.ts               |    11 +
 packages/services/src/cycle/sites-cycle.service.ts |    37 +
 .../services/src/dashboard/dashboard.service.ts    |    87 +
 packages/services/src/dashboard/index.ts           |     7 +
 .../services/src/developer/api-token.service.ts    |    70 +
 packages/services/src/developer/index.ts           |     8 +
 packages/services/src/developer/webhook.service.ts |   112 +
 packages/services/src/file/file-upload.service.ts  |    55 +
 packages/services/src/file/file.service.ts         |    89 +
 packages/services/src/file/helper.ts               |   133 +
 packages/services/src/file/index.ts                |    10 +
 packages/services/src/file/sites-file.service.ts   |   123 +
 packages/services/src/index.ts                     |    21 +
 packages/services/src/indexedDB.service.ts         |    68 +
 packages/services/src/instance/index.ts            |     7 +
 packages/services/src/instance/instance.service.ts |   144 +
 packages/services/src/intake/index.ts              |     8 +
 packages/services/src/intake/intake.service.ts     |    16 +
 packages/services/src/intake/issue.service.ts      |    26 +
 packages/services/src/issue/index.ts               |     7 +
 packages/services/src/issue/sites-issue.service.ts |   250 +
 packages/services/src/label/index.ts               |     7 +
 packages/services/src/label/sites-label.service.ts |    37 +
 packages/services/src/live.service.ts              |    14 +
 packages/services/src/module/index.ts              |    10 +
 packages/services/src/module/link.service.ts       |    89 +
 packages/services/src/module/module.service.ts     |   214 +
 packages/services/src/module/operations.service.ts |   148 +
 .../services/src/module/sites-module.service.ts    |    37 +
 packages/services/src/project/index.ts             |     8 +
 .../services/src/project/sites-publish.service.ts  |    52 +
 packages/services/src/project/view.service.ts      |    20 +
 packages/services/src/state/index.ts               |     7 +
 packages/services/src/state/sites-state.service.ts |    37 +
 packages/services/src/user/favorite.service.ts     |   100 +
 packages/services/src/user/index.ts                |     9 +
 packages/services/src/user/sites-member.service.ts |    37 +
 packages/services/src/user/user.service.ts         |    92 +
 packages/services/src/workspace/index.ts           |    12 +
 .../src/workspace/instance-workspace.service.ts    |    71 +
 .../services/src/workspace/invitation.service.ts   |   123 +
 packages/services/src/workspace/member.service.ts  |    98 +
 .../services/src/workspace/notification.service.ts |   143 +
 packages/services/src/workspace/view.service.ts    |    73 +
 .../services/src/workspace/workspace.service.ts    |   147 +
 packages/services/tsconfig.json                    |     9 +
 packages/services/tsdown.config.ts                 |     9 +
 packages/shared-state/.prettierignore              |    10 +
 packages/shared-state/package.json                 |    42 +
 packages/shared-state/src/index.ts                 |     8 +
 packages/shared-state/src/store/index.ts           |     8 +
 .../shared-state/src/store/rich-filters/adapter.ts |    38 +
 .../src/store/rich-filters/config-manager.ts       |   196 +
 .../shared-state/src/store/rich-filters/config.ts  |   202 +
 .../src/store/rich-filters/filter-helpers.ts       |   283 +
 .../shared-state/src/store/rich-filters/filter.ts  |   571 +
 .../shared-state/src/store/rich-filters/index.ts   |     8 +
 packages/shared-state/src/store/user.store.ts      |   142 +
 .../src/store/work-item-filters/adapter.ts         |   262 +
 .../src/store/work-item-filters/filter.store.ts    |   226 +
 .../src/store/work-item-filters/index.ts           |     9 +
 .../src/store/work-item-filters/shared.ts          |    14 +
 packages/shared-state/src/store/workspace.store.ts |    34 +
 packages/shared-state/src/utils/index.ts           |     8 +
 .../shared-state/src/utils/rich-filter.helper.ts   |    48 +
 .../src/utils/work-item-filters.helper.ts          |    38 +
 packages/shared-state/tsconfig.json                |    11 +
 packages/shared-state/tsdown.config.ts             |     9 +
 packages/tailwind-config/.prettierignore           |    10 +
 packages/tailwind-config/AGENTS.md                 |   667 +
 packages/tailwind-config/index.css                 |   241 +
 packages/tailwind-config/package.json              |    23 +
 packages/tailwind-config/postcss.config.js         |     6 +
 packages/types/.prettierignore                     |    10 +
 packages/types/package.json                        |    36 +
 packages/types/src/activity.ts                     |    36 +
 packages/types/src/ai.ts                           |    16 +
 packages/types/src/analytics.ts                    |    96 +
 packages/types/src/api_token.ts                    |    22 +
 packages/types/src/auth.ts                         |    37 +
 packages/types/src/base-layouts/base.ts            |   105 +
 packages/types/src/base-layouts/gantt/core.ts      |    12 +
 packages/types/src/base-layouts/gantt/extended.ts  |     7 +
 packages/types/src/base-layouts/gantt/index.ts     |    85 +
 packages/types/src/base-layouts/index.ts           |    10 +
 packages/types/src/base-layouts/kanban.ts          |    30 +
 packages/types/src/base-layouts/list.ts            |    26 +
 packages/types/src/calendar.ts                     |    35 +
 packages/types/src/charts/common.ts                |    18 +
 packages/types/src/charts/index.ts                 |   250 +
 packages/types/src/command-palette.ts              |    18 +
 packages/types/src/common.ts                       |    42 +
 packages/types/src/current-user/index.ts           |     7 +
 packages/types/src/current-user/profile.ts         |    36 +
 packages/types/src/cycle/cycle.ts                  |   158 +
 packages/types/src/cycle/cycle_filters.ts          |    30 +
 packages/types/src/cycle/index.ts                  |     8 +
 packages/types/src/dashboard.ts                    |   187 +
 packages/types/src/de-dupe.ts                      |    30 +
 packages/types/src/description_version.ts          |    35 +
 packages/types/src/editor/editor-content.ts        |    26 +
 packages/types/src/editor/index.ts                 |     7 +
 packages/types/src/enums.ts                        |    91 +
 packages/types/src/epics.ts                        |    22 +
 packages/types/src/estimate.ts                     |    90 +
 packages/types/src/favorite/favorite.ts            |    26 +
 packages/types/src/favorite/index.ts               |     7 +
 packages/types/src/file.ts                         |    47 +
 packages/types/src/home.ts                         |    83 +
 packages/types/src/importer/github-importer.ts     |    39 +
 packages/types/src/importer/index.ts               |    64 +
 packages/types/src/importer/jira-importer.ts       |    64 +
 packages/types/src/inbox.ts                        |   123 +
 packages/types/src/index.ts                        |    62 +
 packages/types/src/instance/ai.ts                  |     7 +
 packages/types/src/instance/auth-ee.ts             |     9 +
 packages/types/src/instance/auth.ts                |    86 +
 packages/types/src/instance/base.ts                |   102 +
 packages/types/src/instance/email.ts               |    15 +
 packages/types/src/instance/image.ts               |     7 +
 packages/types/src/instance/index.ts               |    13 +
 packages/types/src/instance/workspace.ts           |     7 +
 packages/types/src/intake/index.ts                 |     7 +
 packages/types/src/intake/state.ts                 |    19 +
 packages/types/src/integration.ts                  |    81 +
 packages/types/src/issues.ts                       |   161 +
 packages/types/src/issues/activity/base.ts         |    89 +
 .../types/src/issues/activity/issue_activity.ts    |    56 +
 .../types/src/issues/activity/issue_comment.ts     |   153 +
 .../src/issues/activity/issue_comment_reaction.ts  |    27 +
 packages/types/src/issues/base.ts                  |    42 +
 packages/types/src/issues/issue-identifier.ts      |    43 +
 packages/types/src/issues/issue-property-values.ts |     8 +
 packages/types/src/issues/issue.ts                 |   225 +
 packages/types/src/issues/issue_attachment.ts      |    33 +
 packages/types/src/issues/issue_link.ts            |    28 +
 packages/types/src/issues/issue_reaction.ts        |    33 +
 packages/types/src/issues/issue_relation.ts        |    17 +
 packages/types/src/issues/issue_sub_issues.ts      |    47 +
 packages/types/src/issues/issue_subscription.ts    |     5 +
 packages/types/src/layout/gantt.ts                 |    66 +
 packages/types/src/layout/index.ts                 |     7 +
 packages/types/src/module/index.ts                 |     8 +
 packages/types/src/module/module_filters.ts        |    44 +
 packages/types/src/module/modules.ts               |   124 +
 packages/types/src/navigation-preferences.ts       |    79 +
 packages/types/src/page/core.ts                    |    83 +
 packages/types/src/page/extended.ts                |     7 +
 packages/types/src/page/index.ts                   |     8 +
 packages/types/src/pagination.ts                   |    21 +
 packages/types/src/payment.ts                      |    48 +
 packages/types/src/pragmatic.ts                    |    35 +
 packages/types/src/project/activity.ts             |    27 +
 packages/types/src/project/index.ts                |    10 +
 packages/types/src/project/project_filters.ts      |    34 +
 packages/types/src/project/project_link.ts         |    28 +
 packages/types/src/project/projects.ts             |   178 +
 packages/types/src/publish.ts                      |    45 +
 packages/types/src/reaction.ts                     |    42 +
 packages/types/src/rich-filters/adapter.ts         |    29 +
 packages/types/src/rich-filters/builder.ts         |    35 +
 .../types/src/rich-filters/config/filter-config.ts |    26 +
 packages/types/src/rich-filters/config/index.ts    |     7 +
 packages/types/src/rich-filters/derived/core.ts    |    83 +
 .../types/src/rich-filters/derived/extended.ts     |    25 +
 packages/types/src/rich-filters/derived/index.ts   |    49 +
 packages/types/src/rich-filters/derived/shared.ts  |    15 +
 packages/types/src/rich-filters/expression.ts      |   116 +
 .../types/src/rich-filters/field-types/core.ts     |    85 +
 .../types/src/rich-filters/field-types/extended.ts |    19 +
 .../types/src/rich-filters/field-types/index.ts    |    35 +
 .../types/src/rich-filters/field-types/shared.ts   |    44 +
 packages/types/src/rich-filters/index.ts           |    14 +
 .../src/rich-filters/operator-configs/core.ts      |    32 +
 .../src/rich-filters/operator-configs/extended.ts  |    17 +
 .../src/rich-filters/operator-configs/index.ts     |    57 +
 packages/types/src/rich-filters/operators/core.ts  |    52 +
 .../types/src/rich-filters/operators/extended.ts   |    43 +
 packages/types/src/rich-filters/operators/index.ts |    72 +
 packages/types/src/search.ts                       |    84 +
 packages/types/src/settings.ts                     |    40 +
 packages/types/src/state.ts                        |    39 +
 packages/types/src/stickies.ts                     |    22 +
 packages/types/src/timezone.ts                     |    14 +
 packages/types/src/users.ts                        |   229 +
 packages/types/src/utils.ts                        |    15 +
 packages/types/src/view-props.ts                   |   273 +
 packages/types/src/views.ts                        |    74 +
 packages/types/src/waitlist.ts                     |     9 +
 packages/types/src/webhook.ts                      |    21 +
 packages/types/src/workspace-draft-issues/base.ts  |    69 +
 packages/types/src/workspace-notifications.ts      |   106 +
 packages/types/src/workspace-views.ts              |    43 +
 packages/types/src/workspace.ts                    |   268 +
 packages/types/tsconfig.json                       |     5 +
 packages/types/tsdown.config.ts                    |     8 +
 packages/typescript-config/.prettierignore         |    10 +
 packages/typescript-config/base.json               |    30 +
 packages/typescript-config/nextjs.json             |    12 +
 packages/typescript-config/node-library.json       |     8 +
 packages/typescript-config/package.json            |    12 +
 packages/typescript-config/react-library.json      |     8 +
 packages/typescript-config/react-router.json       |    17 +
 packages/ui/.prettierignore                        |    10 +
 packages/ui/.storybook/main.ts                     |    36 +
 packages/ui/.storybook/preview.ts                  |    20 +
 packages/ui/README.md                              |     1 +
 packages/ui/package.json                           |    76 +
 packages/ui/postcss.config.js                      |     3 +
 packages/ui/src/avatar/avatar-group.tsx            |    97 +
 packages/ui/src/avatar/avatar.stories.tsx          |    24 +
 packages/ui/src/avatar/avatar.tsx                  |   111 +
 packages/ui/src/avatar/helper.tsx                  |    70 +
 packages/ui/src/avatar/index.ts                    |     8 +
 .../ui/src/breadcrumbs/breadcrumbs.stories.tsx     |   104 +
 packages/ui/src/breadcrumbs/breadcrumbs.tsx        |   200 +
 packages/ui/src/breadcrumbs/index.ts               |     8 +
 .../src/breadcrumbs/navigation-search-dropdown.tsx |   111 +
 packages/ui/src/button/button.tsx                  |    52 +
 packages/ui/src/button/helper.tsx                  |   131 +
 packages/ui/src/card/card.tsx                      |    40 +
 packages/ui/src/card/helper.tsx                    |    41 +
 packages/ui/src/card/index.ts                      |     7 +
 packages/ui/src/collapsible/collapsible-button.tsx |    52 +
 packages/ui/src/collapsible/collapsible.tsx        |    63 +
 packages/ui/src/collapsible/index.ts               |     8 +
 .../ui/src/content-wrapper/content-wrapper.tsx     |    46 +
 packages/ui/src/content-wrapper/index.ts           |     7 +
 packages/ui/src/control-link/control-link.tsx      |    60 +
 packages/ui/src/control-link/index.ts              |     7 +
 packages/ui/src/drag-handle.tsx                    |    43 +
 packages/ui/src/drop-indicator.tsx                 |    29 +
 packages/ui/src/dropdown/Readme.md                 |    48 +
 packages/ui/src/dropdown/common/button.tsx         |    43 +
 packages/ui/src/dropdown/common/index.ts           |    10 +
 packages/ui/src/dropdown/common/input-search.tsx   |    66 +
 packages/ui/src/dropdown/common/loader.tsx         |    18 +
 packages/ui/src/dropdown/common/options.tsx        |   100 +
 packages/ui/src/dropdown/dropdown.d.ts             |   108 +
 packages/ui/src/dropdown/index.ts                  |     7 +
 packages/ui/src/dropdown/single-select.tsx         |   176 +
 packages/ui/src/dropdowns/combo-box.tsx            |    69 +
 packages/ui/src/dropdowns/context-menu/index.ts    |     8 +
 packages/ui/src/dropdowns/context-menu/item.tsx    |   249 +
 packages/ui/src/dropdowns/context-menu/root.tsx    |   243 +
 packages/ui/src/dropdowns/custom-menu.tsx          |   544 +
 packages/ui/src/dropdowns/custom-search-select.tsx |   232 +
 packages/ui/src/dropdowns/custom-select.tsx        |   191 +
 packages/ui/src/dropdowns/helper.tsx               |   127 +
 packages/ui/src/dropdowns/index.ts                 |    11 +
 packages/ui/src/favorite-star.tsx                  |    37 +
 packages/ui/src/form-fields/index.ts               |    10 +
 packages/ui/src/form-fields/input-color-picker.tsx |   111 +
 packages/ui/src/form-fields/input.tsx              |    59 +
 packages/ui/src/form-fields/password/helper.tsx    |    71 +
 packages/ui/src/form-fields/password/index.ts      |     8 +
 packages/ui/src/form-fields/password/indicator.tsx |    81 +
 .../ui/src/form-fields/password/password-input.tsx |    78 +
 packages/ui/src/form-fields/textarea.tsx           |    67 +
 packages/ui/src/header/header.tsx                  |    82 +
 packages/ui/src/header/helper.tsx                  |    32 +
 packages/ui/src/header/index.ts                    |     7 +
 packages/ui/src/hooks/use-auto-resize-textarea.ts  |    22 +
 packages/ui/src/hooks/use-dropdown-key-down.tsx    |    37 +
 packages/ui/src/hooks/use-dropdown-key-pressed.ts  |    42 +
 packages/ui/src/hooks/use-platform-os.ts           |    12 +
 packages/ui/src/index.ts                           |    30 +
 packages/ui/src/link/block.tsx                     |    75 +
 packages/ui/src/link/index.ts                      |     7 +
 packages/ui/src/loader.tsx                         |    38 +
 packages/ui/src/modals/alert-modal.tsx             |   104 +
 packages/ui/src/modals/constants.ts                |    23 +
 packages/ui/src/modals/index.ts                    |     9 +
 packages/ui/src/modals/modal-core.tsx              |    73 +
 packages/ui/src/oauth/index.ts                     |     7 +
 packages/ui/src/oauth/oauth-button.tsx             |    43 +
 packages/ui/src/oauth/oauth-options.tsx            |    65 +
 packages/ui/src/popovers/index.ts                  |     8 +
 packages/ui/src/popovers/popover-menu.stories.tsx  |    44 +
 packages/ui/src/popovers/popover-menu.tsx          |    51 +
 packages/ui/src/popovers/popover.stories.tsx       |    60 +
 packages/ui/src/popovers/popover.tsx               |    86 +
 packages/ui/src/popovers/types.ts                  |    37 +
 packages/ui/src/row/helper.tsx                     |    18 +
 packages/ui/src/row/index.ts                       |     7 +
 packages/ui/src/row/row.tsx                        |    32 +
 packages/ui/src/sortable/draggable.tsx             |    81 +
 packages/ui/src/sortable/index.ts                  |     7 +
 packages/ui/src/sortable/sortable.stories.tsx      |    38 +
 packages/ui/src/sortable/sortable.tsx              |   108 +
 packages/ui/src/spinners/circular-spinner.tsx      |    41 +
 packages/ui/src/spinners/index.ts                  |     7 +
 packages/ui/src/tables/index.ts                    |     7 +
 packages/ui/src/tables/table.stories.tsx           |    67 +
 packages/ui/src/tables/table.tsx                   |    54 +
 packages/ui/src/tables/types.ts                    |    26 +
 packages/ui/src/tag/helper.tsx                     |    30 +
 packages/ui/src/tag/index.ts                       |     7 +
 packages/ui/src/tag/tag.tsx                        |    32 +
 packages/ui/src/utils/classname.tsx                |     7 +
 packages/ui/src/utils/index.ts                     |     7 +
 packages/ui/styles/globals.css                     |     1 +
 packages/ui/tsconfig.json                          |    11 +
 packages/ui/tsdown.config.ts                       |     9 +
 packages/utils/.prettierignore                     |    10 +
 packages/utils/package.json                        |    59 +
 packages/utils/src/array.ts                        |   278 +
 packages/utils/src/attachment.ts                   |    38 +
 packages/utils/src/auth.ts                         |   369 +
 packages/utils/src/calendar.ts                     |    93 +
 packages/utils/src/color.ts                        |   305 +
 packages/utils/src/common.ts                       |   123 +
 packages/utils/src/cycle.ts                        |   245 +
 packages/utils/src/datetime.ts                     |   595 +
 packages/utils/src/distribution-update.ts          |   268 +
 packages/utils/src/editor/common.ts                |   106 +
 packages/utils/src/editor/index.ts                 |     8 +
 .../utils/src/editor/markdown-parser/common.ts     |    12 +
 .../markdown-parser/custom-components-handler.ts   |    53 +
 packages/utils/src/editor/markdown-parser/index.ts |     8 +
 .../src/editor/markdown-parser/marks-handler.ts    |    48 +
 packages/utils/src/editor/markdown-parser/root.ts  |   146 +
 packages/utils/src/editor/markdown-parser/types.ts |    22 +
 packages/utils/src/emoji.ts                        |    89 +
 packages/utils/src/estimates.ts                    |    40 +
 packages/utils/src/file.ts                         |    96 +
 packages/utils/src/filter.ts                       |    69 +
 packages/utils/src/get-icon-for-link.ts            |    70 +
 packages/utils/src/index.ts                        |    42 +
 packages/utils/src/intake.ts                       |    40 +
 packages/utils/src/loader.ts                       |    10 +
 packages/utils/src/math.ts                         |     8 +
 packages/utils/src/module.ts                       |    93 +
 packages/utils/src/notification.ts                 |    14 +
 packages/utils/src/page.ts                         |    98 +
 packages/utils/src/permission/index.ts             |     7 +
 packages/utils/src/permission/role.ts              |    32 +
 packages/utils/src/project-views.ts                |   110 +
 packages/utils/src/project.ts                      |   110 +
 .../src/rich-filters/factories/configs/core.ts     |   137 +
 .../src/rich-filters/factories/configs/index.ts    |     9 +
 .../factories/configs/properties/date.ts           |    35 +
 .../factories/configs/properties/index.ts          |     9 +
 .../factories/configs/properties/member-picker.ts  |    39 +
 .../factories/configs/properties/shared.ts         |   100 +
 .../src/rich-filters/factories/configs/shared.ts   |   102 +
 packages/utils/src/rich-filters/factories/index.ts |    10 +
 .../utils/src/rich-filters/factories/nodes/core.ts |    44 +
 packages/utils/src/rich-filters/index.ts           |    12 +
 .../src/rich-filters/operations/comparison.ts      |   174 +
 .../utils/src/rich-filters/operations/index.ts     |    10 +
 .../rich-filters/operations/manipulation/core.ts   |   130 +
 .../rich-filters/operations/transformation/core.ts |   184 +
 .../operations/transformation/shared.ts            |    25 +
 .../src/rich-filters/operations/traversal/core.ts  |   212 +
 .../rich-filters/operations/traversal/shared.ts    |    29 +
 packages/utils/src/rich-filters/operators/core.ts  |    48 +
 packages/utils/src/rich-filters/operators/index.ts |     8 +
 .../utils/src/rich-filters/operators/shared.ts     |    30 +
 packages/utils/src/rich-filters/types/core.ts      |    72 +
 packages/utils/src/rich-filters/types/index.ts     |     8 +
 packages/utils/src/rich-filters/types/shared.ts    |    41 +
 packages/utils/src/rich-filters/validators/core.ts |    58 +
 .../utils/src/rich-filters/validators/index.ts     |     8 +
 .../utils/src/rich-filters/validators/shared.ts    |    28 +
 packages/utils/src/rich-filters/values/core.ts     |    30 +
 packages/utils/src/rich-filters/values/index.ts    |     7 +
 packages/utils/src/router.ts                       |    14 +
 packages/utils/src/string.ts                       |   433 +
 packages/utils/src/subscription.ts                 |   105 +
 packages/utils/src/tab-indices.ts                  |    18 +
 packages/utils/src/theme-legacy.ts                 |    27 +
 packages/utils/src/theme/color-conversion.ts       |   176 +
 packages/utils/src/theme/color-validation.ts       |    97 +
 packages/utils/src/theme/constants.ts              |   157 +
 packages/utils/src/theme/index.ts                  |    67 +
 packages/utils/src/theme/palette-generator.ts      |   220 +
 packages/utils/src/theme/theme-application.ts      |   193 +
 packages/utils/src/theme/theme-inversion.ts        |    99 +
 packages/utils/src/tlds.ts                         |  1447 ++
 packages/utils/src/url.ts                          |   330 +
 packages/utils/src/validation.ts                   |   230 +
 .../src/work-item-filters/configs/filters/cycle.ts |    64 +
 .../src/work-item-filters/configs/filters/date.ts  |    85 +
 .../src/work-item-filters/configs/filters/index.ts |    14 +
 .../src/work-item-filters/configs/filters/label.ts |    64 +
 .../work-item-filters/configs/filters/module.ts    |    64 +
 .../work-item-filters/configs/filters/priority.ts  |    68 +
 .../work-item-filters/configs/filters/project.ts   |    35 +
 .../work-item-filters/configs/filters/shared.ts    |    63 +
 .../src/work-item-filters/configs/filters/state.ts |   121 +
 .../src/work-item-filters/configs/filters/user.ts  |   124 +
 .../utils/src/work-item-filters/configs/index.ts   |     7 +
 packages/utils/src/work-item-filters/index.ts      |     7 +
 packages/utils/src/work-item/base.ts               |   347 +
 packages/utils/src/work-item/index.ts              |     9 +
 packages/utils/src/work-item/modal.ts              |    53 +
 packages/utils/src/work-item/state.ts              |    56 +
 packages/utils/src/workspace.ts                    |    11 +
 packages/utils/tsconfig.json                       |    11 +
 packages/utils/tsdown.config.ts                    |     9 +
 patches/react-color@2.19.3.patch                   |    85 +
 pnpm-lock.yaml                                     | 17498 +++++++++++++++++++
 pnpm-workspace.yaml                                |   311 +
 setup.sh                                           |    97 +
 turbo.json                                         |    91 +
 4130 files changed, 430577 insertions(+)
## Full diff: pnpm-workspace.yaml (only hand-edited tracked file)
``diff
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
new file mode 100644
index 0000000..9e5e103
--- /dev/null
+++ b/pnpm-workspace.yaml
@@ -0,0 +1,311 @@
+packages:
+  - apps/*
+  - packages/*
+
+catalog:
+  "@atlaskit/pragmatic-drag-and-drop": "1.7.4"
+  "@atlaskit/pragmatic-drag-and-drop-auto-scroll": "1.4.0"
+  "@atlaskit/pragmatic-drag-and-drop-hitbox": "1.1.0"
+  "@base-ui-components/react": "1.0.0-beta.3"
+  "@bprogress/core": "^1.3.4"
+  "@chromatic-com/storybook": "5.2.1"
+  "@effect/platform": "^0.94.0"
+  "@effect/platform-node": "^0.104.0"
+  "@floating-ui/dom": "^1.7.1"
+  "@floating-ui/react": "^0.27.20"
+  "@fontsource-variable/inter": "5.2.8"
+  "@fontsource/ibm-plex-mono": "5.2.7"
+  "@fontsource/inter": "5.2.8"
+  "@fontsource/material-symbols-rounded": "5.2.30"
+  "@headlessui/react": "^2.2.10"
+  "@hocuspocus/extension-database": "2.15.2"
+  "@hocuspocus/extension-logger": "2.15.2"
+  "@hocuspocus/extension-redis": "2.15.2"
+  "@hocuspocus/provider": "2.15.2"
+  "@hocuspocus/server": "2.15.2"
+  "@hocuspocus/transformer": "2.15.2"
+  "@hypermod/utils": "^0.7.1"
+  "@makeplane/propel": "0.3.0"
+  "@popperjs/core": "^2.11.8"
+  "@radix-ui/react-scroll-area": "^1.2.3"
+  "@react-pdf/renderer": "^4.8.1"
+  "@react-pdf/types": "^2.13.1"
+  "@react-router/dev": "8.3.0"
+  "@react-router/node": "8.3.0"
+  "@react-router/serve": "8.3.0"
+  "@storybook/addon-designs": "11.1.3"
+  "@storybook/addon-docs": "10.4.6"
+  "@storybook/addon-links": "10.4.6"
+  "@storybook/addon-onboarding": "10.4.6"
+  "@storybook/addon-styling-webpack": "3.0.2"
+  "@storybook/addon-webpack5-compiler-swc": "4.0.3"
+  "@storybook/react": "10.4.6"
+  "@storybook/react-vite": "10.4.6"
+  "@storybook/react-webpack5": "10.4.6"
+  "@tailwindcss/postcss": "4.1.17"
+  "@tailwindcss/typography": "0.5.19"
+  "@tanstack/react-table": "^8.21.3"
+  "@tanstack/react-virtual": "^3.13.12"
+  "@tanstack/virtual-core": "^3.13.12"
+  "@tiptap/core": "^2.22.3"
+  "@tiptap/extension-blockquote": "^2.22.3"
+  "@tiptap/extension-character-count": "^2.22.3"
+  "@tiptap/extension-collaboration": "^2.22.3"
+  "@tiptap/extension-document": "^2.22.3"
+  "@tiptap/extension-emoji": "^2.22.3"
+  "@tiptap/extension-heading": "^2.22.3"
+  "@tiptap/extension-image": "^2.22.3"
+  "@tiptap/extension-list-item": "^2.22.3"
+  "@tiptap/extension-mention": "^2.22.3"
+  "@tiptap/extension-placeholder": "^2.22.3"
+  "@tiptap/extension-task-item": "^2.22.3"
+  "@tiptap/extension-task-list": "^2.22.3"
+  "@tiptap/extension-text": "^2.22.3"
+  "@tiptap/extension-text-align": "^2.22.3"
+  "@tiptap/extension-text-style": "^2.22.3"
+  "@tiptap/extension-underline": "^2.22.3"
+  "@tiptap/html": "^2.22.3"
+  "@tiptap/pm": "^2.22.3"
+  "@tiptap/react": "^2.22.3"
+  "@tiptap/starter-kit": "^2.22.3"
+  "@tiptap/suggestion": "^2.22.3"
+  "@types/chroma-js": "^3.1.2"
+  "@types/compression": "1.8.1"
+  "@types/cors": "^2.8.17"
+  "@types/express": "4.17.23"
+  "@types/express-ws": "^3.0.5"
+  "@types/hast": "^3.0.4"
+  "@types/jscodeshift": "^17.3.0"
+  "@types/lodash-es": "4.17.12"
+  "@types/mdast": "^4.0.4"
+  "@types/node": "22.12.0"
+  "@types/pdf-parse": "^1.1.5"
+  "@types/react": "19.2.17"
+  "@types/react-color": "^3.0.9"
+  "@types/react-dom": "19.2.3"
+  "@types/sanitize-html": "2.16.0"
+  "@types/ws": "^8.18.1"
+  "@vitest/coverage-v8": "^4.1.8"
+  "ast-types": "0.14.2"
+  "autoprefixer": "^10.4.19"
+  "axios": "1.18.1"
+  "buffer": "^6.0.3"
+  "chroma-js": "^3.2.0"
+  "class-variance-authority": "0.7.1"
+  "clsx": "^2.1.1"
+  "cmdk": "^1.1.1"
+  "comlink": "^4.4.1"
+  "compression": "1.8.1"
+  "cors": "^2.8.5"
+  "date-fns": "^4.1.0"
+  "dotenv": "16.4.7"
+  "effect": "3.20.0"
+  "emoji-picker-react": "^4.5.16"
+  "emoji-regex": "^10.3.0"
+  "export-to-csv": "^1.4.0"
+  "express": "4.22.0"
+  "express-winston": "^4.2.0"
+  "express-ws": "^5.0.2"
+  "file-type": "^21.3.1"
+  "framer-motion": "^12.23.0"
+  "frimousse": "^0.3.0"
+  "hast": "^1.0.0"
+  "hast-util-to-mdast": "^10.1.2"
+  "helmet": "^7.1.0"
+  "highlight.js": "^11.8.0"
+  "husky": "9.1.7"
+  "i18next": "25.10.9"
+  "i18next-icu": "2.4.3"
+  "i18next-resources-to-backend": "1.2.1"
+  "ioredis": "5.7.0"
+  "is-emoji-supported": "^0.0.5"
+  "isbot": "^5.1.31"
+  "jscodeshift": "^17.3.0"
+  "jsx-dom-cjs": "^8.0.3"
+  "linkifyjs": "^4.3.2"
+  "lint-staged": "16.2.7"
+  "lodash-es": "4.18.1"
+  "lowlight": "^3.0.0"
+  "lucide-react": "0.469.0"
+  "mdast": "^3.0.0"
+  "mobx": "6.12.0"
+  "mobx-react": "9.2.2"
+  "mobx-utils": "6.0.8"
+  "next-themes": "0.4.6"
+  "oxfmt": "0.35.0"
+  "oxlint": "1.51.0"
+  "pdf-parse": "^2.4.5"
+  "postcss": "8.5.25"
+  "postcss-cli": "^11.0.0"
+  "postcss-nested": "^6.0.1"
+  "prosemirror-codemark": "^0.4.2"
+  "react": "19.2.8"
+  "react-color": "^2.19.3"
+  "react-day-picker": "9.5.0"
+  "react-dom": "19.2.8"
+  "react-dropzone": "^14.2.3"
+  "react-fast-compare": "^3.2.2"
+  "react-hook-form": "^7.84.0"
+  "react-i18next": "16.6.6"
+  "react-is": "^19.2.8"
+  "react-markdown": "^10.1.0"
+  "react-masonry-component": "^6.3.0"
+  "react-pdf-html": "^2.1.2"
+  "react-popper": "^2.3.0"
+  "react-router": "8.3.0"
+  "recharts": "^2.15.4"
+  "reflect-metadata": "^0.2.2"
+  "rehype-parse": "^9.0.1"
+  "rehype-remark": "^10.0.1"
+  "remark-gfm": "^4.0.1"
+  "remark-stringify": "^11.0.0"
+  "sanitize-html": "2.17.7"
+  "serve": "14.2.5"
+  "sharp": "^0.35.3"
+  "smooth-scroll-into-view-if-needed": "^2.0.2"
+  "storybook": "10.4.6"
+  "swr": "2.4.2"
+  "tailwind-merge": "3.4.0"
+  "tailwindcss": "4.1.17"
+  "tippy.js": "^6.3.7"
+  "tiptap-markdown": "^0.8.10"
+  "tsdown": "0.16.0"
+  "tsx": "4.20.6"
+  "turbo": "2.10.11"
+  "typescript": "5.8.3"
+  "unified": "^11.0.5"
+  "use-font-face-observer": "^1.3.0"
+  "uuid": "14.0.0"
+  "vite": "8.0.16"
+  "vite-tsconfig-paths": "^5.1.4"
+  "vitest": "^4.1.8"
+  "winston": "^3.17.0"
+  "ws": "8.21.0"
+  "y-indexeddb": "^9.0.12"
+  "y-prosemirror": "^1.3.7"
+  "y-protocols": "^1.0.6"
+  "yjs": "^13.6.20"
+  "zod": "^3.25.76"
+
+overrides:
+  # Force a single React across the whole graph. With node-linker=isolated,
+  # auto-install-peers and resolution-mode=highest, a dependency still declaring a
+  # React 18 peer can otherwise pull in a second copy, which surfaces as an invalid
+  # hook call rather than as an install error. The vite `resolve.dedupe` entries only
+  # cover the three app client bundles, not the SSR build, the tsdown package builds
+  # or Storybook.
+  react: "catalog:"
+  react-dom: "catalog:"
+  react-is: "catalog:"
+  "@types/react": "catalog:"
+  "@types/react-dom": "catalog:"
+  express: "catalog:"
+  # @react-router/serve v8 needs Express 5 GÇö it mounts with the Express 5 path syntax
+  # `app.all("/{*splat}")`, which Express 4 silently fails to match, 404ing every route.
+  # The catalog stays on Express 4 for apps/live, which depends on express-ws (Express 4 only).
+  "@react-router/serve>express": "^5.2.1"
+  mdast-util-to-hast: 13.2.1
+  valibot: 1.4.2
+  glob: 11.1.0
+  # brace-expansion <5.0.9 has two DoS advisories (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895,
+  # the second bypasses the first's mitigation) reachable via serve>serve-handler>minimatch.
+  brace-expansion: 5.0.9
+  nanoid: 3.3.18
+  esbuild: 0.28.1
+  "@babel/core": 7.29.7
+  "@babel/helpers": 7.29.7
+  "@babel/runtime": 7.29.7
+  chokidar: 3.6.0
+  prosemirror-view: 1.40.0
+  "@types/express": 4.17.23
+  typescript: "catalog:"
+  vite: "catalog:"
+  qs: 6.15.2
+  diff: 5.2.2
+  webpack: 5.104.1
+  lodash-es: "catalog:"
+  lodash: 4.18.1
+  markdown-it: 14.2.0
+  rollup: 4.59.0
+  "minimatch@3": 3.1.4
+  "minimatch@10": 10.2.3
+  serialize-javascript: 7.0.5
+  "ajv@6": 6.14.0
+  "ajv@8": 8.18.0
+  "undici@7": 7.29.0
+  flatted: 3.4.2
+  picomatch: 2.3.2
+  "yaml@1": 1.10.3
+  "yaml@2": 2.8.3
+  # Pinned for Express 4 (apps/live), which needs path-to-regexp ~0.1.12.
+  path-to-regexp: 0.1.13
+  # Express 5's router needs path-to-regexp 8; the pin above would otherwise reach it
+  # and break route matching at startup with `pathRegexp.match is not a function`.
+  "router>path-to-regexp": "^8.4.2"
+  defu: 6.1.5
+  postcss: 8.5.25
+  "postcss-selector-parser@>=7.1.0 <7.1.3": "7.1.3"
+  axios: "catalog:"
+  follow-redirects: 1.16.0
+  uuid: "catalog:"
+  # SSRF / host-confusion in the URI parser (percent-decoding, IDN
+  # canonicalization and IPv6 normalization): CVE-2026-75899, -75931, -75975 and
+  # -76172, all fixed in 3.1.6. The previous floor pinned 3.1.5, which is the
+  # affected version. fast-uri reaches us only through ajv, so stay on the
+  # patched 3.x rather than 4.x, which is outside ajv's ^3.0.1 range.
+  fast-uri: 3.1.6
+  "js-yaml@4": 4.3.1
+  linkify-it: 5.0.2
+  body-parser: 1.20.6
+  tmp: 0.2.7
+  form-data: 4.0.6
+  "ws@8": 8.21.0
+  "ws@7": 7.5.11
+  "@opentelemetry/core": 2.8.0
+  "@opentelemetry/resources": 2.8.0
+  "@opentelemetry/sdk-trace-base": 2.8.0
+  morgan: 1.11.0
+  # Prototype pollution and unbounded query-cache growth, both reachable as DoS
+  # (CVE-2026-73088 / CVE-2026-73089). browserslist is build tooling only
+  # (babel/postcss/vite), but the runtime images copy node_modules wholesale, so
+  # it lands in the scanned surface.
+  browserslist: ">=4.28.7"
+  # CVE-2026-63376 (prototype-pollution -> arbitrary code execution in the TOML
+  # parser, fixed 4.1.2) and CVE-2026-77465 (DoS via uncontrolled recursion,
+  # fixed 4.2.0). toml reaches us only transitively and its parent's range
+  # already allows the fix -- the lockfile simply predates both. Hold below
+  # 5.0.0, which is outside that range.
+  toml: ">=4.2.0 <5"
+
+allowBuilds:
+  "@parcel/watcher": true
+  "@swc/core": true
+  esbuild: true
+  msgpackr-extract: true
+  turbo: true
+  sharp: false
+
+minimumReleaseAgeExclude:
+  - "@storybook/addon-docs@10.4.6"
+  - "@storybook/builder-vite@10.4.6"
+  - "@storybook/csf-plugin@10.4.6"
+  - "@storybook/react-dom-shim@10.4.6"
+  - "@storybook/react-vite@10.4.6"
+  - "@storybook/react@10.4.6"
+  - storybook@10.4.6
+  - "@makeplane/propel@0.3.0"
+
+patchedDependencies:
+  react-color@2.19.3: patches/react-color@2.19.3.patch
+
+peerDependencyRules:
+  allowedVersions:
+    # react-popper 2.3.0 is unmaintained and its peer range stops at React 18, but it
+    # only uses hooks GÇö no findDOMNode, no string refs, no element.ref reads and no
+    # defaultProps on function components GÇö so it runs unchanged on React 19. All 32
+    # call sites import usePopper only. Recorded here so the acceptance is explicit
+    # rather than hidden behind the global strict-peer-dependencies=false.
+    "react-popper>react": "19"
+    # Same situation: peer range predates React 19, uses nothing React 19 removed.
+    "react-masonry-component>react": "19"
+    "use-font-face-observer>react": "19"
``

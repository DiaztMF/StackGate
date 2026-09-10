import { Hono } from "hono";

const instanceApi = new Hono();

// Plane-compat shim (no {data} envelope): the web InstanceWrapper unwraps
// the response body directly as IInstanceInfo. Lets boot pass MaintenanceView
// without the Django backend. Only flags the replacement API supports are on.
instanceApi.get("/", (c) =>
  c.json({
    instance: {
      id: "stackgate",
      created_at: "2026-09-10T00:00:00.000Z",
      updated_at: "2026-09-10T00:00:00.000Z",
      instance_name: "StackGate",
      whitelist_emails: undefined,
      instance_id: "stackgate",
      license_key: undefined,
      current_version: "0.1.0",
      latest_version: "0.1.0",
      last_checked_at: undefined,
      namespace: undefined,
      is_telemetry_enabled: false,
      is_support_required: false,
      is_activated: true,
      is_setup_done: true,
      is_signup_screen_visited: true,
      user_count: undefined,
      is_verified: true,
      created_by: undefined,
      updated_by: undefined,
      workspaces_exist: true,
    },
    config: {
      enable_signup: false,
      is_workspace_creation_disabled: true,
      is_google_enabled: false,
      is_github_enabled: false,
      is_gitlab_enabled: false,
      is_gitea_enabled: false,
      is_magic_login_enabled: false,
      is_email_password_enabled: true,
      github_app_name: undefined,
      slack_client_id: undefined,
      has_unsplash_configured: false,
      has_llm_configured: false,
      file_size_limit: 5242880,
      is_smtp_configured: false,
      app_base_url: process.env.WEB_ORIGIN ?? undefined,
      space_base_url: undefined,
      admin_base_url: undefined,
      is_self_managed: true,
    },
  }),
);

export default instanceApi;

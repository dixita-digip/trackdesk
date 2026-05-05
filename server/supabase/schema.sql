-- Run this in Supabase: SQL Editor → New query → Run.
-- Uses RLS with no policies so only the service role (server) can access tables.

CREATE TABLE IF NOT EXISTS public.app_counters (
  id smallint PRIMARY KEY CHECK (id = 1),
  next_system_id integer NOT NULL DEFAULT 1,
  next_project_id integer NOT NULL DEFAULT 1,
  next_task_id integer NOT NULL DEFAULT 1,
  next_employee_id integer NOT NULL DEFAULT 1,
  next_notification_id integer NOT NULL DEFAULT 1,
  next_tracker_timer_id integer NOT NULL DEFAULT 1
);

INSERT INTO public.app_counters (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.systems (
  id integer PRIMARY KEY,
  name text NOT NULL,
  owner text NOT NULL,
  location text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  status_history jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.employees (
  id integer PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'Employee',
  assigned_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  hours text NOT NULL DEFAULT '0h 00m',
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  password_reset_required boolean NOT NULL DEFAULT false,
  updated_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_lower ON public.employees (lower(email));

CREATE TABLE IF NOT EXISTS public.projects (
  id integer PRIMARY KEY,
  name text NOT NULL,
  owner text NOT NULL,
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  start_date text NOT NULL DEFAULT '',
  end_date text NOT NULL DEFAULT '',
  total_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

CREATE UNIQUE INDEX IF NOT EXISTS projects_name_lower ON public.projects (lower(name));

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id integer NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  member_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, member_name)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id integer PRIMARY KEY,
  title text NOT NULL,
  project text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'backlog',
  description text NOT NULL DEFAULT '',
  assignee text,
  logged_hours double precision,
  logged_date text,
  deadline text,
  created_at timestamptz,
  active_timer jsonb,
  time_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_tracked_seconds double precision,
  attachments jsonb
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id bigint PRIMARY KEY,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  logged_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tracker_sessions (
  id bigint PRIMARY KEY,
  timer_id bigint,
  user_id text NOT NULL,
  user_name text NOT NULL,
  project_name text NOT NULL,
  task_id integer,
  task_title text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  source text NOT NULL DEFAULT 'desktop',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.active_tracker_timers (
  id integer PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  project_name text NOT NULL,
  task_id integer NOT NULL,
  task_title text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'desktop',
  started_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id integer PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

-- Desktop tracker screen captures (append-only; not part of persistFullState snapshot).
CREATE TABLE IF NOT EXISTS public.tracker_screen_captures (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  employee_id integer NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  display_index integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'image/png',
  image_base64 text,
  file_url text,
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tracker_screen_captures_image_chk CHECK (file_url IS NOT NULL OR image_base64 IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS tracker_screen_captures_employee_captured_idx
  ON public.tracker_screen_captures (employee_id, captured_at DESC);

ALTER TABLE public.app_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_tracker_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_screen_captures ENABLE ROW LEVEL SECURITY;
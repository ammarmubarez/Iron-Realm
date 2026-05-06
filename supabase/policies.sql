-- Iron Realm — Row-Level Security policies. Run AFTER schema.sql.
-- Idempotent: safe to re-run.

alter table public.profiles         enable row level security;
alter table public.friend_requests  enable row level security;
alter table public.friendships      enable row level security;


-- ── PROFILES ──────────────────────────────────────────────────────────────
-- Any authenticated user can read any profile (needed for username search
-- and for rendering friend cards). Only the owner can write their own row.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (auth.uid() = user_id);


-- ── FRIEND REQUESTS ───────────────────────────────────────────────────────
-- Sender or recipient can read. Only the sender can create. Only the
-- recipient can update status (accept/reject). Either party can delete
-- (cancel from sender's side, dismiss from recipient's).

drop policy if exists friend_requests_select on public.friend_requests;
create policy friend_requests_select on public.friend_requests
  for select to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists friend_requests_insert on public.friend_requests;
create policy friend_requests_insert on public.friend_requests
  for insert to authenticated
  with check (auth.uid() = from_user);

drop policy if exists friend_requests_update on public.friend_requests;
create policy friend_requests_update on public.friend_requests
  for update to authenticated
  using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

drop policy if exists friend_requests_delete on public.friend_requests;
create policy friend_requests_delete on public.friend_requests
  for delete to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);


-- ── FRIENDSHIPS ────────────────────────────────────────────────────────────
-- Members of a row can read it. Either side can delete (unfriend); the
-- mirror trigger removes the symmetric row. Inserts only happen via the
-- accept trigger (security definer), so no INSERT policy is needed.

drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships
  for select to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (auth.uid() = user_id);

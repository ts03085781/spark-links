-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.applications enable row level security;
alter table public.invitations enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users table policies
-- Users can read their own data and public profiles
create policy "Users can view own profile" on public.users
    for select using (auth.uid() = id);

create policy "Users can view public profiles" on public.users
    for select using (is_public = true);

-- Users can update their own profile
create policy "Users can update own profile" on public.users
    for update using (auth.uid() = id);

-- Users can insert their own profile (during registration)
create policy "Users can insert own profile" on public.users
    for insert with check (auth.uid() = id);

-- Projects table policies
-- Anyone can read public projects that are recruiting
create policy "Anyone can view public recruiting projects" on public.projects
    for select using (is_public = true and is_recruiting = true);

-- Project creators can view their own projects (even if private)
create policy "Creators can view own projects" on public.projects
    for select using (auth.uid() = creator_id);

-- Project members can view projects they're part of
create policy "Members can view their projects" on public.projects
    for select using (
        exists (
            select 1 from public.project_members
            where project_id = projects.id and user_id = auth.uid()
        )
    );

-- Users can create projects
create policy "Users can create projects" on public.projects
    for insert with check (auth.uid() = creator_id);

-- Project creators can update their projects
create policy "Creators can update own projects" on public.projects
    for update using (auth.uid() = creator_id);

-- Project creators can delete their projects
create policy "Creators can delete own projects" on public.projects
    for delete using (auth.uid() = creator_id);

-- Project members table policies
-- Project creators and members can view project members
create policy "Project creators and members can view members" on public.project_members
    for select using (
        exists (
            select 1 from public.projects
            where id = project_id and (creator_id = auth.uid() or 
                exists (
                    select 1 from public.project_members pm2
                    where pm2.project_id = project_id and pm2.user_id = auth.uid()
                ))
        )
    );

-- Project creators can add/remove members
create policy "Creators can manage members" on public.project_members
    for all using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );

-- System can add members (through triggers)
create policy "System can add members" on public.project_members
    for insert with check (true);

-- Applications table policies
-- Project creators can view applications to their projects
create policy "Creators can view applications to their projects" on public.applications
    for select using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );

-- Applicants can view their own applications
create policy "Applicants can view own applications" on public.applications
    for select using (auth.uid() = applicant_id);

-- Users can create applications
create policy "Users can create applications" on public.applications
    for insert with check (auth.uid() = applicant_id);

-- Project creators can update applications (accept/reject)
create policy "Creators can update applications" on public.applications
    for update using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );

-- Invitations table policies
-- Invitees can view invitations sent to them
create policy "Invitees can view their invitations" on public.invitations
    for select using (auth.uid() = invitee_id);

-- Inviters can view invitations they sent
create policy "Inviters can view sent invitations" on public.invitations
    for select using (auth.uid() = inviter_id);

-- Project creators can create invitations for their projects
create policy "Creators can create invitations" on public.invitations
    for insert with check (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        ) and auth.uid() = inviter_id
    );

-- Invitees can update invitations (accept/reject)
create policy "Invitees can respond to invitations" on public.invitations
    for update using (auth.uid() = invitee_id);

-- Conversations table policies
-- Participants can view conversations they're part of
create policy "Participants can view their conversations" on public.conversations
    for select using (auth.uid() = any(participants));

-- Users can create conversations if they're a participant
create policy "Users can create conversations they participate in" on public.conversations
    for insert with check (auth.uid() = any(participants));

-- Participants can update conversation metadata
create policy "Participants can update conversations" on public.conversations
    for update using (auth.uid() = any(participants));

-- Messages table policies
-- Conversation participants can view messages
create policy "Conversation participants can view messages" on public.messages
    for select using (
        exists (
            select 1 from public.conversations
            where id = conversation_id and auth.uid() = any(participants)
        )
    );

-- Users can send messages to conversations they're part of
create policy "Users can send messages to their conversations" on public.messages
    for insert with check (
        auth.uid() = sender_id and
        exists (
            select 1 from public.conversations
            where id = conversation_id and auth.uid() = any(participants)
        )
    );

-- Senders can update their own messages (mark as read, etc.)
create policy "Senders can update own messages" on public.messages
    for update using (auth.uid() = sender_id);

-- Recipients can update message read status
create policy "Recipients can mark messages as read" on public.messages
    for update using (
        exists (
            select 1 from public.conversations
            where id = conversation_id and auth.uid() = any(participants)
        )
    );

-- Create helper functions for RLS
create or replace function public.is_project_member(project_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.project_members
        where project_members.project_id = is_project_member.project_id
        and project_members.user_id = auth.uid()
    );
end;
$$ language plpgsql security definer;

create or replace function public.is_project_creator(project_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.projects
        where projects.id = is_project_creator.project_id
        and projects.creator_id = auth.uid()
    );
end;
$$ language plpgsql security definer;

create or replace function public.can_access_conversation(conversation_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.conversations
        where conversations.id = can_access_conversation.conversation_id
        and auth.uid() = any(conversations.participants)
    );
end;
$$ language plpgsql security definer;
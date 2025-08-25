-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type work_mode_type as enum ('fulltime', 'parttime');
create type location_preference_type as enum ('remote', 'specific_location');
create type project_stage_type as enum ('idea', 'prototype', 'beta', 'launched');
create type application_status_type as enum ('pending', 'accepted', 'rejected');

-- Users table (extends Supabase auth.users)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    name text not null,
    contact_info text,
    skills text[] default '{}',
    experience_description text default '',
    work_mode work_mode_type default 'fulltime',
    partner_description text default '',
    location_preference location_preference_type default 'remote',
    specific_location text,
    is_public boolean default false,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects table
create table public.projects (
    id uuid default uuid_generate_v4() primary key,
    creator_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    current_team_size integer default 1,
    target_team_size integer not null,
    required_roles text[] default '{}',
    required_skills text[] default '{}',
    project_stage project_stage_type default 'idea',
    is_recruiting boolean default true,
    is_public boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Project members table (many-to-many relationship)
create table public.project_members (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    role text not null default 'member',
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, user_id)
);

-- Applications table
create table public.applications (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    applicant_id uuid references public.users(id) on delete cascade not null,
    message text not null,
    status application_status_type default 'pending',
    response_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, applicant_id)
);

-- Invitations table
create table public.invitations (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    inviter_id uuid references public.users(id) on delete cascade not null,
    invitee_id uuid references public.users(id) on delete cascade not null,
    message text not null,
    status application_status_type default 'pending',
    response_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, invitee_id)
);

-- Conversations table
create table public.conversations (
    id uuid default uuid_generate_v4() primary key,
    participants uuid[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    sender_id uuid references public.users(id) on delete cascade not null,
    content text not null,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index users_email_idx on public.users(email);
create index users_is_public_idx on public.users(is_public);
create index users_skills_idx on public.users using gin(skills);
create index users_work_mode_idx on public.users(work_mode);
create index users_location_preference_idx on public.users(location_preference);

create index projects_creator_id_idx on public.projects(creator_id);
create index projects_is_public_idx on public.projects(is_public);
create index projects_is_recruiting_idx on public.projects(is_recruiting);
create index projects_required_skills_idx on public.projects using gin(required_skills);
create index projects_required_roles_idx on public.projects using gin(required_roles);
create index projects_project_stage_idx on public.projects(project_stage);

create index project_members_project_id_idx on public.project_members(project_id);
create index project_members_user_id_idx on public.project_members(user_id);

create index applications_project_id_idx on public.applications(project_id);
create index applications_applicant_id_idx on public.applications(applicant_id);
create index applications_status_idx on public.applications(status);

create index invitations_project_id_idx on public.invitations(project_id);
create index invitations_inviter_id_idx on public.invitations(inviter_id);
create index invitations_invitee_id_idx on public.invitations(invitee_id);
create index invitations_status_idx on public.invitations(status);

create index conversations_participants_idx on public.conversations using gin(participants);

create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_is_read_idx on public.messages(is_read);

-- Create triggers to automatically update updated_at columns
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.users
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.projects
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.applications
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.invitations
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.conversations
    for each row execute procedure public.handle_updated_at();

-- Function to automatically add project creator as team member
create or replace function public.add_creator_as_member()
returns trigger as $$
begin
    insert into public.project_members (project_id, user_id, role)
    values (new.id, new.creator_id, 'creator');
    return new;
end;
$$ language plpgsql;

create trigger add_creator_as_member after insert on public.projects
    for each row execute procedure public.add_creator_as_member();

-- Function to update project current_team_size
create or replace function public.update_project_team_size()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        update public.projects 
        set current_team_size = (
            select count(*) from public.project_members 
            where project_id = new.project_id
        )
        where id = new.project_id;
        return new;
    elsif TG_OP = 'DELETE' then
        update public.projects 
        set current_team_size = (
            select count(*) from public.project_members 
            where project_id = old.project_id
        )
        where id = old.project_id;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

create trigger update_project_team_size 
    after insert or delete on public.project_members
    for each row execute procedure public.update_project_team_size();
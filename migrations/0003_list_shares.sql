create table if not exists list_shares (
  id text primary key,
  owner_id text not null,
  recipient_id text not null,
  list_id text not null,
  payload jsonb not null,
  created_at bigint not null,
  unique (owner_id, recipient_id, list_id)
);

create table if not exists account_saves (
  user_id text primary key,
  payload jsonb not null,
  updated_at bigint not null
);

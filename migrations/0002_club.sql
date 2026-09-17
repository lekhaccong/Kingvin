-- Kim Lân club: virtual-coin wallets, ledger, shared game rounds, bets.

create table if not exists wallets (
  user_id    text primary key,
  balance    bigint not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallet_ledger (
  id              bigserial primary key,
  user_id         text not null,
  type            text not null,
  amount          bigint not null,
  balance_before  bigint not null,
  balance_after   bigint not null,
  game            text,
  round_id        bigint,
  reference_id    text not null,
  created_at      timestamptz not null default now()
);
create index if not exists wallet_ledger_user_idx on wallet_ledger (user_id, created_at desc);
create unique index if not exists wallet_ledger_ref_uniq on wallet_ledger (user_id, reference_id);

create table if not exists game_rounds (
  id          bigserial primary key,
  game        text not null,
  started_at  timestamptz not null default now(),
  bet_ms      int not null,
  lock_ms     int not null,
  result_ms   int not null,
  status      text not null default 'betting',
  payload     jsonb,
  settled     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists game_rounds_game_id_idx on game_rounds (game, id desc);
create unique index if not exists game_rounds_one_open_idx on game_rounds (game) where status <> 'closed';

create table if not exists bets (
  id          bigserial primary key,
  user_id     text not null,
  game        text not null,
  round_id    bigint not null,
  market      text not null,
  amount      bigint not null check (amount > 0),
  payout      bigint not null default 0,
  status      text not null default 'open',
  request_id  text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, round_id, market)
);
create index if not exists bets_round_idx on bets (round_id);
create index if not exists bets_user_idx on bets (user_id, created_at desc);
create unique index if not exists bets_request_uniq on bets (user_id, request_id);

create table if not exists daily_claims (
  user_id text not null,
  day     date not null,
  kind    text not null,
  amount  bigint not null,
  primary key (user_id, day, kind)
);

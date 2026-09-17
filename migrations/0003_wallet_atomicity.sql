-- Enforce one daily grant per user and calendar day, regardless of grant kind.
-- Older code keyed by (user, day, kind), which allowed both daily and relief.
delete from daily_claims older
using daily_claims newer
where older.user_id = newer.user_id
  and older.day = newer.day
  and older.kind < newer.kind;

create unique index if not exists daily_claims_user_day_uniq
  on daily_claims (user_id, day);

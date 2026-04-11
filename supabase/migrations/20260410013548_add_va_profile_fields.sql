alter table public.profiles
add column if not exists va_rating_level text null,
add column if not exists va_is_pt boolean null,
add column if not exists va_is_tdiu boolean null;

alter table public.profiles
drop constraint if exists profiles_va_rating_level_check;

alter table public.profiles
add constraint profiles_va_rating_level_check
check (
  va_rating_level is null
  or va_rating_level in ('below_100', 'one_hundred')
);

alter table public.profiles
drop constraint if exists profiles_va_pt_below_100_check;

alter table public.profiles
add constraint profiles_va_pt_below_100_check
check (
  not (
    va_rating_level = 'below_100'
    and va_is_pt is true
  )
);

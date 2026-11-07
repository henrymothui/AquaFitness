alter table public.class_types
  add column color text not null default '#0f766e'
  check (color ~ '^#[0-9A-Fa-f]{6}$');

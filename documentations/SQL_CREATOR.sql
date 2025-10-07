-- 0) Habilita extensão para geração de UUIDs (se necessário)
create extension if not exists "pgcrypto";

-- 1) TABELAS PRINCIPAIS

-- profiles: dados do usuário (perfil)
create table if not exists public.profiles (
  user_id uuid primary key, -- FK para auth.users.id
  full_name text,
  gender text,
  birthdate date,
  height_cm integer,
  weight_kg numeric,
  activity_level text,
  goal_weight numeric,
  preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- foods: base de alimentos/nutrientes (reuso entre usuários)
create table if not exists public.foods (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  source text, -- ex: 'openfoodfacts' / 'manual'
  calories_per_100g numeric,
  carbs_per_100g numeric,
  protein_per_100g numeric,
  fat_per_100g numeric,
  extra jsonb,
  created_at timestamptz default now()
);

-- meals: cabeçalho de uma refeição (dia do usuário)
create table if not exists public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  date date not null,
  name text,
  total_calories numeric default 0,
  created_at timestamptz default now()
);

-- meal_items: itens dentro de uma refeição (associa food com meal)
create table if not exists public.meal_items (
  id uuid default gen_random_uuid() primary key,
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id uuid references public.foods(id),
  description text, -- descricão custom (ex: 'arroz 1 concha')
  grams integer,
  calories numeric,
  created_at timestamptz default now()
);

-- diaries: resumo diário (agregação rápida por datas)
create table if not exists public.diaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  date date not null,
  total_calories numeric default 0,
  target_calories numeric,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- plans: planos gerados (cardápios, rotinas) salvos em JSON
create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null, -- 'cardapio' | 'treino' | ...
  content jsonb not null,
  created_at timestamptz default now()
);

-- user_quotas: controla quotas diárias por usuário
create table if not exists public.user_quotas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  quota_key text not null, -- 'llm' | 'image' | 'text'
  remaining integer not null default 0,
  reset_at timestamptz not null,
  unique(user_id, quota_key)
);

-- images: armazena referências a imagens enviadas (storage path)
create table if not exists public.images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  meal_id uuid references public.meals(id),
  storage_path text, -- caminho no Supabase Storage (bucket)
  status text default 'uploaded', -- uploaded | processing | done | failed
  detected_foods jsonb, -- resultado do classificador
  created_at timestamptz default now()
);

-- model_downloads: registros de modelos baixados/instalados pelo usuário (offline)
create table if not exists public.model_downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  model_id text not null,
  local_path text,
  installed_at timestamptz
);

-- 2) ÍNDICES importantes para performance (consultas por usuário e por data)
create index if not exists idx_meals_user_date on public.meals (user_id, date);
create index if not exists idx_meal_items_meal on public.meal_items (meal_id);
create index if not exists idx_diaries_user_date on public.diaries (user_id, date);
create index if not exists idx_images_user on public.images (user_id);

-- 3) TRIGGER: cria profile e quotas padrão ao registrar usuário no Auth
-- Função que será executada após insert em auth.users
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  default_llm integer := 20;
  default_image integer := 5;
  default_text integer := 40;
begin
  -- cria profile vazio vinculado ao auth user
  insert into public.profiles (user_id, full_name, created_at, updated_at)
    values (new.id, new.email, now(), now())
  on conflict (user_id) do nothing;

  -- cria quotas padrão
  insert into public.user_quotas (user_id, quota_key, remaining, reset_at)
    values
      (new.id, 'llm', default_llm, now() + interval '1 day'),
      (new.id, 'image', default_image, now() + interval '1 day'),
      (new.id, 'text', default_text, now() + interval '1 day')
  on conflict (user_id, quota_key) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- cria o trigger na tabela de usuários do Auth do Supabase (schema auth, tabela users)
-- Nota: dependendo do projeto Supabase, o esquema pode ser 'auth'. Este é o padrão.
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 4) HABILITAR RLS (Row Level Security) e exemplos de policies
-- É altamente recomendável habilitar RLS para tabelas com dados do usuário.
-- Abaixo habilitamos e aplicamos policies básicas para 'profiles' e 'meals'.
-- Você deve adaptar e criar políticas semelhantes para outras tabelas (meals, meal_items, diaries, images, plans, user_quotas).

-- Exemplo para profiles:
alter table public.profiles enable row level security;

-- permite que usuários autenticados leiam e escrevam apenas seu próprio profile
create policy "Profiles: access own profile" on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Meals
alter table public.meals enable row level security;

create policy "Meals: users can manage own meals" on public.meals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Meal items
alter table public.meal_items enable row level security;

create policy "MealItems: users can read/write items for their meals" on public.meal_items
  for all
  using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));

-- Diaries
alter table public.diaries enable row level security;
create policy "Diaries: users own diaries" on public.diaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User quotas (controle)
alter table public.user_quotas enable row level security;
create policy "UserQuotas: users see their quotas" on public.user_quotas
  for select using (auth.uid() = user_id);

-- Images
alter table public.images enable row level security;
create policy "Images: users manage own images" on public.images
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Plans
alter table public.plans enable row level security;
create policy "Plans: users manage own plans" on public.plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- model_downloads
alter table public.model_downloads enable row level security;
create policy "ModelDownloads: own models" on public.model_downloads
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) FUNÇÃO AUXILIAR (opcional): decrementar quota de forma atômica
-- Essa função pode ser chamada pela função edge (RPC) ou por uma Supabase Function para diminuir quotas
create or replace function public.consume_user_quota(p_user_id uuid, p_quota_key text, p_amount int)
returns boolean as $$
declare
  v_remaining int;
begin
  loop
    -- tenta bloquear a linha para leitura concorrente
    select remaining into v_remaining from public.user_quotas
      where user_id = p_user_id and quota_key = p_quota_key
      for update;

    if not found then
      return false; -- quota não existe
    end if;

    if v_remaining < p_amount then
      return false; -- sem saldo suficiente
    end if;

    -- decrementa
    update public.user_quotas
      set remaining = remaining - p_amount
      where user_id = p_user_id and quota_key = p_quota_key;

    return true;
  end loop;
end;
$$ language plpgsql security definer;

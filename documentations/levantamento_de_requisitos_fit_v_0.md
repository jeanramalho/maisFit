# Levantamento de Requisitos — **+Fit**

**Versão:** 0.2  
**Data:** 2025-10-06  
**Autor:** Equipe de Arquitetura / Engenharia

---

## 1. Visão do produto

+Fit é um aplicativo móvel profissional (React Native + Expo) para auxiliar pessoas no processo de emagrecimento. O produto é concebido como uma solução comercial, vendável e pronta para uso por clientes finais. O app ajuda o usuário a definir metas de peso, calcular necessidades calóricas, montar cardápios e rotinas de treino personalizados, e registrar histórico alimentar e de exercícios. A geração assistida por IA é oferecida de forma gratuita dentro de limites diários e existe opção opcional de modelo local para operação offline.

---

## 2. Objetivos

- Fornecer uma solução confiável e profissional para pessoas que desejam emagrecer e precisam de acompanhamento prático e personalizado.  
- Automatizar cálculo de metas calóricas e sugerir cardápios/rotinas de treino baseados no perfil e nos alimentos disponíveis.  
- Garantir operações gratuitas para o usuário final por meio de IA em cloud com cotas diárias e oferecer opção offline (download de modelo local) para uso sem internet.

---

## 3. Restrições e premissas

- **Posicionamento:** produto comercial e profissional — toda documentação e comunicação deve seguir esse tom e não referir fins de portfólio.  
- **Custo:** desenvolvimento sem custos pagos do desenvolvedor; uso de serviços com camadas gratuitas (ex.: Supabase).  
- **Tokens de usuário:** não serão usados tokens individuais para IA — uso centralizado via endpoints gratuitos com cotas.  
- **Plataforma:** iniciar com Expo Managed; opção de eject/EAS mais adiante para suportar IA on-device.  
- **Privacidade:** imagens e dados do usuário serão armazenados com segurança; políticas de privacidade e termos serão necessários.

---

## 4. Público-alvo / Personas

- **Pessoa em processo de emagrecimento:** adulto(a) que busca reduzir peso de forma saudável, precisa de orientações práticas para alimentação e exercícios, e prefere soluções simples e sem custo adicional.

---

## 5. MVP — Funcionalidades (priorizadas)

### Prioridade Alta (Core)
- Autenticação (email/senha) — Supabase Auth.  
- Perfil do usuário: nome, idade, sexo, peso, altura, nível de atividade, objetivos (meta de peso) e equipamentos disponíveis.  
- Cálculo de TMB (Mifflin-St Jeor) e sugestão de meta calórica com déficit ajustável.  
- Registro de refeições (manual) com pesquisa em base pública (Open Food Facts / tabela local).  
- Dashboard diário: calorias ingeridas, meta, déficit/superávit, e histórico básico.  
- Geração de cardápio e rotina de exercícios via IA (chamadas cloud gratuitas com limite por usuário/dia).  
- Upload de foto de refeição: reconhecimento sugerido + confirmação de porção pelo usuário.  
- Notificações locais (dicas diárias e lembretes).  
- Sistema de quotas diárias (ex.: 20 LLM calls/dia, 5 image calls/dia — valores iniciais configuráveis).

### Prioridade Média
- Rotinas de treino personalizadas (baseadas em objetivo e equipamento).  
- Gráficos e relatórios semanais/mensais.  
- Exportar plano/diário em PDF.

### Prioridade Baixa
- Integrações com wearables e redes sociais (futuro).

---

## 6. Requisitos funcionais (exemplos)

- RF001: Permitir registro e login por email e senha.  
- RF002: Permitir cadastro e edição do perfil com peso, altura, idade e nível de atividade.  
- RF003: Calcular TMB pela fórmula de Mifflin-St Jeor e sugerir meta diária de ingestão calórica com déficit.  
- RF004: Inserir refeições manualmente e atribuir calorias usando base de dados.  
- RF005: Enviar foto de refeição; sistema deve sugerir classificação e solicitar confirmação de porção.  
- RF006: Solicitar geração de cardápio ou rotina; cada solicitação deve consumir quota diária.

---

## 7. Requisitos não-funcionais

- RN001: Funcionar offline para dados locais já sincronizados; operações IA offline dependem do download do modelo.  
- RN002: Resposta aceitável das chamadas IA cloud (meta <= 5s para LLM simples).  
- RN003: Armazenamento seguro das credenciais (Supabase Auth) e dados do usuário.  
- RN004: Conformidade mínima com acessibilidade móvel (font scaling, contraste adequado).

---

## 8. Modelo de dados (alto nível)

Tabelas principais (Supabase/Postgres):

- `users` (id, email, created_at)
- `profiles` (user_id FK, name, gender, birthdate, height_cm, weight_kg, activity_level, goal_weight, preferences)
- `foods` (food_id, name, source, calories_per_100g, carbs, protein, fat)
- `meals` (id, user_id, date, name, total_calories)
- `meal_items` (id, meal_id FK, food_id FK, grams, calories)
- `diaries` (id, user_id, date, total_calories, target_calories)
- `plans` (id, user_id, type, content_json, created_at)
- `user_quotas` (user_id, quota_key, remaining, reset_at)
- `images` (id, user_id, meal_id (opcional), storage_path, status, detected_foods_json)
- `model_downloads` (user_id, model_id, local_path, installed_at)

> Observação: índices por `user_id` e `date` para consultas rápidas; projetar esquemas com boas práticas de normalização e desempenho.

---

## 9. Endpoints / Serviços (alto nível)

- `POST /auth/signup` (delegado ao Supabase Auth)
- `POST /auth/login` (Supabase Auth)
- `GET /profile`  
- `PUT /profile`  
- `GET /meals?date=`  
- `POST /meals`  
- `POST /meals/:id/items`  
- `POST /upload-image` (armazena em Supabase Storage)  
- `POST /classify-image` (chamada IA cloud ou local)  
- `POST /generate-plan` (consome quota)  
- `GET /quotas`  
- `POST /download-model` (registra/ordena download do modelo local)

---

## 10. Quotas e gerenciamento (proposta)

- **LLM (gerar plano):** 20 chamadas / usuário / dia (configurável).  
- **Classificação de imagem:** 5 chamadas / usuário / dia.  
- **Operações de texto rápido:** 40 ops / dia.

Implementação: tabela `user_quotas` no Supabase; verificações server-side antes de executar; campo `reset_at` controla reset diário.

---

## 11. Arquitetura técnica (resumo)

**Mobile (Expo + TypeScript, arquitetura MVVM)**
- Views: componentes e telas React Native (apresentação).  
- ViewModels: lógica de apresentação, comunicação com serviços, estado (preferência por hooks + Zustand ou context + hooks).  
- Services: clientes para Supabase, IA cloud, image-classifier, armazenamento local.  

**Backend (Supabase)**
- Auth, Postgres, Storage, Functions (edge) para operações críticas como gerenciamento de quotas.

**IA**
- Cloud: endpoints gratuitos (com cotas) para classificação e geração.  
- Offline: modelo local opcional (download) para execução on-device (requer build custom/EAS para integração nativa quando necessário).

---

## 12. Plano de Sprints (curto)

**Sprint 0 — Requisitos & Design** (completo)

**Sprint 1 — Infra & Autenticação**
- Inicializar repositório Expo + TypeScript.  
- Configurar Supabase (projeto) e criar tabelas essenciais (`users`, `profiles`, `user_quotas`).  
- Implementar tela de login/signup e perfil (Views + ViewModels).

**Sprint 2 — Refeições & Diário**
- CRUD de refeições e integração com base de alimentos.  
- Dashboard diário.

**Sprint 3 — IA Cloud & Fotos**
- Integração IA cloud com limites de quota e UX para confirmação de porções.  
- Upload e classificação de fotos.

**Sprint 4 — Offline & Release**
- Opção de download do modelo local (documentar necessidade de EAS/eject).  
- Polimento e geração de APK de release.

---

## 13. Riscos e mitigação

- **Mudança nas camadas gratuitas de provedores IA:** mitigar com caching, quotas rígidas e opção offline.  
- **Desempenho em dispositivos modestos para IA on-device:** tornar download opcional e oferecer modelos menores.  
- **Privacidade de imagens alimentares:** armazenar de forma segura e oferecer opções de exclusão de dados.

---

## 14. Critérios de aceite (MVP)

- Usuário consegue criar conta, cadastrar perfil e visualizar meta calórica.  
- Usuário registra refeições e visualiza dashboard com calorias e déficit.  
- Usuário solicita geração de cardápio ou rotina (consome quota) e recebe resposta válida da IA cloud ou local.

---

## 15. Próximos passos imediatos (entregáveis)

1. Criar repositório Expo + TypeScript com estrutura inicial.  
2. Criar projeto Supabase e provisionar tabelas básicas.  
3. Implementar autenticação e tela de perfil (Views + ViewModels).  
4. Implementar sistema de quotas no Supabase (função/trigger ou tabela + rotina).

---



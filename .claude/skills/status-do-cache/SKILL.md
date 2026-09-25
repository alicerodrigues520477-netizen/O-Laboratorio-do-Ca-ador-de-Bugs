---
name: status-do-cache
description: Mostra quanto tempo de cache (1 hora) resta em cada sessão recente do Claude Code da Alice. Use quando ela escrever "status do cache", "quanto cache resta", "cache timer" ou perguntar se uma sessão ainda está com o cache ativo.
---

# Status do cache (sob demanda)

Versão sob demanda do antigo Monitor de cache: roda só quando a Alice pede, sem
agendamentos e sem custo quando parada. O cache de cada sessão dura 1 hora
(plano Pro/Max) a partir da última atividade; depois disso, a próxima mensagem
relê a conversa inteira e gasta bem mais do limite.

## Passos

1. Chame `get_session` sem `session_id` para saber o ID desta sessão.
2. Chame `list_sessions` (servidor `Claude_Code_Remote`) com `mine: true` e
   `limit: 8`. Carregue a ferramenta com ToolSearch se ela não estiver disponível.
3. Ignore sessões com `session_status` `SESSION_STATUS_ARCHIVED`. Para cada
   uma das demais, calcule `restante = updated_at + 60 min − agora`:
   - `status_bucket` terminando em `WORKING` → **trabalhando** (cache sendo renovado);
   - `restante > 15 min` → 🟢;
   - `5 min < restante ≤ 15 min` → 🟡;
   - `0 < restante ≤ 5 min` → 🔴;
   - `restante ≤ 0` → ⚪ **expirado** (liste só as 3 mais recentes, para não poluir).
   A sessão atual acabou de ter atividade: marque-a como "(esta sessão)".
4. Responda em português, em uma tabela curta: título, estado, tempo restante
   (em minutos) e horário de expiração em Brasília (UTC-3). Ordene das que
   expiram primeiro para as últimas. Termine com uma linha de recomendação, por
   exemplo: `"CantAlice" expira em 4 min — mande uma mensagem agora se for continuar.`

## Regras

- Não agende nada (`send_later`, Routines, `loop`) e não mande mensagens para outras
  sessões: acordar uma sessão renova o cache dela e custa uso.
- `updated_at` é uma aproximação da última resposta do Claude; avise que a
  contagem pode errar por alguns minutos se alguma sessão estiver perto do limite.

# Monitor de cache (versão iPad)

Adaptação da extensão de Chrome "Claude Code Cache Timer" para funcionar sem computador.

A extensão lia o claude.ai no navegador para mostrar quanto tempo cada chat ainda tinha
de cache (1 hora nos planos Pro/Max) e avisava 5 minutos antes de expirar. No iPad não
há extensões de Chrome, então a mesma conta é feita na nuvem do Claude Code.

## Versão atual: sob demanda

Em qualquer sessão deste repositório, escreva **`status do cache`**. O Claude usa a
skill [`.claude/skills/status-do-cache`](../../.claude/skills/status-do-cache/SKILL.md)
para listar as sessões recentes com o tempo de cache restante e o horário de expiração.
Não há nada agendado: custa só a consulta, quando você pede.

## Versão automática (pausada)

A primeira versão era uma sessão "Monitor de cache" acordada de hora em hora (8h–22h)
por uma Routine, que mandava notificação push 5 min antes de cada cache expirar. Ela
funcionou, mas custou cerca de US$ 24 em uso no primeiro dia: cada ciclo relia o
histórico inteiro da sessão, que só crescia. Foi pausada; as regras que ela seguia
continuam em [`INSTRUCOES.md`](INSTRUCOES.md) como referência.

## Limitações

- `updated_at` é uma aproximação da última resposta do Claude; a contagem pode
  errar por alguns minutos.
- A skill só existe em sessões deste repositório. Em outro repositório, peça o mesmo
  com as suas palavras ("quanto cache resta nas minhas sessões?").

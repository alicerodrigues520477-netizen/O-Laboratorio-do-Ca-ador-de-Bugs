# Monitor de cache (versão iPad)

Adaptação da extensão de Chrome "Claude Code Cache Timer" para funcionar sem computador.

A extensão lia o claude.ai no navegador para mostrar quanto tempo cada chat ainda tinha
de cache (1 hora nos planos Pro/Max) e avisava 5 minutos antes de expirar. No iPad não
há extensões de Chrome, então a mesma lógica roda na nuvem do Claude Code:

- Uma sessão chamada **Monitor de cache** lê a última atividade (`updated_at`) de cada
  sessão sua e calcula o tempo restante, como o `core.js` da extensão fazia.
- 5 minutos antes de um cache expirar, ela manda uma **notificação push** para o app.
- Ela se agenda sozinha para o próximo aviso (`send_later`) e dorme quando nenhuma
  sessão está ativa.
- Uma **Routine** a acorda de hora em hora, todo dia das 8h às 22h (Brasília), para
  perceber sessões novas.

As regras que a sessão segue estão em [`INSTRUCOES.md`](INSTRUCOES.md).

## Comandos (escreva na sessão "Monitor de cache")

- `pausa o monitor`: desliga a Routine e cancela o aviso pendente.
- `liga o monitor`: religa.

## Limitações

- `updated_at` é uma aproximação da última resposta do Claude; a contagem pode
  errar por alguns minutos.
- Cada despertar do monitor gasta um pouco do seu limite de uso (uma mensagem curta).
- Se você estiver com o app aberto na própria sessão monitor, a notificação é
  omitida (você já está vendo a tela).

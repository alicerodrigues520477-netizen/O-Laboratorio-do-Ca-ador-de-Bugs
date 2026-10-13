# 📖 Alice's Library

Leitor gratuito de livros em inglês para iPad, com **páginas que viram**, **leitura em voz alta** com a frase destacada e **player de audiolivro**. Roda direto no Safari como app (PWA): sem App Store, sem conta, sem anúncios, sem servidor — os livros ficam só no seu iPad.

## Instalar no iPad

1. Abra o endereço do app no **Safari** do iPad:
   `https://alicerodrigues520477-netizen.github.io/O-Laboratorio-do-Ca-ador-de-Bugs/leitor-ipad/`
   (fica no ar depois que a branch for mesclada na `main`; o workflow `deploy-pages.yml` publica sozinho).
2. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**.
3. Abra pelo ícone. Depois da primeira vez ele funciona **offline**.

## Como usar

| Ação | Gesto |
|---|---|
| Virar página | arraste a página, ou toque nas bordas esquerda/direita |
| Mostrar/esconder controles | toque no centro |
| Ler em voz alta a partir de uma frase | toque duas vezes na frase |
| Ler em voz alta a partir da página atual | botão ▶ da barra inferior |
| Capítulos | botão ☰ |
| Tamanho, tema, fonte, voz, velocidade | botão **Aa** |
| Audiolivro (MP3/M4A/M4B) | botão 🎧 → anexar arquivo |

- **Paisagem** mostra duas páginas (livro aberto); **retrato** mostra uma.
- A posição de leitura e do áudio é salva automaticamente.
- Formatos de livro: **.epub** e **.txt** (inclusive os do Project Gutenberg).

## Onde achar livros e audiobooks grátis

- [Project Gutenberg](https://www.gutenberg.org) e [Standard Ebooks](https://standardebooks.org) — EPUB de domínio público.
- [LibriVox](https://librivox.org) e [Internet Archive](https://archive.org) — audiobooks em MP3.

## Voz mais natural (grátis)

Ajustes do iPad › Acessibilidade › Conteúdo Falado › Vozes › Inglês → baixe uma voz **Aprimorada** ou **Premium**. O app a usa automaticamente (marcada com ★ na lista de vozes).

## Limitações conhecidas

- A leitura em voz alta usa a voz do iPad e **pausa com a tela bloqueada** (limitação do iOS para apps web). Mantenha a tela acesa — o app pede ao iPad para não apagar. Já o **audiolivro em arquivo** continua tocando com a tela bloqueada.
- O áudio humano de um audiolivro **não sincroniza** com o texto (isso exigiria alinhamento palavra a palavra). Para ler e ouvir juntos, use o ▶ do app.
- EPUBs com imagens, tabelas ou layout fixo aparecem só como texto.

## Para desenvolver

Sem build: HTML/CSS/JS puros + [JSZip](https://stuk.github.io/jszip/) (em `lib/`) para abrir EPUB.

```bash
cd leitor-ipad && python3 -m http.server 8000   # abra http://localhost:8000
```

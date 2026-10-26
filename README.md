# Elza Vitória — Jardim Digital

Portfólio completo, com estética cozy green, navegação responsiva, cinco projetos, mochila, dia/noite, bosque interativo e surpresa dos gatos.

Inclui **Medica Doctor X — Power BI, em desenvolvimento**, e **Atlas Skills — hackathon colaborativo**, com as duas imagens enviadas para as capas.

## Publicar no GitHub Pages

1. Extraia o ZIP e abra a pasta `elza-portfolio-github`.
2. Crie um repositório no GitHub. Envie **o conteúdo** dessa pasta, inclusive `.github`, para o branch `main`. Não envie o ZIP nem uma pasta extra envolvendo os arquivos.
3. No repositório, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Abra **Actions → Publicar portfólio → Run workflow**, selecione `main` e confirme. Se uma primeira execução falhou antes de habilitar Pages, execute novamente agora.
5. Aguarde a conclusão. O endereço aparece em **Settings → Pages** e no resultado da execução.

O workflow já envia `dist/`; não precisa mudar caminhos, instalar pacotes ou configurar chaves. Se usar outro branch, ajuste `branches` em `.github/workflows/pages.yml`.

**Acesso:** o GitHub Pages normalmente publica um endereço acessível ao público. A proteção privada da hospedagem no ChatGPT não acompanha os arquivos. No plano GitHub Free, Pages exige repositório público; outros planos têm condições próprias.

## Executar no computador

Com Node.js 24 instalado, abra o terminal nesta pasta e execute:

```bash
npm start
```

Abra `http://127.0.0.1:3000`. Para encerrar, pressione `Ctrl+C`. Não é necessário `npm install`: o projeto não depende de pacotes npm externos.

Para executar os testes:

```bash
npm test
```

## Editar

| Arquivo | Conteúdo |
| --- | --- |
| `dist/index.html` | Textos, cartões, seções e navegação |
| `dist/projects.mjs` | Descrições e detalhes dos projetos |
| `dist/gallery.mjs` | Imagens e legendas da galeria |
| `dist/assets/` | Capas, fundos, fontes e favicon |
| `dist/*.css` | Estilos e temas |
| `.github/workflows/pages.yml` | Publicação automática |

Atualize os arquivos e faça um novo commit em `main` para publicar novamente. As imagens e fontes estão locais; os caminhos relativos atendem também a repositórios de projeto do GitHub Pages.

## Estrutura

- `dist/`: site pronto, sem etapa de compilação.
- `tests/`: testes de estado, regras, interações e geometria.
- `scripts/serve.mjs`: servidor de prévia local.
- `docs/CREDITOS.md`: fontes e licenças dos ativos.
- `docs/VALIDACAO.md`: escopo da conferência deste pacote.

O site é estático. E-mail abre o aplicativo do visitante; mochila e preferências usam armazenamento do navegador. Não há servidor de autenticação próprio. A prévia do Doctor X não é uma aplicação Power BI executada dentro deste site.

A configuração atual mantém `noindex, nofollow`. Para permitir indexação, altere essa meta em `dist/index.html` para `index, follow`. Essa meta não restringe acesso.

Documentação oficial de Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

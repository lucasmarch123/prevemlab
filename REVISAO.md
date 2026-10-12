# PREVEM LAB — versão para revisão

Implementação local em 09/10/2026. O site principal não foi publicado ou modificado no Netlify.

## Alterações

- Entrada com Enviar minha ideia, Regras e prazos e Assistir à experiência; acesso sem áudio e links diretos `/#inscricao` e `/#regras`.
- Apresentação original de 12 telas, cores, tipografia, partículas, vídeos, trilha e arte preservados. Caminhos de mídia corrigidos para os nomes reais, inclusive maiúsculas/minúsculas.
- Atalho de inscrição na apresentação, botão na central e retorno às regras sem apagar o formulário. Áreas inativas ficam fora da navegação por teclado.
- Datas de 13/10/2026 a 23/10/2026 às 23h59, com referência explícita a Brasília. A interface atualiza automaticamente antes, durante e depois do período. A última fração de segundo de 23h59 está incluída.
- Regulamento e desempate consolidados, preservando a distinção entre finalistas e premiados. Nenhum número interno de premiação foi inserido.
- Revelação individual pela central ou pela apresentação; botão para reproduzir novamente o vídeo. Conteúdo da premiação sem cortes nas duas resoluções de computador verificadas.
- Cinco perguntas com orientação e contadores. Nome do segundo integrante obrigatório somente em dupla; ao mudar para individual, esse campo não é enviado. A data usa Brasília.
- Envio com validação, prevenção de repetição durante processamento, retorno de erro sem apagar os campos e sucesso somente após resposta HTTP bem-sucedida. Confirmação informa que recebimento não implica aprovação ou premiação.

## Verificação local concluída

`node --test tests/campaign.test.mjs`: 4 testes aprovados, cobrindo fronteiras de datas, data em Brasília, validação de campos, nomes exatos das mídias e proteção de prazo no servidor com relógio simulado.

`tests/browser.cjs`: 9 cenários aprovados em Chromium, sem erros JavaScript. Abrange 1366 × 768, 1920 × 1080 e 390 × 844; atalhos, rolagem ao formulário, preservação do preenchimento, teclado, 12 slides, bloqueio da tela de suspense, reprodução dos dois vídeos, revelação e repetição, inscrição individual/dupla, erro, sucesso, clique repetido e limites temporais. Respostas HTTP de sucesso/erro da versão nova foram simuladas localmente, sem criar inscrições reais.

Capturas em `review/`: entrada, formulário e premiação nas três resoluções. As capturas de cenários abertos usam 15/10/2026 como data simulada; a captura `entrada-revisao.png` usa 09/10/2026.

## Netlify: evidência real

Foi usado o ambiente existente **prevemlabteste**, ainda com a versão anterior publicada. A detecção do formulário `prevem-lab-inscricao` está habilitada.

Em 09/10/2026, às 19h21 (Brasília), foi enviada uma inscrição em dupla com o título **TESTE QA CODEX 20261009 — RECEBIMENTO**. O registro apareceu em Verified submissions. Foram conferidos no painel: participante1, equipe, tipo, participante2, titulo, data, problema, solucao, usoIA, impacto, aplicacao e aceite. A inscrição fictícia foi mantida para auditoria, sem ser apagada ou marcada como spam.

Painel: https://app.netlify.com/projects/prevemlabteste/forms/6ac95af6f394f7000833eb85

Evidência: `review/netlify-recebimento.jpg`. Essa evidência comprova o recebimento da versão já publicada no ambiente de testes, não o deploy da versão nova. O teste anterior à abertura também confirma que a versão anterior não bloqueava o período no serviço.

## Proteção no recebimento e pendências

Foi adicionada a Edge Function `netlify/edge-functions/registration-window.js`, aplicada a todos os caminhos. Para POSTs do formulário da campanha, ela usa o relógio do servidor, recusa fora do período com HTTP 403 e valida os campos obrigatórios e limites antes de continuar. A mesma definição de datas é importada pela interface e pela função.

**A implantação e a integração dessa função com Netlify Forms ainda precisam ser verificadas em um deploy de revisão.** Os testes locais da função não comprovam a ordem efetiva de processamento do Forms na hospedagem. Antes de publicar a campanha, confirmar que POST direto é recusado fora do período, inclusive em caminhos alternativos, e que a inscrição dentro do período aparece no painel. Não basta verificar o botão desativado.

O painel da conta apresentou aviso de que deploys de produção e Agent Runners estão pausados por limite de créditos. Não alterei plano, cobrança, configurações ou hospedagem. Não fiz deploy de revisão ou produção.

A organização ainda precisa definir o procedimento para empate absoluto em todos os critérios. Nenhuma regra foi inventada. A data e as orientações da visita continuam a ser comunicadas pela organização. A regra de uma proposta por colaborador permanece no regulamento; não foi criado um mecanismo de identificação ou deduplicação de participantes.

## Como revisar e preparar publicação

1. Na pasta do projeto, executar `node tools/build.mjs`.
2. Executar `node tools/preview.cjs` e abrir http://127.0.0.1:8877/. A prévia local não recebe inscrições reais.
3. Para publicar, usar o projeto completo com `netlify.toml`, a função e o módulo de datas. O comando de build é `node tools/build.mjs`; a pasta publicada é `dist`.
4. **Arrastar somente `dist` no painel não implanta a Edge Function.** A pasta `dist` serve para revisão dos arquivos estáticos; a proteção no servidor depende do deploy completo por integração Git ou CLI com suporte à função.
5. Repetir o teste de recebimento e de prazo no deploy de revisão antes de promover a produção. Manter a detecção do formulário habilitada.

Os arquivos de revisão, testes e código de servidor não são copiados para `dist`. As mídias originais sem uso permanecem em `assets`, mas não são incluídas na saída de publicação.

Documentação consultada: https://docs.netlify.com/manage/forms/setup/ e https://docs.netlify.com/resources/troubleshooting/request-chain/ . A documentação geral de processamento não substitui a verificação específica da função junto ao Forms.

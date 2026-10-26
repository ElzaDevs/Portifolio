export const projects = Object.freeze({
  fluxo: {
    title: 'Fluxo Inteligente', category: '01 / FULL STACK · PROJETO DE PORTFÓLIO',
    summary: 'Um sistema web para conectar gestão financeira e triagem operacional.',
    problem: 'Uma organização precisa acompanhar receitas, despesas e indicadores, além de organizar solicitações com prioridade, SLA e rastreabilidade. O projeto simula esse cenário com FastAPI, interface web e persistência em banco de dados.',
    learning: ['Organização em apresentação, API, serviços, regras e persistência.', 'Lançamentos financeiros, importação CSV e visualização de indicadores.', 'Prioridades, SLA, encaminhamento e revisão humana nas solicitações.'],
    tags: ['Python', 'FastAPI', 'PostgreSQL'],
    status: 'Projeto de portfólio executável, conforme documentação do repositório. Não é apresentado como sistema contratado ou utilizado em produção.',
    repo: 'https://github.com/ElzaDevs/fluxo_inteligente',
    image: { src: 'assets/fluxo-capa.webp', alt: 'Capa conceitual do Fluxo Inteligente com caderno e fichas organizadas', width: 1672, height: 941, caption: 'Capa criada para este portfólio; não é uma captura do sistema.' },
  },
  lacrei: {
    title: 'Lacrei Saúde — Front-end', category: '02 / FRONT-END · DESAFIO TÉCNICO',
    summary: 'Uma interface acessível, responsiva e acolhedora para um desafio de desenvolvimento front-end.',
    problem: 'Uma plataforma de saúde precisa facilitar a navegação de diferentes pessoas. O desafio trabalha essa experiência com páginas de apresentação e ajuda, componentes reutilizáveis e recursos de acessibilidade.',
    learning: ['Componentização com React, Next.js e TypeScript.', 'Responsividade, foco visível e navegação por teclado.', 'Estilização modular e testes de componentes com Jest e Testing Library.'],
    tags: ['React', 'Next.js', 'TypeScript', 'Styled Components'],
    status: 'Desafio técnico de front-end, conforme README do repositório. Não apresentado como produto oficial em produção nem como vínculo de emprego.',
    repo: 'https://github.com/ElzaDevs/lacrei-saude-frontend',
    image: { src: 'assets/lacrei-logo.jpeg', alt: 'Símbolo da Lacrei Saúde presente no repositório do desafio', width: 133, height: 121, caption: 'Imagem utilizada no repositório do desafio técnico.' },
  },
  mentalist: {
    title: 'The Mentalist — CBI Selection', category: '03 / PYTHON · PROJETO ACADÊMICO',
    summary: 'Um exercício de votação com personagens de The Mentalist para praticar fundamentos de programação.',
    problem: 'Receber votos é só o começo: é preciso validar as entradas, contar as opções e apresentar percentuais e resultado. O tema conecta um exercício acadêmico a uma narrativa mais interessante.',
    learning: ['Validação de entradas e estruturas de repetição.', 'Contadores e tratamento de votos brancos e nulos.', 'Cálculo de percentuais e apresentação de resultados.'],
    tags: ['Python', 'Lógica de programação', 'Algoritmos'],
    status: 'Projeto acadêmico com código disponível no GitHub.',
    repo: 'https://github.com/ElzaDevs/The-Mentalist-CBI-Selection',
    image: { src: 'assets/mentalist-github.webp', alt: 'Capa de The Mentalist com Patrick Jane e elementos de investigação', width: 1672, height: 940, caption: 'Capa original publicada no repositório do projeto.' },
  },
  doctorx: {
    title: 'Medica Doctor X', category: '04 / DADOS & BI · EM DESENVOLVIMENTO',
    summary: 'Um projeto de Power BI em construção, com foco na apresentação visual dos dados.',
    problemTitle: 'O projeto',
    problem: 'Desenvolvimento de um painel em Power BI. A proposta está em construção; os indicadores, a fonte dos dados e a versão de demonstração ainda serão detalhados.',
    learningTitle: 'Próximos passos',
    learning: ['Desenvolver e refinar a apresentação visual do painel.', 'Detalhar os indicadores e documentar a fonte dos dados.', 'Disponibilizar o arquivo do projeto ou uma demonstração interativa.'],
    tags: ['Power BI', 'Visualização de dados', 'Em desenvolvimento'],
    status: 'Em desenvolvimento, conforme atualização da autora. Sem demonstração publicada ou resultados apresentados como concluídos.',
    repo: null,
    pendingLink: 'Arquivo do Power BI ou demonstração interativa ainda sem link confirmado.',
    image: { src: 'assets/doctorx-preview.png', alt: 'Prévia do Doctor X com tela de acesso e temática médica em fundo escuro', width: 704, height: 395, caption: 'Prévia visual enviada pela autora. Projeto de Power BI em desenvolvimento.' },
  },
  atlas: {
    title: 'Atlas Skills', category: '05 / HACKATHON · COLLAB',
    summary: 'Projeto colaborativo de hackathon que conecta perfis, competências e trilhas de aprendizagem com IA.',
    problemTitle: 'A proposta da equipe',
    problem: 'Reunir informações profissionais, cursos, competências e projetos para apoiar o acompanhamento da aprendizagem. A plataforma usa o perfil cadastrado para gerar trilhas personalizadas com Gemini, a partir de um catálogo de materiais.',
    learningTitle: 'Frentes do projeto em equipe',
    learning: ['Interface com React, TypeScript, Vite e Tailwind CSS.', 'Backend em Express/TypeScript, com a integração Gemini executada no servidor.', 'Geração de trilhas a partir do perfil e validação das referências no catálogo de materiais.'],
    tags: ['React', 'TypeScript', 'Express', 'Gemini'],
    status: 'Projeto colaborativo de hackathon. A solução e as tecnologias estão documentadas no repositório da equipe; não é apresentado como trabalho individual.',
    repo: 'https://github.com/EduardaAndrade16/Atlas-Skills',
    image: { src: 'assets/atlas-logo.png', alt: 'Logotipo Atlas Skills em branco e roxo sobre fundo escuro, com três quadrados ascendentes', width: 151, height: 117, caption: 'Identidade visual do Atlas Skills, enviada pela autora.' },
  },
});

export function matchesFilter(tags, filter) {
  return filter === 'all' || tags.split(/\s+/).includes(filter);
}

export function projectCountLabel(count) {
  return `${count} ${count === 1 ? 'projeto' : 'projetos'}`;
}

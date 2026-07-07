# Rastreador de Progresso Semanal - Psicólogo

Um rastreador de progresso interativo e adaptativo para ajudar psicólogos recém-formados a gerenciar sua rotina de transição profissional, com suporte a drag & drop, edição de tarefas e rastreamento inteligente de dias.

## 🎯 Características

- **Organização por dias da semana:** Visualize suas tarefas organizadas por dia
- **Drag & drop:** Mova tarefas entre dias facilmente
- **Edição de tarefas:** Adicione, edite ou delete tarefas conforme necessário
- **Rastreamento inteligente:** Marque tarefas como completas e registre em qual dia foram realmente feitas
- **Indicadores visuais:** Verde para tarefas feitas no dia correto, amarelo para ajustes
- **Progresso em tempo real:** Acompanhe sua porcentagem de conclusão semanal
- **Dados persistentes:** Tudo é salvo automaticamente no navegador

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Express.js (Node.js)
- **Build:** Vite
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS com paleta lápis-lazúli

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- pnpm (ou npm/yarn)

### Passos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/rastreador_progresso_psicologo.git
cd rastreador_progresso_psicologo

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev

# Acesse em http://localhost:5173
```

## 🚀 Deploy no Vercel

### Opção 1: Via CLI do Vercel

```bash
# Instale o CLI do Vercel
npm i -g vercel

# Faça deploy
vercel
```

### Opção 2: Via GitHub (Recomendado)

1. Faça push do código para seu repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Selecione seu repositório
5. Vercel detectará automaticamente a configuração
6. Clique em "Deploy"

### Variáveis de Ambiente (se necessário)

Se você adicionar variáveis de ambiente no futuro, adicione-as no painel do Vercel em:
**Settings → Environment Variables**

## 📁 Estrutura do Projeto

```
rastreador_progresso_psicologo/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, NotFound)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # React Contexts
│   │   ├── hooks/         # Custom Hooks
│   │   ├── lib/           # Utilitários
│   │   ├── App.tsx        # Componente raiz
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Estilos globais
│   ├── public/            # Arquivos estáticos
│   └── index.html         # HTML template
├── server/                # Backend Express
│   └── index.ts           # Servidor principal
├── shared/                # Código compartilhado
├── package.json           # Dependências
├── vite.config.ts         # Configuração Vite
├── tsconfig.json          # Configuração TypeScript
└── vercel.json            # Configuração Vercel
```

## 🎨 Design

A interface segue a identidade visual **Lápis-Lazúli** com:
- **Cores principais:** Azul escuro (#0F1C2E), Azul profundo (#1E3A6D), Dourado (#C8A75B)
- **Fundo:** Bege (#F5F1E8)
- **Tipografia:** Playfair Display (títulos) + Lato (corpo)

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
pnpm dev       # Inicia servidor de desenvolvimento
pnpm build     # Build para produção
pnpm start     # Inicia servidor de produção
pnpm preview   # Preview do build
pnpm check     # Verifica tipos TypeScript
pnpm format    # Formata código com Prettier
```

### Adicionar Novas Dependências

```bash
pnpm add nome-do-pacote
```

## 📝 Funcionalidades Futuras

- [ ] Notas reflexivas por dia
- [ ] Relatório semanal com insights
- [ ] Filtro por categoria de tarefas
- [ ] Sincronização com Google Calendar
- [ ] Autenticação de usuário
- [ ] Banco de dados para múltiplos usuários

## 🤝 Contribuindo

Este é um projeto pessoal, mas sinta-se livre para fazer fork e adaptá-lo para suas necessidades!

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ para psicólogos em transição profissional.

---

**Dúvidas ou sugestões?** Abra uma issue no GitHub!

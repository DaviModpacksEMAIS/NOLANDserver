# Island Survival — Servidor Multiplayer

Servidor WebSocket para o jogo Island Survival.  
Deploy gratuito no Railway em ~5 minutos.

---

## 🚀 Deploy no Railway (grátis)

### Passo 1 — Criar conta
Acesse https://railway.app e crie uma conta (pode usar GitHub).

### Passo 2 — Subir os arquivos do servidor
Você tem duas opções:

**Opção A — Via GitHub (recomendado):**
1. Crie um repositório no GitHub
2. Faça upload dos arquivos desta pasta (`server.js`, `package.json`, `railway.toml`)
3. No Railway: clique em **New Project → Deploy from GitHub repo**
4. Selecione o repositório

**Opção B — Via CLI:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Passo 3 — Pegar a URL do servidor
1. No Railway, abra seu projeto
2. Clique em **Settings → Networking → Generate Domain**
3. Você receberá uma URL tipo: `seu-app.up.railway.app`

### Passo 4 — Conectar no jogo
1. Abra o jogo no navegador
2. Pressione **ESC → MULTIPLAYER → aba ENTRAR**
3. Cole a URL do servidor: `wss://seu-app.up.railway.app`
4. Clique em **CONECTAR**

> Compartilhe essa mesma URL com seus amigos — todos conectam nela!

---

## 🔧 Testar localmente

```bash
npm install
npm start
```

Servidor rodará em `ws://localhost:3000`  
Para conectar localmente, use: `ws://localhost:3000`

---

## 📡 Como funciona

- O servidor gera um **seed único** ao iniciar
- Todo jogador que conecta recebe esse seed e gera **exatamente o mesmo mapa**
- Posições, HP e skin são sincronizados a cada 100ms
- Chat funciona em tempo real entre todos os jogadores
- Suporta 5–10 jogadores simultâneos confortavelmente

---

## 🌐 Alternativas ao Railway

| Plataforma | Free tier | Obs |
|---|---|---|
| **Render.com** | ✅ | Dorme após 15min inativo |
| **Fly.io** | ✅ | Requer cartão de crédito |
| **Glitch.com** | ✅ | Dorme após inatividade |
| **Railway** | ✅ $5/mês crédito | Recomendado |

Para Render.com, o processo é igual ao Railway — só muda o painel.

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// ── Persistência em arquivo JSON ──────────────────────────────────────────
const SAVES_FILE = path.join(__dirname, 'player_saves.json');

function loadSaves(){
  try{ return JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8')); }
  catch{ return {}; }
}
function writeSaves(saves){
  try{ fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2)); }
  catch(e){ console.error('[!] Erro ao salvar:', e.message); }
}

let playerSaves = loadSaves();
console.log(`[i] ${Object.keys(playerSaves).length} saves carregados de ${SAVES_FILE}`);

const PORT = process.env.PORT || 3000;

// ── Estado global do servidor ──────────────────────────────────────────────
const WORLD_SEED = Math.floor(Math.random() * 99999999);
const players = new Map(); // wsId -> playerData
let nextId = 1;

// ── HTTP server (Railway precisa de HTTP também) ───────────────────────────
const httpServer = http.createServer((req, res) => {
  if (req.url === '/seed') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ seed: WORLD_SEED }));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK - Island Survival Server\nPlayers: ' + players.size + '\nSeed: ' + WORLD_SEED);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Island Survival Multiplayer Server');
  }
});

// ── WebSocket server ───────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

function broadcast(data, excludeId = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client._playerId !== excludeId) {
      client.send(msg);
    }
  });
}

function broadcastPlayerList() {
  const list = Array.from(players.values()).map(p => ({
    id: p.id, name: p.name, island: p.island,
    x: p.x, y: p.y, hp: p.hp, mhp: p.mhp, skin: p.skin
  }));
  broadcast({ type: 'playerList', players: list });
}

wss.on('connection', (ws) => {
  const id = nextId++;
  ws._playerId = id;

  console.log(`[+] Jogador conectado: #${id} (total: ${wss.clients.size})`);

  // Envia seed e ID para o cliente recém-conectado
  ws.send(JSON.stringify({ type: 'welcome', id, seed: WORLD_SEED }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        // Jogador entrou com nome e skin
        players.set(id, {
          id, ws,
          name: (msg.name || 'Steve').slice(0, 20),
          skin: msg.skin || {},
          island: msg.island || 0,
          x: msg.x || 100, y: msg.y || 100,
          hp: msg.hp || 100, mhp: msg.mhp || 100,
        });
        console.log(`  → Join: ${players.get(id).name} (id=${id})`);

        // Envia lista de todos os jogadores atuais para o recém-chegado
        const existing = Array.from(players.values())
          .filter(p => p.id !== id)
          .map(p => ({ id: p.id, name: p.name, island: p.island, x: p.x, y: p.y, hp: p.hp, mhp: p.mhp, skin: p.skin }));
        ws.send(JSON.stringify({ type: 'existingPlayers', players: existing }));

        // Avisa os outros que alguém entrou
        broadcast({ type: 'playerJoined', id, name: players.get(id).name, island: msg.island, x: msg.x, y: msg.y, hp: msg.hp, mhp: msg.mhp, skin: msg.skin }, id);
        break;
      }

      case 'state': {
        // Update de posição/estado do jogador
        const p = players.get(id);
        if (!p) break;
        p.x = msg.x; p.y = msg.y;
        p.island = msg.island;
        p.hp = msg.hp; p.mhp = msg.mhp;
        if (msg.skin) p.skin = msg.skin;
        broadcast({ type: 'state', id, x: p.x, y: p.y, island: p.island, hp: p.hp, mhp: p.mhp, name: p.name, skin: p.skin }, id);
        break;
      }

      case 'chat': {
        const p = players.get(id);
        if (!p) break;
        const text = (msg.text || '').slice(0, 120);
        console.log(`  [chat] ${p.name}: ${text}`);
        // Retransmite para todos incluindo o remetente
        broadcast({ type: 'chat', name: p.name, text }, null);
        break;
      }
    }
  });

  ws.on('close', () => {
    const p = players.get(id);
    console.log(`[-] Jogador desconectado: ${p ? p.name : '#'+id} (total restante: ${wss.clients.size - 1})`);
    // Salva posição/estado ao desconectar se o jogador tinha dados
    if(p){
      const key = p.name.toLowerCase().replace(/\s+/g, '_');
      if(playerSaves[key]){
        // Atualiza posição e ilha do save existente
        playerSaves[key].x = p.x;
        playerSaves[key].y = p.y;
        playerSaves[key].island = p.island;
        playerSaves[key].hp = p.hp;
        playerSaves[key].savedAt = Date.now();
        writeSaves(playerSaves);
      }
    }
    players.delete(id);
    broadcast({ type: 'playerLeft', id });
  });

  ws.on('error', (err) => {
    console.error(`[!] Erro ws #${id}:`, err.message);
    players.delete(id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🟢 Island Survival Server rodando na porta ${PORT}`);
  console.log(`   Seed do mundo: ${WORLD_SEED}`);
  console.log(`   Acesse: http://localhost:${PORT}/health`);
});

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket) {
  clients.add(ws);
}

export function removeClient(ws: WebSocket) {
  clients.delete(ws);
}

export function broadcast(data: any) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  window.dispatchEvent(new CustomEvent(data.type, { detail: data }));
  for (const ws of clients) {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
      } catch {
        clients.delete(ws);
      }
    } else {
      clients.delete(ws);
    }
  }
}
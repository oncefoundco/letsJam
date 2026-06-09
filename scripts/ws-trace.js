/**
 * WebSocket frame tracer — for confirming Supabase Realtime is actually firing.
 *
 * This is a BROWSER init script, NOT a Node module (it touches `window`, so
 * `node scripts/ws-trace.js` will throw). It's meant to be injected into a page
 * BEFORE any script runs, so it can wrap `window.WebSocket` before the Supabase
 * realtime client opens its socket.
 *
 * Why this exists: Supabase Realtime delivers frames as BINARY (ArrayBuffer /
 * Blob), not strings, and its serializer prefixes a few framing bytes before the
 * readable `topic / event / payload`. A naive `typeof e.data === "string"` log
 * captures nothing and makes it look like broadcasts never fire when they do.
 * This hook decodes every frame (incoming AND outgoing) so you can see the real
 * traffic — e.g. the `votes-updated` broadcast leaving one client and landing on
 * another (see lib/realtime.ts).
 *
 * ── Usage with agent-browser ──────────────────────────────────────────────────
 *   URL="http://localhost:3000/vote?session=<id>"
 *   agent-browser --session a --init-script scripts/ws-trace.js open "$URL"
 *   # ...drive the app (cast a vote in another session)...
 *   # Read what this client received/sent (only realtime frames are kept):
 *   agent-browser --session a eval 'window.__wsTrace.dump("votes-updated")'
 *   agent-browser --session a eval 'window.__wsTrace.state'   # socket urls -> open/closed
 *
 * ── Reading the API in the page (DevTools console works too) ───────────────────
 *   window.__wsTrace.frames            // all captured realtime frames: {t, dir, url, text}
 *   window.__wsTrace.dump(substr?)     // frames whose decoded text includes substr (omit = all)
 *   window.__wsTrace.state             // { "<wss url>": "open" | "closed" }
 *   window.__wsTrace.clear()           // reset the buffer
 *
 * `dir` is "RECV" or "SEND". `t` is seconds since the hook installed. Frames are
 * logged to the console live and ring-buffered (last MAX) so a long session
 * doesn't grow unbounded.
 *
 * ── Tuning ─────────────────────────────────────────────────────────────────────
 * Init scripts can't take args, so the two knobs are constants below:
 *   MATCH — which sockets to trace (default: Supabase realtime). Widen to /./ to
 *           trace every WebSocket on the page.
 *   MAX   — ring-buffer size.
 * Caveat: TextDecoder assumes UTF-8; the leading control bytes (e.g. …)
 * are Supabase's binary framing, not corruption — the topic/event/payload after
 * them decode cleanly.
 */
(() => {
  const MATCH = /supabase\.co\/realtime/; // sockets to trace
  const MAX = 200; // ring-buffer cap

  // Idempotent: re-injecting (e.g. a reload re-runs init scripts) keeps one buffer
  // and avoids double-wrapping the constructor.
  if (window.__wsTrace && window.__wsTrace.__installed) return;

  const t0 = performance.now();
  const now = () => Number(((performance.now() - t0) / 1000).toFixed(2));
  const dec = new TextDecoder(); // UTF-8

  const trace = {
    __installed: true,
    frames: [],
    state: {},
    dump(substr) {
      return substr
        ? this.frames.filter((f) => f.text.includes(substr))
        : this.frames.slice();
    },
    clear() {
      this.frames.length = 0;
    },
  };
  window.__wsTrace = trace;

  // Push a decoded frame. Blob.text() is async, so this branch resolves later —
  // ordering across a mix of Blob/ArrayBuffer frames is therefore best-effort.
  const record = (dir, url, data) => {
    const t = now();
    const put = (text) => {
      trace.frames.push({ t, dir, url, text });
      while (trace.frames.length > MAX) trace.frames.shift();
      // eslint-disable-next-line no-console
      console.log(`[ws ${dir} ${t}s]`, text);
    };
    try {
      if (typeof data === "string") put(data);
      else if (data instanceof ArrayBuffer) put(dec.decode(new Uint8Array(data)));
      else if (ArrayBuffer.isView(data)) put(dec.decode(data));
      else if (typeof Blob !== "undefined" && data instanceof Blob) data.text().then(put);
      else put(`[unhandled: ${Object.prototype.toString.call(data)}]`);
    } catch {
      put("[decode-error]");
    }
  };

  const Orig = window.WebSocket;
  function Traced(url, protocols) {
    const u = String(url);
    const ws = protocols !== undefined ? new Orig(url, protocols) : new Orig(url);
    if (MATCH.test(u)) {
      trace.state[u] = "connecting";
      ws.addEventListener("open", () => (trace.state[u] = "open"));
      ws.addEventListener("close", () => (trace.state[u] = "closed"));
      ws.addEventListener("message", (e) => record("RECV", u, e.data));
      const send = ws.send.bind(ws);
      ws.send = (data) => {
        record("SEND", u, data);
        return send(data);
      };
    }
    return ws;
  }
  // Preserve identity so `instanceof WebSocket`, static constants, and the
  // prototype chain still work for the app code we're wrapping.
  Traced.prototype = Orig.prototype;
  Object.assign(Traced, Orig);
  window.WebSocket = Traced;
})();

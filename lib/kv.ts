import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny key-value layer.
 * - On Vercel: Upstash Redis (connect it from the Vercel Storage tab; env vars are added for you).
 * - On your computer with no Redis configured: a local JSON file in .data/ so you can try things out.
 */
interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  incr(key: string, ttlSeconds: number): Promise<number>;
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function redisKV(): KV {
  const r = new Redis({ url: url!, token: token! });
  return {
    async get<T>(key: string) {
      return (await r.get<T>(key)) ?? null;
    },
    async set(key, value) {
      await r.set(key, value);
    },
    async del(key) {
      await r.del(key);
    },
    async hget<T>(key: string, field: string) {
      return (await r.hget<T>(key, field)) ?? null;
    },
    async hset(key, field, value) {
      await r.hset(key, { [field]: value });
    },
    async hdel(key, field) {
      await r.hdel(key, field);
    },
    async hgetall<T>(key: string) {
      return ((await r.hgetall<Record<string, T>>(key)) ?? {}) as Record<string, T>;
    },
    async incr(key, ttlSeconds) {
      const n = await r.incr(key);
      if (n === 1) await r.expire(key, ttlSeconds);
      return n;
    },
  };
}

function fileKV(): KV {
  const file = path.join(process.cwd(), ".data", "db.json");
  type Store = { kv: Record<string, unknown>; h: Record<string, Record<string, unknown>>; exp: Record<string, number> };
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<Store> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return { kv: {}, h: {}, exp: {} };
    }
  }
  async function save(s: Store) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(s, null, 2));
  }
  function run<T>(fn: (s: Store) => T | Promise<T>, write = false): Promise<T> {
    const p = queue.then(async () => {
      const s = await load();
      const out = await fn(s);
      if (write) await save(s);
      return out;
    });
    queue = p.catch(() => undefined);
    return p;
  }
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  return {
    get: (key) => run((s) => clone((s.kv[key] as never) ?? null)),
    set: (key, value) => run((s) => void (s.kv[key] = clone(value)), true),
    del: (key) => run((s) => void (delete s.kv[key], delete s.h[key]), true),
    hget: (key, field) => run((s) => clone((s.h[key]?.[field] as never) ?? null)),
    hset: (key, field, value) =>
      run((s) => void ((s.h[key] ??= {})[field] = clone(value)), true),
    hdel: (key, field) => run((s) => void delete s.h[key]?.[field], true),
    hgetall: (key) => run((s) => clone((s.h[key] as never) ?? {})),
    incr: (key, ttl) =>
      run((s) => {
        const now = Date.now();
        if (!s.exp[key] || s.exp[key] < now) {
          s.kv[key] = 0;
          s.exp[key] = now + ttl * 1000;
        }
        s.kv[key] = ((s.kv[key] as number) || 0) + 1;
        return s.kv[key] as number;
      }, true),
  };
}

let instance: KV | null = null;

export function kv(): KV {
  if (instance) return instance;
  if (url && token) {
    instance = redisKV();
  } else if (process.env.VERCEL) {
    throw new Error(
      "No database connected. In Vercel, open your project > Storage > connect Upstash Redis, then redeploy."
    );
  } else {
    instance = fileKV();
  }
  return instance;
}

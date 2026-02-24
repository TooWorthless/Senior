import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Card } from "@/components/Card";
import { Btn } from "@/components/Btn";

// ─── NetInfo Hook ─────────────────────────────────
function useNetInfo() {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState);
    return unsubscribe;
  }, []);

  return state;
}

// ─── Fetch с retry ────────────────────────────────
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & { maxRetries?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, backoff = 1000, ...fetchOptions } = options;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, backoff * 2 ** attempt)); // exponential
      }
    }
  }
  throw lastError;
}

// ─── Offline Queue ────────────────────────────────
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
}

function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const netInfo = useNetInfo();

  const enqueue = useCallback((url: string, method = "POST", body?: object) => {
    const item: QueuedRequest = {
      id: Date.now().toString(),
      url, method,
      body: body ? JSON.stringify(body) : undefined,
      timestamp: Date.now(),
    };
    setQueue(q => [...q, item]);
  }, []);

  // Отправить очередь при восстановлении сети
  useEffect(() => {
    if (netInfo?.isConnected && queue.length > 0) {
      const process = async () => {
        for (const item of queue) {
          try {
            await fetch(item.url, { method: item.method, body: item.body });
            setQueue(q => q.filter(i => i.id !== item.id));
          } catch {
            // оставить в очереди
          }
        }
      };
      void process();
    }
  }, [netInfo?.isConnected, queue]);

  return { queue, enqueue };
}

export default function NetworkingScreen() {
  const [tab, setTab] = useState<"fetch" | "netinfo" | "offline" | "patterns">("fetch");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["fetch", "netinfo", "offline", "patterns"] as const).map(t => (
          <View key={t} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]} onPress={() => setTab(t)}>{t}</Text>
          </View>
        ))}
      </ScrollView>

      {tab === "fetch"    && <FetchTab />}
      {tab === "netinfo"  && <NetInfoTab />}
      {tab === "offline"  && <OfflineTab />}
      {tab === "patterns" && <PatternsTab />}
    </View>
  );
}

// ─── Fetch Tab ────────────────────────────────────
interface Post { id: number; title: string; userId: number }

function FetchTab() {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPosts = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=5",
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as Post[];
      setData(json);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetryDemo = async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    try {
      const result = await fetchWithRetry<Post[]>(
        "https://jsonplaceholder.typicode.com/posts?_limit=3",
        { maxRetries: 3, backoff: 500 }
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="fetch в React Native">
        <CodeBlock>{`// fetch работает как в браузере — полифил в RN
// AbortController — отмена запроса:

useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return res.json();
    })
    .then(setData)
    .catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    });

  return () => controller.abort(); // cleanup

}, [url]);

// Таймаут через AbortSignal.timeout (современный):
const signal = AbortSignal.timeout(5000); // 5 секунд
fetch(url, { signal });

// Поддержка FormData, Blob, ArrayBuffer — как в вебе
// ⚠️ XMLHttpRequest тоже работает (старый axios его использует)`}</CodeBlock>
      </Section>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.md }}>
        <Btn label="Fetch Posts" onPress={fetchPosts} />
        <Btn label="Fetch + Retry" variant="ghost" onPress={fetchWithRetryDemo} />
      </View>

      {loading && (
        <View style={s.statusBox}>
          <Text style={{ color: COLORS.amber }}>⏳ Загрузка...</Text>
        </View>
      )}
      {error && (
        <View style={[s.statusBox, { borderColor: COLORS.red }]}>
          <Text style={{ color: COLORS.red }}>❌ {error}</Text>
        </View>
      )}
      {data.map(post => (
        <View key={post.id} style={s.postItem}>
          <Text style={{ color: COLORS.textDim, fontSize: 10 }}>#{post.id}</Text>
          <Text style={{ color: COLORS.text, fontSize: 13, flex: 1 }} numberOfLines={2}>{post.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── NetInfo Tab ──────────────────────────────────
function NetInfoTab() {
  const netInfo = useNetInfo();

  const isConnected = netInfo?.isConnected;
  const type = netInfo?.type;
  const isInternetReachable = netInfo?.isInternetReachable;

  const statusColor = isConnected ? COLORS.green : COLORS.red;

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="NetInfo — сетевое состояние">
        <CodeBlock>{`import NetInfo from "@react-native-community/netinfo";

// Один раз:
const state = await NetInfo.fetch();
console.log(state.isConnected);        // boolean | null
console.log(state.type);              // "wifi" | "cellular" | "none" | "unknown"
console.log(state.isInternetReachable); // фактический интернет

// Подписка на изменения:
const unsubscribe = NetInfo.addEventListener(state => {
  if (!state.isConnected) showOfflineBanner();
  if (state.isConnected) hideOfflineBanner();
});
return unsubscribe; // cleanup!

// Типы соединения:
// "wifi" | "cellular" | "ethernet"
// "bluetooth" | "wimax" | "vpn"
// "none" | "unknown" | "other"

// Мобильные данные:
if (state.type === "cellular") {
  const details = state.details as CellularNetInfoDetails;
  details.cellularGeneration; // "2g" | "3g" | "4g" | "5g" | null
}`}</CodeBlock>
      </Section>

      <View style={[s.netCard, { borderColor: statusColor }]}>
        <Text style={{ color: statusColor, fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
          {isConnected ? "🟢 Online" : "🔴 Offline"}
        </Text>
        {[
          { label: "Type",               value: type ?? "..." },
          { label: "Is Connected",       value: String(isConnected ?? "...") },
          { label: "Internet Reachable", value: String(isInternetReachable ?? "...") },
        ].map(({ label, value }) => (
          <View key={label} style={s.metricRow}>
            <Text style={{ color: COLORS.textDim, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: COLORS.blue, fontFamily: "monospace", fontSize: 12 }}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Offline Tab ──────────────────────────────────
function OfflineTab() {
  const netInfo = useNetInfo();
  const { queue, enqueue } = useOfflineQueue();
  const [counter, setCounter] = useState(1);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Offline Queue паттерн">
        <CodeBlock>{`// Паттерн: сохранить запрос в очередь если нет сети,
// отправить при восстановлении

function useOfflineQueue() {
  const [queue, setQueue] = useState([]);
  const netInfo = useNetInfo();

  const enqueue = (url, method, body) => {
    setQueue(q => [...q, { id: Date.now(), url, method, body }]);
  };

  // Flush при восстановлении:
  useEffect(() => {
    if (netInfo?.isConnected && queue.length > 0) {
      processQueue(queue, setQueue);
    }
  }, [netInfo?.isConnected, queue.length]);

  return { queue, enqueue };
}

// Production: добавить AsyncStorage для персистентности
// очередь должна выживать после перезапуска приложения`}</CodeBlock>
      </Section>

      <View style={[s.statusBox, { borderColor: netInfo?.isConnected ? COLORS.green : COLORS.red }]}>
        <Text style={{ color: netInfo?.isConnected ? COLORS.green : COLORS.red, fontSize: 14, fontWeight: "600" }}>
          {netInfo?.isConnected ? "Online" : "Offline"}
        </Text>
        <Text style={{ color: COLORS.textDim, fontSize: 12 }}>
          Очередь: {queue.length} запросов
        </Text>
      </View>

      <Btn label={`Enqueue Request #${counter}`}
        onPress={() => {
          enqueue(`https://api.example.com/action/${counter}`, "POST", { id: counter });
          setCounter(c => c + 1);
        }} />

      {queue.length > 0 && (
        <View style={{ marginTop: SPACING.sm }}>
          {queue.map(item => (
            <View key={item.id} style={s.queueItem}>
              <Text style={{ color: COLORS.amber, fontSize: 11, fontFamily: "monospace" }}>
                {item.method} {item.url}
              </Text>
              <Text style={{ color: COLORS.textDim, fontSize: 10 }}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Patterns Tab ─────────────────────────────────
function PatternsTab() {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Retry с exponential backoff">
        <CodeBlock>{`async function fetchWithRetry(url, { maxRetries = 3, backoff = 1000 } = {}) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return res.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // Exponential backoff: 1s, 2s, 4s...
      await sleep(backoff * 2 ** attempt);
    }
  }
}`}</CodeBlock>
      </Section>

      <Section title="Timeout через AbortSignal">
        <CodeBlock>{`// Современный способ (нет поддержки в старом RN):
const res = await fetch(url, {
  signal: AbortSignal.timeout(5000), // 5 секунд
});

// Совместимый способ:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return res.json();
} catch (err) {
  if (err.name === "AbortError") throw new Error("Request timeout");
  throw err;
}`}</CodeBlock>
      </Section>

      <Section title="TanStack Query в RN (рекомендуется)">
        <CodeBlock>{`// npm install @tanstack/react-query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Запрос с кешированием:
function ProductScreen({ id }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    staleTime: 5 * 60 * 1000, // 5 минут в кеше
  });

  if (isLoading) return <Skeleton />;
  if (error)     return <ErrorView onRetry={refetch} />;
  return <ProductView product={data} />;
}

// Мутация:
const mutation = useMutation({
  mutationFn: (data) => updateProduct(id, data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product", id] }),
  onError: (err) => showToast(err.message),
});

// Оффлайн с TanStack Query:
import { onlineManager } from "@tanstack/react-query";
NetInfo.addEventListener(state => {
  onlineManager.setOnline(state.isConnected ?? false);
});
// Автоматически retries при восстановлении сети!`}</CodeBlock>
      </Section>

      <Card title="Типичные вопросы на интервью" accent={COLORS.amber}>
        {[
          "Как отменить запрос при unmount компонента?",
          "Как обработать offline режим в мобильном приложении?",
          "Что такое exponential backoff и зачем?",
          "Чем TanStack Query лучше голого fetch?",
          "Как сериализовать очередь запросов в AsyncStorage?",
        ].map((q, i) => (
          <Text key={i} style={{ color: COLORS.text, fontSize: 13, lineHeight: 22, paddingVertical: 2 }}>
            ▸ {q}
          </Text>
        ))}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: SPACING.md },
  tabBar: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBarContent: { paddingHorizontal: SPACING.sm, gap: SPACING.xs },
  tab: { paddingHorizontal: 14, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.blue },
  tabText: { fontSize: 13, color: COLORS.textDim },
  tabTextActive: { color: COLORS.blue },

  statusBox: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface, gap: 4,
  },
  netCard: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.lg,
    backgroundColor: COLORS.surface, gap: 4,
  },
  metricRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  postItem: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  queueItem: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4,
  },
});

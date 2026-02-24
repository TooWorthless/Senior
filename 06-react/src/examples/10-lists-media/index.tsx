import { useState, useMemo, useRef, useCallback } from "react";

interface Item { id: number; name: string; category: string; price: number }

// Simulate 10k items
const ITEMS: Item[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: i + 1,
  name: `Product #${i + 1}`,
  category: ["Electronics", "Clothing", "Food", "Books"][i % 4]!,
  price: Math.round(10 + Math.random() * 990),
}));

// ─── Virtual List ─────────────────────────────────
const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 12;

function VirtualList({ items }: { items: Item[] }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(items.length, startIndex + VISIBLE_COUNT + 4);
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(item => (
            <div key={item.id} style={{
              height: ITEM_HEIGHT, display: "flex", alignItems: "center",
              padding: "0 12px", borderBottom: "1px solid #21262d", fontSize: 12,
              justifyContent: "space-between",
            }}>
              <span style={{ color: "var(--text-dim)" }}>#{item.id}</span>
              <span style={{ flex: 1, marginLeft: 8 }}>{item.name}</span>
              <span className="badge blue" style={{ marginRight: 8 }}>{item.category}</span>
              <span style={{ color: "var(--green)" }}>${item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Regular List (для сравнения) ─────────────────
function RegularList({ items }: { items: Item[] }) {
  return (
    <div style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
      {items.map(item => (
        <div key={item.id} style={{
          height: ITEM_HEIGHT, display: "flex", alignItems: "center",
          padding: "0 12px", borderBottom: "1px solid #21262d", fontSize: 12,
          justifyContent: "space-between",
        }}>
          <span style={{ color: "var(--text-dim)" }}>#{item.id}</span>
          <span style={{ flex: 1, marginLeft: 8 }}>{item.name}</span>
          <span className="badge blue" style={{ marginRight: 8 }}>{item.category}</span>
          <span style={{ color: "var(--green)" }}>${item.price}</span>
        </div>
      ))}
    </div>
  );
}

export default function ListsMedia() {
  const [tab, setTab] = useState<"lists" | "media">("lists");
  const [listMode, setListMode] = useState<"virtual" | "regular">("virtual");
  const [filter, setFilter] = useState("");
  const [renderTime, setRenderTime] = useState<Record<string, number>>({});
  const timerRef = useRef<number | null>(null);

  const filtered = useMemo(() =>
    ITEMS.filter(i => !filter || i.category === filter),
  [filter]);

  const measure = useCallback((mode: "virtual" | "regular") => {
    const t0 = performance.now();
    setListMode(mode);
    // Измерение после рендера
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRenderTime(prev => ({ ...prev, [mode]: parseFloat((performance.now() - t0).toFixed(1)) }));
    }, 0);
  }, []);

  return (
    <div className="example-page">
      <h1>10 · Lists & Media</h1>
      <p className="subtitle">Keys, виртуализация, оптимизация больших списков, обработка медиа</p>

      <div className="btn-row">
        {(["lists", "media"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "lists" && (
        <section style={{ marginTop: 16 }}>
          <h2>Виртуализация — 10 000 строк</h2>

          <div className="card">
            <h3>Зачем виртуализация?</h3>
            <div className="code-block">{`// Обычный список 10_000 элементов:
// - Создать 10_000 DOM nodes → медленный mount
// - Браузер должен обновить layout для ВСЕХ → медленный re-render
// - Много памяти под DOM nodes

// Виртуализация:
// - Рендерить только ~15-20 видимых элементов
// - При скролле убирать старые, добавлять новые
// - O(viewport_items) вместо O(total_items) сложность DOM

// react-window: FixedSizeList / VariableSizeList / Grid
import { FixedSizeList } from "react-window";
<FixedSizeList height={600} width={400} itemCount={10000} itemSize={40}>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>

// tanstack/react-virtual (более гибкий):
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
});`}</div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <strong>Список: {filtered.length.toLocaleString()} строк</strong>
                <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-dim)" }}>
                  {renderTime[listMode] !== undefined && `render: ${renderTime[listMode]}ms`}
                </span>
              </div>
              <div className="btn-row" style={{ margin: 0 }}>
                <button className={`btn${listMode === "virtual" ? "" : " ghost"}`}
                  style={{ fontSize: 12 }} onClick={() => measure("virtual")}>
                  Virtual ✅
                </button>
                <button className={`btn${listMode === "regular" ? " red" : " ghost"}`}
                  style={{ fontSize: 12 }} onClick={() => measure("regular")}>
                  Regular ⚠️
                </button>
              </div>
            </div>

            <div className="btn-row" style={{ marginBottom: 8 }}>
              {["", "Electronics", "Clothing", "Food", "Books"].map(cat => (
                <button key={cat}
                  className={`btn${filter === cat ? "" : " ghost"}`}
                  style={{ fontSize: 11 }}
                  onClick={() => setFilter(cat)}>
                  {cat || "All"}
                </button>
              ))}
            </div>

            {listMode === "virtual"
              ? <VirtualList items={filtered} />
              : <RegularList items={filtered.slice(0, 500)} />
            }
            {listMode === "regular" && (
              <div className="highlight warn" style={{ marginTop: 8 }}>
                ⚠️ Показаны первые 500 из {filtered.length.toLocaleString()} — полный список заморозит браузер
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "media" && <MediaSection />}
    </div>
  );
}

function MediaSection() {
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Media в React</h2>

      <div className="card">
        <h3>Изображения — оптимизация</h3>
        <div className="code-block">{`// 1. Lazy loading — браузерный
<img loading="lazy" src={src} alt={alt} />

// 2. Lazy loading — intersection observer (React)
function LazyImage({ src, alt }) {
  const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {isIntersecting && <img src={src} alt={alt} />}
    </div>
  );
}

// 3. Progressive loading (blur-up)
function ProgressiveImage({ src, placeholder, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <img src={placeholder} style={{ filter: loaded ? "none" : "blur(10px)", transition: "filter 0.3s" }} alt={alt} />
      <img src={src} onLoad={() => setLoaded(true)} style={{ position: "absolute", inset: 0, opacity: loaded ? 1 : 0 }} alt={alt} />
    </div>
  );
}

// 4. Next.js Image (автооптимизация):
import Image from "next/image";
<Image src="/hero.jpg" width={800} height={600} alt="Hero" priority />
// → WebP/AVIF конвертация, lazy loading, srcset, placeholder`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Video в React</h3>
        <VideoDemo />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Списки с медиа — паттерны</h3>
        <div className="code-block">{`// Media gallery с virtualization
function MediaGallery({ items }) {
  return (
    <FixedSizeGrid
      columnCount={3}
      columnWidth={200}
      rowCount={Math.ceil(items.length / 3)}
      rowHeight={200}
      width={600}
      height={600}
    >
      {({ columnIndex, rowIndex, style }) => {
        const item = items[rowIndex * 3 + columnIndex];
        return item ? (
          <div style={style}>
            <LazyImage src={item.thumbnail} alt={item.title} />
          </div>
        ) : null;
      }}
    </FixedSizeGrid>
  );
}

// srcset для responsive images:
<img
  src="/img-800.jpg"
  srcSet="/img-400.jpg 400w, /img-800.jpg 800w, /img-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 900px) 800px, 1200px"
  alt="Responsive"
/>`}</div>
      </div>
    </section>
  );
}

function VideoDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { void v.play(); setPlaying(true); }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = +e.target.value;
    setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol;
  };

  return (
    <div>
      <div style={{ background: "#010409", borderRadius: 6, padding: 12, marginBottom: 10, textAlign: "center" }}>
        <video
          ref={videoRef}
          loop muted playsInline
          style={{ width: "100%", maxWidth: 400, borderRadius: 4 }}
          onEnded={() => setPlaying(false)}
        >
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео
        </video>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn" style={{ fontSize: 12 }} onClick={toggle}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>🔊</label>
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onChange={handleVolume} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{Math.round(volume * 100)}%</span>
      </div>
      <div className="code-block" style={{ marginTop: 10, fontSize: 11 }}>{`// useRef для медиа элементов:
const videoRef = useRef<HTMLVideoElement>(null);
videoRef.current?.play();  // императивный API
videoRef.current?.pause();
videoRef.current.currentTime = 0;
videoRef.current.volume = 0.5;`}</div>
    </div>
  );
}

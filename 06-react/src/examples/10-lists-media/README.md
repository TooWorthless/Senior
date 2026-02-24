# 10 · Lists & Media

[← Назад](../../../README.md)

---

## Содержание

- [Keys](#keys-в-списках)
- [Виртуализация](#виртуализация)
- [Infinite Scroll](#infinite-scroll)
- [Оптимизация списков](#оптимизация-списков)
- [Изображения](#изображения)
- [Video & Audio](#video--audio)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Keys в списках

(Подробно в модуле 01, здесь — практические паттерны)

```tsx
// ✅ ID из данных — наилучший вариант
items.map(item => <Item key={item.id} {...item} />)

// ✅ Составной key когда нет уникального ID
items.map(item => <Item key={`${item.category}-${item.slug}`} {...item} />)

// ❌ Index для изменяемых списков
items.map((item, i) => <Item key={i} {...item} />) // state съедет при удалении!

// ❌ Math.random() — unmount + mount каждый рендер
items.map(item => <Item key={Math.random()} {...item} />) // катастрофа!
```

---

## Виртуализация

**Проблема:** 10 000 DOM элементов → медленный mount, много памяти, медленный scroll.

**Решение:** рендерить только видимые элементы (15-20) + небольшой overscan.

### Реализация с нуля

```tsx
const ITEM_HEIGHT = 50; // px, фиксированная высота

function VirtualList({ items }: { items: Item[] }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 400; // видимая область
  const overscan = 3; // дополнительные элементы вне viewport

  // Первый видимый элемент
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - overscan);
  // Последний видимый элемент
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT; // пространство до первого видимого

  return (
    <div
      style={{ height: containerHeight, overflowY: "auto" }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Полная высота для корректного скроллбара */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Смещаем на высоту невидимых элементов */}
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(item => (
            <div key={item.id} style={{ height: ITEM_HEIGHT }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Production: react-window

```tsx
import { FixedSizeList, VariableSizeList, FixedSizeGrid } from "react-window";

// Фиксированная высота строк:
<FixedSizeList
  height={600}
  width={800}
  itemCount={items.length}
  itemSize={50} // px
>
  {({ index, style }) => (
    // style содержит position: absolute, top, height — ОБЯЗАТЕЛЬНО применять!
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>

// Переменная высота:
const getItemSize = (index: number) => index % 2 === 0 ? 50 : 80;
<VariableSizeList
  height={600}
  width={800}
  itemCount={items.length}
  itemSize={getItemSize}
>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</VariableSizeList>

// Сетка (grid):
<FixedSizeGrid
  columnCount={3}
  columnWidth={200}
  rowCount={Math.ceil(items.length / 3)}
  rowHeight={200}
  height={600}
  width={600}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    return index < items.length
      ? <div style={style}>{items[index].name}</div>
      : null;
  }}
</FixedSizeGrid>
```

### TanStack Virtual (react-virtual)

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // начальная оценка высоты
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflowY: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement} // автоизмерение высоты
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Infinite Scroll

```tsx
function InfiniteList() {
  const [pages, setPages] = useState<User[][]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const newPage = await fetchUsers({ page: pages.length });
    if (newPage.length === 0) setHasMore(false);
    else setPages(prev => [...prev, newPage]);
    setLoading(false);
  }, [loading, hasMore, pages.length]);

  // IntersectionObserver на sentinel элемент
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loadMore();
    }, { threshold: 0.1 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const allItems = pages.flat();

  return (
    <div style={{ maxHeight: 500, overflowY: "auto" }}>
      {allItems.map(user => <UserCard key={user.id} user={user} />)}
      {loading && <Spinner />}
      {/* Sentinel — пустой div внизу списка */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      {!hasMore && <p>Все загружены</p>}
    </div>
  );
}
```

---

## Оптимизация списков

```tsx
// 1. Мемоизация элементов списка
const UserCard = memo(function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
});

// 2. Стабильные обработчики для элементов списка
function UserList({ users, onDelete }: Props) {
  // ❌ Новая функция для каждого элемента каждый рендер:
  return users.map(user => (
    <UserCard key={user.id} user={user}
      onDelete={() => onDelete(user.id)} // новая функция!
    />
  ));
}

// ✅ Делегирование — один обработчик на контейнере:
function UserList({ users, onDelete }: Props) {
  const handleDelete = useCallback((e: React.MouseEvent) => {
    const id = (e.currentTarget as HTMLElement).dataset["userId"];
    if (id) onDelete(+id);
  }, [onDelete]);

  return (
    <div onClick={handleDelete}>
      {users.map(user => (
        <div key={user.id} data-user-id={user.id}>
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

---

## Изображения

```tsx
// 1. Нативный lazy loading
<img src={src} loading="lazy" alt={alt} />

// 2. Progressive loading (blur-up)
function ProgressiveImage({ src, placeholder, alt }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {/* Маленькое размытое превью */}
      <img
        src={placeholder}
        alt={alt}
        style={{
          width: "100%",
          filter: loaded ? "blur(0)" : "blur(20px)",
          transition: "filter 0.3s",
        }}
      />
      {/* Полное изображение поверх, появляется при загрузке */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          position: "absolute", inset: 0, width: "100%",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />
    </div>
  );
}

// 3. Responsive images
<img
  src="/img-800.jpg"
  srcSet="/img-400.jpg 400w, /img-800.jpg 800w, /img-1600.jpg 1600w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1600px"
  alt="Responsive"
/>

// 4. Next.js Image компонент:
import Image from "next/image";
<Image
  src="/hero.jpg"
  width={800}
  height={600}
  alt="Hero"
  priority         // загрузить с высоким приоритетом (above the fold)
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
```

---

## Video & Audio

```tsx
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Импеpативный API через ref
  const play = () => videoRef.current?.play().then(() => setPlaying(true));
  const pause = () => { videoRef.current?.pause(); setPlaying(false); };
  const seek = (time: number) => { if (videoRef.current) videoRef.current.currentTime = time; };

  return (
    <div>
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        // playsInline — важно для мобильных Safari (воспроизведение inline, не fullscreen)
        playsInline
        // preload стратегия:
        // "none" — не загружать до play()
        // "metadata" — загрузить метаданные (длительность, размеры)
        // "auto" — загрузить всё
        preload="metadata"
      />
      <input
        type="range" min={0} max={duration}
        value={currentTime} step={0.1}
        onChange={e => seek(+e.target.value)}
      />
      <button onClick={playing ? pause : play}>
        {playing ? "⏸" : "▶"}
      </button>
      <input
        type="range" min={0} max={1} step={0.01}
        value={volume}
        onChange={e => {
          const v = +e.target.value;
          setVolume(v);
          if (videoRef.current) videoRef.current.volume = v;
        }}
      />
    </div>
  );
}

// Ключевые события video:
// onLoadedMetadata — длительность и размеры доступны
// onCanPlay — можно начать воспроизведение
// onTimeUpdate — текущее время изменилось (~4 раза/сек)
// onEnded — видео закончилось
// onError — ошибка загрузки
// onWaiting — буферизация
// onPlaying — воспроизведение возобновлено
```

---

## Вопросы на интервью

### 1. Зачем виртуализация и как она работает?

Без виртуализации 10k элементов = 10k DOM nodes → медленный mount, много памяти, медленный scroll. Виртуализация рендерит только **видимые элементы** (~15-20) плюс небольшой overscan. При скролле: убирать элементы выходящие из viewport, добавлять новые. DOM остаётся маленьким — O(viewport) вместо O(total). Реализация: `scrollTop / itemHeight` = startIndex, компенсировать offset translateY.

### 2. Как реализовать infinite scroll?

Паттерн **sentinel**: добавить пустой div в конец списка, повесить `IntersectionObserver`. При пересечении viewport — загрузить следующую страницу, добавить в state. Cleanup observer при unmount. Альтернатива — TanStack Query `useInfiniteQuery` с автоматическим управлением страницами.

### 3. Что такое progressive image loading (blur-up)?

Техника: показать маленькое размытое превью (10-20px → CSS blur) сразу, пока загружается полное изображение. При загрузке полного — fade in, убрать blur. Пользователь видит контент сразу вместо пустого места. Используется Medium, Gatsby, Next.js.

### 4. Как управлять видео/аудио через ref?

`useRef<HTMLVideoElement>(null)` → `videoRef.current` — прямой доступ к DOM элементу с медиа API. Методы: `play()` (Promise), `pause()`, `load()`. Свойства: `currentTime`, `duration`, `volume`, `muted`, `playbackRate`. События через React props: `onTimeUpdate`, `onLoadedMetadata`, `onEnded`.

---

## Ловушки

```tsx
// ❌ 1. Ключи для виртуализированных элементов
// При виртуализации React может "думать" что элемент новый → re-mount state
// Используй стабильный key={item.id}, не key={virtualRow.index}

// ❌ 2. Обработчик onChange в range input (временной прогресс видео)
// onTimeUpdate (4 раза/сек) → setState → много ре-рендеров
// Для слайдера прогресса используй uncontrolled + ref или requestAnimationFrame

// ❌ 3. img без width/height → Layout Shift (CLS)
<img src={src} alt="..." />
// Браузер не знает размер → сдвигает контент при загрузке
// ✅ Всегда указывай размеры:
<img src={src} alt="..." width={800} height={600} />
// или aspect-ratio через CSS

// ❌ 4. video autoplay без muted на mobile
<video autoPlay /> // браузеры блокируют звук по умолчанию
<video autoPlay muted playsInline /> // ✅ работает везде

// ❌ 5. Большой список без memo
{items.map(item => <HeavyCard key={item.id} item={item} onDelete={handleDelete} />)}
// Изменение любого item → все HeavyCard ре-рендерятся
// ✅ memo + useCallback для handleDelete
```

import { useIntersectionObserver } from "./hooks";

export default function UseIntersectionDemo() {
  return (
    <section style={{ marginTop: 16 }}>
      <h2>useIntersectionObserver — lazy loading & анимации</h2>

      <div className="card">
        <h3>Применения</h3>
        <div className="code-block">{`// 1. Infinite scroll — загрузить следующую страницу
const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
useEffect(() => {
  if (isIntersecting && hasMore) loadNextPage();
}, [isIntersecting]);
<div ref={ref} /> // sentinel element внизу списка

// 2. Lazy images — загружать когда видно
const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
<img ref={ref} src={isIntersecting ? realSrc : undefined} />

// 3. Animate on scroll — CSS анимации при появлении
const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
<div ref={ref} className={isIntersecting ? "animated" : "hidden"} />`}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 12 }}>
          Прокрути вниз чтобы увидеть анимации:
        </p>
        <div style={{ maxHeight: 400, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <AnimatedCard key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedCard({ index }: { index: number }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: true,
  });

  const colors = [
    "var(--blue)", "var(--green)", "var(--amber)", "var(--purple)",
    "var(--red)", "var(--blue)", "var(--green)", "var(--amber)",
  ];

  return (
    <div
      ref={ref}
      style={{
        padding: 16,
        marginBottom: 12,
        background: "var(--surface)",
        borderRadius: 8,
        borderLeft: `4px solid ${colors[index % colors.length]}`,
        transform: isIntersecting ? "translateX(0)" : "translateX(-30px)",
        opacity: isIntersecting ? 1 : 0,
        transition: `all 0.4s ease ${index * 0.1}s`,
      }}
    >
      <div style={{ color: colors[index % colors.length], fontWeight: "bold", marginBottom: 4 }}>
        {isIntersecting ? "✅" : "⏳"} Card #{index + 1}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
        {isIntersecting
          ? "Виден пользователю — анимация завершена"
          : "Ещё не виден — ожидает появления в viewport"}
      </div>
    </div>
  );
}

# 10 · Продвинутые алгоритмы

[← JavaScript](../README.md)

Алгоритмы которые знают не все, но которые реально используются в production системах. Каждый — с задачей, которую решает, и почему он крутой.

---

## Содержание

### Алгоритмы балансировки
1. [Round-Robin и взвешенный Round-Robin](#round-robin)
2. [Least Connections](#least-connections)
3. [Consistent Hashing](#consistent-hashing)

### Структуры данных и алгоритмы
4. [Trie (Префиксное дерево)](#trie)
5. [Union-Find / Disjoint Set Union](#union-find)
6. [Fenwick Tree / Binary Indexed Tree](#fenwick-tree)
7. [Bloom Filter](#bloom-filter)

### Алгоритмические паттерны
8. [Boyer-Moore Voting](#boyer-moore-voting)
9. [Reservoir Sampling](#reservoir-sampling)
10. [Topological Sort](#topological-sort)

```bash
node 03-javascript/10-advanced-algorithms/examples/load-balancing.js
node 03-javascript/10-advanced-algorithms/examples/data-structures.js
node 03-javascript/10-advanced-algorithms/examples/patterns.js
```

---

## Round-Robin

**Задача:** Распределить N запросов по M серверам равномерно.

**Round-Robin:** По кругу, каждый сервер получает запрос по очереди. O(1).

**Weighted Round-Robin:** Серверы имеют разный вес. Сервер с весом 3 получает 3 запроса на каждый 1 запрос сервера с весом 1.

```javascript
class RoundRobin {
  #servers; #index = 0;
  constructor(servers) { this.#servers = servers; }
  next() {
    const server = this.#servers[this.#index];
    this.#index = (this.#index + 1) % this.#servers.length;
    return server;
  }
}
```

---

## Least Connections

**Задача:** Распределить запросы так, чтобы серверы с меньшей нагрузкой получали больше.

**Идея:** При получении запроса выбираем сервер с наименьшим количеством активных соединений.

Лучше Round-Robin когда запросы имеют разное время обработки.

---

## Consistent Hashing

**Задача:** Распределить ключи по N серверам так, чтобы при добавлении/удалении сервера перебалансировалась только 1/N часть ключей (а не все).

**Обычный hash(key) % N:** При изменении N инвалидируются почти все ключи.

**Consistent Hashing:**
1. Серверы и ключи хешируются на одно «кольцо» [0..2³²)
2. Каждый ключ → ближайший сервер по часовой стрелке
3. При добавлении сервера → берёт только соседние ключи
4. **Virtual nodes:** каждый сервер хешируется несколько раз для равномерности

Используется: Redis Cluster, Cassandra, Amazon DynamoDB, Kafka.

---

## Trie

**Задача:** Автодополнение, поиск по префиксу, проверка орфографии.

**Преимущества vs Hash Map:**
- O(L) поиск где L — длина слова (vs O(L) у HashMap, но Trie поддерживает prefixSearch)
- Можно найти все слова с заданным префиксом
- Меньше памяти для общих префиксов

**Узел Trie:**
```
{ children: Map<char, TrieNode>, isEnd: boolean }
```

---

## Union-Find

**Задача:** Поддерживать связные компоненты в графе. Быстро отвечать: «находятся ли два узла в одной компоненте?».

**Операции:**
- `find(x)` — найти корень компоненты x
- `union(x, y)` — объединить компоненты x и y

**Оптимизации:**
- Path compression: при `find` сразу прикреплять к корню
- Union by rank: прикреплять меньшее дерево к большему

**Итоговая сложность:** почти O(1) амортизированно — O(α(n)) где α — обратная функция Аккермана.

Применение: Kruskal MST, определение циклов, сети, кластеризация.

---

## Fenwick Tree

**Задача:** Быстрые prefix sum queries и point updates.

**Наивный массив:** Update O(1), PrefixSum O(n)  
**Prefix Sum Array:** Update O(n), Query O(1)  
**Fenwick Tree:** Update O(log n), Query O(log n) — лучший компромисс!

**Трюк:** Каждый узел хранит сумму определённого диапазона, основанного на младшем установленном бите (`i & (-i)`).

Применение: count inversions, range queries, 2D версия для матриц.

---

## Bloom Filter

**Задача:** Быстро проверить «точно НЕТ» или «ВЕРОЯТНО ДА». Без false negatives, с false positives.

**Принцип:**
- k хэш-функций, битовый массив размером m
- Add: установить k битов
- Check: все k битов установлены? → ВЕРОЯТНО ДА (может быть false positive)

**Применение:**
- Chrome: проверка вредоносных URL (без отправки URL на сервер!)
- Cassandra / HBase: проверить есть ли ключ в таблице перед disk I/O
- Redis: фильтрация кэш-промахов
- Spell checkers

---

## Boyer-Moore Voting

**Задача:** Найти мажоритарный элемент (появляется > n/2 раз) за O(n) и O(1) памяти.

**Идея:** Голосование. Если текущий элемент совпадает с кандидатом — увеличиваем счётчик, иначе уменьшаем. При 0 — меняем кандидата.

Математическое обоснование: если элемент встречается > n/2 раз, он «переживёт» все голосования против него.

---

## Reservoir Sampling

**Задача:** Выбрать k случайных элементов из потока неизвестной длины n. Каждый элемент должен иметь равную вероятность k/n.

**Алгоритм:**
1. Первые k элементов → в резервуар
2. Для i-го элемента (i > k): с вероятностью k/i → заменить случайный элемент резервуара

Применение: A/B тестирование, логирование, стриминг данных, случайные выборки.

---

## Topological Sort

**Задача:** Линейное упорядочивание DAG (directed acyclic graph) такое что для каждого ребра u→v, u стоит раньше v.

Применение: сборка зависимостей (npm, webpack), планировщики задач, компиляция, курикулум.

**Алгоритмы:**
- Kahn's (BFS + in-degree): хорош для обнаружения циклов
- DFS с post-order stack: элегантен, рекурсивен

---

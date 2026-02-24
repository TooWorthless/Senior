# 08 · Справочник встроенных методов

[← JavaScript](../README.md)

Все встроенные методы по секциям. Формат: **метод → пример → результат → что делает**.

```bash
node 03-javascript/08-builtins-reference/examples/strings.js
node 03-javascript/08-builtins-reference/examples/arrays.js
node 03-javascript/08-builtins-reference/examples/objects.js
node 03-javascript/08-builtins-reference/examples/numbers.js
node 03-javascript/08-builtins-reference/examples/misc.js
```

---

## Содержание

- [String](#string)
- [Array](#array)
- [Object](#object)
- [Number / Math](#number--math)
- [Map / Set](#map--set)
- [JSON](#json)
- [Date (кратко)](#date)

---

## String

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `.length` | `"hello".length` | `5` | Длина строки |
| `.at(i)` | `"hello".at(-1)` | `"o"` | Символ по индексу, поддерживает отрицательные |
| `.charAt(i)` | `"hello".charAt(1)` | `"e"` | Символ по индексу (старый вариант) |
| `.charCodeAt(i)` | `"A".charCodeAt(0)` | `65` | Код UTF-16 символа |
| `.codePointAt(i)` | `"😀".codePointAt(0)` | `128512` | Unicode code point (поддерживает emoji) |
| `String.fromCharCode(n)` | `String.fromCharCode(65)` | `"A"` | Символ из кода UTF-16 |
| `String.fromCodePoint(n)` | `String.fromCodePoint(128512)` | `"😀"` | Символ из Unicode code point |
| `.indexOf(s)` | `"hello".indexOf("ll")` | `2` | Первый индекс вхождения, -1 если нет |
| `.lastIndexOf(s)` | `"hello".lastIndexOf("l")` | `3` | Последний индекс вхождения |
| `.includes(s)` | `"hello".includes("ell")` | `true` | Содержит ли подстроку |
| `.startsWith(s)` | `"hello".startsWith("he")` | `true` | Начинается ли с подстроки |
| `.endsWith(s)` | `"hello".endsWith("lo")` | `true` | Заканчивается ли подстрокой |
| `.slice(s,e)` | `"hello".slice(1, 3)` | `"el"` | Подстрока [start, end), поддерживает отрицательные |
| `.substring(s,e)` | `"hello".substring(1, 3)` | `"el"` | Подстрока [start, end), отрицательные = 0 |
| `.split(sep)` | `"a,b,c".split(",")` | `["a","b","c"]` | Разбить на массив по разделителю |
| `.join` | *(метод Array)* | — | — |
| `.replace(p,r)` | `"aaa".replace("a","x")` | `"xaa"` | Заменить первое вхождение |
| `.replaceAll(p,r)` | `"aaa".replaceAll("a","x")` | `"xxx"` | Заменить все вхождения |
| `.match(re)` | `"a1b2".match(/\d+/g)` | `["1","2"]` | Найти совпадения с RegExp |
| `.matchAll(re)` | `"a1b2".matchAll(/(\d)/g)` | `Iterator` | Все совпадения с группами |
| `.search(re)` | `"hello".search(/l+/)` | `2` | Индекс первого совпадения с RegExp |
| `.toUpperCase()` | `"hello".toUpperCase()` | `"HELLO"` | В верхний регистр |
| `.toLowerCase()` | `"HELLO".toLowerCase()` | `"hello"` | В нижний регистр |
| `.toLocaleUpperCase()` | `"i".toLocaleUpperCase("tr")` | `"İ"` | Верхний регистр с учётом локали |
| `.trim()` | `"  hi  ".trim()` | `"hi"` | Убрать пробелы с обоих концов |
| `.trimStart()` | `"  hi  ".trimStart()` | `"hi  "` | Убрать пробелы с начала |
| `.trimEnd()` | `"  hi  ".trimEnd()` | `"  hi"` | Убрать пробелы с конца |
| `.padStart(n,s)` | `"5".padStart(3, "0")` | `"005"` | Дополнить строку до длины n слева |
| `.padEnd(n,s)` | `"5".padEnd(3, "0")` | `"500"` | Дополнить строку до длины n справа |
| `.repeat(n)` | `"ab".repeat(3)` | `"ababab"` | Повторить строку n раз |
| `.concat(s)` | `"hi".concat(" ", "there")` | `"hi there"` | Конкатенация (лучше использовать `+` или template) |
| `.normalize(form)` | `"\u00E9".normalize("NFD")` | `"é"` | Unicode нормализация (NFD/NFC/NFKD/NFKC) |
| `.localeCompare(s)` | `"b".localeCompare("a")` | `1` | Лексикографическое сравнение с учётом локали |
| `[Symbol.iterator]` | `[..."hello"]` | `["h","e","l","l","o"]` | Строка итерируемая |

---

## Array

### Мутирующие

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `.push(...items)` | `[1,2].push(3,4)` | `4` (length) | Добавить в конец, вернуть длину |
| `.pop()` | `[1,2,3].pop()` | `3` | Удалить и вернуть последний |
| `.unshift(...items)` | `[2,3].unshift(0,1)` | `4` (length) | Добавить в начало, вернуть длину |
| `.shift()` | `[1,2,3].shift()` | `1` | Удалить и вернуть первый |
| `.splice(s,d,...i)` | `[1,2,3].splice(1,1,9)` | `[2]` | Удалить d элементов с позиции s, вставить i. Возвращает удалённые |
| `.sort(fn)` | `[3,1,2].sort((a,b)=>a-b)` | `[1,2,3]` | Сортировка на месте. Без fn — лексикографически! |
| `.reverse()` | `[1,2,3].reverse()` | `[3,2,1]` | Разворот на месте |
| `.fill(v,s,e)` | `[0,0,0].fill(5,1,3)` | `[0,5,5]` | Заполнить значением v от s до e |
| `.copyWithin(t,s,e)` | `[1,2,3,4].copyWithin(0,2)` | `[3,4,3,4]` | Скопировать часть массива внутрь |

### Немутирующие (возвращают новое)

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `.map(fn)` | `[1,2,3].map(x=>x*2)` | `[2,4,6]` | Трансформация каждого элемента |
| `.filter(fn)` | `[1,2,3,4].filter(x=>x>2)` | `[3,4]` | Фильтрация по условию |
| `.reduce(fn,init)` | `[1,2,3].reduce((a,x)=>a+x,0)` | `6` | Свёртка слева направо |
| `.reduceRight(fn,init)` | `[[1],[2],[3]].reduceRight((a,x)=>[...a,...x],[])` | `[3,2,1]` | Свёртка справа налево |
| `.find(fn)` | `[1,2,3].find(x=>x>1)` | `2` | Первый подходящий элемент |
| `.findIndex(fn)` | `[1,2,3].findIndex(x=>x>1)` | `1` | Индекс первого подходящего |
| `.findLast(fn)` | `[1,2,3].findLast(x=>x<3)` | `2` | Последний подходящий |
| `.findLastIndex(fn)` | `[1,2,3].findLastIndex(x=>x<3)` | `1` | Индекс последнего подходящего |
| `.some(fn)` | `[1,2,3].some(x=>x>2)` | `true` | Хотя бы один удовлетворяет |
| `.every(fn)` | `[1,2,3].every(x=>x>0)` | `true` | Все удовлетворяют |
| `.includes(v)` | `[1,2,NaN].includes(NaN)` | `true` | Содержит значение (SameValueZero) |
| `.indexOf(v)` | `[1,2,3].indexOf(2)` | `1` | Индекс первого === совпадения, -1 нет |
| `.lastIndexOf(v)` | `[1,2,1].lastIndexOf(1)` | `2` | Индекс последнего === совпадения |
| `.flat(depth)` | `[1,[2,[3]]].flat(Infinity)` | `[1,2,3]` | Выпрямить вложенность |
| `.flatMap(fn)` | `[1,2].flatMap(x=>[x,x*2])` | `[1,2,2,4]` | map + flat(1) |
| `.slice(s,e)` | `[1,2,3,4].slice(1,3)` | `[2,3]` | Подмассив [s, e) |
| `.concat(...arr)` | `[1,2].concat([3],[4,5])` | `[1,2,3,4,5]` | Объединить массивы |
| `.join(sep)` | `[1,2,3].join("-")` | `"1-2-3"` | Соединить в строку |
| `.toString()` | `[1,2,3].toString()` | `"1,2,3"` | В строку (join с ",") |
| `.at(i)` | `[1,2,3].at(-1)` | `3` | Элемент по индексу, поддерживает отрицательные |
| `.keys()` | `[...['a','b'].keys()]` | `[0,1]` | Итератор индексов |
| `.values()` | `[...['a','b'].values()]` | `["a","b"]` | Итератор значений |
| `.entries()` | `[...['a','b'].entries()]` | `[[0,"a"],[1,"b"]]` | Итератор [индекс, значение] |
| `.forEach(fn)` | `[1,2].forEach(x=>console.log(x))` | `undefined` | Итерация (нет break, нет return) |
| `Array.from(it,fn)` | `Array.from({length:3},(_,i)=>i)` | `[0,1,2]` | Из итерируемого или array-like |
| `Array.isArray(v)` | `Array.isArray([])` | `true` | Проверка массива |
| `Array.of(...v)` | `Array.of(1,2,3)` | `[1,2,3]` | Создать массив из аргументов |

### ES2023 немутирующие

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `.toSorted(fn)` | `[3,1,2].toSorted((a,b)=>a-b)` | `[1,2,3]` | Немутирующий sort |
| `.toReversed()` | `[1,2,3].toReversed()` | `[3,2,1]` | Немутирующий reverse |
| `.toSpliced(s,d,...i)` | `[1,2,3].toSpliced(1,1,9)` | `[1,9,3]` | Немутирующий splice |
| `.with(i,v)` | `[1,2,3].with(1,9)` | `[1,9,3]` | Немутирующая замена по индексу |

---

## Object

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `Object.keys(o)` | `Object.keys({a:1,b:2})` | `["a","b"]` | Собственные перечислимые ключи |
| `Object.values(o)` | `Object.values({a:1,b:2})` | `[1,2]` | Собственные перечислимые значения |
| `Object.entries(o)` | `Object.entries({a:1,b:2})` | `[["a",1],["b",2]]` | Собственные перечислимые [ключ, значение] |
| `Object.fromEntries(it)` | `Object.fromEntries([["a",1]])` | `{a:1}` | Создать объект из итерируемого [[k,v]] |
| `Object.assign(t,...s)` | `Object.assign({},{a:1},{b:2})` | `{a:1,b:2}` | Shallow copy / merge. Мутирует target! |
| `Object.create(proto)` | `Object.create({hi(){return 1}})` | `{}` | Создать объект с заданным прототипом |
| `Object.freeze(o)` | `Object.freeze({x:1})` | объект | Запретить мутации (shallow) |
| `Object.seal(o)` | `Object.seal({x:1})` | объект | Запретить добавление/удаление свойств |
| `Object.isFrozen(o)` | `Object.isFrozen(Object.freeze({}))` | `true` | Проверка: заморожен ли |
| `Object.isSealed(o)` | `Object.isSealed(Object.seal({}))` | `true` | Проверка: запечатан ли |
| `Object.defineProperty(o,k,d)` | `Object.defineProperty(o,"x",{value:1,writable:false})` | — | Определить свойство с дескриптором |
| `Object.defineProperties(o,ds)` | `Object.defineProperties(o,{x:{value:1}})` | — | Определить несколько свойств |
| `Object.getOwnPropertyDescriptor(o,k)` | `Object.getOwnPropertyDescriptor({x:1},"x")` | `{value:1,writable:true,...}` | Получить дескриптор свойства |
| `Object.getOwnPropertyDescriptors(o)` | `Object.getOwnPropertyDescriptors({x:1})` | `{x:{...}}` | Все дескрипторы |
| `Object.getOwnPropertyNames(o)` | `Object.getOwnPropertyNames({x:1})` | `["x"]` | Все собственные ключи (включая non-enumerable) |
| `Object.getOwnPropertySymbols(o)` | `Object.getOwnPropertySymbols(o)` | `[Symbol...]` | Все Symbol-ключи объекта |
| `Object.getPrototypeOf(o)` | `Object.getPrototypeOf([])` | `Array.prototype` | Прототип объекта |
| `Object.setPrototypeOf(o,p)` | `Object.setPrototypeOf(o, proto)` | — | Установить прототип (медленно!) |
| `Object.is(a,b)` | `Object.is(NaN,NaN)` | `true` | SameValue сравнение (NaN===NaN, -0≠+0) |
| `Object.hasOwn(o,k)` | `Object.hasOwn({a:1},"a")` | `true` | Собственное свойство (лучше чем hasOwnProperty) |
| `o.hasOwnProperty(k)` | `{a:1}.hasOwnProperty("a")` | `true` | Собственное свойство (старый вариант) |
| `k in o` | `"a" in {a:1}` | `true` | Свойство в объекте или цепочке прототипов |
| `o instanceof C` | `[] instanceof Array` | `true` | Проверка через prototype chain |

---

## Number / Math

### Number

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `Number.isNaN(v)` | `Number.isNaN(NaN)` | `true` | Строгая проверка NaN (без приведения) |
| `Number.isFinite(v)` | `Number.isFinite(Infinity)` | `false` | Конечное число (без приведения) |
| `Number.isInteger(v)` | `Number.isInteger(1.0)` | `true` | Целое число |
| `Number.isSafeInteger(v)` | `Number.isSafeInteger(2**53)` | `false` | В диапазоне -(2⁵³-1)...(2⁵³-1) |
| `Number.parseInt(s,r)` | `Number.parseInt("ff",16)` | `255` | Разбор целого с radix |
| `Number.parseFloat(s)` | `Number.parseFloat("3.14")` | `3.14` | Разбор числа с плавающей точкой |
| `Number.EPSILON` | `Number.EPSILON` | `2.22e-16` | Наименьшая разница между float |
| `Number.MAX_SAFE_INTEGER` | `Number.MAX_SAFE_INTEGER` | `9007199254740991` | 2⁵³-1 |
| `Number.MAX_VALUE` | `Number.MAX_VALUE` | `1.79e+308` | Наибольшее представимое число |
| `.toFixed(n)` | `(3.14159).toFixed(2)` | `"3.14"` | Строка с n знаками после запятой |
| `.toPrecision(n)` | `(123.456).toPrecision(5)` | `"123.46"` | Строка с n значимыми цифрами |
| `.toString(r)` | `(255).toString(16)` | `"ff"` | Строка в заданном radix |
| `.toLocaleString(l)` | `(1234567).toLocaleString("ru")` | `"1 234 567"` | Строка с локализацией |

### Math

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `Math.abs(x)` | `Math.abs(-5)` | `5` | Модуль числа |
| `Math.floor(x)` | `Math.floor(3.9)` | `3` | Округление вниз |
| `Math.ceil(x)` | `Math.ceil(3.1)` | `4` | Округление вверх |
| `Math.round(x)` | `Math.round(3.5)` | `4` | Округление по правилам математики |
| `Math.trunc(x)` | `Math.trunc(-3.9)` | `-3` | Отбросить дробную часть |
| `Math.sign(x)` | `Math.sign(-5)` | `-1` | 1, 0, -1 в зависимости от знака |
| `Math.max(...v)` | `Math.max(1,5,3)` | `5` | Максимум из аргументов |
| `Math.min(...v)` | `Math.min(1,5,3)` | `1` | Минимум из аргументов |
| `Math.pow(b,e)` | `Math.pow(2,10)` | `1024` | b в степени e (лучше `**`) |
| `Math.sqrt(x)` | `Math.sqrt(16)` | `4` | Квадратный корень |
| `Math.cbrt(x)` | `Math.cbrt(27)` | `3` | Кубический корень |
| `Math.hypot(...v)` | `Math.hypot(3,4)` | `5` | √(x²+y²+...) |
| `Math.random()` | `Math.random()` | `0..1` | Случайное [0, 1) |
| `Math.log(x)` | `Math.log(Math.E)` | `1` | Натуральный логарифм |
| `Math.log2(x)` | `Math.log2(1024)` | `10` | Логарифм по основанию 2 |
| `Math.log10(x)` | `Math.log10(1000)` | `3` | Логарифм по основанию 10 |
| `Math.clz32(x)` | `Math.clz32(1)` | `31` | Ведущие нули в 32-bit |
| `Math.imul(a,b)` | `Math.imul(3,4)` | `12` | 32-bit целочисленное умножение |
| `Math.fround(x)` | `Math.fround(1.337)` | `1.3370000124...` | Ближайшее 32-bit float |
| `Math.PI` | `Math.PI` | `3.14159...` | Константа π |
| `Math.E` | `Math.E` | `2.71828...` | Константа e |
| `Math.LN2` | `Math.LN2` | `0.693...` | ln(2) |

---

## Map / Set

### Map

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `new Map(it?)` | `new Map([["a",1]])` | `Map {"a"=>1}` | Создать Map |
| `.set(k,v)` | `m.set("x", 1)` | `Map` (сам) | Добавить/обновить запись, возвращает Map |
| `.get(k)` | `m.get("x")` | `1` | Получить значение |
| `.has(k)` | `m.has("x")` | `true` | Проверить наличие ключа |
| `.delete(k)` | `m.delete("x")` | `true` | Удалить ключ, вернуть успех |
| `.clear()` | `m.clear()` | `undefined` | Очистить Map |
| `.size` | `m.size` | `n` | Количество записей |
| `.keys()` | `[...m.keys()]` | `[...]` | Итератор ключей |
| `.values()` | `[...m.values()]` | `[...]` | Итератор значений |
| `.entries()` | `[...m.entries()]` | `[[k,v],...]` | Итератор [ключ, значение] |
| `.forEach(fn)` | `m.forEach((v,k)=>...)` | `undefined` | Обход (порядок: value, key!) |

### Set

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `new Set(it?)` | `new Set([1,2,2,3])` | `Set {1,2,3}` | Создать Set (уникальные значения) |
| `.add(v)` | `s.add(4)` | `Set` (сам) | Добавить значение |
| `.has(v)` | `s.has(2)` | `true` | Проверить наличие |
| `.delete(v)` | `s.delete(2)` | `true` | Удалить, вернуть успех |
| `.clear()` | `s.clear()` | `undefined` | Очистить Set |
| `.size` | `s.size` | `n` | Количество элементов |
| `.values()` | `[...s.values()]` | `[...]` | Итератор значений (то же что .keys()) |
| `.forEach(fn)` | `s.forEach(v=>...)` | `undefined` | Обход |

### WeakMap / WeakRef

| | WeakMap | WeakSet |
|---|---|---|
| Ключи | Объекты | Объекты |
| GC | Не мешает | Не мешает |
| Итерируем | ❌ | ❌ |
| `.size` | ❌ | ❌ |
| Применение | Приватные данные | Отслеживание объектов |

---

## JSON

| Метод | Пример | Результат | Описание |
|-------|--------|-----------|----------|
| `JSON.stringify(v,r,s)` | `JSON.stringify({a:1})` | `'{"a":1}'` | Сериализация в строку |
| `JSON.stringify(v,null,2)` | — | Форматированный JSON | 3-й аргумент — отступ |
| `JSON.stringify(v,[keys])` | `JSON.stringify(o,["a"])` | Только ключ "a" | 2-й аргумент — whitelist ключей |
| `JSON.stringify(v,replacer)` | `JSON.stringify(o,(k,v)=>...)` | Трансформированный | 2-й аргумент — функция замены |
| `JSON.parse(s,r?)` | `JSON.parse('{"a":1}')` | `{a:1}` | Парсинг JSON строки |
| `JSON.parse(s,reviver)` | `JSON.parse(s,(k,v)=>...)` | Трансформированный | Reviver вызывается для каждой пары |

**Что не сериализуется через JSON.stringify:**

```javascript
JSON.stringify({ fn: () => {}, sym: Symbol(), undef: undefined, inf: Infinity, nan: NaN })
// { }  — все эти поля пропускаются (или заменяются на null для Infinity/NaN)
// Исключение: в массивах undefined/fn/Symbol → null
```

---

## Date

Краткий справочник (для полного изучения — отдельный модуль):

| Метод | Результат | Описание |
|-------|-----------|----------|
| `new Date()` | Текущий момент | |
| `new Date(ms)` | Дата из Unix ms | |
| `Date.now()` | `1708780800000` | Unix timestamp в миллисекундах |
| `Date.parse(s)` | ms | Парсинг строки ISO |
| `.getFullYear()` | `2025` | Год |
| `.getMonth()` | `0-11` | Месяц (0 = Январь!) |
| `.getDate()` | `1-31` | День месяца |
| `.getDay()` | `0-6` | День недели (0 = Воскресенье!) |
| `.getHours/Minutes/Seconds/Milliseconds()` | — | Время |
| `.getTime()` | ms | Unix timestamp |
| `.toISOString()` | `"2025-01-01T00:00:00.000Z"` | ISO 8601 строка |
| `.toLocaleDateString(l)` | `"01.01.2025"` | Локализованная дата |
| `.toLocaleString(l,opts)` | `"1 января 2025 г."` | Полная локализация |

---

## Примеры кода

```bash
node 03-javascript/08-builtins-reference/examples/strings.js
node 03-javascript/08-builtins-reference/examples/arrays.js
node 03-javascript/08-builtins-reference/examples/objects.js
node 03-javascript/08-builtins-reference/examples/numbers.js
node 03-javascript/08-builtins-reference/examples/misc.js
```

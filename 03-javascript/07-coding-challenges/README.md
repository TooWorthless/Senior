# 07 · Coding Challenges

[← JavaScript](../README.md)

Практические задачи с оптимальными решениями. Каждая задача — **O(n) или O(n log n)** максимум. Никакого `filter().map()` если задача решается за один проход.

```bash
# Запустить все задачи
node 03-javascript/07-coding-challenges/examples/challenges.js

# Запустить конкретную группу
node 03-javascript/07-coding-challenges/examples/strings.js
node 03-javascript/07-coding-challenges/examples/numbers.js
```

---

## Задачи

### Строки
| Задача | Сложность | Паттерн |
|--------|-----------|---------|
| FizzBuzz | O(n) | Один проход |
| Палиндром | O(n) | Two Pointers |
| Анаграмма | O(n) | HashMap |
| Реверс строки | O(n) | Two Pointers |
| Найти все анаграммы в строке | O(n) | Sliding Window |
| Сжатие строки | O(n) | Один проход |
| Валидные скобки | O(n) | Stack |

### Числа и математика
| Задача | Сложность | Паттерн |
|--------|-----------|---------|
| Числа Фибоначчи | O(n) | Итерация |
| Простое число | O(√n) | Математика |
| Решето Эратосфена | O(n log log n) | Решето |
| Целочисленный разворот | O(log n) | Математика |
| Является ли степенью 2 | O(1) | Битовые операции |

### Массивы
| Задача | Сложность | Паттерн |
|--------|-----------|---------|
| Two Sum | O(n) | HashMap |
| Продукт кроме себя | O(n) | Prefix/Suffix |
| Максимальная подпоследовательность (Kadane) | O(n) | DP |
| Дубликат в массиве | O(n) | HashMap / Floyd |
| Rotate Array | O(n) | Reversal |
| Move Zeros | O(n) | Two Pointers |
| Merge Intervals | O(n log n) | Sort + Merge |

### Объекты и структуры
| Задача | Сложность | Паттерн |
|--------|-----------|---------|
| Deep equal | O(n) | Рекурсия |
| Flatten объекта | O(n) | Рекурсия |
| Глубокий merge | O(n) | Рекурсия |
| LRU Cache | O(1) | HashMap + DLL |

# Code Review Report — udacity/cd14715-simple-todo-app#2

**Overall score:** 48/100

## src/todo.ts

### Code quality
The three added search helpers introduce direct SQL string interpolation in database queries.

### Test coverage
Existing todo tests do not provide sufficient evidence for the three new query helpers; behavior and security properties need regression tests.

### Refactoring
The primary refactoring is to align the new functions with the module’s existing parameterized-query design.

## Recommendations

1. **critical — SQL injection:** Replace all three direct SQL interpolations with parameterized queries. — `src/todo.ts`
2. **high — test coverage:** Add regression tests for search, status filtering, user filtering, and injection-like inputs. — `src/todo.ts, src/todo.test.ts`

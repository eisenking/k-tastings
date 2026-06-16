# PostgreSQL MCP (Postgres MCP Pro)

Агент может запрашивать схему и данные из **локальной dev-БД** прямо в чате.

Сервер: [crystaldba/postgres-mcp](https://github.com/crystaldba/postgres-mcp) v0.3.0 (MIT, активно поддерживается).  
Режим: **`restricted`** — read-only с защитами, не deprecated npm-пакет.

## Файлы

| Файл | Назначение |
|------|------------|
| `.cursor/mcp.json` | Конфиг Cursor (без секретов) |
| `.cursor/run-postgres-mcp.ps1` | Читает `DATABASE_URL` из `.env`, запускает MCP |
| `.cursor/setup-postgres-mcp.ps1` | Одноразовая установка в venv |
| `.cursor/postgres-mcp-venv/` | Python venv (в gitignore) |

## Первая установка (один раз)

```powershell
# из корня проекта
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/setup-postgres-mcp.ps1
```

Требуется **Python 3.12+** (у тебя уже есть).

## Включение в Cursor

1. В `.env` должен быть `DATABASE_URL` (тот же, что для Drizzle / `npm run dev`).
2. **Полностью перезапусти Cursor** (MCP не hot-reload).
3. **Settings → Tools & MCP** → сервер **postgres** → включить.
4. Статус: connected. Ошибки — **Output → MCP**.

## Проверка

В Agent mode:

> Покажи список таблиц в БД  
> Сколько записей в products?

Агент должен вызвать инструменты postgres MCP.

## Безопасность

- Секреты **только в `.env`**, не в `mcp.json`.
- Режим `restricted` — без записи в БД через MCP.
- Только **локальная dev-БД**, не production.
- Опционально: отдельный PostgreSQL-пользователь с правами `SELECT` only.

## Если не работает

| Симптом | Решение |
|---------|---------|
| `postgres-mcp не установлен` | Запусти `setup-postgres-mcp.ps1` |
| `DATABASE_URL не задан` | Заполни `.env` |
| Ошибка подключения | PostgreSQL запущен? База из URL существует? |
| Сервер не в списке | Перезапусти Cursor |

## Переустановка

```powershell
Remove-Item -Recurse -Force .cursor\postgres-mcp-venv
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor\setup-postgres-mcp.ps1
```

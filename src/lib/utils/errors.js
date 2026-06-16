export class ActionError extends Error {
    constructor(message, { code = "ACTION_ERROR", status = 400, meta } = {}) {
        super(message);
        this.name = "ActionError";
        this.code = code;
        this.status = status;
        this.meta = meta;
    }
}

export class UnauthorizedError extends ActionError {
    constructor(message = "Не авторизован") {
        super(message, { code: "UNAUTHORIZED", status: 401 });
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends ActionError {
    constructor(message = "Нет доступа") {
        super(message, { code: "FORBIDDEN", status: 403 });
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends ActionError {
    constructor(message = "Не найдено") {
        super(message, { code: "NOT_FOUND", status: 404 });
        this.name = "NotFoundError";
    }
}

export class ValidationError extends ActionError {
    constructor(message = "Некорректные данные", fieldErrors) {
        super(message, { code: "VALIDATION", status: 422, meta: { fieldErrors } });
        this.name = "ValidationError";
    }
}

export class ConflictError extends ActionError {
    constructor(message = "Конфликт данных") {
        super(message, { code: "CONFLICT", status: 409 });
        this.name = "ConflictError";
    }
}
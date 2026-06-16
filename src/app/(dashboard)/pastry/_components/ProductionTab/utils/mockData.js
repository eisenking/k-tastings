function pad2(n) {
    return String(n).padStart(2, "0");
}

function toISODateLocal(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysLocal(d, days) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function normalizeName(s) {
    return String(s || "").trim().toLowerCase();
}

function findRecipeIdByName(recipesById, name) {
    const q = normalizeName(name);
    if (!q) return null;

    for (const [id, r] of recipesById.entries()) {
        const n = normalizeName(r?.name);
        if (n === q) return id;
    }
    return null;
}

export function generateMockOrdersWeek(recipesById) {
    const today = new Date();
    const fillings = ["Банановый брауни", "Панчо", "Рафаэлло"];

    const ids = fillings.map((nm) => ({
        name: nm,
        recipeId: findRecipeIdByName(recipesById, nm) || `mock_${normalizeName(nm)}`,
    }));

    const baseKgByName = {
        "Банановый брауни": [2.0, 1.5, 2.5, 1.0, 2.0, 3.0, 1.5],
        "Панчо": [1.5, 2.0, 1.0, 2.5, 1.5, 2.0, 1.0],
        "Рафаэлло": [1.0, 1.5, 2.0, 1.5, 1.0, 2.5, 2.0],
    };

    const orders = [];
    for (let i = 0; i < 7; i++) {
        const date = toISODateLocal(addDaysLocal(today, i));

        for (const x of ids) {
            const arr = baseKgByName[x.name] || [1, 1, 1, 1, 1, 1, 1];
            const kg = arr[i] ?? 1;

            orders.push({
                date,
                recipeId: x.recipeId,
                kg,
                name: x.name,
            });
        }
    }

    return orders;
}
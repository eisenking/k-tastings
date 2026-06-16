"use server";

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schemas/auth/auth";
import { desc } from "drizzle-orm";
import { getAdminSession } from "./_shared";

export async function getUsers() {
    await getAdminSession();

    const users = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            banned: user.banned,
            createdAt: user.createdAt,
            username: user.username,
        })
        .from(user)
        .orderBy(desc(user.createdAt));

    return users;
}
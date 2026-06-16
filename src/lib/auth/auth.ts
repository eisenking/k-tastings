import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema"
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema
    }),
    emailAndPassword: {  
        enabled: true
    },
    plugins: [
        admin(), username()
    ]
});
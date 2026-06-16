// export default function UsersTab() {
//     return (
//         <div>UsersTab</div>
//     )
// }

import { getUsers } from  "@/actions/admin/users/getUsers";
import UsersList from "./UsersList";

export default async function UsersTab() {
    const users = await getUsers();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Пользователи</h2>
                <p className="text-sm text-muted-foreground">
                    Всего пользователей: {users.length}
                </p>
            </div>
            <UsersList users={users} />
        </div>
    );
}
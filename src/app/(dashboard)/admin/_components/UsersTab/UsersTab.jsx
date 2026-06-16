import { getUsers } from "@/actions/admin/users/getUsers";
import UsersTable from "./UsersTable";
import CreateUserDialog from "./CreateUserDialog";

export default async function UsersTab() {
    const users = await getUsers();

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <CreateUserDialog />
            </div>

            <UsersTable users={users} />
        </div>
    );
}
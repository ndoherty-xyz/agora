import { provider, SERVER_URL } from "@/lib/ydoc";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";

type User = {
  name: string;
  color: `#${string}`;
  avatar?: string;
};

export const Users = () => {
  const { xUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = provider.awareness?.getStates().values() ?? [];

      const newUsers: User[] = [];
      for (const state of states) {
        if ("user" in state) {
          newUsers.push(state.user);
        }
      }

      setUsers(newUsers);
    };

    updateUsers();
    provider.awareness?.on("change", updateUsers);

    return () => {
      provider.awareness?.off("change", updateUsers);
    };
  }, []);

  const visible = users.slice(0, 5);
  const overflow = users.length - 5;

  return (
    <div className="fixed top-6 right-6 flex flex-col items-end gap-3">
      <div className="flex -space-x-2">
        {visible.map((u, i) => (
          <div key={i} className="relative group">
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={u.name}
                className="w-8 h-8 rounded-full border shadow-xs border-black/5"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full border shadow-xs border-black/5"
                style={{ backgroundColor: u.color }}
              />
            )}
            <span className="absolute shadow-xs top-full mt-1 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {u.name}
            </span>
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span className="text-xs text-gray-500">+{overflow} more</span>
      )}

      {xUser ? (
        <button
          onClick={logout}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          logout @{xUser.handle}
        </button>
      ) : (
        <a
          href={`http://${SERVER_URL}/api/auth/x`}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          link twitter
        </a>
      )}
    </div>
  );
};

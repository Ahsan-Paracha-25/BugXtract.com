import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
import { AdminEditor } from "./editor";

export const dynamic = "force-dynamic";
const ADMIN_USER_ID = "06db3a2a-3a08-41a3-a289-8ccb9af32a97";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) return <main className="admin-shell"><section className="admin-card"><p className="admin-kicker">BugXtract.com</p><h1>Admin sign in</h1><p>Sign in with your authorized ChatGPT account to manage website plans.</p><a className="admin-button" href={chatGPTSignInPath("/admin")} target="_top">Sign in with ChatGPT</a><a className="admin-back" href="/">Back to website</a></section></main>;
  if (user.userId !== ADMIN_USER_ID) return <main className="admin-shell"><section className="admin-card"><p className="admin-kicker">Access restricted</p><h1>Admin access required</h1><p>This account is not authorized to change BugXtract.com pricing.</p><a className="admin-back" href="/">Back to website</a></section></main>;
  return <AdminEditor />;
}

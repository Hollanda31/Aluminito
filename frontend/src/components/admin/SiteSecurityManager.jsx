import { useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import AdminHelp from "@/components/admin/AdminHelp";

const field = "mt-1 w-full rounded-lg border border-white/10 bg-graphite px-3 py-2.5 text-sm text-white outline-none focus:border-azul";
const PERMISSION_OPTIONS = [
    ["atendimentos", "Atendimentos"], ["relatorios", "Visão geral"], ["avaliacoes", "Avaliações"],
    ["aviso", "Aviso do site"], ["contato", "Contato e horário"], ["projetos", "Obras e galeria"],
    ["catalogo", "Catálogo de cores"], ["lixeira", "Lixeira"], ["auditoria", "Histórico"],
];

export default function SiteSecurityManager({ usuario }) {
    const canManageSite = ["aviso", "contato"].some((permission) => usuario?.permissions?.includes(permission));
    const canManageUsers = usuario?.permissions?.includes("usuarios");
    const canManagePermissions = usuario?.permissions?.includes("permissoes");
    const canManageSessions = ["chefe", "admin"].includes(usuario?.role);
    const [config, setConfig] = useState({ whatsapp: "", whatsapp_display: "", horario: "" });
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const [password, setPassword] = useState({ senha_atual: "", senha_nova: "" });
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState({ gerente: [], atendente: ["atendimentos"] });
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "atendente" });

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/site-config")).then(({ data }) => setConfig(data)).catch(() => {});
        if (canManageUsers) loadUsers();
        if (canManageSessions) loadSessions();
        if (canManagePermissions) withAuthRefresh(() => authApi.get("/api/admin/role-permissions")).then(({ data }) => setRolePermissions(data.roles)).catch(() => {});
    }, [usuario?.role]);
    const loadUsers = () => withAuthRefresh(() => authApi.get("/api/admin/users")).then(({ data }) => setUsers(data)).catch(() => {});
    const loadSessions = () => withAuthRefresh(() => authApi.get("/api/admin/sessions")).then(({ data }) => setSessions(data)).catch(() => setMsg("Não foi possível carregar as sessões."));
    const saveConfig = async (e) => {
        e.preventDefault(); setBusy(true); setMsg("");
        try { const { data } = await withAuthRefresh(() => authApi.put("/api/admin/site-config", config)); setConfig(data); window.dispatchEvent(new Event("site-config-updated")); setMsg("Telefone e horário atualizados no site."); }
        catch { setMsg("Não foi possível salvar os dados de contato."); }
        finally { setBusy(false); }
    };
    const changePassword = async (e) => {
        e.preventDefault(); setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.post("/api/auth/change-password", password)); setPassword({ senha_atual: "", senha_nova: "" }); setMsg("Senha alterada com sucesso."); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível alterar a senha."); }
        finally { setBusy(false); }
    };
    const createUser = async (e) => {
        e.preventDefault(); setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.post("/api/admin/users", newUser)); setNewUser({ name: "", email: "", password: "", role: "atendente" }); await loadUsers(); setMsg("Acesso criado."); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível criar o acesso."); }
        finally { setBusy(false); }
    };
    const deleteUser = async (id) => {
        if (!window.confirm("Remover o acesso deste usuário?")) return;
        try { await withAuthRefresh(() => authApi.delete(`/api/admin/users/${id}`)); await loadUsers(); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível remover o acesso."); }
    };
    const setUserActive = async (user) => {
        const active = !user.active;
        const message = active
            ? `Reativar o acesso de ${user.name}?`
            : `Desativar o acesso de ${user.name}? As sessões abertas serão encerradas.`;
        if (!window.confirm(message)) return;
        setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.patch(`/api/admin/users/${user.id}/active`, { active })); await loadUsers(); if (!active) await loadSessions(); setMsg(active ? "Acesso reativado." : "Acesso desativado e sessões encerradas."); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível atualizar o acesso."); }
        finally { setBusy(false); }
    };
    const revokeSession = async (session) => {
        if (!window.confirm(`Encerrar a sessão de ${session.user.name} neste dispositivo?`)) return;
        setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.delete(`/api/admin/sessions/${session.id}`)); await loadSessions(); setMsg("Sessão encerrada."); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível encerrar a sessão."); }
        finally { setBusy(false); }
    };
    const setPermission = (userId, permission, enabled) => setUsers((all) => all.map((u) => u.id === userId ? { ...u, permissions: enabled ? [...new Set([...(u.permissions || []), permission])] : (u.permissions || []).filter((p) => p !== permission) } : u));
    const savePermissions = async (user) => {
        setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.patch(`/api/admin/users/${user.id}/permissions`, { permissions: user.permissions || [] })); await loadUsers(); setMsg(`Permissões de ${user.name} salvas.`); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível salvar as permissões."); }
        finally { setBusy(false); }
    };
    const saveRolePermissions = async () => {
        setBusy(true); setMsg("");
        try { const { data } = await withAuthRefresh(() => authApi.put("/api/admin/role-permissions", { roles: rolePermissions })); setRolePermissions(data.roles); await loadUsers(); setMsg("Permissões padrão dos cargos atualizadas."); }
        catch (err) { setMsg(err.response?.data?.detail || "Não foi possível salvar as permissões por cargo."); }
        finally { setBusy(false); }
    };

    return <div className="grid gap-5 lg:grid-cols-2">
        <AdminHelp className="lg:col-span-2">Cadastre acessos individuais para a equipe. O chefe pode desativar usuários e encerrar sessões conectadas. Confirme antes de publicar ou remover itens: essas ações podem afetar o site e outros usuários.</AdminHelp>
        {canManageSite && <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Contato e horário</h2>
            <p className="mt-1 text-sm text-silver/60">Uma alteração atualiza os links e os dados do rodapé e da seção Contato.</p>
            <form onSubmit={saveConfig} className="mt-5 space-y-4">
                <label className="block text-xs text-silver/70">WhatsApp com código do país e DDD<input required value={config.whatsapp} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} className={field} placeholder="5527999999999" /></label>
                <label className="block text-xs text-silver/70">Número exibido no site<input required value={config.whatsapp_display} onChange={(e) => setConfig({ ...config, whatsapp_display: e.target.value })} className={field} /></label>
                <label className="block text-xs text-silver/70">Horário de atendimento<textarea required rows={3} value={config.horario} onChange={(e) => setConfig({ ...config, horario: e.target.value })} className={field} /></label>
                <button disabled={busy} className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold">Salvar contato</button>
            </form>
        </section>}
        <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Trocar minha senha</h2>
            <p className="mt-1 text-sm text-silver/60">Use uma senha nova com pelo menos 10 caracteres.</p>
            <form onSubmit={changePassword} className="mt-5 space-y-4">
                <label className="block text-xs text-silver/70">Senha atual<input required type="password" autoComplete="current-password" value={password.senha_atual} onChange={(e) => setPassword({ ...password, senha_atual: e.target.value })} className={field} /></label>
                <label className="block text-xs text-silver/70">Nova senha<input required minLength={10} type="password" autoComplete="new-password" value={password.senha_nova} onChange={(e) => setPassword({ ...password, senha_nova: e.target.value })} className={field} /></label>
                <button disabled={busy} className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold">Alterar senha</button>
            </form>
        </section>
        {canManageUsers && <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7 lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">Usuários do painel</h2>
            <p className="mt-1 text-sm text-silver/60">Atendentes acessam somente a lista e o acompanhamento de atendimentos.</p>
            {canManagePermissions && <details open className="mt-4 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold">Definir permissões padrão por cargo</summary><div className="mt-4 grid gap-5 md:grid-cols-2">{["gerente", "atendente"].map((role) => <div key={role}><h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-azul">{role}</h3><div className="grid gap-2">{PERMISSION_OPTIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs text-silver/70"><input type="checkbox" checked={(rolePermissions[role] || []).includes(key)} disabled={key === "atendimentos"} onChange={(e) => setRolePermissions((all) => ({ ...all, [role]: e.target.checked ? [...new Set([...(all[role] || []), key])] : (all[role] || []).filter((p) => p !== key) }))} />{label}</label>)}</div></div>)}</div><button onClick={saveRolePermissions} disabled={busy} className="mt-4 rounded-full bg-azul px-4 py-2 text-xs font-semibold">Salvar permissões dos cargos</button></details>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{users.map((u) => <div key={u.id} className={`rounded-lg border px-3 py-3 ${u.active === false ? "border-red-400/20 opacity-60" : "border-white/10"}`}><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm">{u.name} {u.active === false && <span className="text-red-200">· Desativado</span>}</p><p className="truncate text-xs text-silver/50">{u.email} · {({ chefe: "Chefe", gerente: "Gerente", atendente: "Atendente", admin: "Chefe" })[u.role] || "Atendente"}</p></div>{canManageSessions && <button onClick={() => setUserActive(u)} disabled={busy || u.id === usuario?.id} className="text-xs text-azul disabled:opacity-40">{u.active === false ? "Reativar" : "Desativar"}</button>}<button onClick={() => deleteUser(u.id)} disabled={u.id === usuario?.id || ((u.role === "chefe" || u.role === "admin") && usuario?.role !== "chefe")} className="text-xs text-red-200 disabled:opacity-40">Remover</button></div>{canManagePermissions && u.role !== "chefe" && u.role !== "admin" && <details className="mt-3"><summary className="cursor-pointer text-xs text-azul">Permissões por área</summary><div className="mt-2 grid gap-2">{PERMISSION_OPTIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs text-silver/70"><input type="checkbox" checked={(u.permissions || []).includes(key)} onChange={(e) => setPermission(u.id, key, e.target.checked)} />{label}</label>)}</div><button onClick={() => savePermissions(u)} disabled={busy} className="mt-3 rounded-full border border-white/20 px-3 py-1.5 text-xs">Salvar permissões</button></details>}</div>)}</div>
            <form onSubmit={createUser} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <input required minLength={2} aria-label="Nome" placeholder="Nome" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className={field} />
                <input required type="email" aria-label="E-mail" placeholder="E-mail" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={field} />
                <input required minLength={10} type="password" aria-label="Senha inicial" placeholder="Senha inicial (10+ caracteres)" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={field} />
                <select aria-label="Cargo" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={field}><option value="atendente">Atendente</option><option value="gerente">Gerente</option>{usuario?.role === "chefe" && <option value="chefe">Chefe</option>}</select>
                <button disabled={busy} className="rounded-full bg-azul px-4 py-2.5 text-sm font-semibold">Criar acesso</button>
            </form>
        </section>}
        {canManageSessions && <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7 lg:col-span-2">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Sessões conectadas</h2><p className="mt-1 text-sm text-silver/60">Encerre o acesso de um dispositivo sem trocar a senha de toda a equipe.</p></div><button type="button" onClick={loadSessions} className="rounded-full border border-white/20 px-4 py-2 text-sm">Atualizar</button></div>
            {sessions.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{sessions.map((session) => <li key={session.id} className="rounded-lg border border-white/10 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{session.user.name}</p><p className="truncate text-xs text-silver/50">{session.user.email} · {session.user.role}</p><p className="mt-2 text-xs text-silver/60">Último acesso: {session.last_seen ? new Date(session.last_seen).toLocaleString("pt-BR") : "—"}</p><p className="text-[11px] text-silver/40">{session.ip || "IP indisponível"} · {(session.user_agent || "Dispositivo desconhecido").slice(0, 95)}</p></div><button type="button" onClick={() => revokeSession(session)} disabled={busy} className="text-xs text-red-200 disabled:opacity-50">Encerrar</button></div></li>)}</ul> : <p className="mt-5 text-sm text-silver/60">Nenhuma sessão conectada.</p>}
        </section>}
        <p role="status" className="text-sm text-silver/70 lg:col-span-2">{msg}</p>
    </div>;
}

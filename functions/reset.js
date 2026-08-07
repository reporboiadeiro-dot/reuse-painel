import { fetchFromSupabase, validateApiKey, validateToken, corsHeaders } from './utils.js';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };
  try {
    if (!await validateApiKey(event)) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'API Key invalida' }) };
    const userId = validateToken(event);
    if (!userId) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Token invalido' }) };
    const { app_package, device_id } = JSON.parse(event.body || '{}');
    if (!app_package || !device_id) return { statusCode: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Dados obrigatorios' }) };
    const { data: apps } = await fetchFromSupabase('apps', 'GET', null, `?package_name=eq.${app_package}&active=eq.true&select=*`);
    if (!apps || apps.length === 0) return { statusCode: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'App nao encontrado' }) };
    const { data: users } = await fetchFromSupabase('users', 'GET', null, `?id=eq.${userId}&select=*`);
    if (!users || users.length === 0) return { statusCode: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Usuario nao encontrado' }) };
    const user = users[0];
    if (!user.active) return { statusCode: 403, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Conta desativada' }) };
    if (user.credits <= 0) return { statusCode: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Creditos insuficientes' }) };
    const newCredits = user.credits - 1;
    await fetchFromSupabase('users', 'PATCH', { credits: newCredits }, `?id=eq.${userId}`);
    await fetchFromSupabase('logs', 'POST', { type: 'reset', description: `Reset de "${apps[0].name}"`, credits_change: -1, user_id: userId });
    return { statusCode: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: 'Reset autorizado', app_name: apps[0].name, app_cod: apps[0].cod, credits_remaining: newCredits }) };
  } catch (error) { return { statusCode: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Erro interno' }) }; }
};

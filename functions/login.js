import { fetchFromSupabase, validateApiKey, generateToken, corsHeaders } from './utils.js';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };
  try {
    if (!await validateApiKey(event)) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'API Key invalida' }) };
    const { phone, password } = JSON.parse(event.body || '{}');
    if (!phone || !password) return { statusCode: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Preencha tudo' }) };
    const { data: users } = await fetchFromSupabase('users', 'GET', null, `?phone=eq.${phone}&select=*`);
    if (!users || users.length === 0) return { statusCode: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Usuario nao encontrado' }) };
    const user = users[0];
    if (user.password !== password) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Senha incorreta' }) };
    if (!user.active) return { statusCode: 403, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Conta desativada' }) };
    const token = generateToken(user.id);
    await fetchFromSupabase('logs', 'POST', { type: 'user_login', description: `Login por "${user.name}"`, credits_change: 0, user_id: user.id });
    return { statusCode: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, credits: user.credits } }) };
  } catch (error) { return { statusCode: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Erro interno' }) }; }
};

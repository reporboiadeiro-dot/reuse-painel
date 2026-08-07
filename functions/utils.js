export async function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Erro config');
  return { url, key };
}
export async function fetchFromSupabase(table, method = 'GET', body = null, query = '') {
  const { url, key } = await getSupabase();
  const endpoint = `${url}/rest/v1/${table}${query}`;
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': (method !== 'GET') ? 'return=representation' : 'count=exact' };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(endpoint, options);
  if (!response.ok) throw new Error(await response.text());
  if (method === 'DELETE') return { data: null };
  return { data: await response.json() };
}
export async function validateApiKey(request) {
  const k = request.headers.get('x-api-key');
  if (!k) return false;
  try { const { data } = await fetchFromSupabase('settings', 'GET', null, '?key=eq.api_key&select=value'); return data && data.length > 0 && data[0].value === k; } catch (e) { return false; }
}
export function generateToken(userId) { return Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + (30*24*60*60*1000) })).toString('base64'); }
export function validateToken(request) {
  const h = request.headers.get('authorization');
  if (!h || !h.startsWith('Bearer ')) return null;
  try { const p = JSON.parse(Buffer.from(h.replace('Bearer ', ''), 'base64').toString('utf-8')); return (p.exp && Date.now() > p.exp) ? null : p.id; } catch (e) { return null; }
}
export function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400' }; }

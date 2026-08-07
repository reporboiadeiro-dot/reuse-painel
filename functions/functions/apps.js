import { fetchFromSupabase, validateApiKey, validateToken, corsHeaders } from './utils.js';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };
  try {
    if (!await validateApiKey(event)) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'API Key invalida' }) };
    if (!validateToken(event)) return { statusCode: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Token invalido' }) };
    const { data: apps } = await fetchFromSupabase('apps', 'GET', null, '?active=eq.true&select=name,package_name,cod,link,category,icon,color&order=name.asc');
    return { statusCode: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, apps: apps || [] }) };
  } catch (error) { return { statusCode: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Erro interno' }) }; }
};

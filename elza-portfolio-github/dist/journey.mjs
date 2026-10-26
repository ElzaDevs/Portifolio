export const stops = ['sobre', 'projetos', 'tecnologias', 'trajetoria', 'contato'];
export const priorityMatrix = Object.freeze({
  baixo: { baixa: 'D', media: 'D', alta: 'C', critica: 'B' },
  medio: { baixa: 'C', media: 'C', alta: 'B', critica: 'B' },
  alto: { baixa: 'C', media: 'C', alta: 'B', critica: 'A' },
  critico: { baixa: 'B', media: 'B', alta: 'A', critica: 'A' },
});
export const priorityLabels = { A: 'crítica', B: 'alta', C: 'média', D: 'baixa' };
export const impactLabels = { baixo: 'baixo', medio: 'médio', alto: 'alto', critico: 'crítico' };
export const urgencyLabels = { baixa: 'baixa', media: 'média', alta: 'alta', critica: 'crítica' };
export function calculatePriority(impact, urgency) {
  const code = priorityMatrix[impact]?.[urgency];
  if (!code) throw new RangeError('Combinação de impacto e urgência inválida.');
  return { code, label: priorityLabels[code], explanation: `Impacto ${impactLabels[impact]} + urgência ${urgencyLabels[urgency]} → prioridade ${priorityLabels[code]}.` };
}
export function cleanIds(value, allowed) {
  return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && allowed.includes(id)))] : [];
}
export function toggleSaved(saved, id, allowed) {
  const valid = cleanIds(saved, allowed);
  if (!allowed.includes(id)) return valid;
  return valid.includes(id) ? valid.filter(item => item !== id) : [...valid, id];
}
export function readPreference(storage, key, fallback) {
  try { const value = storage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; }
}
export function savePreference(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

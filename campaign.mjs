export const OPENS_AT = Date.parse('2026-10-13T00:00:00-03:00');
// The whole final minute is included; the exclusive limit is the next midnight.
export const CLOSES_AT = Date.parse('2026-10-24T00:00:00-03:00');
export function registrationState(now = Date.now()) {
  return now < OPENS_AT ? 'before' : now >= CLOSES_AT ? 'closed' : 'open';
}
export const stateMessages = {
  before: 'As inscrições começam em 13/10/2026, às 00h, no horário de Brasília. Você já pode conhecer as regras e preparar sua ideia.',
  open: 'Inscrições abertas até 23/10/2026, às 23h59, no horário de Brasília.',
  closed: 'Inscrições encerradas. O resultado será divulgado após a rodada de apresentação das ideias.'
};
export function brasiliaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export const fieldLimits = {participante1:120,equipe:100,participante2:120,titulo:140,problema:3000,solucao:3000,usoIA:2000,impacto:2000,aplicacao:2000};
export function validateSubmission(data) {
  if (!['Individual','Dupla'].includes(data.get('tipo'))) return 'Selecione participação individual ou em dupla.';
  for (const [name, limit] of Object.entries(fieldLimits)) {
    const value = String(data.get(name) || '').trim();
    if (name === 'participante2' && data.get('tipo') === 'Individual') continue;
    if (!value || value.length > limit) return 'Preencha todos os campos obrigatórios e respeite os limites de caracteres.';
  }
  if (data.get('aceite') !== 'on') return 'Confirme o uso responsável de informações.';
  return null;
}

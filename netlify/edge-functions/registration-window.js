import {registrationState, stateMessages, validateSubmission} from '../../campaign.mjs';

// Inspect a clone so that Netlify Forms can still read the original request body.
export default async function registrationWindow(request) {
  if(request.method !== 'POST') return;
  let data;
  try { data = await request.clone().formData(); } catch { return; }
  if(data.get('form-name') !== 'prevem-lab-inscricao') return;
  const state = registrationState();
  const headers = {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'};
  if(state !== 'open') return new Response(stateMessages[state],{status:403,headers});
  const validation = validateSubmission(data);
  if(validation) return new Response(validation,{status:400,headers});
  // Returning undefined continues the request through Netlify's processing chain.
}

export const config = {path:'/*'};

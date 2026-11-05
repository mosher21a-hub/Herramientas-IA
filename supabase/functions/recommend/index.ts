// Supabase Edge Function: recommend
// Recibe { goal: string } y devuelve recomendaciones del catálogo público.
// Si hay una AI Gateway compatible con OpenAI configurada (AI_GATEWAY_API_KEY),
// usa el modelo para razonar; si no, responde { fallback: true, catalog }
// y el cliente aplica su recomendador local.
//
// Despliegue: supabase functions deploy recommend --no-verify-jwt
// Secretos:   supabase secrets set AI_GATEWAY_BASE_URL=... AI_GATEWAY_API_KEY=... AI_MODEL=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RecPayload {
  multi: boolean
  steps: { order: number; id: string; reason?: string }[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { goal } = await req.json()
    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Describe qué quieres lograr (mínimo 3 caracteres).' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    // Catálogo público (service role para leer sin RLS dentro de la función).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name, description, price, category, url')
      .eq('is_public', true)

    if (error) throw new Error(error.message)

    const catalog = (tools ?? []).map((t: Record<string, string>) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price,
      category: t.category,
    }))

    const baseUrl = Deno.env.get('AI_GATEWAY_BASE_URL') ?? 'https://ai-gateway.vercel.sh/v1'
    const apiKey = Deno.env.get('AI_GATEWAY_API_KEY')
    const model = Deno.env.get('AI_MODEL') ?? 'gemini-3.8-flash'

    let rec: RecPayload | null = null

    if (apiKey) {
      const system =
        'Eres un asesor de herramientas IA. Dado el objetivo del usuario y un catálogo ' +
        'en JSON, elige las herramientas adecuadas. Si la tarea es compleja o tiene varias ' +
        'partes, recomienda varias herramientas EN EL ORDEN en que deben usarse. ' +
        'Responde ÚNICAMENTE JSON válido con esta forma: ' +
        '{"multi": boolean, "steps": [{"order": number, "id": "id del catálogo", "reason": "máx 20 palabras"}]}. ' +
        'Usa solo ids del catálogo. Máximo 4 pasos.'
      
      const res = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content: `Objetivo del usuario: ${goal}\n\nCatálogo: ${JSON.stringify(catalog)}`,
            },
          ],
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const raw: string = json.choices?.[0]?.message?.content ?? ''
        try {
          const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/, ''))
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            const valid = new Set(catalog.map((c: { id: string }) => c.id))
            const steps = parsed.steps
              .filter((s: RecPayload['steps'][number]) => valid.has(s.id))
              .map((s: RecPayload['steps'][number], i: number) => ({
                order: i + 1,
                id: s.id,
                reason: s.reason,
              }))
            if (steps.length > 0) rec = { multi: Boolean(parsed.multi), steps }
          } else {
            console.error("La IA respondió correctamente, pero el JSON no contenía la estructura 'steps' esperada.", parsed)
          }
        } catch (err) {
          console.error("Error al parsear el JSON de la IA:", err, "Respuesta raw del modelo:", raw)
          rec = null // JSON inválido del modelo → fallback local
        }
      } else {
        // AQUÍ ES DONDE ATRAPAMOS EL ERROR DEL AI GATEWAY
        const errorText = await res.text()
        console.error(`Error del AI Gateway [${res.status} ${res.statusText}]:`, errorText)
      }
    } else {
      console.error("No se encontró la variable AI_GATEWAY_API_KEY configurada.")
    }

    if (!rec) {
      // Sin gateway configurada (o respuesta inválida): el cliente usará su fallback.
      return new Response(
        JSON.stringify({ fallback: true, catalog }),
        { headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ fallback: false, ...rec }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error("Error crítico en la Edge Function:", e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
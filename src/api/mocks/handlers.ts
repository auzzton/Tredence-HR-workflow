import { http, HttpResponse } from 'msw'
import type { SimulationRequest } from '@/types/workflow'
import { FALLBACK_ACTIONS } from '@/lib/fallbackActions'
import { runSimulation } from '@/lib/simulate'

export const handlers = [
  http.get('/automations', () => {
    return HttpResponse.json(FALLBACK_ACTIONS)
  }),

  http.post('/simulate', async ({ request }) => {
    const { graph } = (await request.json()) as SimulationRequest
    return HttpResponse.json(runSimulation(graph))
  }),
]

import { flow } from "@/app/api/scrape/flow/route"

export type SavedFlow = {
  name: string
  steps: flow[]
}

const STORAGE_KEY = "automation_flows"

export function getSavedFlows(): SavedFlow[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedFlow[]) : []
  } catch {
    return []
  }
}

export function saveFlow(flow: SavedFlow) {
  const flows = getSavedFlows()
  const existingIndex = flows.findIndex((f) => f.name === flow.name)

  if (existingIndex >= 0) {
    flows[existingIndex] = flow // overwrite if name exists
  } else {
    flows.push(flow)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
}

export function deleteFlow(name: string) {
  const flows = getSavedFlows().filter((f) => f.name !== name)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
}

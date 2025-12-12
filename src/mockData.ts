import type {
  Material,
  MaterialUsage,
  ManualExpense,
  Payment,
  Project,
  ProjectStatus,
  ProjectSummaryRow,
  Receipt,
  Task,
  TimeEntry,
  Worker,
} from './types'

export const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatCurrency = (value: number) => currency.format(value)

export const workers: Worker[] = [
  { id: 'w1', name: 'Mike Ross', initials: 'MR', hourlyRate: 45, projectIds: ['p1'], phone: '555-0101' },
  { id: 'w2', name: 'John Smith', initials: 'JS', hourlyRate: 35, projectIds: ['p1'], phone: '555-0102' },
]

export const materials: Material[] = [
  { id: 'm1', name: 'Lumber 2x4', unitPrice: 15, stockQty: 120 },
  { id: 'm2', name: 'Paint - Interior White', unitPrice: 70, stockQty: 28 },
]

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Miller Kitchen Renovation',
    address: '123 Oak Street, Springfield',
    clientName: 'Cathy Miller',
    status: 'active',
    price: 25000,
    stage: 'Installation',
    progress: 62,
  },
  {
    id: 'p2',
    name: 'Downtown Office Painting',
    address: '456 Main Ave, Downtown',
    clientName: 'Downtown Holdings',
    status: 'pending',
    price: 8500,
    stage: 'Planning',
    progress: 20,
  },
]

export const materialUsage: MaterialUsage[] = [
  { id: 'u1', projectId: 'p1', materialId: 'm1', quantity: 30, date: '2025-12-12' },
  { id: 'u2', projectId: 'p2', materialId: 'm2', quantity: 4, date: '2025-12-12' },
]

export const timeEntries: TimeEntry[] = [
  { id: 't1', projectId: 'p1', workerId: 'w1', hours: 8, date: '2025-12-12' },
  { id: 't2', projectId: 'p1', workerId: 'w2', hours: 7.5, date: '2025-12-12' },
]

export const manualExpenses: ManualExpense[] = [
  { id: 'e1', projectId: 'p1', description: 'Dumpster rental', amount: 220, date: '2025-12-11' },
  { id: 'e2', projectId: 'p2', description: 'Permit filing fee', amount: 120, date: '2025-12-10' },
]
export const receipts: Receipt[] = [
  { id: 'r1', projectId: 'p1', fileName: 'lumber-receipt.pdf', amount: 450, date: '2025-12-10' },
]
export const tasks: Task[] = [
  { id: 'task1', projectId: 'p1', title: 'Install cabinets', assigneeIds: ['w1'], status: 'in_progress', dueDate: '2025-12-14' },
  { id: 'task2', projectId: 'p1', title: 'Paint walls', assigneeIds: ['w2'], status: 'not_started', dueDate: '2025-12-15' },
  { id: 'task3', projectId: 'p2', title: 'Color matching', assigneeIds: ['w2'], status: 'in_progress', dueDate: '2025-12-16' },
]
export const payments: Payment[] = [
  { id: 'pay1', projectId: 'p1', amount: 10000, status: 'partial', date: '2025-12-09' },
  { id: 'pay2', projectId: 'p2', amount: 2000, status: 'partial', date: '2025-12-08' },
]

const projectStatusLabel = (status: ProjectStatus) => {
  if (status === 'active') return 'In Progress'
  if (status === 'completed') return 'Completed'
  return 'Pending'
}

const projectLaborCost = (projectId: string) => {
  return timeEntries
    .filter((entry) => entry.projectId === projectId)
    .reduce((sum, entry) => {
      const worker = workers.find((w) => w.id === entry.workerId)
      if (!worker) return sum
      return sum + entry.hours * worker.hourlyRate
    }, 0)
}

const projectMaterialCost = (projectId: string) => {
  return materialUsage
    .filter((use) => use.projectId === projectId)
    .reduce((sum, use) => {
      const material = materials.find((m) => m.id === use.materialId)
      if (!material) return sum
      return sum + material.unitPrice * use.quantity
    }, 0)
}

const projectManualExpenseCost = (projectId: string) => {
  return manualExpenses.filter((exp) => exp.projectId === projectId).reduce((sum, exp) => sum + exp.amount, 0)
}

const projectReceiptCost = (projectId: string) => {
  return receipts.filter((r) => r.projectId === projectId).reduce((sum, r) => sum + r.amount, 0)
}

const buildProjectSummaries = (): ProjectSummaryRow[] => {
  return projects.map((project) => {
    const laborCost = projectLaborCost(project.id)
    const materialCost = projectMaterialCost(project.id)
    const manualExpenseCost = projectManualExpenseCost(project.id)
    const receiptCost = projectReceiptCost(project.id)
    const totalCost = laborCost + materialCost + manualExpenseCost + receiptCost
    const profit = project.price - totalCost

    return {
      projectId: project.id,
      name: project.name,
      address: project.address,
      statusLabel: projectStatusLabel(project.status),
      price: project.price,
      laborCost,
      materialCost,
      totalCost,
      profit,
      isPositive: profit >= 0,
    }
  })
}

const sumProjectsByStatus = (status: ProjectStatus) => projects.filter((p) => p.status === status).length
const sumProjectPrices = () => projects.reduce((sum, p) => sum + p.price, 0)
const sumProjectProfit = () => buildProjectSummaries().reduce((sum, p) => sum + p.profit, 0)

export const dashboardStats = [
  {
    label: 'Projects',
    status: 'Active',
    value: `${sumProjectsByStatus('active')}`,
    tone: 'blue' as const,
    icon: 'PR',
  },
  {
    label: 'Workers',
    status: 'Working',
    value: `${new Set(timeEntries.map((t) => t.workerId)).size}`,
    tone: 'green' as const,
    icon: 'WK',
  },
  {
    label: 'Revenue',
    status: 'Revenue',
    value: formatCurrency(sumProjectPrices()),
    tone: 'purple' as const,
    icon: 'RV',
  },
  {
    label: 'Profit/Loss',
    status: 'Profit',
    value: formatCurrency(sumProjectProfit()),
    tone: 'amber' as const,
    icon: 'PL',
  },
]

export const dashboardWorkerHours = timeEntries.map((entry) => {
  const worker = workers.find((w) => w.id === entry.workerId)
  const project = projects.find((p) => p.id === entry.projectId)
  const earnings = worker ? worker.hourlyRate * entry.hours : 0
  return {
    initials: worker?.initials ?? 'NA',
    name: worker?.name ?? 'Unknown Worker',
    project: project?.name ?? 'Unknown Project',
    hours: `${entry.hours} hrs`,
    earnings: formatCurrency(earnings),
  }
})

export const dashboardMaterialExpenses = materialUsage.map((use) => {
  const material = materials.find((m) => m.id === use.materialId)
  const project = projects.find((p) => p.id === use.projectId)
  const cost = material ? material.unitPrice * use.quantity : 0
  return {
    name: material?.name ?? 'Unknown Material',
    project: project?.name ?? 'Unknown Project',
    cost: formatCurrency(cost),
  }
})

export const projectSummaryRows = buildProjectSummaries().map((row) => ({
  ...row,
  laborDisplay: formatCurrency(row.laborCost),
  materialDisplay: formatCurrency(row.materialCost),
  totalDisplay: formatCurrency(row.totalCost),
  priceDisplay: formatCurrency(row.price),
  profitDisplay: formatCurrency(row.profit),
}))

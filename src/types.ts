export type ProjectStatus = 'active' | 'completed' | 'pending'
export type TaskStatus = 'not_started' | 'in_progress' | 'completed'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export interface Worker {
  id: string
  name: string
  initials: string
  hourlyRate: number
  phone?: string
  email?: string
  projectIds?: string[]
}

export interface Material {
  id: string
  name: string
  unitPrice: number
  stockQty?: number
  lowStockThreshold?: number
  supplier?: string
}

export interface MaterialUsage {
  id: string
  projectId: string
  materialId: string
  quantity: number
  date: string
}

export interface ManualExpense {
  id: string
  projectId: string
  description: string
  amount: number
  date: string
}

export interface Receipt {
  id: string
  projectId: string
  fileName: string
  amount: number
  date: string
}

export interface MaterialReceipt {
  id: string
  materialId: string
  fileName: string
  amount: number
  date: string
  url?: string
}

export interface TimeEntry {
  id: string
  projectId: string
  workerId: string
  hours: number
  date: string
  photoUrl?: string
}

export interface Payment {
  id: string
  projectId: string
  amount: number
  status: PaymentStatus
  date: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  assigneeIds: string[]
  status: TaskStatus
  dueDate?: string
  notes?: string
}

export interface Project {
  id: string
  name: string
  address: string
  clientName: string
  clientContact?: string
  status: ProjectStatus
  price: number
  stage?: string
  progress?: number
}

export interface ProjectCostBreakdown {
  laborCost: number
  materialCost: number
  manualExpenseCost: number
  receiptCost: number
  totalCost: number
  profit: number
}

export interface ProjectSummaryRow {
  projectId: string
  name: string
  address: string
  statusLabel: string
  price: number
  laborCost: number
  materialCost: number
  totalCost: number
  profit: number
  isPositive: boolean
}

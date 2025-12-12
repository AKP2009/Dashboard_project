import './App.css'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  formatCurrency,
  manualExpenses as initialManualExpenses,
  materialUsage as initialMaterialUsage,
  materials as initialMaterials,
  payments as initialPayments,
  projects as initialProjects,
  receipts as initialReceipts,
  tasks as initialTasks,
  timeEntries as initialTimeEntries,
  workers as initialWorkers,
} from './mockData'
import type {
  MaterialUsage,
  ManualExpense,
  Payment,
  Project,
  Task,
  TimeEntry,
  Worker,
} from './types'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { label: 'Dashboard', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Workers', path: '/workers' },
    { label: 'Materials', path: '/materials' },
    { label: 'Reports', path: '/reports' },
  ]

  const workerLinks = [{ label: 'Worker Portal', path: '/worker' }]

  const [viewMode, setViewMode] = useState<'admin' | 'worker'>('admin')
  const [activeWorkerId, setActiveWorkerId] = useState(initialWorkers[0]?.id ?? '')
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkLog, setCheckLog] = useState<{ id: string; workerId: string; action: 'in' | 'out'; time: string }[]>([])

  const [projectsState] = useState<Project[]>(initialProjects)
  const [workersState] = useState<Worker[]>(initialWorkers)
  const [materialsState] = useState(initialMaterials)
  const [materialUsageState, setMaterialUsageState] = useState<MaterialUsage[]>(initialMaterialUsage)
  const [timeEntriesState, setTimeEntriesState] = useState<TimeEntry[]>(initialTimeEntries)
  const [manualExpensesState, setManualExpensesState] = useState<ManualExpense[]>(initialManualExpenses)
  const [receiptsState, setReceiptsState] = useState(initialReceipts)
  const [paymentsState, setPaymentsState] = useState<Payment[]>(initialPayments)
  const [tasksState, setTasksState] = useState<Task[]>(initialTasks)

  const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const projectLaborCost = (projectId: string) => {
    return timeEntriesState
      .filter((entry) => entry.projectId === projectId)
      .reduce((sum, entry) => {
        const worker = workersState.find((w) => w.id === entry.workerId)
        if (!worker) return sum
        return sum + entry.hours * worker.hourlyRate
      }, 0)
  }

  const projectMaterialCost = (projectId: string) => {
    return materialUsageState
      .filter((use) => use.projectId === projectId)
      .reduce((sum, use) => {
        const material = materialsState.find((m) => m.id === use.materialId)
        if (!material) return sum
        return sum + material.unitPrice * use.quantity
      }, 0)
  }

  const projectManualExpenseCost = (projectId: string) => {
    return manualExpensesState.filter((exp) => exp.projectId === projectId).reduce((sum, exp) => sum + exp.amount, 0)
  }

  const projectReceiptCost = (projectId: string) => {
    return receiptsState.filter((r) => r.projectId === projectId).reduce((sum, r) => sum + r.amount, 0)
  }

  const projectSummaryRows = useMemo(() => {
    return projectsState.map((project) => {
      const laborCost = projectLaborCost(project.id)
      const materialCost = projectMaterialCost(project.id)
      const manualExpenseCost = projectManualExpenseCost(project.id)
      const receiptCost = projectReceiptCost(project.id)
      const totalCost = laborCost + materialCost + manualExpenseCost + receiptCost
      const profit = project.price - totalCost
      const statusLabel = project.status === 'active' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'Pending'

      return {
        projectId: project.id,
        name: project.name,
        address: project.address,
        statusLabel,
        price: project.price,
        laborCost,
        materialCost,
        totalCost,
        profit,
        isPositive: profit >= 0,
        laborDisplay: formatCurrency(laborCost),
        materialDisplay: formatCurrency(materialCost),
        totalDisplay: formatCurrency(totalCost),
        priceDisplay: formatCurrency(project.price),
        profitDisplay: formatCurrency(profit),
      }
    })
  }, [projectsState, timeEntriesState, workersState, materialUsageState, materialsState, manualExpensesState, receiptsState])

  const dashboardStats = useMemo(() => {
    const activeProjects = projectsState.filter((p) => p.status === 'active').length
    const workerSet = new Set(timeEntriesState.map((t) => t.workerId)).size
    const totalRevenue = projectsState.reduce((sum, p) => sum + p.price, 0)
    const totalProfit = projectSummaryRows.reduce((sum, p) => sum + p.profit, 0)

    return [
      { label: 'Projects', status: 'Active', value: `${activeProjects}`, tone: 'blue' as const, icon: 'PR' },
      { label: 'Workers', status: 'Working', value: `${workerSet}`, tone: 'green' as const, icon: 'WK' },
      { label: 'Revenue', status: 'Revenue', value: formatCurrency(totalRevenue), tone: 'purple' as const, icon: 'RV' },
      { label: 'Profit/Loss', status: 'Profit', value: formatCurrency(totalProfit), tone: 'amber' as const, icon: 'PL' },
    ]
  }, [projectsState, timeEntriesState, projectSummaryRows])

  const dashboardWorkerHours = useMemo(() => {
    return timeEntriesState.map((entry) => {
      const worker = workersState.find((w) => w.id === entry.workerId)
      const project = projectsState.find((p) => p.id === entry.projectId)
      const earnings = worker ? worker.hourlyRate * entry.hours : 0
      return {
        initials: worker?.initials ?? 'NA',
        name: worker?.name ?? 'Unknown Worker',
        project: project?.name ?? 'Unknown Project',
        hours: `${entry.hours} hrs`,
        earnings: formatCurrency(earnings),
      }
    })
  }, [timeEntriesState, workersState, projectsState])

  const dashboardMaterialExpenses = useMemo(() => {
    return materialUsageState.map((use) => {
      const material = materialsState.find((m) => m.id === use.materialId)
      const project = projectsState.find((p) => p.id === use.projectId)
      const cost = material ? material.unitPrice * use.quantity : 0
      return {
        name: material?.name ?? 'Unknown Material',
        project: project?.name ?? 'Unknown Project',
        cost: formatCurrency(cost),
      }
    })
  }, [materialUsageState, materialsState, projectsState])

  const WorkerPortal = () => {
    const activeWorker = workersState.find((w) => w.id === activeWorkerId)

    const toggleCheck = (action: 'in' | 'out') => {
      if (!activeWorker) return
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setCheckedIn(action === 'in')
      setCheckLog((prev) => [{ id: makeId('log'), workerId: activeWorker.id, action, time }, ...prev.slice(0, 9)])
    }

    return (
      <main className="content">
        <div className="page-header">
          <div>
            <p className="eyebrow">Worker Portal</p>
            <h1>Check-in / Check-out</h1>
          </div>
        </div>

        <div className="grid two-up">
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">Status</div>
            </div>
            <div className="panel-body list">
              <div className="list-row">
                <div className="list-meta">
                  <div className="list-title">Worker</div>
                  <div className="list-sub">Select your profile</div>
                </div>
                <div className="list-value">
                  <select className="input" value={activeWorkerId} onChange={(e) => setActiveWorkerId(e.target.value)}>
                    {workersState.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="list-row">
                <div className="list-meta">
                  <div className="list-title">Current Status</div>
                  <div className="list-sub">Local-only demo toggle</div>
                </div>
                <div className="list-value">
                  <span className={`badge ${checkedIn ? 'success-chip' : 'warning'}`}>
                    {checkedIn ? 'Checked In' : 'Checked Out'}
                  </span>
                </div>
              </div>
              <div className="list-row">
                <div className="list-meta">
                  <div className="list-title">Action</div>
                  <div className="list-sub">Tap to update status</div>
                </div>
                <div className="list-value button-stack">
                  <button className="ghost" type="button" onClick={() => toggleCheck('in')}>
                    Check In
                  </button>
                  <button className="ghost" type="button" onClick={() => toggleCheck('out')}>
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">Recent Activity</div>
            </div>
            <div className="panel-body list">
              {checkLog.length === 0 && <div className="list-row">No activity yet.</div>}
              {checkLog.map((log) => {
                const worker = workersState.find((w) => w.id === log.workerId)
                return (
                  <div key={log.id} className="list-row">
                    <div className="pill-avatar">{worker?.initials ?? 'NA'}</div>
                    <div className="list-meta">
                      <div className="list-title">{worker?.name ?? 'Worker'}</div>
                      <div className="list-sub">{log.time}</div>
                    </div>
                    <div className={`list-value ${log.action === 'in' ? 'success' : 'danger'}`}>
                      {log.action === 'in' ? 'Checked In' : 'Checked Out'}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    )
  }

  const switchMode = (mode: 'admin' | 'worker') => {
    setViewMode(mode)
    if (mode === 'worker') {
      navigate('/worker')
    } else if (location.pathname === '/worker') {
      navigate('/')
    }
  }

  const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="placeholder">
      <div className="panel wide">
        <div className="panel-head">
          <div className="panel-title">{title}</div>
          <span className="pill subtle">Empty for now</span>
        </div>
        <div className="panel-body empty">
          <p>This page is intentionally left blank so you can wire it up later.</p>
        </div>
      </div>
    </div>
  )

  const DashboardPage = () => (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard Overview</p>
          <h1>Real-time business metrics and insights</h1>
        </div>
      </header>

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <article key={stat.label} className={`stat-card tone-${stat.tone}`}>
            <div className="stat-top">
              <div className="icon-chip" aria-hidden>{stat.icon}</div>
              <span className="badge">{stat.status}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </article>
        ))}
      </section>

      <div className="grid two-up">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="bullet" />
              Today&apos;s Worker Hours
            </div>
            <button className="ghost">View All</button>
          </div>
          <div className="panel-body list">
            {dashboardWorkerHours.map((worker) => (
              <div key={worker.name} className="list-row">
                <div className="pill-avatar">{worker.initials}</div>
                <div className="list-meta">
                  <div className="list-title">{worker.name}</div>
                  <div className="list-sub">{worker.project}</div>
                </div>
                <div className="list-value">
                  <span className="bold">{worker.hours}</span>
                  <span className="muted">{worker.earnings}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="bullet purple" />
              Today&apos;s Material Expenses
            </div>
            <button className="ghost">View All</button>
          </div>
          <div className="panel-body list">
            {dashboardMaterialExpenses.map((item) => (
              <div key={item.name} className="list-row">
                <div className="pill-avatar purple">⬛</div>
                <div className="list-meta">
                  <div className="list-title">{item.name}</div>
                  <div className="list-sub">{item.project}</div>
                </div>
                <div className="list-value accent">{item.cost}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel wide">
        <div className="panel-head">
          <div className="panel-title">Projects Cost Summary</div>
          <button className="ghost">Export</button>
        </div>
        <div className="table">
          <div className="table-head">
            <span>Project</span>
            <span>Status</span>
            <span>Labor Cost</span>
            <span>Material Cost</span>
            <span>Total Cost</span>
            <span>Project Price</span>
            <span>Profit/Loss</span>
          </div>
          {projectSummaryRows.map((project) => (
            <div key={project.projectId} className="table-row">
              <div>
                <div className="list-title">{project.name}</div>
                <div className="list-sub">{project.address}</div>
              </div>
              <div>
                <span className={`status-chip ${project.statusLabel === 'In Progress' ? 'info' : 'warning'}`}>
                  {project.statusLabel}
                </span>
              </div>
              <span>{project.laborDisplay}</span>
              <span>{project.materialDisplay}</span>
              <span>{project.totalDisplay}</span>
              <span>{project.priceDisplay}</span>
              <span className={project.isPositive ? 'success' : 'danger'}>{project.profitDisplay}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  const ProjectsPage = () => (
    <div className="panel wide">
      <div className="panel-head">
        <div className="panel-title">Projects</div>
        <span className="pill subtle">{projectsState.length} total</span>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Project</span>
          <span>Status</span>
          <span>Labor</span>
          <span>Materials</span>
          <span>Total Cost</span>
          <span>Price</span>
          <span>Profit/Loss</span>
          <span>Progress</span>
        </div>
        {projectSummaryRows.map((row) => {
          const project = projectsState.find((p) => p.id === row.projectId)
          return (
            <div key={row.projectId} className="table-row">
              <div>
                <div className="list-title">
                  <Link to={`/projects/${row.projectId}`}>{row.name}</Link>
                </div>
                <div className="list-sub">{project?.clientName ?? 'Unknown client'} · {row.address}</div>
              </div>
              <div>
                <span className={`status-chip ${row.statusLabel === 'In Progress' ? 'info' : row.statusLabel === 'Completed' ? 'success-chip' : 'warning'}`}>
                  {row.statusLabel}
                </span>
              </div>
              <span>{row.laborDisplay}</span>
              <span>{row.materialDisplay}</span>
              <span>{row.totalDisplay}</span>
              <span>{row.priceDisplay}</span>
              <span className={row.isPositive ? 'success' : 'danger'}>{row.profitDisplay}</span>
              <span>{project?.progress != null ? `${project.progress}%` : '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const WorkersPage = () => (
    <div className="panel wide">
      <div className="panel-head">
        <div className="panel-title">Workers</div>
        <span className="pill subtle">{workersState.length} total</span>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Worker</span>
          <span>Hourly Rate</span>
          <span>Assigned Projects</span>
          <span>Contact</span>
        </div>
        {workersState.map((worker) => (
          <div key={worker.id} className="table-row">
            <div className="list-title">{worker.name}</div>
            <span>${worker.hourlyRate.toFixed(2)}/hr</span>
            <span>
              {worker.projectIds?.length
                ? projectsState.filter((p) => worker.projectIds?.includes(p.id)).map((p) => p.name).join(', ')
                : '—'}
            </span>
            <span>{worker.phone ?? worker.email ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const ProjectDetailPage = () => {
    const { projectId } = useParams()
    const project = projectsState.find((p) => p.id === projectId)
    const summary = projectSummaryRows.find((p) => p.projectId === projectId)

    if (!project || !summary) {
      return <PlaceholderPage title="Project not found" />
    }

    const projectTasks = tasksState.filter((t) => t.projectId === project.id)
    const projectTime = timeEntriesState.filter((t) => t.projectId === project.id)
    const projectMaterials = materialUsageState.filter((m) => m.projectId === project.id)
    const projectExpenses = manualExpensesState.filter((e) => e.projectId === project.id)
    const projectReceipts = receiptsState.filter((r) => r.projectId === project.id)
    const projectPayments = paymentsState.filter((p) => p.projectId === project.id)
    const paidTotal = projectPayments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = project.price - paidTotal

    const [taskTitle, setTaskTitle] = useState('')
    const [taskDue, setTaskDue] = useState('')
    const [taskAssignee, setTaskAssignee] = useState(workersState[0]?.id ?? '')

    const [timeWorker, setTimeWorker] = useState(workersState[0]?.id ?? '')
    const [timeHours, setTimeHours] = useState('')

    const [usageMaterial, setUsageMaterial] = useState(materialsState[0]?.id ?? '')
    const [usageQty, setUsageQty] = useState('')

    const [expenseDesc, setExpenseDesc] = useState('')
    const [expenseAmt, setExpenseAmt] = useState('')

    const [paymentAmt, setPaymentAmt] = useState('')
    const [paymentStatus, setPaymentStatus] = useState<Payment['status']>('partial')

    const [receiptName, setReceiptName] = useState('')
    const [receiptAmt, setReceiptAmt] = useState('')

    const addTask = (e: React.FormEvent) => {
      e.preventDefault()
      if (!taskTitle.trim()) return
      const newTask: Task = {
        id: makeId('task'),
        projectId: project.id,
        title: taskTitle.trim(),
        assigneeIds: taskAssignee ? [taskAssignee] : [],
        status: 'not_started',
        dueDate: taskDue || undefined,
      }
      setTasksState((prev) => [...prev, newTask])
      setTaskTitle('')
      setTaskDue('')
    }

    const addTime = (e: React.FormEvent) => {
      e.preventDefault()
      const hours = parseFloat(timeHours)
      if (!timeWorker || Number.isNaN(hours) || hours <= 0) return
      const entry: TimeEntry = {
        id: makeId('time'),
        projectId: project.id,
        workerId: timeWorker,
        hours,
        date: new Date().toISOString().slice(0, 10),
      }
      setTimeEntriesState((prev) => [...prev, entry])
      setTimeHours('')
    }

    const addUsage = (e: React.FormEvent) => {
      e.preventDefault()
      const qty = parseFloat(usageQty)
      if (!usageMaterial || Number.isNaN(qty) || qty <= 0) return
      const usage: MaterialUsage = {
        id: makeId('use'),
        projectId: project.id,
        materialId: usageMaterial,
        quantity: qty,
        date: new Date().toISOString().slice(0, 10),
      }
      setMaterialUsageState((prev) => [...prev, usage])
      setUsageQty('')
    }

    const addExpense = (e: React.FormEvent) => {
      e.preventDefault()
      const amt = parseFloat(expenseAmt)
      if (!expenseDesc.trim() || Number.isNaN(amt) || amt <= 0) return
      const exp: ManualExpense = {
        id: makeId('exp'),
        projectId: project.id,
        description: expenseDesc.trim(),
        amount: amt,
        date: new Date().toISOString().slice(0, 10),
      }
      setManualExpensesState((prev) => [...prev, exp])
      setExpenseDesc('')
      setExpenseAmt('')
    }

    const addPayment = (e: React.FormEvent) => {
      e.preventDefault()
      const amt = parseFloat(paymentAmt)
      if (Number.isNaN(amt) || amt <= 0) return
      const pay: Payment = {
        id: makeId('pay'),
        projectId: project.id,
        amount: amt,
        status: paymentStatus,
        date: new Date().toISOString().slice(0, 10),
      }
      setPaymentsState((prev) => [...prev, pay])
      setPaymentAmt('')
    }

    const addReceipt = (e: React.FormEvent) => {
      e.preventDefault()
      const amt = parseFloat(receiptAmt)
      if (!receiptName.trim() || Number.isNaN(amt) || amt <= 0) return
      const rec = {
        id: makeId('rec'),
        projectId: project.id,
        fileName: receiptName.trim(),
        amount: amt,
        date: new Date().toISOString().slice(0, 10),
      }
      setReceiptsState((prev) => [...prev, rec])
      setReceiptName('')
      setReceiptAmt('')
    }

    return (
      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">{project.name}</div>
            <span className="pill subtle">{summary.statusLabel}</span>
          </div>
          <div className="panel-body list">
            <div className="list-row">
              <div className="list-meta">
                <div className="list-title">Client</div>
                <div className="list-sub">{project.clientName}</div>
              </div>
              <div className="list-value">{project.clientContact ?? '—'}</div>
            </div>
            <div className="list-row">
              <div className="list-meta">
                <div className="list-title">Address</div>
                <div className="list-sub">{project.address}</div>
              </div>
              <div className="list-value">{project.stage ?? 'Stage N/A'}</div>
            </div>
            <div className="list-row">
              <div className="list-meta">
                <div className="list-title">Price</div>
                <div className="list-sub">Progress</div>
              </div>
              <div className="list-value">
                <span className="bold">{formatCurrency(project.price)}</span>
                <span className="muted">{project.progress != null ? `${project.progress}%` : '—'}</span>
              </div>
            </div>
            <div className="list-row">
              <div className="list-meta">
                <div className="list-title">Paid</div>
                <div className="list-sub">Outstanding</div>
              </div>
              <div className="list-value">
                <span className="bold">{formatCurrency(paidTotal)}</span>
                <span className="muted">{formatCurrency(outstanding)}</span>
              </div>
            </div>
            <div className="list-row">
              <div className="list-meta">
                <div className="list-title">Profit / Loss</div>
                <div className="list-sub">Total Cost</div>
              </div>
              <div className="list-value">
                <span className={summary.isPositive ? 'success' : 'danger'}>{summary.profitDisplay}</span>
                <span className="muted">{summary.totalDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Tasks</div>
            <form className="inline-form" onSubmit={addTask}>
              <input
                className="input"
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <input
                className="input"
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
              <select className="input" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                {workersState.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button className="ghost" type="submit">Add</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectTasks.length === 0 && <div className="list-row">No tasks yet.</div>}
            {projectTasks.map((task) => (
              <div key={task.id} className="list-row">
                <div className="list-meta">
                  <div className="list-title">{task.title}</div>
                  <div className="list-sub">Due {task.dueDate ?? '—'}</div>
                </div>
                <div className="list-value">
                  <span className="badge small">{task.status.replace('_', ' ')}</span>
                  <span className="muted">Assignees: {task.assigneeIds.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Time Entries</div>
            <form className="inline-form" onSubmit={addTime}>
              <select className="input" value={timeWorker} onChange={(e) => setTimeWorker(e.target.value)}>
                {workersState.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                placeholder="Hours"
                value={timeHours}
                onChange={(e) => setTimeHours(e.target.value)}
              />
              <button className="ghost" type="submit">Log</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectTime.length === 0 && <div className="list-row">No time yet.</div>}
            {projectTime.map((entry) => {
              const worker = workersState.find((w) => w.id === entry.workerId)
              const earnings = worker ? worker.hourlyRate * entry.hours : 0
              return (
                <div key={entry.id} className="list-row">
                  <div className="pill-avatar">{worker?.initials ?? 'NA'}</div>
                  <div className="list-meta">
                    <div className="list-title">{worker?.name ?? 'Unknown'}</div>
                    <div className="list-sub">{entry.date}</div>
                  </div>
                  <div className="list-value">
                    <span className="bold">{entry.hours} hrs</span>
                    <span className="muted">{formatCurrency(earnings)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Material Usage</div>
            <form className="inline-form" onSubmit={addUsage}>
              <select className="input" value={usageMaterial} onChange={(e) => setUsageMaterial(e.target.value)}>
                {materialsState.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="Qty"
                value={usageQty}
                onChange={(e) => setUsageQty(e.target.value)}
              />
              <button className="ghost" type="submit">Add</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectMaterials.length === 0 && <div className="list-row">No materials logged.</div>}
            {projectMaterials.map((use) => {
              const material = materialsState.find((m) => m.id === use.materialId)
              const cost = material ? material.unitPrice * use.quantity : 0
              return (
                <div key={use.id} className="list-row">
                  <div className="pill-avatar purple">MU</div>
                  <div className="list-meta">
                    <div className="list-title">{material?.name ?? 'Unknown material'}</div>
                    <div className="list-sub">{use.date}</div>
                  </div>
                  <div className="list-value">
                    <span className="bold">{use.quantity} units</span>
                    <span className="muted">{formatCurrency(cost)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Manual Expenses</div>
            <form className="inline-form" onSubmit={addExpense}>
              <input
                className="input"
                placeholder="Description"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={expenseAmt}
                onChange={(e) => setExpenseAmt(e.target.value)}
              />
              <button className="ghost" type="submit">Add</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectExpenses.length === 0 && <div className="list-row">No expenses logged.</div>}
            {projectExpenses.map((exp) => (
              <div key={exp.id} className="list-row">
                <div className="list-meta">
                  <div className="list-title">{exp.description}</div>
                  <div className="list-sub">{exp.date}</div>
                </div>
                <div className="list-value accent">{formatCurrency(exp.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Receipts</div>
            <form className="inline-form" onSubmit={addReceipt}>
              <input
                className="input"
                placeholder="File name"
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={receiptAmt}
                onChange={(e) => setReceiptAmt(e.target.value)}
              />
              <button className="ghost" type="submit">Upload</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectReceipts.length === 0 && <div className="list-row">No receipts uploaded.</div>}
            {projectReceipts.map((rec) => (
              <div key={rec.id} className="list-row">
                <div className="list-meta">
                  <div className="list-title">{rec.fileName}</div>
                  <div className="list-sub">{rec.date}</div>
                </div>
                <div className="list-value accent">{formatCurrency(rec.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Payments</div>
            <form className="inline-form" onSubmit={addPayment}>
              <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as Payment['status'])}>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={paymentAmt}
                onChange={(e) => setPaymentAmt(e.target.value)}
              />
              <button className="ghost" type="submit">Add</button>
            </form>
          </div>
          <div className="panel-body list">
            {projectPayments.length === 0 && <div className="list-row">No payments yet.</div>}
            {projectPayments.map((pay) => (
              <div key={pay.id} className="list-row">
                <div className="list-meta">
                  <div className="list-title">{pay.status.toUpperCase()}</div>
                  <div className="list-sub">{pay.date}</div>
                </div>
                <div className="list-value accent">{formatCurrency(pay.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const MaterialsPage = () => (
    <div className="panel wide">
      <div className="panel-head">
        <div className="panel-title">Materials</div>
        <span className="pill subtle">{materialsState.length} items</span>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Material</span>
          <span>Unit Price</span>
          <span>Stock</span>
          <span>Used (qty)</span>
        </div>
        {materialsState.map((material) => (
          <div key={material.id} className="table-row">
            <div className="list-title">{material.name}</div>
            <span>${material.unitPrice.toFixed(2)}</span>
            <span>{material.stockQty != null ? material.stockQty : '—'}</span>
            <span>
              {materialUsageState
                .filter((use) => use.materialId === material.id)
                .reduce((sum, use) => sum + use.quantity, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const ReportsPage = () => {
    const totalRevenue = projectSummaryRows.reduce((sum, p) => sum + p.price, 0)
    const totalExpenses = projectSummaryRows.reduce((sum, p) => sum + p.totalCost, 0)
    const totalProfit = projectSummaryRows.reduce((sum, p) => sum + p.profit, 0)
    const totalPayments = paymentsState.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = totalRevenue - totalPayments

    return (
      <div className="grid two-up reports-grid">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">Financial Summary</div>
          </div>
          <div className="panel-body list">
            <div className="list-row">
              <div className="list-title">Total Revenue</div>
              <div className="list-value accent">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="list-row">
              <div className="list-title">Total Expenses</div>
              <div className="list-value">{formatCurrency(totalExpenses)}</div>
            </div>
            <div className="list-row">
              <div className="list-title">Total Profit/Loss</div>
              <div className={`list-value ${totalProfit >= 0 ? 'success' : 'danger'}`}>{formatCurrency(totalProfit)}</div>
            </div>
            <div className="list-row">
              <div className="list-title">Payments Received</div>
              <div className="list-value">{formatCurrency(totalPayments)}</div>
            </div>
            <div className="list-row">
              <div className="list-title">Outstanding</div>
              <div className={`list-value ${outstanding <= 0 ? 'success' : 'danger'}`}>{formatCurrency(outstanding)}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">Worker Attendance</div>
            <span className="pill subtle">{timeEntriesState.length} records</span>
          </div>
          <div className="panel-body list">
            {timeEntriesState.map((entry) => {
              const worker = workersState.find((w) => w.id === entry.workerId)
              const project = projectsState.find((p) => p.id === entry.projectId)
              return (
                <div key={entry.id} className="list-row">
                  <div className="pill-avatar">{worker?.initials ?? 'NA'}</div>
                  <div className="list-meta">
                    <div className="list-title">{worker?.name ?? 'Unknown'}</div>
                    <div className="list-sub">{project?.name ?? 'Project'} · {entry.date}</div>
                  </div>
                  <div className="list-value">
                    <span className="bold">{entry.hours} hrs</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-head">
            <div className="panel-title">Project Profitability</div>
          </div>
          <div className="table">
            <div className="table-head">
              <span>Project</span>
              <span>Revenue</span>
              <span>Expenses</span>
              <span>Profit/Loss</span>
            </div>
            {projectSummaryRows.map((p) => (
              <div key={p.projectId} className="table-row">
                <div className="list-title">{p.name}</div>
                <span>{p.priceDisplay}</span>
                <span>{p.totalDisplay}</span>
                <span className={p.isPositive ? 'success' : 'danger'}>{p.profitDisplay}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CP</div>
          <div>
            <div className="brand-name">ContractorPro</div>
            <div className="brand-sub">{viewMode === 'admin' ? 'Admin Portal' : 'Worker Portal'}</div>
          </div>
        </div>
        <nav className="nav">
          {(viewMode === 'admin' ? navLinks : workerLinks).map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-dot" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="profile-card">
          <div className="profile-top">
            <div className="avatar">{viewMode === 'worker' ? 'WK' : 'AU'}</div>
            <div className="profile-meta">
              <div className="profile-name">{viewMode === 'worker' ? 'Worker' : 'Admin User'}</div>
              <div className="profile-role">{viewMode === 'worker' ? 'Worker' : 'Administrator'}</div>
            </div>
          </div>
          <div className="profile-switch">
            <div className="switch">
              <button
                type="button"
                className={`switch-btn ${viewMode === 'admin' ? 'active' : ''}`}
                onClick={() => switchMode('admin')}
              >
                Admin
              </button>
              <button
                type="button"
                className={`switch-btn ${viewMode === 'worker' ? 'active' : ''}`}
                onClick={() => switchMode('worker')}
              >
                Worker
              </button>
            </div>
            <div className="profile-note">{viewMode === 'admin' ? 'Dashboard access' : 'Check-in / out only'}</div>
          </div>
        </div>
      </aside>

      <main className="content">
        {viewMode === 'worker' ? (
          <Routes>
            <Route path="/worker" element={<WorkerPortal />} />
            <Route path="*" element={<WorkerPortal />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<PlaceholderPage title="Not found" />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App

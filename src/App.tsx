import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, ChevronDown, Circle, ListTodo, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'

type Priority = 'baixa' | 'media' | 'alta'
type Filter = 'todas' | 'pendentes' | 'concluidas'
type Task = { id: string; title: string; completed: boolean; priority: Priority; dueDate: string; createdAt: number }

const STORAGE_KEY = 'foco.tasks.v1'
const priorityLabel: Record<Priority, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

const starterTasks: Task[] = [
  { id: crypto.randomUUID(), title: 'Conhecer o projeto Foco', completed: true, priority: 'baixa', dueDate: '', createdAt: Date.now() - 2 },
  { id: crypto.randomUUID(), title: 'Adicionar minha primeira tarefa', completed: false, priority: 'alta', dueDate: new Date().toISOString().slice(0, 10), createdAt: Date.now() - 1 },
]

function loadTasks(): Task[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) : starterTasks
  } catch { return starterTasks }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('media')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }, [tasks])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length
    return { completed, pending: tasks.length - completed, progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 }
  }, [tasks])

  const visibleTasks = useMemo(() => tasks
    .filter((task) => filter === 'todas' || (filter === 'concluidas' ? task.completed : !task.completed))
    .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt), [tasks, filter, search])

  function addTask(event: FormEvent) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setTasks((current) => [{ id: crypto.randomUUID(), title: cleanTitle, completed: false, priority, dueDate, createdAt: Date.now() }, ...current])
    setTitle(''); setDueDate(''); setPriority('media')
  }

  function toggleTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))
  }

  function saveEdit(id: string) {
    const cleanTitle = editingTitle.trim()
    if (cleanTitle) setTasks((current) => current.map((task) => task.id === id ? { ...task, title: cleanTitle } : task))
    setEditingId(null)
  }

  function formatDate(value: string) {
    if (!value) return null
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  }

  return (
    <main className="app-shell">
      <div className="orb orb-one" /><div className="orb orb-two" />
      <section className="app-card">
        <header className="hero">
          <div className="brand"><span className="brand-mark"><Check /></span><span>foco</span></div>
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} /> ORGANIZE O SEU DIA</p>
            <h1>O que vamos<br/><em>realizar hoje?</em></h1>
            <p>Pequenos passos, grandes resultados. Coloque suas ideias em movimento.</p>
          </div>
          <div className="progress-card">
            <div className="progress-ring" style={{ '--progress': `${stats.progress * 3.6}deg` } as React.CSSProperties}>
              <span>{stats.progress}%</span>
            </div>
            <div><strong>Seu progresso</strong><small>{stats.completed} de {tasks.length} tarefas concluídas</small></div>
          </div>
        </header>

        <div className="content">
          <form className="task-form" onSubmit={addTask}>
            <div className="task-input-wrap"><Plus size={20}/><input aria-label="Nova tarefa" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Adicione uma nova tarefa..." maxLength={100}/></div>
            <div className="form-options">
              <label><span>Prioridade</span><div className="select-wrap"><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select><ChevronDown size={15}/></div></label>
              <label><span>Prazo</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/></label>
              <button className="add-button" type="submit" disabled={!title.trim()}><Plus size={18}/>Adicionar</button>
            </div>
          </form>

          <div className="toolbar">
            <div className="filters">
              {(['todas', 'pendentes', 'concluidas'] as Filter[]).map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}<span>{item === 'todas' ? tasks.length : item === 'pendentes' ? stats.pending : stats.completed}</span></button>)}
            </div>
            <label className="search"><Search size={17}/><input aria-label="Buscar tarefas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa..."/>{search && <button onClick={() => setSearch('')}><X size={14}/></button>}</label>
          </div>

          <div className="task-list">
            {visibleTasks.length === 0 ? <div className="empty"><ListTodo/><strong>Nenhuma tarefa por aqui</strong><span>Adicione uma tarefa ou altere os filtros.</span></div> : visibleTasks.map((task) => (
              <article className={`task ${task.completed ? 'done' : ''}`} key={task.id}>
                <button className="check-button" aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'} onClick={() => toggleTask(task.id)}>{task.completed ? <CheckCircle2/> : <Circle/>}</button>
                <div className="task-body">
                  {editingId === task.id ? <form className="edit-form" onSubmit={(e) => { e.preventDefault(); saveEdit(task.id) }}><input autoFocus value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} maxLength={100}/><button><Check size={16}/></button><button type="button" onClick={() => setEditingId(null)}><X size={16}/></button></form> : <strong>{task.title}</strong>}
                  <div className="meta"><span className={`priority ${task.priority}`}>{priorityLabel[task.priority]}</span>{task.dueDate && <span><CalendarDays size={13}/>{formatDate(task.dueDate)}</span>}</div>
                </div>
                <div className="task-actions"><button aria-label="Editar tarefa" onClick={() => { setEditingId(task.id); setEditingTitle(task.title) }}><Pencil size={16}/></button><button aria-label="Excluir tarefa" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 size={16}/></button></div>
              </article>
            ))}
          </div>

          {stats.completed > 0 && <button className="clear-button" onClick={() => setTasks((current) => current.filter((task) => !task.completed))}><Trash2 size={14}/>Limpar tarefas concluídas</button>}
        </div>
      </section>
      <footer>Feito com intenção <span>•</span> Projeto 01 de 20</footer>
    </main>
  )
}

export default App

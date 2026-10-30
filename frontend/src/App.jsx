import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api, { messageFromError } from './api'
import { useAuth } from './AuthContext'
import PetCard from './components/PetCard'

function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  async function signOut() {
    await logout()
    navigate('/')
    setOpen(false)
  }
  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-lg container py-3">
        <Link to="/" className="navbar-brand brand" onClick={() => setOpen(false)}><span className="brand-mark">🐾</span> PetLink</Link>
        <button className="navbar-toggler" type="button" aria-label="Abrir menú" onClick={() => setOpen(!open)}><span className="navbar-toggler-icon" /></button>
        <div className={'navbar-collapse ' + (open ? 'show' : '')}>
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <Link className="nav-link" to="/mascotas" onClick={() => setOpen(false)}>Adopta</Link>
            <a className="nav-link" href="/#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</a>
            {user ? <>
              <Link className="nav-link" to="/panel" onClick={() => setOpen(false)}>Mi panel</Link>
              <span className="nav-user">Hola, {user.name.split(' ')[0]}</span>
              <button className="btn btn-sm btn-outline-success rounded-pill px-3" onClick={signOut}>Salir</button>
            </> : <>
              <Link className="nav-link" to="/iniciar-sesion" onClick={() => setOpen(false)}>Iniciar sesión</Link>
              <Link className="btn btn-success rounded-pill px-4" to="/registro" onClick={() => setOpen(false)}>Crear cuenta</Link>
            </>}
          </div>
        </div>
      </nav>
    </header>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/iniciar-sesion" replace />
}

function Loading() {
  return <div className="page-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando</span></div></div>
}

function Footer() {
  return <footer className="site-footer"><div className="container d-flex flex-column flex-md-row justify-content-between gap-2"><span>PetLink · Cuidado que conecta</span><span>Adopción responsable en Colombia</span></div></footer>
}

function HomePage() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/mascotas', { params: { per_page: 3 } })
      .then(({ data }) => setPets(data.data || []))
      .catch(() => setPets([]))
      .finally(() => setLoading(false))
  }, [])
  return <>
    <main>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Una familia cambia una vida</span>
            <h1>El amor que buscas<br /><em>te está esperando.</em></h1>
            <p>Conecta con refugios y conoce mascotas que buscan un hogar lleno de cariño. Cada adopción responsable empieza con una historia.</p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Link to="/mascotas" className="btn btn-success btn-lg rounded-pill px-4">Encontrar mi compañero <span aria-hidden="true">→</span></Link>
              <Link to="/registro" className="btn btn-outline-success btn-lg rounded-pill px-4">Quiero ayudar</Link>
            </div>
            <div className="hero-proof mt-5"><div className="proof-avatars"><span>🐶</span><span>🐱</span><span>🐰</span></div><span><strong>Historias que empiezan</strong><br />con un hogar responsable</span></div>
          </div>
          <div className="hero-art" aria-label="Ilustración de una mascota"><div className="sun-disc" /><div className="hero-blob"><span className="hero-pet">🐕</span></div><div className="floating-note note-one">♡ Adoptar es amar</div><div className="floating-note note-two">+ cuidado, + futuro</div><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✿</span></div>
        </div>
      </section>

      <section className="container trust-strip"><div><span className="trust-icon">🤝</span><div><strong>Adopción responsable</strong><small>Un proceso acompañado</small></div></div><div><span className="trust-icon">🏡</span><div><strong>Refugios verificados</strong><small>Conectados en un mismo lugar</small></div></div><div><span className="trust-icon">💚</span><div><strong>Bienestar primero</strong><small>Seguimiento y cuidado animal</small></div></div></section>

      <section className="section-space bg-soft">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">Encuentros que cambian todo</span><h2>Alguien especial te espera</h2><p>Conoce algunas mascotas disponibles para adopción.</p></div><Link className="text-link" to="/mascotas">Ver todas las mascotas <span aria-hidden="true">→</span></Link></div>
          {loading ? <Loading /> : pets.length ? <div className="row g-4">{pets.map((pet) => <div className="col-md-6 col-lg-4" key={pet.id}><PetCard pet={pet} /></div>)}</div> : <EmptyState title="Pronto habrá nuevas historias" text="Vuelve a visitar el catálogo de adopciones." />}
        </div>
      </section>

      <section id="como-funciona" className="section-space container">
        <div className="section-heading"><div><span className="eyebrow">Un camino sencillo</span><h2>Así comienza una nueva historia</h2><p>Te acompañamos en cada paso para que el encuentro sea el indicado.</p></div></div>
        <div className="row g-4 steps-row"><Step number="01" icon="🔎" title="Encuentra" text="Explora mascotas y descubre cuál conecta con tu estilo de vida." /><Step number="02" icon="💌" title="Conversa" text="Cuéntale al refugio sobre ti y resuelve tus preguntas." /><Step number="03" icon="🏠" title="Da la bienvenida" text="Completa el proceso y empieza una vida juntos." /></div>
      </section>
      <section className="closing-cta"><div className="container"><span className="cta-paw">🐾</span><div><span className="eyebrow text-white-50">Una familia te está buscando</span><h2>Tu hogar puede ser su lugar feliz.</h2><p>Explora el catálogo y encuentra a tu próximo mejor amigo.</p></div><Link to="/mascotas" className="btn btn-light rounded-pill px-4">Ver mascotas disponibles</Link></div></section>
    </main>
  </>
}

function Step({ number, icon, title, text }) {
  return <div className="col-md-4"><div className="step-card"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div></div>
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><span>🐾</span><h3>{title}</h3><p>{text}</p></div>
}

function CatalogPage() {
  const [filters, setFilters] = useState({ q: '', especie_id: '', sexo: '', tamano: '' })
  const [species, setSpecies] = useState([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/catalogos/especies').then(({ data }) => setSpecies(data.data || [])).catch(() => {}) }, [])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.get('/mascotas', { params: { ...filters, page, per_page: 9 } })
      .then(({ data }) => { if (active) setResult(data) })
      .catch((err) => { if (active) setError(messageFromError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, page])
  function changeFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
    setPage(1)
  }
  return <main className="container page-container">
    <div className="page-intro"><span className="eyebrow">Adopción responsable</span><h1>Encuentra a tu compañero</h1><p>Busca entre las mascotas publicadas por refugios y responsables.</p></div>
    <div className="filter-panel row g-3 align-items-end mb-4">
      <div className="col-lg-4"><label className="form-label" htmlFor="search">Buscar por nombre</label><input id="search" className="form-control" name="q" value={filters.q} onChange={changeFilter} placeholder="Por ejemplo, Luna" /></div>
      <div className="col-6 col-lg-2"><label className="form-label" htmlFor="species">Especie</label><select id="species" className="form-select" name="especie_id" value={filters.especie_id} onChange={changeFilter}><option value="">Todas</option>{species.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
      <div className="col-6 col-lg-2"><label className="form-label" htmlFor="sex">Sexo</label><select id="sex" className="form-select" name="sexo" value={filters.sexo} onChange={changeFilter}><option value="">Todos</option><option value="hembra">Hembra</option><option value="macho">Macho</option><option value="desconocido">Sin especificar</option></select></div>
      <div className="col-6 col-lg-2"><label className="form-label" htmlFor="size">Tamaño</label><select id="size" className="form-select" name="tamano" value={filters.tamano} onChange={changeFilter}><option value="">Todos</option><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option></select></div>
      <div className="col-6 col-lg-2"><button className="btn btn-outline-success w-100" onClick={() => { setFilters({ q: '', especie_id: '', sexo: '', tamano: '' }); setPage(1) }}>Limpiar filtros</button></div>
    </div>
    {error && <div className="alert alert-danger">{error}</div>}
    {loading ? <Loading /> : result.data?.length ? <>
      <div className="row g-4">{result.data.map((pet) => <div className="col-md-6 col-lg-4" key={pet.id}><PetCard pet={pet} /></div>)}</div>
      <div className="pagination-row"><button className="btn btn-outline-success rounded-pill" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button><span>Página {result.current_page || page} de {result.last_page || 1}</span><button className="btn btn-outline-success rounded-pill" disabled={page >= result.last_page} onClick={() => setPage(page + 1)}>Siguiente →</button></div>
    </> : <EmptyState title="No encontramos coincidencias" text="Prueba con otros filtros o vuelve más tarde." />}
  </main>
}

function PetDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => {
    api.get('/mascotas/' + id).then(({ data }) => setPet(data.mascota)).catch((err) => setError(messageFromError(err))).finally(() => setLoading(false))
  }, [id])
  async function apply() {
    if (!user) return navigate('/iniciar-sesion')
    setSending(true)
    setNotice('')
    try {
      await api.post('/publicaciones/' + pet.publicacion_id + '/solicitudes', { motivacion: 'Quiero conocer más sobre esta mascota.' })
      setNotice('Tu solicitud quedó registrada. Puedes consultar su estado desde tu panel.')
    } catch (err) { setNotice(messageFromError(err)) } finally { setSending(false) }
  }
  if (loading) return <Loading />
  if (error) return <main className="container page-container"><div className="alert alert-warning">{error}</div><Link to="/mascotas">Volver al catálogo</Link></main>
  if (!pet) return null
  return <main className="container page-container">
    <Link to="/mascotas" className="back-link">← Volver al catálogo</Link>
    <div className="detail-layout mt-4">
      <div className="detail-photo">{pet.fotografia ? <img src={pet.fotografia} alt={pet.nombre} /> : <span>{pet.especie?.nombre === 'Gato' ? '🐱' : '🐶'}</span>}</div>
      <div className="detail-copy"><span className="eyebrow">{pet.especie?.nombre}{pet.raza?.nombre ? ' · ' + pet.raza.nombre : ''}</span><h1>{pet.nombre}</h1><p className="lead">{pet.descripcion || 'Una nueva historia está por comenzar.'}</p><div className="pet-facts"><Fact label="Edad" value={pet.edad_estimada_anios ? pet.edad_estimada_anios + ' años' : 'Por conocer'} /><Fact label="Sexo" value={pet.sexo || 'Por conocer'} /><Fact label="Tamaño" value={pet.tamano || 'Por conocer'} /><Fact label="Estado" value={pet.estado?.nombre || 'Disponible'} /></div>
        {pet.refugio && <div className="shelter-card"><span className="shelter-icon">🏡</span><div><strong>{pet.refugio.nombre}</strong><small>{[pet.refugio.municipio, pet.refugio.departamento].filter(Boolean).join(', ') || 'Colombia'}</small></div></div>}
        {notice && <div className="alert alert-success mt-3">{notice}</div>}
        {pet.publicacion_id && pet.estado?.codigo === 'disponible' && <button className="btn btn-success btn-lg rounded-pill mt-4 px-5" disabled={sending} onClick={apply}>{sending ? 'Enviando…' : 'Quiero conocer a ' + pet.nombre}</button>}
        {!user && <p className="small text-secondary mt-3">Necesitas una cuenta para enviar una solicitud.</p>}
      </div>
    </div>
  </main>
}

function Fact({ label, value }) { return <div className="fact"><small>{label}</small><strong>{value}</strong></div> }

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', telefono: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const demoAccounts = [
    ['Administrador', 'admin@petlink.test', import.meta.env.VITE_DEMO_PASSWORD_ADMIN],
    ['Adoptante', 'adoptante@petlink.test', import.meta.env.VITE_DEMO_PASSWORD_ADOPTER],
    ['Refugio', 'refugio@petlink.test', import.meta.env.VITE_DEMO_PASSWORD_SHELTER],
    ['Veterinario', 'veterinario@petlink.test', import.meta.env.VITE_DEMO_PASSWORD_VETERINARIAN],
    ['Hogar temporal', 'hogar@petlink.test', import.meta.env.VITE_DEMO_PASSWORD_FOSTER],
  ].filter(([, , password]) => typeof password === 'string' && password.length >= 16)
  if (user) return <Navigate to="/panel" replace />
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isRegister) await register(form)
      else await login({ email: form.email, password: form.password })
      navigate('/panel')
    } catch (err) { setError(messageFromError(err)) } finally { setBusy(false) }
  }
  return <main className="container auth-layout">
    <div className="auth-aside"><span className="eyebrow">PetLink</span><h1>{isRegister ? 'Un nuevo comienzo empieza aquí.' : 'Qué bueno verte de nuevo.'}</h1><p>{isRegister ? 'Crea tu cuenta para iniciar un proceso de adopción responsable y seguir cada paso.' : 'Inicia sesión para consultar tus solicitudes y continuar tu historia.'}</p><div className="auth-paw">🐾</div></div>
    <div className="auth-card"><h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2><p className="text-secondary mb-4">{isRegister ? 'Regístrate como adoptante para comenzar.' : 'Ingresa con tus datos de PetLink.'}</p>
      <form onSubmit={submit} className="vstack gap-3">
        {isRegister && <><Field label="Nombre completo" name="name" value={form.name} onChange={change} required autoComplete="name" /><Field label="Teléfono (opcional)" name="telefono" value={form.telefono} onChange={change} autoComplete="tel" /></>}
        <Field label="Correo electrónico" name="email" type="email" value={form.email} onChange={change} required autoComplete="email" />
        <Field label="Contraseña" name="password" type="password" value={form.password} onChange={change} required minLength={isRegister ? 10 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} />
        {isRegister && <Field label="Confirmar contraseña" name="password_confirmation" type="password" value={form.password_confirmation} onChange={change} required minLength={10} autoComplete="new-password" />}
        {!isRegister && import.meta.env.DEV && <details className="demo-login"><summary>Rellenar una cuenta de demostración</summary><div className="demo-login-list">{demoAccounts.map(([label, email, password]) => <button type="button" className="btn btn-sm btn-outline-success" key={email} onClick={() => { setError(''); setForm((current) => ({ ...current, email, password })) }}>{label}</button>)}</div><small>Se inicia sesión mediante este formulario; las cuentas solo se habilitan en desarrollo.</small></details>}
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <button className="btn btn-success btn-lg rounded-pill w-100 mt-2" disabled={busy}>{busy ? 'Un momento…' : isRegister ? 'Crear mi cuenta' : 'Iniciar sesión'}</button>
      </form>
      <p className="auth-switch">{isRegister ? '¿Ya tienes cuenta?' : '¿Primera vez en PetLink?'} <Link to={isRegister ? '/iniciar-sesion' : '/registro'}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Link></p>
      {!isRegister && <p className="auth-switch mt-2"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p>}
    </div>
  </main>
}

function PasswordRecoveryPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ email: searchParams.get('email') || '', password: '', password_confirmation: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const resetting = Boolean(token)

  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('')
    try {
      const response = resetting
        ? await api.post('/auth/restablecer-contrasena', { ...form, token })
        : await api.post('/auth/recuperar-contrasena', { email: form.email })
      setMessage(response.data.message)
      if (resetting) setForm((current) => ({ ...current, password: '', password_confirmation: '' }))
    } catch (err) { setError(messageFromError(err)) } finally { setBusy(false) }
  }

  return <main className="container auth-layout"><div className="auth-aside"><span className="eyebrow">PetLink</span><h1>Recupera el acceso a tu cuenta.</h1><p>Te enviaremos instrucciones al correo registrado para cambiar tu contraseña de forma segura.</p><div className="auth-paw">🐾</div></div><div className="auth-card"><h2>{resetting ? 'Crear una contraseña nueva' : 'Recuperar contraseña'}</h2><form onSubmit={submit} className="vstack gap-3 mt-4"><Field label="Correo electrónico" name="recovery-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" />{resetting && <><Field label="Nueva contraseña" name="recovery-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={10} autoComplete="new-password" /><Field label="Confirmar contraseña" name="recovery-password-confirm" type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} required minLength={10} autoComplete="new-password" /></>}{message && <div className="alert alert-success" role="status">{message}</div>}{error && <div className="alert alert-danger" role="alert">{error}</div>}<button className="btn btn-success rounded-pill" disabled={busy}>{busy ? 'Un momento…' : resetting ? 'Restablecer contraseña' : 'Enviar instrucciones'}</button></form><p className="auth-switch"><Link to="/iniciar-sesion">Volver a iniciar sesión</Link></p></div></main>
}

function Field({ label, name, type = 'text', value, onChange, ...props }) {
  return <div><label className="form-label" htmlFor={name}>{label}</label><input className="form-control" id={name} name={name} type={type} value={value} onChange={onChange} {...props} /></div>
}

function DashboardPage() {
  const { user, refreshUser, logout } = useAuth()
  const [payload, setPayload] = useState({})
  const [modules, setModules] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [profile, setProfile] = useState({ name: user.name || '', email: user.email || '', telefono: user.telefono || '' })
  const role = user.role?.nombre
  function announce(message) {
    if (!message) { setNotice(null); return }
    const successful = /^(Perfil actualizado|Estado de mascota actualizado|Publicación actualizada|Catálogo actualizado|Mascota registrada|Asignación guardada|Cita solicitada|Donación registrada|Cita marcada como realizada|Registro médico guardado|Vacuna aplicada y registrada|Cita reprogramada|Cita cancelada|Acogida cerrada|Hogar temporal registrado|Contraseña actualizada|Fotografía)/i.test(message)
    setNotice({ message, type: successful && !/no se pudo|error/i.test(message) ? 'success' : 'danger' })
  }
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/panel')
      setPayload(data.dashboard)
      const next = {}
      const { data: notifications } = await api.get('/notificaciones')
      next.notifications = notifications.data || []
      next.unreadCount = notifications.unread_count || 0
      if (role === 'Administrador' || role === 'Refugio') {
        const responses = await Promise.allSettled([api.get('/mis-mascotas'), api.get('/solicitudes/para-revisar'), api.get('/hogares-temporales'), api.get('/asignaciones-hogar')])
        if (responses[0].status === 'fulfilled') next.pets = responses[0].value.data.data || []
        if (responses[1].status === 'fulfilled') next.requests = responses[1].value.data.data || []
        if (responses[2].status === 'fulfilled') next.homes = responses[2].value.data.data || []
        if (responses[3].status === 'fulfilled') next.assignments = responses[3].value.data.data || []
      }
      if (role === 'Administrador') {
        const responses = await Promise.allSettled([api.get('/usuarios'), api.get('/roles'), api.get('/auditoria')])
        if (responses[0].status === 'fulfilled') next.users = responses[0].value.data.data || []
        if (responses[1].status === 'fulfilled') next.roles = responses[1].value.data.data || []
        if (responses[2].status === 'fulfilled') next.auditLogs = responses[2].value.data.data || []
      } else if (role === 'Adoptante') {
        const responses = await Promise.allSettled([api.get('/mis-solicitudes'), api.get('/adopciones'), api.get('/seguimientos'), api.get('/citas'), api.get('/mascotas', { params: { per_page: 30 } }), api.get('/veterinarios')])
        if (responses[0].status === 'fulfilled') next.requests = responses[0].value.data.data || []
        if (responses[1].status === 'fulfilled') next.adoptions = responses[1].value.data.data || []
        if (responses[2].status === 'fulfilled') next.followUps = responses[2].value.data.data || []
        if (responses[3].status === 'fulfilled') next.appointments = responses[3].value.data.data || []
        if (responses[4].status === 'fulfilled') next.pets = responses[4].value.data.data || []
        if (responses[5].status === 'fulfilled') next.veterinarians = responses[5].value.data.data || []
      } else if (role === 'Veterinario') {
        const responses = await Promise.allSettled([api.get('/citas'), api.get('/catalogos/vacunas')])
        if (responses[0].status === 'fulfilled') next.appointments = responses[0].value.data.data || []
        if (responses[1].status === 'fulfilled') next.vaccines = responses[1].value.data.data || []
      } else if (role === 'Hogar temporal') {
        const { data: home } = await api.get('/hogar-temporal')
        next.home = home.hogar
        if (home.hogar) {
          const { data: assignments } = await api.get('/asignaciones-hogar')
          next.assignments = assignments.data || []
        }
      }
      setModules(next)
    } catch (err) { setError(messageFromError(err)) } finally { setLoading(false) }
  }, [role])
  useEffect(() => { load() }, [load])
  async function saveProfile(event) {
    event.preventDefault()
    announce('')
    try { await api.put('/auth/perfil', profile); await refreshUser(); announce('Perfil actualizado.') } catch (err) { announce(messageFromError(err)) }
  }
  if (loading) return <Loading />
  return <main className="container page-container dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Panel de {role || 'usuario'}</span><h1>Hola, {user.name.split(' ')[0]}</h1><p>Administra tu actividad y continúa tu historia en PetLink.</p><span className="role-badge">{role}</span></div><span className="user-avatar" aria-label={'Usuario ' + user.name}>{user.name.charAt(0).toUpperCase()}</span></div>
    {error && <div className="alert alert-danger">{error}</div>}{notice && <div className={'alert alert-' + notice.type} role={notice.type === 'danger' ? 'alert' : 'status'}>{notice.message}</div>}
    {payload.stats && <div id="resumen" className="row g-3 stats-row">{Object.entries(payload.stats).map(([label, value]) => <div className="col-6 col-xl-3" key={label}><div className="stat-card"><small>{label.replaceAll('_', ' ')}</small><strong>{typeof value === 'number' ? value.toLocaleString('es-CO') : value || '—'}</strong></div></div>)}</div>}
    <DashboardNav role={role} />
    <NotificationPanel items={modules.notifications || []} unreadCount={modules.unreadCount || 0} onDone={load} />
    <section id="mi-perfil" className="dashboard-section profile-section"><div className="section-title"><div><span className="eyebrow">Tu cuenta · {role}</span><h2>Mi perfil</h2></div></div><form className="row g-3 align-items-end" onSubmit={saveProfile}><div className="col-md-4"><Field label="Nombre" name="profile-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></div><div className="col-md-4"><Field label="Correo" name="profile-email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></div><div className="col-md-3"><Field label="Teléfono" name="profile-phone" value={profile.telefono || ''} onChange={(e) => setProfile({ ...profile, telefono: e.target.value })} /></div><div className="col-md-1"><button className="btn btn-success w-100" aria-label="Guardar perfil">Guardar</button></div></form><form className="row g-3 align-items-end mt-2" onSubmit={async (event) => { event.preventDefault(); announce(''); try { await api.put('/auth/contrasena', passwordForm); setPasswordForm({ current_password: '', password: '', password_confirmation: '' }); announce('Contraseña actualizada. Vuelve a iniciar sesión.'); await logout() } catch (err) { announce(messageFromError(err)) } }}><div className="col-md-3"><Field label="Contraseña actual" name="current-password" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required autoComplete="current-password" /></div><div className="col-md-3"><Field label="Nueva contraseña" name="new-password" type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} required minLength="10" autoComplete="new-password" /></div><div className="col-md-3"><Field label="Confirmar nueva contraseña" name="confirm-new-password" type="password" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })} required minLength="10" autoComplete="new-password" /></div><div className="col-md-3"><button className="btn btn-outline-success w-100">Actualizar contraseña</button></div></form></section>
    {(role === 'Administrador' || role === 'Refugio') && <>
      <PetManagement role={role} pets={modules.pets || []} onDone={load} onNotice={announce} />
      <RequestReview requests={modules.requests || []} onDone={load} />
      <AssignmentManagement pets={modules.pets || []} homes={modules.homes || []} assignments={modules.assignments || []} onDone={load} onNotice={announce} />
    </>}
    {role === 'Administrador' && <><UserManagement users={modules.users || []} roles={modules.roles || []} onDone={load} /><CatalogManagement onDone={load} onNotice={announce} /><AuditPanel rows={modules.auditLogs || []} /></>}
    {role === 'Adoptante' && <AdopterActivity requests={modules.requests || []} adoptions={modules.adoptions || []} followUps={modules.followUps || []} appointments={modules.appointments || []} pets={modules.pets || []} veterinarians={modules.veterinarians || []} onDone={load} onNotice={announce} />}
    {role === 'Veterinario' && <VeterinaryActivity appointments={payload.citas || modules.appointments || []} vaccines={modules.vaccines || []} history={payload.historial_reciente || []} vaccineHistory={payload.vacunas_recientes || []} onDone={load} onNotice={announce} />}
    {role === 'Hogar temporal' && <FosterActivity home={modules.home} assignments={modules.assignments || []} onDone={load} onNotice={announce} />}
    {role === 'Administrador' && <AdminActivity dashboard={payload} />}
    {role === 'Refugio' && <ReportPanel />}
    <div className="dashboard-footer-note"><span>💚</span> Gracias por ser parte de una comunidad que cuida y conecta.</div>
  </main>
}

function DashboardNav({ role }) {
  const menus = {
    Administrador: [['Resumen', '#resumen'], ['Notificaciones', '#notificaciones'], ['Mascotas', '#gestion-mascotas'], ['Solicitudes', '#solicitudes-recibidas'], ['Hogares', '#asignaciones'], ['Usuarios y roles', '#usuarios-roles'], ['Catálogos', '#catalogos'], ['Auditoría', '#auditoria'], ['Módulos y reportes', '#reportes-admin']],
    Adoptante: [['Explorar mascotas', '/mascotas'], ['Notificaciones', '#notificaciones'], ['Mis solicitudes', '#mis-solicitudes'], ['Adopciones', '#mis-adopciones'], ['Citas', '#mis-citas'], ['Perfil', '#mi-perfil']],
    Refugio: [['Mascotas y publicaciones', '#gestion-mascotas'], ['Notificaciones', '#notificaciones'], ['Solicitudes recibidas', '#solicitudes-recibidas'], ['Hogares temporales', '#asignaciones'], ['Reportes', '#reportes-refugio'], ['Perfil', '#mi-perfil']],
    Veterinario: [['Agenda', '#agenda-veterinaria'], ['Notificaciones', '#notificaciones'], ['Historiales', '#historial-veterinario'], ['Vacunas', '#vacunas-veterinario'], ['Perfil', '#mi-perfil']],
    'Hogar temporal': [['Mi hogar', '#mi-hogar'], ['Notificaciones', '#notificaciones'], ['Asignaciones', '#asignaciones-hogar'], ['Perfil', '#mi-perfil']],
  }
  return <nav className="dashboard-nav" aria-label={'Navegación del panel ' + role}>{(menus[role] || []).map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
}

function NotificationPanel({ items, unreadCount, onDone }) {
  const [error, setError] = useState('')
  async function markRead(id) {
    setError('')
    try { await api.patch('/notificaciones/' + id + '/leida'); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  async function markAllRead() {
    setError('')
    try { await api.patch('/notificaciones/leidas'); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  return <Section id="notificaciones" eyebrow="Avisos de tu cuenta" title="Notificaciones" action={unreadCount > 0 && <button className="btn btn-sm btn-outline-success" onClick={markAllRead}>Marcar todas como leídas</button>}>
    {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}{items.length ? <div className="vstack gap-2">{items.map((item) => <article className={'notification-item' + (item.read_at ? '' : ' notification-unread')} key={item.id}><div>{item.data?.url ? <Link className="fw-bold text-success" to={item.data.url}>{item.data?.title || 'Actualización de PetLink'}</Link> : <strong>{item.data?.title || 'Actualización de PetLink'}</strong>}<p className="mb-1">{item.data?.message}</p><small>{new Date(item.created_at).toLocaleString('es-CO')}</small></div>{!item.read_at && <button className="btn btn-sm btn-outline-success text-nowrap" onClick={() => markRead(item.id)}>Marcar leída</button>}</article>)}</div> : <EmptyState title="No hay notificaciones" text="Los cambios importantes de solicitudes, adopciones y citas aparecerán aquí." />}
  </Section>
}

function AuditPanel({ rows }) {
  return <Section id="auditoria" eyebrow="Trazabilidad" title="Auditoría de operaciones">
    {rows.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Registro</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString('es-CO')}</td><td>{row.actor?.name || 'Cuenta eliminada'}</td><td>{row.action}</td><td>{row.subject_type ? `${row.subject_type} #${row.subject_id}` : '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="Sin operaciones auditadas" text="Las acciones críticas aparecerán después de guardar cambios." />}
  </Section>
}

function ReportPanel() {
  return <Section id="reportes-refugio" eyebrow="Actividad de tu refugio" title="Reporte de actividad" action={<DownloadReportButton />}><p className="text-secondary mb-0">Descarga cifras de mascotas, publicaciones, solicitudes, adopciones, citas y asignaciones bajo tu responsabilidad.</p></Section>
}

function DownloadReportButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function download() {
    setBusy(true); setError('')
    try {
      const { data } = await api.get('/reportes/resumen.csv', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = 'petlink-resumen.csv'; anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) { setError(messageFromError(err)) } finally { setBusy(false) }
  }
  return <div className="text-end"><button className="btn btn-outline-success" onClick={download} disabled={busy}>{busy ? 'Preparando…' : 'Descargar CSV'}</button>{error && <small className="d-block text-danger mt-1">{error}</small>}</div>
}

function Section({ eyebrow, title, children, action, id }) {
  return <section id={id} className="dashboard-section"><div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>{children}</section>
}

function AdminActivity({ dashboard }) {
  const requestsByState = dashboard.solicitudes_por_estado || []
  const maxRequests = Math.max(1, ...requestsByState.map((item) => Number(item.total)))
  return <Section id="reportes-admin" eyebrow="Supervisión general" title="Módulos veterinarios, donaciones y seguimientos" action={<DownloadReportButton />}>
    {requestsByState.length > 0 && <div className="status-chart" aria-label="Solicitudes de adopción por estado">{requestsByState.map((item) => <div className="status-chart-row" key={item.estado}><span>{item.estado.replaceAll('_', ' ')}</span><div className="status-chart-track"><div className="status-chart-fill" style={{ width: `${Math.max(8, Number(item.total) / maxRequests * 100)}%` }} /></div><strong>{item.total}</strong></div>)}</div>}
    <div className="row g-4 mt-1">
      <div className="col-lg-6"><h3 className="h6">Citas veterinarias recientes</h3><ActivityTable rows={dashboard.citas_recientes || []} columns={[["Fecha", (item) => new Date(item.programada_en).toLocaleDateString('es-CO')], ["Mascota", (item) => item.mascota?.nombre], ["Estado", (item) => item.estado]]} empty="No hay citas registradas." /></div>
      <div className="col-lg-6"><h3 className="h6">Historial médico reciente</h3><ActivityTable rows={dashboard.historial_medico_reciente || []} columns={[["Fecha", (item) => item.fecha_registro], ["Mascota", (item) => item.mascota?.nombre], ["Atención", (item) => item.titulo], ["Autor", (item) => item.autor?.name]]} empty="No hay atenciones registradas." /></div>
      <div className="col-lg-6"><h3 className="h6">Vacunaciones</h3><ActivityTable rows={dashboard.vacunas_recientes || []} columns={[["Fecha", (item) => item.aplicada_en], ["Mascota", (item) => item.mascota?.nombre], ["Vacuna", (item) => item.vacuna?.nombre]]} empty="No hay vacunas registradas." /></div>
      <div className="col-lg-6"><h3 className="h6">Donaciones registradas</h3><ActivityTable rows={dashboard.donaciones_recientes || []} columns={[["Aporte", (item) => item.tipo_aporte], ["Refugio", (item) => item.refugio?.nombre || '—'], ["COP", (item) => item.importe_cop || '—']]} empty="No hay donaciones registradas." /></div>
      <div className="col-lg-6"><h3 className="h6">Seguimientos</h3><ActivityTable rows={dashboard.seguimientos_recientes || []} columns={[["Mascota", (item) => item.adopcion?.mascota?.nombre], ["Fecha", (item) => item.fecha_programada], ["Estado", (item) => item.resultado]]} empty="No hay seguimientos registrados." /></div>
    </div>
  </Section>
}

function ActivityTable({ rows, columns, empty }) {
  if (!rows.length) return <p className="small text-secondary">{empty}</p>
  return <div className="table-responsive"><table className="table table-sm align-middle"><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map(([label, value]) => <td key={label}>{value(row) || '—'}</td>)}</tr>)}</tbody></table></div>
}

function PetManagement({ role, pets, onDone, onNotice }) {
  const [showForm, setShowForm] = useState(false)
  const [species, setSpecies] = useState([])
  const [states, setStates] = useState([])
  const [form, setForm] = useState({ nombre: '', especie_id: '', edad_estimada_anios: '', sexo: 'hembra', tamano: 'mediano', descripcion: '', foto: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.allSettled([api.get('/catalogos/especies'), api.get('/catalogos/estados-mascota')]).then(([speciesResult, statesResult]) => {
      if (speciesResult.status === 'fulfilled') setSpecies(speciesResult.value.data.data || [])
      if (statesResult.status === 'fulfilled') setStates(statesResult.value.data.data || [])
    })
  }, [])
  async function changeState(pet, estado_id) {
    onNotice('')
    try { await api.put('/mascotas/' + pet.id, { estado_id: Number(estado_id) }); onNotice('Estado de mascota actualizado.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function togglePublication(pet) {
    if (!pet.publicacion) return
    onNotice('')
    try { await api.put('/publicaciones/' + pet.publicacion.id, { estado: pet.publicacion.estado === 'publicada' ? 'cerrada' : 'publicada' }); onNotice('Publicación actualizada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); onNotice('')
    try {
      const { foto, ...fields } = form
      const body = { ...fields, edad_estimada_anios: form.edad_estimada_anios || null }
      const { data } = await api.post('/mascotas', body)
      await api.post('/mascotas/' + data.mascota.id + '/publicaciones', { titulo: 'Conoce a ' + data.mascota.nombre, descripcion: data.mascota.descripcion })
      let photoError = ''
      if (foto) {
        const upload = new FormData()
        upload.append('foto', foto)
        upload.append('principal', '1')
        try { await api.post('/mascotas/' + data.mascota.id + '/fotos', upload) } catch (err) { photoError = messageFromError(err) }
      }
      setForm({ nombre: '', especie_id: '', edad_estimada_anios: '', sexo: 'hembra', tamano: 'mediano', descripcion: '', foto: null })
      setShowForm(false); onNotice(photoError ? 'Mascota registrada; no se pudo subir la fotografía: ' + photoError : 'Mascota registrada y publicada.'); await onDone()
    } catch (err) { setError(messageFromError(err)) } finally { setBusy(false) }
  }
  return <Section id="gestion-mascotas" eyebrow={role === 'Administrador' ? 'Gestión general' : 'Tu refugio'} title="Mascotas y publicaciones" action={<button className="btn btn-success rounded-pill" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cerrar formulario' : '+ Registrar mascota'}</button>}>
    {showForm && <form className="form-panel row g-3 mb-4" onSubmit={submit}><div className="col-md-4"><Field label="Nombre" name="pet-name" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></div><div className="col-md-3"><label className="form-label" htmlFor="pet-species">Especie</label><select className="form-select" id="pet-species" value={form.especie_id} onChange={(e) => setForm({ ...form, especie_id: e.target.value })} required><option value="">Elige una especie</option>{species.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div><div className="col-md-2"><label className="form-label" htmlFor="pet-sex">Sexo</label><select className="form-select" id="pet-sex" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}><option value="hembra">Hembra</option><option value="macho">Macho</option><option value="desconocido">Sin especificar</option></select></div><div className="col-md-3"><label className="form-label" htmlFor="pet-size">Tamaño</label><select className="form-select" id="pet-size" value={form.tamano} onChange={(e) => setForm({ ...form, tamano: e.target.value })}><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option></select></div><div className="col-md-3"><Field label="Edad aproximada" name="pet-age" type="number" min="0" max="40" value={form.edad_estimada_anios} onChange={(e) => setForm({ ...form, edad_estimada_anios: e.target.value })} /></div><div className="col-md-4"><label className="form-label" htmlFor="pet-photo">Fotografía (opcional)</label><input className="form-control" id="pet-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0] || null })} /></div><div className="col-md-5"><label className="form-label" htmlFor="pet-description">Descripción</label><textarea className="form-control" id="pet-description" rows="2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>{error && <div className="col-12"><div className="alert alert-danger py-2">{error}</div></div>}<div className="col-12 text-end"><button className="btn btn-success rounded-pill px-4" disabled={busy}>{busy ? 'Guardando…' : 'Guardar y publicar'}</button></div></form>}
    <PetPhotos pets={pets} onDone={onDone} onNotice={onNotice} />
    {pets.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Mascota</th><th>Especie</th><th>Estado</th><th>Publicación</th><th /></tr></thead><tbody>{pets.map((pet) => <tr key={pet.id}><td><Link to={'/mascotas/' + pet.id}>{pet.nombre}</Link></td><td>{pet.especie?.nombre}</td><td><select className="form-select form-select-sm" value={pet.estado?.id || ''} onChange={(e) => changeState(pet, e.target.value)} aria-label={'Estado de ' + pet.nombre}>{states.filter((item) => item.codigo !== 'adoptada').map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></td><td>{pet.publicacion?.estado === 'publicada' ? 'Publicada' : 'Cerrada'}</td><td>{pet.publicacion && pet.estado?.codigo === 'disponible' && <button className="btn btn-sm btn-outline-success" onClick={() => togglePublication(pet)}>{pet.publicacion.estado === 'publicada' ? 'Cerrar' : 'Reabrir'}</button>}</td></tr>)}</tbody></table></div> : <EmptyState title="Aún no hay mascotas registradas" text="Usa el botón para crear la primera ficha." />}
  </Section>
}

function PetPhotos({ pets, onDone, onNotice }) {
  async function upload(pet, file) {
    if (!file) return
    const form = new FormData(); form.append('foto', file)
    try { await api.post('/mascotas/' + pet.id + '/fotos', form); onNotice('Fotografía cargada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function setPrimary(pet, photo) {
    try { await api.patch(`/mascotas/${pet.id}/fotos/${photo.id}/principal`); onNotice('Fotografía principal actualizada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function remove(pet, photo) {
    if (!window.confirm('¿Eliminar esta fotografía de ' + pet.nombre + '?')) return
    try { await api.delete(`/mascotas/${pet.id}/fotos/${photo.id}`); onNotice('Fotografía eliminada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  if (!pets.length) return null
  return <div className="pet-photo-management" aria-label="Administrar fotografías de mascotas">{pets.map((pet) => <div className="pet-photo-row" key={pet.id}><strong>{pet.nombre}</strong><div className="pet-photo-list">{(pet.fotos || []).map((photo) => <div className="pet-photo-item" key={photo.id}><img src={photo.url || photo.ruta} alt={photo.texto_alternativo || 'Fotografía de ' + pet.nombre} /><div className="d-flex flex-wrap gap-1">{photo.principal ? <span className="status-pill status-success">Principal</span> : <button className="btn btn-sm btn-outline-success" onClick={() => setPrimary(pet, photo)}>Hacer principal</button>}<button className="btn btn-sm btn-outline-danger" onClick={() => remove(pet, photo)}>Eliminar</button></div></div>)}</div><label className="btn btn-sm btn-outline-success mb-0">Añadir foto<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { upload(pet, event.target.files?.[0]); event.target.value = '' }} /></label></div>)}</div>
}

function RequestReview({ requests, onDone }) {
  const [error, setError] = useState('')
  async function changeStatus(item, status) {
    setError('')
    try { await api.patch('/solicitudes/' + item.id, { estado: status }); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  async function formalize(item) {
    setError('')
    try { await api.post('/solicitudes/' + item.id + '/formalizar'); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  return <Section id="solicitudes-recibidas" eyebrow="Proceso de adopción" title="Solicitudes recibidas">
    {error && <div className="alert alert-danger">{error}</div>}
    {requests.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Adoptante</th><th>Mascota</th><th>Motivación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td>{item.adoptante?.name}</td><td>{item.publicacion?.mascota?.nombre}</td><td className="request-note">{item.motivacion || 'Sin comentario'}</td><td><Status value={item.estado} /></td><td><div className="d-flex gap-2 flex-wrap">{item.estado === 'pendiente' && <button className="btn btn-sm btn-outline-success" onClick={() => changeStatus(item, 'en_revision')}>Revisar</button>}{item.estado === 'en_revision' && <><button className="btn btn-sm btn-success" onClick={() => changeStatus(item, 'aprobada')}>Aprobar</button><button className="btn btn-sm btn-outline-danger" onClick={() => changeStatus(item, 'rechazada')}>Rechazar</button></>}{item.estado === 'aprobada' && <button className="btn btn-sm btn-success" onClick={() => formalize(item)}>Formalizar</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="No hay solicitudes por revisar" text="Las solicitudes nuevas aparecerán aquí." />}
  </Section>
}

function UserManagement({ users, roles, onDone }) {
  const [error, setError] = useState('')
  async function update(user, changes) {
    setError('')
    try { await api.patch('/usuarios/' + user.id, changes); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  return <Section id="usuarios-roles" eyebrow="Administración" title="Usuarios y roles">
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td><select className="form-select form-select-sm role-select" value={item.role_id} onChange={(e) => update(item, { role_id: Number(e.target.value) })}>{roles.map((role) => <option key={role.id} value={role.id}>{role.nombre}</option>)}</select></td><td><Status value={item.activo ? 'Activo' : 'Inactivo'} /></td><td><button className="btn btn-sm btn-outline-secondary" onClick={() => update(item, { activo: !item.activo })}>{item.activo ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div>
  </Section>
}

function CatalogManagement({ onDone, onNotice }) {
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [states, setStates] = useState([])
  const [form, setForm] = useState({ species: '', breed: '', vaccine: '', species_id: '' })
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([api.get('/catalogos/especies'), api.get('/catalogos/razas'), api.get('/catalogos/estados-mascota')])
    setSpecies(results[0].status === 'fulfilled' ? results[0].value.data.data || [] : [])
    setBreeds(results[1].status === 'fulfilled' ? results[1].value.data.data || [] : [])
    setStates(results[2].status === 'fulfilled' ? results[2].value.data.data || [] : [])
  }, [])
  async function updateCatalog(path, fields) {
    setError(''); onNotice('')
    try { await api.patch(path, fields); onNotice('Catálogo actualizado.'); await refresh() } catch (err) { setError(messageFromError(err)) }
  }
  useEffect(() => { refresh() }, [refresh])
  async function submit(event, path, body, clear) {
    event.preventDefault(); setError(''); onNotice('')
    try { await api.post(path, body); setForm((current) => ({ ...current, ...clear })); onNotice('Catálogo actualizado.'); await refresh(); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  return <Section id="catalogos" eyebrow="Catálogos" title="Especies, razas, estados y vacunas">
    {error && <div className="alert alert-danger py-2">{error}</div>}
    <div className="row g-3">
      <form className="col-lg-4" onSubmit={(e) => submit(e, '/catalogos/especies', { nombre: form.species }, { species: '' })}><label className="form-label" htmlFor="new-species">Nueva especie</label><div className="input-group"><input className="form-control" id="new-species" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} required maxLength="60" /><button className="btn btn-outline-success">Agregar</button></div></form>
      <form className="col-lg-4" onSubmit={(e) => submit(e, '/catalogos/razas', { especie_id: Number(form.species_id), nombre: form.breed }, { breed: '' })}><label className="form-label" htmlFor="new-breed">Nueva raza</label><div className="input-group"><select id="new-breed-species" className="form-select" value={form.species_id} onChange={(e) => setForm({ ...form, species_id: e.target.value })} required><option value="">Especie</option>{species.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><input className="form-control" id="new-breed" placeholder="Nombre" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} required maxLength="80" /><button className="btn btn-outline-success">Agregar</button></div></form>
      <form className="col-lg-4" onSubmit={(e) => submit(e, '/vacunas', { nombre: form.vaccine }, { vaccine: '' })}><label className="form-label" htmlFor="new-vaccine">Nueva vacuna</label><div className="input-group"><input className="form-control" id="new-vaccine" value={form.vaccine} onChange={(e) => setForm({ ...form, vaccine: e.target.value })} required maxLength="100" /><button className="btn btn-outline-success">Agregar</button></div></form>
    </div>
    <div className="row g-4 mt-2">
      <div className="col-lg-4"><h3 className="h6">Especies</h3><div className="table-responsive"><table className="table table-sm align-middle"><tbody>{species.map((item) => <tr key={item.id}><td>{item.nombre}</td><td><Status value={item.activo ? 'Activa' : 'Inactiva'} /></td><td><button className="btn btn-sm btn-outline-secondary" onClick={() => updateCatalog('/catalogos/especies/' + item.id, { activo: !item.activo })}>{item.activo ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div></div>
      <div className="col-lg-4"><h3 className="h6">Razas</h3><div className="table-responsive"><table className="table table-sm align-middle"><tbody>{breeds.map((item) => <tr key={item.id}><td>{item.nombre}<small className="d-block text-secondary">{item.especie?.nombre}</small></td><td><Status value={item.activo ? 'Activa' : 'Inactiva'} /></td><td><button className="btn btn-sm btn-outline-secondary" onClick={() => updateCatalog('/catalogos/razas/' + item.id, { activo: !item.activo })}>{item.activo ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div></div>
      <div className="col-lg-4"><h3 className="h6">Estados de mascotas</h3><div className="table-responsive"><table className="table table-sm align-middle"><thead><tr><th>Estado</th><th>Visible</th><th /></tr></thead><tbody>{states.map((item) => <tr key={item.id}><td><strong>{item.nombre}</strong><small className="d-block text-secondary">{item.codigo}</small></td><td><input type="checkbox" className="form-check-input" checked={Boolean(item.visible_publico)} aria-label={'Visibilidad pública de ' + item.nombre} onChange={(e) => updateCatalog('/catalogos/estados-mascota/' + item.id, { visible_publico: e.target.checked })} /></td><td><button className="btn btn-sm btn-outline-secondary" onClick={() => { const nombre = window.prompt('Nuevo nombre del estado', item.nombre); if (nombre?.trim()) updateCatalog('/catalogos/estados-mascota/' + item.id, { nombre: nombre.trim() }) }}>Renombrar</button></td></tr>)}</tbody></table></div></div>
    </div>
  </Section>
}

function AssignmentManagement({ pets, homes, assignments, onDone, onNotice }) {
  const [form, setForm] = useState({ mascota_id: '', hogar_id: '', inicio: '', fin: '', notas: '' })
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setError(''); onNotice('')
    try { await api.post('/asignaciones-hogar', { ...form, mascota_id: Number(form.mascota_id), hogar_id: Number(form.hogar_id) }); setForm({ mascota_id: '', hogar_id: '', inicio: '', fin: '', notas: '' }); onNotice('Asignación guardada.'); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  async function close(item) {
    setError('')
    try { await api.patch('/asignaciones-hogar/' + item.id + '/finalizar'); await onDone() } catch (err) { setError(messageFromError(err)) }
  }
  return <Section id="asignaciones" eyebrow="Acogida temporal" title="Asignaciones de hogares">
    {error && <div className="alert alert-danger py-2">{error}</div>}
    {homes.length && pets.length ? <form className="form-panel row g-3 align-items-end mb-4" onSubmit={submit}><div className="col-md-3"><label className="form-label" htmlFor="assign-pet">Mascota</label><select id="assign-pet" className="form-select" value={form.mascota_id} onChange={(e) => setForm({ ...form, mascota_id: e.target.value })} required><option value="">Selecciona</option>{pets.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div><div className="col-md-4"><label className="form-label" htmlFor="assign-home">Hogar disponible</label><select id="assign-home" className="form-select" value={form.hogar_id} onChange={(e) => setForm({ ...form, hogar_id: e.target.value })} required><option value="">Selecciona</option>{homes.filter((item) => item.espacios_ocupados < item.capacidad).map((item) => <option key={item.id} value={item.id}>{item.responsable?.name} · {item.espacios_ocupados}/{item.capacidad}</option>)}</select></div><div className="col-md-2"><Field label="Inicio" name="assign-start" type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} required /></div><div className="col-md-2"><Field label="Fin (opcional)" name="assign-end" type="date" value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} /></div><div className="col-md-1"><button className="btn btn-success w-100" aria-label="Asignar hogar">+</button></div></form> : <p className="text-secondary">Para asignar una mascota, registra un hogar temporal y una mascota primero.</p>}
    {assignments.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Mascota</th><th>Hogar</th><th>Fechas</th><th>Estado</th><th /></tr></thead><tbody>{assignments.map((item) => <tr key={item.id}><td>{item.mascota?.nombre}</td><td>{item.hogar?.responsable?.name}</td><td>{item.inicio} – {item.fin || 'En curso'}</td><td><Status value={item.estado} /></td><td>{item.estado === 'activa' && <button className="btn btn-sm btn-outline-success" onClick={() => close(item)}>Finalizar</button>}</td></tr>)}</tbody></table></div> : <EmptyState title="Sin asignaciones" text="Las acogidas creadas aparecerán aquí." />}
  </Section>
}

function AdopterActivity({ requests, adoptions, followUps, appointments, pets, veterinarians, onDone, onNotice }) {
  const [form, setForm] = useState({ tipo_aporte: 'dinero', importe_cop: '', descripcion: '' })
  const [appointment, setAppointment] = useState({ mascota_id: '', veterinario_id: '', programada_en: '', motivo: '' })
  const [busy, setBusy] = useState(false)
  async function book(event) {
    event.preventDefault(); setBusy(true); onNotice('')
    try {
      await api.post('/citas', { ...appointment, mascota_id: Number(appointment.mascota_id), veterinario_id: Number(appointment.veterinario_id), programada_en: new Date(appointment.programada_en).toISOString() })
      setAppointment({ mascota_id: '', veterinario_id: '', programada_en: '', motivo: '' }); onNotice('Cita solicitada. Consulta su estado en tu panel.'); await onDone()
    } catch (err) { onNotice(messageFromError(err)) } finally { setBusy(false) }
  }
  async function donate(event) {
    event.preventDefault(); setBusy(true); onNotice('')
    try {
      await api.post('/donaciones', { ...form, importe_cop: form.tipo_aporte === 'dinero' ? form.importe_cop : null })
      setForm({ tipo_aporte: 'dinero', importe_cop: '', descripcion: '' }); onNotice('Donación registrada. PetLink no procesa pagos.'); await onDone()
    } catch (err) { onNotice(messageFromError(err)) } finally { setBusy(false) }
  }
  return <>
    <Section id="mis-solicitudes" eyebrow="Tu proceso" title="Mis solicitudes">
      {requests.length ? <div className="row g-3">{requests.map((item) => <div className="col-md-6" key={item.id}><div className="activity-card"><div><strong>{item.publicacion?.mascota?.nombre || 'Mascota'}</strong><small>Enviada el {new Date(item.created_at).toLocaleDateString('es-CO')}</small></div><Status value={item.estado} /></div></div>)}</div> : <EmptyState title="Aún no has enviado solicitudes" text="Explora las mascotas disponibles para comenzar." />}
    </Section>
    <Section id="mis-adopciones" eyebrow="Una nueva familia" title="Mis adopciones">
      {adoptions.length ? <div className="row g-3">{adoptions.map((item) => <div className="col-md-6" key={item.id}><div className="activity-card"><div><strong>{item.mascota?.nombre}</strong><small>Adopción del {new Date(item.fecha_adopcion).toLocaleDateString('es-CO')}</small></div><Status value={item.estado} /></div></div>)}</div> : <EmptyState title="Todavía no hay adopciones formalizadas" text="Aquí podrás consultar el historial y los seguimientos." />}
    </Section>
    {followUps.length > 0 && <Section id="mis-seguimientos" eyebrow="Después de adoptar" title="Seguimientos"><div className="row g-3">{followUps.map((item) => <div className="col-md-6" key={item.id}><div className="activity-card"><div><strong>{item.adopcion?.mascota?.nombre}</strong><small>Próximo seguimiento: {item.fecha_programada}</small></div><Status value={item.resultado} /></div></div>)}</div></Section>}
    <Section id="mis-citas" eyebrow="Salud y bienestar" title="Mis citas veterinarias">
      {appointments.length ? <div className="row g-3">{appointments.map((item) => <div className="col-md-6" key={item.id}><AppointmentCard item={item} onDone={onDone} onNotice={onNotice} /></div>)}</div> : <EmptyState title="No tienes citas registradas" text="Puedes solicitar una cita para una mascota disponible o adoptada por ti." />}
      <form className="form-panel row g-3 align-items-end mt-3" onSubmit={book}><div className="col-md-3"><label className="form-label" htmlFor="appointment-pet">Mascota</label><select id="appointment-pet" className="form-select" value={appointment.mascota_id} onChange={(e) => setAppointment({ ...appointment, mascota_id: e.target.value })} required><option value="">Selecciona</option>{pets.map((item) => <option key={item.id} value={item.id}>{item.nombre} · disponible</option>)}{adoptions.map((item) => <option key={'adopcion-' + item.mascota?.id} value={item.mascota?.id}>{item.mascota?.nombre} · adoptada</option>)}</select></div><div className="col-md-3"><label className="form-label" htmlFor="appointment-vet">Veterinario</label><select id="appointment-vet" className="form-select" value={appointment.veterinario_id} onChange={(e) => setAppointment({ ...appointment, veterinario_id: e.target.value })} required><option value="">Selecciona</option>{veterinarians.map((item) => <option key={item.id} value={item.id}>{item.usuario?.name} · {item.especialidad || 'General'}</option>)}</select></div><div className="col-md-3"><Field label="Fecha y hora" name="appointment-date" type="datetime-local" min={localDateTimeMin()} value={appointment.programada_en} onChange={(e) => setAppointment({ ...appointment, programada_en: e.target.value })} required /></div><div className="col-md-2"><Field label="Motivo" name="appointment-reason" value={appointment.motivo} onChange={(e) => setAppointment({ ...appointment, motivo: e.target.value })} /></div><div className="col-md-1"><button className="btn btn-success w-100" disabled={busy} aria-label="Solicitar cita">{busy ? '…' : 'Pedir'}</button></div></form>
    </Section>
    <Section eyebrow="Apoya a los refugios" title="Registrar una donación"><form className="form-panel row g-3 align-items-end" onSubmit={donate}><div className="col-md-3"><label className="form-label" htmlFor="donation-type">Tipo de aporte</label><select id="donation-type" className="form-select" value={form.tipo_aporte} onChange={(e) => setForm({ ...form, tipo_aporte: e.target.value })}><option value="dinero">Dinero</option><option value="especie">Especie</option><option value="servicio">Servicio</option></select></div>{form.tipo_aporte === 'dinero' && <div className="col-md-3"><Field label="Valor en COP" name="donation-amount" type="number" min="0.01" step="0.01" value={form.importe_cop} onChange={(e) => setForm({ ...form, importe_cop: e.target.value })} required /></div>}<div className="col-md-4"><Field label="Descripción" name="donation-description" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div><div className="col-md-2"><button className="btn btn-success w-100" disabled={busy}>{busy ? 'Guardando…' : 'Registrar aporte'}</button></div></form><p className="small text-secondary mt-2">El registro no realiza cobros ni procesa pagos.</p></Section>
  </>
}

function VeterinaryActivity({ appointments, vaccines, history = [], vaccineHistory = [], onDone, onNotice }) {
  const [record, setRecord] = useState({ mascota_id: '', fecha_registro: localDateString(), titulo: '', descripcion: '', tipo: 'consulta' })
  const [vaccination, setVaccination] = useState({ mascota_id: '', vacuna_id: '', aplicada_en: localDateString(), refuerzo_en: '', lote: '', observaciones: '' })
  const appointmentPets = [...new Map(appointments.map((item) => [item.mascota_id, item])).values()]
  async function completeAppointment(item) {
    onNotice('')
    try { await api.patch('/citas/' + item.id, { estado: 'realizada' }); onNotice('Cita marcada como realizada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function addRecord(event) {
    event.preventDefault(); onNotice('')
    try { await api.post('/historial-medico', { ...record, mascota_id: Number(record.mascota_id) }); setRecord({ ...record, titulo: '', descripcion: '' }); onNotice('Registro médico guardado.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function addVaccination(event) {
    event.preventDefault(); onNotice('')
    try { await api.post('/vacunaciones', { ...vaccination, mascota_id: Number(vaccination.mascota_id), vacuna_id: Number(vaccination.vacuna_id), refuerzo_en: vaccination.refuerzo_en || null }); setVaccination({ ...vaccination, lote: '', observaciones: '' }); onNotice('Vacuna aplicada y registrada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  return <>
    <Section id="agenda-veterinaria" eyebrow="Agenda clínica" title="Mis citas">{appointments.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Fecha</th><th>Mascota</th><th>Motivo</th><th>Estado</th><th /></tr></thead><tbody>{appointments.map((item) => <tr key={item.id}><td>{new Date(item.programada_en).toLocaleString('es-CO')}</td><td>{item.mascota?.nombre}</td><td>{item.motivo || 'Consulta'}</td><td><Status value={item.estado} /></td><td>{item.estado !== 'realizada' && item.estado !== 'cancelada' && <button className="btn btn-sm btn-outline-success" onClick={() => completeAppointment(item)}>Marcar realizada</button>}</td></tr>)}</tbody></table></div> : <EmptyState title="No hay citas programadas" text="Las citas asignadas aparecerán en esta lista." />}</Section>
    <Section id="historial-veterinario" eyebrow="Bienestar animal" title="Historiales autorizados"><ActivityTable rows={history} columns={[["Fecha", (item) => item.fecha_registro], ["Mascota", (item) => item.mascota?.nombre], ["Atención", (item) => item.titulo], ["Tipo", (item) => item.tipo]]} empty="Aún no hay atenciones registradas para tus citas." /><form className="form-panel row g-3 mt-2" onSubmit={addRecord}><div className="col-md-3"><label className="form-label" htmlFor="record-pet">Mascota de una cita</label><select className="form-select" id="record-pet" value={record.mascota_id} onChange={(e) => setRecord({ ...record, mascota_id: e.target.value })} required><option value="">Selecciona</option>{appointmentPets.map((item) => <option key={item.mascota_id} value={item.mascota_id}>{item.mascota?.nombre}</option>)}</select></div><div className="col-md-3"><Field label="Tipo" name="record-type" value={record.tipo} onChange={(e) => setRecord({ ...record, tipo: e.target.value })} required /></div><div className="col-md-3"><Field label="Fecha" name="record-date" type="date" value={record.fecha_registro} onChange={(e) => setRecord({ ...record, fecha_registro: e.target.value })} required /></div><div className="col-md-3"><Field label="Título" name="record-title" value={record.titulo} onChange={(e) => setRecord({ ...record, titulo: e.target.value })} required /></div><div className="col-md-10"><label className="form-label" htmlFor="record-description">Descripción</label><textarea id="record-description" className="form-control" rows="2" value={record.descripcion} onChange={(e) => setRecord({ ...record, descripcion: e.target.value })} required /></div><div className="col-md-2 d-flex align-items-end"><button className="btn btn-success w-100">Guardar</button></div></form></Section>
    <Section id="vacunas-veterinario" eyebrow="Vacunación" title="Historial y aplicación de vacunas"><ActivityTable rows={vaccineHistory} columns={[["Fecha", (item) => item.aplicada_en], ["Mascota", (item) => item.mascota?.nombre], ["Vacuna", (item) => item.vacuna?.nombre], ["Refuerzo", (item) => item.refuerzo_en]]} empty="Aún no hay vacunas registradas por ti." /><form className="form-panel row g-3 mt-2" onSubmit={addVaccination}><div className="col-md-3"><label className="form-label" htmlFor="vaccination-pet">Mascota de una cita</label><select className="form-select" id="vaccination-pet" value={vaccination.mascota_id} onChange={(e) => setVaccination({ ...vaccination, mascota_id: e.target.value })} required><option value="">Selecciona</option>{appointmentPets.map((item) => <option key={item.mascota_id} value={item.mascota_id}>{item.mascota?.nombre}</option>)}</select></div><div className="col-md-3"><label className="form-label" htmlFor="vaccine">Vacuna</label><select className="form-select" id="vaccine" value={vaccination.vacuna_id} onChange={(e) => setVaccination({ ...vaccination, vacuna_id: e.target.value })} required><option value="">Selecciona</option>{vaccines.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div><div className="col-md-3"><Field label="Fecha de aplicación" name="vaccine-date" type="date" value={vaccination.aplicada_en} onChange={(e) => setVaccination({ ...vaccination, aplicada_en: e.target.value })} required /></div><div className="col-md-3"><Field label="Refuerzo (opcional)" name="vaccine-next" type="date" value={vaccination.refuerzo_en} onChange={(e) => setVaccination({ ...vaccination, refuerzo_en: e.target.value })} /></div><div className="col-md-4"><Field label="Lote" name="vaccine-lot" value={vaccination.lote} onChange={(e) => setVaccination({ ...vaccination, lote: e.target.value })} /></div><div className="col-md-6"><Field label="Observaciones" name="vaccine-notes" value={vaccination.observaciones} onChange={(e) => setVaccination({ ...vaccination, observaciones: e.target.value })} /></div><div className="col-md-2 d-flex align-items-end"><button className="btn btn-success w-100">Guardar vacuna</button></div></form></Section>
  </>
}

function AppointmentCard({ item, onDone, onNotice }) {
  const [editing, setEditing] = useState(false)
  const [when, setWhen] = useState(localDateTimeString(item.programada_en))
  const [busy, setBusy] = useState(false)
  async function update(event) {
    event.preventDefault(); setBusy(true); onNotice('')
    try { await api.patch('/citas/' + item.id, { programada_en: new Date(when).toISOString() }); setEditing(false); onNotice('Cita reprogramada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) } finally { setBusy(false) }
  }
  async function cancel() {
    setBusy(true); onNotice('')
    try { await api.patch('/citas/' + item.id, { estado: 'cancelada' }); onNotice('Cita cancelada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) } finally { setBusy(false) }
  }
  return <div className="activity-card appointment-card"><div><strong>{item.mascota?.nombre}</strong><small>{new Date(item.programada_en).toLocaleString('es-CO')} · {item.veterinario?.usuario?.name || 'Veterinario'}</small><Status value={item.estado} /></div>{['programada', 'confirmada'].includes(item.estado) && <div className="d-flex gap-2"><button className="btn btn-sm btn-outline-success" onClick={() => setEditing(!editing)}>{editing ? 'Cerrar' : 'Cambiar'}</button><button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={cancel}>Cancelar</button></div>}{editing && <form className="appointment-edit" onSubmit={update}><label className="form-label" htmlFor={'reschedule-' + item.id}>Nueva fecha y hora</label><div className="d-flex gap-2"><input className="form-control" id={'reschedule-' + item.id} type="datetime-local" min={localDateTimeMin()} value={when} onChange={(e) => setWhen(e.target.value)} required /><button className="btn btn-success" disabled={busy}>Guardar</button></div></form>}</div>
}

function FosterActivity({ home, assignments, onDone, onNotice }) {
  const [form, setForm] = useState({ capacidad: 1, acepta_perros: true, acepta_gatos: true, notas: '' })
  async function register(event) {
    event.preventDefault(); onNotice('')
    try { await api.post('/hogar-temporal', form); onNotice('Hogar temporal registrado.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  async function close(item) {
    onNotice('')
    try { await api.patch('/asignaciones-hogar/' + item.id + '/finalizar'); onNotice('Acogida cerrada.'); await onDone() } catch (err) { onNotice(messageFromError(err)) }
  }
  if (!home) return <Section id="mi-hogar" eyebrow="Hogar temporal" title="Registra tu hogar"><form className="form-panel row g-3 align-items-end" onSubmit={register}><div className="col-md-3"><Field label="Capacidad de acogida" name="home-capacity" type="number" min="1" max="20" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} required /></div><div className="col-md-3 form-check ms-3"><input id="accept-dogs" type="checkbox" className="form-check-input" checked={form.acepta_perros} onChange={(e) => setForm({ ...form, acepta_perros: e.target.checked })} /><label className="form-check-label" htmlFor="accept-dogs">Acepta perros</label></div><div className="col-md-3 form-check"><input id="accept-cats" type="checkbox" className="form-check-input" checked={form.acepta_gatos} onChange={(e) => setForm({ ...form, acepta_gatos: e.target.checked })} /><label className="form-check-label" htmlFor="accept-cats">Acepta gatos</label></div><div className="col-md-8"><Field label="Notas" name="home-notes" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div><div className="col-md-3"><button className="btn btn-success w-100">Registrar mi hogar</button></div></form></Section>
  return <><Section id="mi-hogar" eyebrow="Mi hogar temporal" title="Capacidad y preferencias"><div className="row g-3"><div className="col-sm-4"><div className="fact"><small>Capacidad</small><strong>{home.capacidad} mascotas</strong></div></div><div className="col-sm-4"><div className="fact"><small>Recibe perros</small><strong>{home.acepta_perros ? 'Sí' : 'No'}</strong></div></div><div className="col-sm-4"><div className="fact"><small>Recibe gatos</small><strong>{home.acepta_gatos ? 'Sí' : 'No'}</strong></div></div>{home.notas && <div className="col-12"><p className="mb-0 text-secondary">{home.notas}</p></div>}</div></Section><Section id="asignaciones-hogar" eyebrow="Acogidas autorizadas" title="Mascotas asignadas e historial">{assignments.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Mascota</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Observaciones</th><th /></tr></thead><tbody>{assignments.map((item) => <tr key={item.id}><td>{item.mascota?.nombre}</td><td>{item.inicio}</td><td>{item.fin || '—'}</td><td><Status value={item.estado} /></td><td>{item.notas || '—'}</td><td>{item.estado === 'activa' && <button className="btn btn-sm btn-outline-success" onClick={() => close(item)}>Finalizar</button>}</td></tr>)}</tbody></table></div> : <EmptyState title="Aún no tienes mascotas asignadas" text="Las asignaciones aprobadas aparecerán aquí." />}</Section></>
}

function Status({ value }) {
  const status = String(value || 'pendiente').toLowerCase()
  const className = status.includes('rechaz') || status.includes('cancel') || status.includes('inactivo') ? 'status-pill status-danger' : status.includes('aproba') || status.includes('complet') || status.includes('activa') || status.includes('formal') ? 'status-pill status-success' : 'status-pill status-neutral'
  return <span className={className}>{String(value || 'pendiente').replaceAll('_', ' ')}</span>
}

function localDateTimeMin() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

function localDateTimeString(value) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function localDateString() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <Loading />
  return <><Header /><Routes><Route path="/" element={<HomePage />} /><Route path="/mascotas" element={<CatalogPage />} /><Route path="/mascotas/:id" element={<PetDetailPage />} /><Route path="/iniciar-sesion" element={<AuthPage mode="login" />} /><Route path="/registro" element={<AuthPage mode="register" />} /><Route path="/recuperar-contrasena" element={<PasswordRecoveryPage />} /><Route path="/panel" element={<PrivateRoute><DashboardPage /></PrivateRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes><Footer /></>
}

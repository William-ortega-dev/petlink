import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_MODE_LABEL, DEMO_ROLES } from './demoMode'
import { useDemoData } from './useDemoData'

const PENDING = new Set(['Pendiente', 'En revisión'])
const dateLabel = (value) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO') : 'Sin fecha'

export default function DemoDashboard({ user, onSelectRole }) {
  const { state, actions } = useDemoData()
  const [feedback, setFeedback] = useState(null)
  const profile = state.profiles[user.id] || {}
  const demoUser = { ...user, name: profile.name || user.name }
  const role = user.role.nombre
  const myPets = role === 'Administrador' ? state.pets : state.pets.filter((pet) => pet.refugio_id === user.id)
  const myRequests = state.requests.filter((item) => item.adopter_id === user.id)
  const shelterRequests = state.requests.filter((item) => {
    const pet = state.pets.find((candidate) => candidate.id === item.pet_id)
    return role === 'Administrador' || pet?.refugio_id === user.id
  })
  const myAdoptions = state.adoptions.filter((item) => role === 'Administrador' || (role === 'Adoptante' ? item.adopter_id === user.id : myPets.some((pet) => pet.id === item.pet_id)))
  const myAssignments = state.assignments.filter((item) => role !== 'Hogar temporal' || item.foster_id === user.id)
  const myAppointments = state.appointments.filter((item) => role === 'Administrador' || (role === 'Veterinario' ? item.vet_id === user.id : role === 'Adoptante' ? item.adopter_id === user.id : myPets.some((pet) => pet.id === item.pet_id)))
  const myNotifications = state.notifications.filter((item) => item.user_id === user.id)
  const quickLinks = {
    Administrador: [['Resumen', '#demo-summary'], ['Administración', '#demo-workspace'], ['Actividad', '#demo-notifications'], ['Catálogo', '/mascotas']],
    Adoptante: [['Mis procesos', '#demo-workspace'], ['Catálogo', '/mascotas'], ['Avisos', '#demo-notifications']],
    Refugio: [['Gestión del refugio', '#demo-workspace'], ['Catálogo', '/mascotas'], ['Avisos', '#demo-notifications']],
    Veterinario: [['Agenda y registros', '#demo-workspace'], ['Avisos', '#demo-notifications']],
    'Hogar temporal': [['Mis acogidas', '#demo-workspace'], ['Avisos', '#demo-notifications']],
  }[role]
  const stats = role === 'Administrador'
    ? [['Mascotas', state.pets.length], ['Solicitudes pendientes', state.requests.filter((item) => PENDING.has(item.status)).length], ['Adopciones', state.adoptions.length], ['Citas', state.appointments.length]]
    : role === 'Adoptante'
      ? [['Mis solicitudes', myRequests.length], ['En revisión', myRequests.filter((item) => PENDING.has(item.status)).length], ['Adopciones', myAdoptions.length], ['Seguimientos', state.followUps.filter((item) => item.adopter_id === user.id).length]]
      : role === 'Refugio'
        ? [['Mascotas a cargo', myPets.length], ['Publicaciones activas', myPets.filter((pet) => pet.publicada).length], ['Solicitudes pendientes', shelterRequests.filter((item) => PENDING.has(item.status)).length], ['Adopciones', myAdoptions.length]]
        : role === 'Veterinario'
          ? [['Citas asignadas', myAppointments.length], ['Por atender', myAppointments.filter((item) => item.status !== 'Realizada' && item.status !== 'Cancelada').length], ['Atenciones', state.medicalRecords.filter((item) => item.vet_id === user.id).length], ['Vacunas', state.vaccinations.filter((item) => item.vet_id === user.id).length]]
          : [['Mascotas bajo cuidado', myAssignments.filter((item) => item.status === 'Activa').length], ['Asignaciones activas', myAssignments.filter((item) => item.status === 'Activa').length], ['Novedades', myAssignments.reduce((sum, item) => sum + item.notes.length, 0)], ['Acogidas anteriores', myAssignments.filter((item) => item.status === 'Finalizada').length]]

  function run(action, success) {
    try {
      action()
      setFeedback({ type: 'success', text: success })
    } catch (error) {
      setFeedback({ type: 'danger', text: error.message || 'No fue posible completar esta acción.' })
    }
  }

  function reset() {
    if (!window.confirm('¿Restablecer los datos ficticios de PetLink en este navegador?')) return
    actions.reset()
    setFeedback({ type: 'success', text: 'La demo volvió a sus datos iniciales.' })
  }

  return <main className="container page-container dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">Panel interactivo de {role}</span><h1>Hola, {demoUser.name.split(' ')[0]}</h1><p>Prueba los flujos con datos de muestra.</p><span className="role-badge">{role} · {DEMO_MODE_LABEL}</span></div><span className="user-avatar" aria-label={'Usuario ' + demoUser.name}>{demoUser.name.charAt(0).toUpperCase()}</span></div>
    <div className="demo-notice" role="status"><strong>{DEMO_MODE_LABEL} · datos locales de ejemplo</strong><span>Las acciones sí cambian el recorrido y quedan guardadas en este navegador. No se llama a la API ni se modifica PostgreSQL.</span></div>
    <div className="demo-role-switcher"><strong>Cambiar rol para probar el flujo</strong><div className="demo-login-list">{DEMO_ROLES.map((availableRole) => <button type="button" className={'btn btn-sm ' + (availableRole === role ? 'btn-success' : 'btn-outline-success')} aria-pressed={availableRole === role} key={availableRole} onClick={() => onSelectRole(availableRole)}>{availableRole}</button>)}</div></div>
    <nav className="dashboard-nav" aria-label={'Accesos rápidos de ' + role}>{quickLinks.map(([label, href]) => href.startsWith('/') ? <Link key={label} to={href}>{label}</Link> : <a key={label} href={href}>{label}</a>)}</nav>
    {feedback && <div className={'alert alert-' + feedback.type} role={feedback.type === 'danger' ? 'alert' : 'status'}>{feedback.text}</div>}
    <section id="demo-summary" className="row g-3 stats-row" aria-label="Resumen de actividad">{stats.map(([label, value]) => <div className="col-6 col-xl-3" key={label}><div className="stat-card"><small>{label}</small><strong>{value}</strong></div></div>)}</section>
    <section id="demo-profile" className="dashboard-section profile-section"><div className="section-title"><div><span className="eyebrow">Cuenta de muestra</span><h2>Mi perfil</h2></div></div><ProfileForm key={user.id} user={demoUser} profile={profile} onSave={(name, phone) => run(() => actions.updateProfile(user.id, name, phone, demoUser), 'Perfil actualizado en la demo.')} /></section>
    <div id="demo-workspace" />
    {role === 'Administrador' && <AdminWorkspace state={state} user={demoUser} myPets={myPets} requests={shelterRequests} assignments={myAssignments} appointments={myAppointments} adoptions={myAdoptions} onRun={run} />}
    {role === 'Refugio' && <ShelterWorkspace state={state} user={demoUser} pets={myPets} requests={shelterRequests} assignments={myAssignments} onRun={run} />}
    {role === 'Adoptante' && <AdopterWorkspace state={state} user={demoUser} requests={myRequests} adoptions={myAdoptions} appointments={myAppointments} onRun={run} />}
    {role === 'Veterinario' && <VeterinaryWorkspace state={state} user={demoUser} appointments={myAppointments} onRun={run} />}
    {role === 'Hogar temporal' && <FosterWorkspace state={state} user={demoUser} assignments={myAssignments} onRun={run} />}
    <section id="demo-notifications" className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Avisos</span><h2>Notificaciones</h2></div></div>{myNotifications.length ? <div className="vstack gap-2">{myNotifications.map((item) => <article className="activity-card" key={item.id}><div><strong>{item.title}</strong><p className="mb-0">{item.message}</p><small>{new Date(item.created_at).toLocaleString('es-CO')}</small></div>{item.read ? <span className="status-pill">Leída</span> : <button className="btn btn-sm btn-outline-success" onClick={() => run(() => actions.markNotificationRead(item.id, demoUser), 'Aviso marcado como leído.')}>Marcar leída</button>}</article>)}</div> : <Empty text="Las solicitudes, citas y cambios importantes aparecerán aquí." />}</section>
    <div className="demo-dashboard-footer"><Link to="/mascotas" className="btn btn-outline-success">Explorar catálogo</Link><button className="btn btn-outline-secondary" onClick={reset}>Restablecer datos de demo</button></div>
  </main>
}

function ProfileForm({ user, profile, onSave }) {
  const [name, setName] = useState(profile.name || user.name)
  const [phone, setPhone] = useState(profile.phone || '')
  return <form className="row g-3 align-items-end" onSubmit={(event) => { event.preventDefault(); onSave(name, phone) }}>
    <div className="col-md-5"><label className="form-label" htmlFor="demo-profile-name">Nombre</label><input id="demo-profile-name" className="form-control" value={name} onChange={(event) => setName(event.target.value)} required /></div>
    <div className="col-md-4"><label className="form-label" htmlFor="demo-profile-phone">Teléfono de muestra</label><input id="demo-profile-phone" className="form-control" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
    <div className="col-md-3"><button className="btn btn-outline-success w-100">Guardar perfil</button></div>
  </form>
}

function AdminWorkspace({ state, user, myPets, requests, assignments, appointments, adoptions, onRun }) {
  return <>
    <PetManager state={state} user={user} pets={myPets} onRun={onRun} />
    <RequestManager state={state} user={user} requests={requests} onRun={onRun} />
    <AssignmentManager state={state} user={user} pets={myPets} assignments={assignments} onRun={onRun} />
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Catálogo</span><h2>Especies</h2></div></div><SpeciesForm species={state.species} user={user} onRun={onRun} /></section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Supervisión</span><h2>Adopciones y citas</h2></div></div><ActivityRows rows={[...adoptions.map((item) => ({ title: `${item.pet_id} · ${item.adopter_name}`, status: item.status, date: item.date })), ...appointments.map((item) => ({ title: `${item.pet_id} · ${item.type}`, status: item.status, date: dateLabel(item.scheduled_at) }))]} empty="Aún no hay adopciones ni citas." /></section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Aportes y bienestar</span><h2>Donaciones y seguimientos</h2></div></div><ActivityRows rows={[...state.donations.map((item) => ({ title: `${item.adopter_name} · ${item.description}`, status: item.type, date: dateLabel(item.date) })), ...state.followUps.map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.notes}`, status: item.status, date: dateLabel(item.date) }))]} empty="Los aportes y seguimientos se verán aquí al registrarse." /></section>
    <AuditLog rows={state.audit} />
  </>
}

function ShelterWorkspace({ state, user, pets, requests, assignments, onRun }) {
  return <>
    <PetManager state={state} user={user} pets={pets} onRun={onRun} />
    <RequestManager state={state} user={user} requests={requests} onRun={onRun} />
    <AssignmentManager state={state} user={user} pets={pets} assignments={assignments} onRun={onRun} />
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Actividad del refugio</span><h2>Mis adopciones</h2></div></div><ActivityRows rows={state.adoptions.filter((item) => pets.some((pet) => pet.id === item.pet_id)).map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.adopter_name}`, status: item.status, date: dateLabel(item.date) }))} empty="Las adopciones aprobadas aparecerán aquí." /></section>
  </>
}

function PetManager({ state, user, pets, onRun }) {
  const { actions } = useDemoData()
  const [form, setForm] = useState({ nombre: '', especie_id: String(state.species[0]?.id || ''), raza: '', sexo: 'hembra', tamano: 'mediano', edad_estimada_anios: '', descripcion: '', publicada: true })
  function change(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }
  return <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Gestión de mascotas</span><h2>Registrar y administrar mascotas</h2></div></div>
    <form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { const pet = actions.createPet(form, user); setForm({ nombre: '', especie_id: String(state.species[0]?.id || ''), raza: '', sexo: 'hembra', tamano: 'mediano', edad_estimada_anios: '', descripcion: '', publicada: true }); return pet }, 'Mascota agregada a la demo y visible en el catálogo.') }}>
      <Field label="Nombre" name="nombre" id="demo-new-pet-name" value={form.nombre} onChange={change} required />
      <div><label className="form-label" htmlFor="demo-pet-species">Especie</label><select id="demo-pet-species" className="form-select" name="especie_id" value={form.especie_id} onChange={change}>{state.species.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
      <Field label="Raza" name="raza" value={form.raza} onChange={change} />
      <div><label className="form-label" htmlFor="demo-pet-sex">Sexo</label><select id="demo-pet-sex" className="form-select" name="sexo" value={form.sexo} onChange={change}><option value="hembra">Hembra</option><option value="macho">Macho</option><option value="desconocido">Sin especificar</option></select></div>
      <div><label className="form-label" htmlFor="demo-pet-size">Tamaño</label><select id="demo-pet-size" className="form-select" name="tamano" value={form.tamano} onChange={change}><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option></select></div>
      <Field label="Edad aproximada" name="edad_estimada_anios" type="number" min="0" max="30" value={form.edad_estimada_anios} onChange={change} />
      <div className="demo-form-wide"><label className="form-label" htmlFor="demo-pet-description">Descripción</label><textarea id="demo-pet-description" className="form-control" name="descripcion" rows="2" value={form.descripcion} onChange={change} /></div>
      <label className="form-check demo-publish-check"><input className="form-check-input" type="checkbox" name="publicada" checked={form.publicada} onChange={change} /> Publicar de inmediato en el catálogo</label>
      <div className="demo-form-wide"><button className="btn btn-success">Agregar mascota</button></div>
    </form>
    <div className="demo-pet-list">{pets.map((pet) => <PetAdminRow key={pet.id} state={state} user={user} pet={pet} onRun={onRun} />)}</div>
    {!pets.length && <Empty text="Todavía no tienes mascotas registradas." />}
  </section>
}

function PetAdminRow({ state, user, pet, onRun }) {
  const { actions } = useDemoData()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: pet.nombre, raza: pet.raza?.nombre || '', sexo: pet.sexo || 'desconocido', tamano: pet.tamano || 'mediano', descripcion: pet.descripcion || '' })
  const canDelete = !state.requests.some((item) => item.pet_id === pet.id) && !state.adoptions.some((item) => item.pet_id === pet.id) && !state.assignments.some((item) => item.pet_id === pet.id) && !state.appointments.some((item) => item.pet_id === pet.id) && !state.medicalRecords.some((item) => item.pet_id === pet.id) && !state.vaccinations.some((item) => item.pet_id === pet.id)
  return <article className="demo-pet-row"><div className="demo-row-heading"><div><strong>{pet.emoji || '🐾'} {pet.nombre}</strong><small>{pet.especie.nombre} · {pet.raza?.nombre || 'Criolla'} · {petNameStatus(pet)}</small></div><div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-success" onClick={() => onRun(() => actions.setPetPublished(pet.id, !pet.publicada, user), pet.publicada ? 'Publicación pausada.' : 'Mascota publicada en el catálogo.')}>{pet.publicada ? 'Pausar publicación' : 'Publicar'}</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cerrar edición' : 'Editar'}</button>{canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => onRun(() => actions.deletePet(pet.id, user), 'Mascota retirada de la demo.')}>Quitar</button>}</div></div>
    {editing && <form className="demo-form-grid mt-3" onSubmit={(event) => { event.preventDefault(); onRun(() => actions.updatePet(pet.id, form, user), 'Ficha actualizada.') }}><Field label="Nombre" name="nombre" id={`demo-edit-name-${pet.id}`} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required /><Field label="Raza" name="raza" id={`demo-edit-breed-${pet.id}`} value={form.raza} onChange={(event) => setForm({ ...form, raza: event.target.value })} /><div><label className="form-label" htmlFor={`pet-sex-${pet.id}`}>Sexo</label><select id={`pet-sex-${pet.id}`} className="form-select" value={form.sexo} onChange={(event) => setForm({ ...form, sexo: event.target.value })}><option value="hembra">Hembra</option><option value="macho">Macho</option><option value="desconocido">Sin especificar</option></select></div><div><label className="form-label" htmlFor={`pet-size-${pet.id}`}>Tamaño</label><select id={`pet-size-${pet.id}`} className="form-select" value={form.tamano} onChange={(event) => setForm({ ...form, tamano: event.target.value })}><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option></select></div><div className="demo-form-wide"><label className="form-label" htmlFor={`pet-description-${pet.id}`}>Descripción</label><textarea id={`pet-description-${pet.id}`} className="form-control" rows="2" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} /></div><div className="demo-form-wide"><button className="btn btn-success btn-sm">Guardar cambios</button></div></form>}
  </article>
}

function RequestManager({ state, user, requests, onRun }) {
  const { actions } = useDemoData()
  return <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Proceso de adopción</span><h2>Solicitudes recibidas</h2></div></div>
    {requests.length ? <div className="demo-pet-list">{requests.map((request) => <article className="demo-pet-row" key={request.id}><div className="demo-row-heading"><div><strong>{petName(state, request.pet_id)} · {request.adopter_name}</strong><small>{request.motivation} · {dateLabel(request.created_at)}</small></div><div className="d-flex flex-wrap align-items-center gap-2"><span className="status-pill">{request.status}</span>{PENDING.has(request.status) && <><button className="btn btn-sm btn-success" onClick={() => onRun(() => actions.resolveRequest(request.id, 'approve', user), 'Solicitud aprobada: se registró la adopción y un seguimiento.')}>Aprobar adopción</button><button className="btn btn-sm btn-outline-danger" onClick={() => onRun(() => actions.resolveRequest(request.id, 'reject', user), 'Solicitud rechazada.')}>Rechazar</button></>}</div></div></article>)}</div> : <Empty text="Todavía no han llegado solicitudes para tus mascotas." />}
  </section>
}

function AssignmentManager({ state, user, pets, assignments, onRun }) {
  const { actions } = useDemoData()
  const eligible = pets.filter((pet) => pet.estado?.codigo === 'disponible' && !assignments.some((item) => item.pet_id === pet.id && item.status === 'Activa'))
  const [petId, setPetId] = useState(eligible[0]?.id || '')
  const [homeId, setHomeId] = useState(state.homes[0]?.id || '')
  const [endsAt, setEndsAt] = useState('')
  return <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Hogares temporales</span><h2>Asignaciones de acogida</h2></div></div>
    <form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.assignFoster(petId, homeId, endsAt, user); return true }, 'Hogar temporal asignado; su panel ya muestra la mascota.') }}>
      <div><label className="form-label" htmlFor="demo-assign-pet">Mascota</label><select id="demo-assign-pet" className="form-select" value={petId} onChange={(event) => setPetId(event.target.value)} required>{eligible.map((pet) => <option key={pet.id} value={pet.id}>{pet.nombre}</option>)}</select></div>
      <div><label className="form-label" htmlFor="demo-assign-home">Hogar</label><select id="demo-assign-home" className="form-select" value={homeId} onChange={(event) => setHomeId(event.target.value)} required>{state.homes.map((home) => <option key={home.id} value={home.id}>{home.name} · {home.municipio}</option>)}</select></div>
      <Field label="Fecha estimada de salida" name="ends_at" type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
      <div><button className="btn btn-success w-100" disabled={!eligible.length}>Asignar hogar</button></div>
    </form>
    {assignments.length ? <div className="demo-pet-list mt-3">{assignments.map((item) => <article className="demo-pet-row" key={item.id}><div className="demo-row-heading"><div><strong>{petName(state, item.pet_id)} · {item.home_name}</strong><small>{dateLabel(item.starts_at)} – {item.ends_at ? dateLabel(item.ends_at) : 'sin fecha de cierre'} · {item.notes.at(-1) || 'Sin novedades registradas.'}</small></div><div className="d-flex gap-2 align-items-center"><span className="status-pill">{item.status}</span>{item.status === 'Activa' && <button className="btn btn-sm btn-outline-secondary" onClick={() => onRun(() => actions.closeAssignment(item.id, user), 'Acogida finalizada.')}>Cerrar acogida</button>}</div></div></article>)}</div> : <Empty text="No hay asignaciones de hogar temporal." />}
  </section>
}

function AdopterWorkspace({ state, user, requests, adoptions, appointments, onRun }) {
  const adoptedPets = state.pets.filter((pet) => state.adoptions.some((item) => item.pet_id === pet.id && item.adopter_id === user.id && item.status === 'Activa'))
  const [appointment, setAppointment] = useState({ pet_id: adoptedPets[0]?.id || '', scheduled_at: '', type: 'Consulta general' })
  const [donation, setDonation] = useState({ type: 'Alimento', amount: '', description: '' })
  const { actions } = useDemoData()
  const ownFollowUps = state.followUps.filter((item) => item.adopter_id === user.id)
  return <>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Adopta</span><h2>Mis solicitudes y adopciones</h2></div><Link className="btn btn-success" to="/mascotas">Buscar mascotas</Link></div><RequestRows state={state} requests={requests} /><h3 className="h5 mt-4">Mis adopciones</h3><ActivityRows rows={adoptions.map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.adopter_name}`, status: item.status, date: dateLabel(item.date) }))} empty="Cuando aprueben una solicitud, la adopción aparecerá aquí." /><h3 className="h5 mt-4">Seguimientos</h3>{ownFollowUps.length ? <div className="demo-pet-list">{ownFollowUps.map((item) => <article className="demo-pet-row" key={item.id}><div className="demo-row-heading"><div><strong>{petName(state, item.pet_id)} · {dateLabel(item.date)}</strong><small>{item.notes}</small></div><div className="d-flex gap-2 align-items-center"><span className="status-pill">{item.status}</span>{item.status === 'Programado' && <button className="btn btn-sm btn-outline-success" onClick={() => onRun(() => actions.updateFollowUp(item.id, 'Realizado', 'Mascota en buen estado.', user), 'Seguimiento marcado como realizado.')}>Confirmar seguimiento</button>}</div></div></article>)}</div> : <Empty text="Los seguimientos se crean cuando se aprueba una adopción." />}</section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Bienestar animal</span><h2>Solicitar cita veterinaria</h2></div></div>{adoptedPets.length ? <form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.createAppointment(appointment.pet_id, appointment.scheduled_at, appointment.type, user); setAppointment((current) => ({ ...current, scheduled_at: '' })); return true }, 'Cita solicitada; ya aparece en la agenda veterinaria.') }}><div><label className="form-label" htmlFor="demo-appointment-pet">Mascota adoptada</label><select id="demo-appointment-pet" className="form-select" value={appointment.pet_id} onChange={(event) => setAppointment({ ...appointment, pet_id: event.target.value })}>{adoptedPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.nombre}</option>)}</select></div><Field label="Fecha y hora" name="scheduled_at" type="datetime-local" value={appointment.scheduled_at} onChange={(event) => setAppointment({ ...appointment, scheduled_at: event.target.value })} required /><Field label="Motivo" name="appointment_type" value={appointment.type} onChange={(event) => setAppointment({ ...appointment, type: event.target.value })} required /><div><button className="btn btn-success w-100">Solicitar cita</button></div></form> : <Empty text="Solicitarás citas cuando tengas una adopción activa en la demo." />}<h3 className="h5 mt-4">Mis citas</h3><ActivityRows rows={appointments.map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.type}`, status: item.status, date: dateLabel(item.scheduled_at) }))} empty="Todavía no tienes citas." /></section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Apoya a los refugios</span><h2>Registrar una donación de muestra</h2></div></div><form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.createDonation(donation.type, donation.amount, donation.description, user); setDonation({ type: 'Alimento', amount: '', description: '' }); return true }, 'Donación de ejemplo registrada para el refugio.') }}><Field label="Tipo de aporte" name="donation_type" value={donation.type} onChange={(event) => setDonation({ ...donation, type: event.target.value })} required /><Field label="Valor en COP (opcional)" name="amount" type="number" min="0" value={donation.amount} onChange={(event) => setDonation({ ...donation, amount: event.target.value })} /><div className="demo-form-wide"><label className="form-label" htmlFor="demo-donation-description">Descripción</label><textarea id="demo-donation-description" className="form-control" rows="2" value={donation.description} onChange={(event) => setDonation({ ...donation, description: event.target.value })} required /></div><div className="demo-form-wide"><button className="btn btn-outline-success">Registrar aporte</button></div></form></section>
  </>
}

function VeterinaryWorkspace({ state, user, appointments, onRun }) {
  const authorized = [...new Set(appointments.filter((item) => item.status !== 'Cancelada').map((item) => item.pet_id))]
  const firstAuthorizedPet = authorized[0] || ''
  const [notes, setNotes] = useState({})
  const [record, setRecord] = useState({ pet_id: firstAuthorizedPet, title: 'Consulta general', notes: '' })
  const [vaccine, setVaccine] = useState({ pet_id: firstAuthorizedPet, name: '', applied_at: new Date().toISOString().slice(0, 10), next_at: '' })
  const { actions } = useDemoData()
  return <>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Agenda</span><h2>Citas veterinarias</h2></div></div>{appointments.length ? <div className="demo-pet-list">{appointments.map((item) => <article className="demo-pet-row" key={item.id}><div className="demo-row-heading"><div><strong>{petName(state, item.pet_id)} · {item.type}</strong><small>{dateLabel(item.scheduled_at)} · {item.status}</small></div><div className="d-flex flex-wrap gap-2">{item.status === 'Solicitada' && <button className="btn btn-sm btn-success" onClick={() => onRun(() => actions.updateAppointment(item.id, 'Programada', '', user), 'Cita confirmada.')}>Confirmar</button>}{!['Realizada', 'Cancelada'].includes(item.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => onRun(() => actions.updateAppointment(item.id, 'Cancelada', '', user), 'Cita cancelada.')}>Cancelar</button>}</div></div>{!['Realizada', 'Cancelada'].includes(item.status) && <div className="demo-inline-action"><textarea className="form-control" rows="2" placeholder="Observaciones de la atención para completar la cita" value={notes[item.id] || ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} /><button className="btn btn-sm btn-outline-success" disabled={!notes[item.id]?.trim()} onClick={() => onRun(() => actions.updateAppointment(item.id, 'Realizada', notes[item.id], user), 'Atención registrada y cita completada.')}>Marcar realizada</button></div>}</article>)}</div> : <Empty text="Las nuevas solicitudes aparecerán en tu agenda." />}</section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Historial médico autorizado</span><h2>Registrar consulta</h2></div></div><form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.addMedicalRecord(record.pet_id, record.title, record.notes, user); setRecord({ ...record, notes: '' }); return true }, 'Consulta agregada al historial médico.') }}><SelectPet state={state} petId={record.pet_id} onChange={(pet_id) => setRecord({ ...record, pet_id })} options={state.pets.filter((pet) => authorized.includes(pet.id))} label="Mascota autorizada" /><Field label="Atención" name="title" value={record.title} onChange={(event) => setRecord({ ...record, title: event.target.value })} required /><div className="demo-form-wide"><label className="form-label" htmlFor="demo-medical-notes">Observaciones</label><textarea id="demo-medical-notes" className="form-control" rows="3" value={record.notes} onChange={(event) => setRecord({ ...record, notes: event.target.value })} required /></div><div className="demo-form-wide"><button className="btn btn-success" disabled={!authorized.length}>Guardar consulta</button></div></form><ActivityRows rows={state.medicalRecords.filter((item) => item.vet_id === user.id).map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.title}: ${item.notes}`, status: 'Historial', date: dateLabel(item.date) }))} empty="Aún no has registrado atenciones." /></section>
    <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Vacunación</span><h2>Registrar vacuna</h2></div></div><form className="demo-form-grid" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.addVaccination(vaccine.pet_id, vaccine.name, vaccine.applied_at, vaccine.next_at, user); setVaccine({ ...vaccine, name: '' }); return true }, 'Vacuna añadida al historial autorizado.') }}><SelectPet state={state} petId={vaccine.pet_id} onChange={(pet_id) => setVaccine({ ...vaccine, pet_id })} options={state.pets.filter((pet) => authorized.includes(pet.id))} label="Mascota autorizada" /><Field label="Vacuna" name="vaccine_name" value={vaccine.name} onChange={(event) => setVaccine({ ...vaccine, name: event.target.value })} required /><Field label="Aplicada el" name="applied_at" type="date" value={vaccine.applied_at} onChange={(event) => setVaccine({ ...vaccine, applied_at: event.target.value })} required /><Field label="Próxima dosis" name="next_at" type="date" value={vaccine.next_at} onChange={(event) => setVaccine({ ...vaccine, next_at: event.target.value })} /><div className="demo-form-wide"><button className="btn btn-outline-success" disabled={!authorized.length}>Registrar vacuna</button></div></form><ActivityRows rows={state.vaccinations.filter((item) => item.vet_id === user.id).map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.name}`, status: item.next_at ? `Próxima: ${dateLabel(item.next_at)}` : 'Aplicada', date: dateLabel(item.applied_at) }))} empty="Aún no hay vacunas aplicadas." /></section>
  </>
}

function FosterWorkspace({ state, user, assignments, onRun }) {
  const { actions } = useDemoData()
  const [notes, setNotes] = useState({})
  const active = assignments.filter((item) => item.status === 'Activa')
  return <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Cuidado temporal</span><h2>Mascotas bajo mi cuidado</h2></div></div>{assignments.length ? <div className="demo-pet-list">{assignments.map((item) => <article className="demo-pet-row" key={item.id}><div className="demo-row-heading"><div><strong>{petName(state, item.pet_id)} · {item.home_name}</strong><small>{dateLabel(item.starts_at)} – {item.ends_at ? dateLabel(item.ends_at) : 'fecha de salida pendiente'} · {item.status}</small><small>Instrucciones: {state.homes.find((home) => home.id === item.home_id)?.instructions || 'Sigue las indicaciones del refugio.'}</small></div>{item.status === 'Activa' && <button className="btn btn-sm btn-outline-secondary" onClick={() => onRun(() => actions.closeAssignment(item.id, user), 'Tu acogida quedó finalizada.')}>Finalizar acogida</button>}</div>{item.notes.map((note, index) => <p className="small mb-1" key={index}>Novedad: {note}</p>)}{active.some((activeItem) => activeItem.id === item.id) && <form className="demo-inline-action" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.addCareNote(item.id, notes[item.id], user); setNotes({ ...notes, [item.id]: '' }); return true }, 'Novedad de cuidado enviada al refugio.') }}><input className="form-control" placeholder="Registrar novedad de cuidado" value={notes[item.id] || ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} required /><button className="btn btn-sm btn-success">Guardar novedad</button></form>}</article>)}</div> : <Empty text="Cuando un refugio te asigne una mascota, aparecerá aquí." />}</section>
}

function SpeciesForm({ species, user, onRun }) {
  const [name, setName] = useState('')
  const { actions } = useDemoData()
  return <><form className="demo-inline-action" onSubmit={(event) => { event.preventDefault(); onRun(() => { actions.addSpecies(name, user); setName(''); return true }, 'Especie agregada al catálogo de la demo.') }}><input className="form-control" placeholder="Nueva especie" value={name} onChange={(event) => setName(event.target.value)} required /><button className="btn btn-success">Agregar especie</button></form><p className="text-secondary mt-3 mb-0">{species.map((item) => item.nombre).join(' · ')}</p></>
}

function RequestRows({ state, requests }) {
  return requests.length ? <ActivityRows rows={requests.map((item) => ({ title: `${petName(state, item.pet_id)} · ${item.motivation}`, status: item.status, date: dateLabel(item.created_at) }))} /> : <Empty text="Todavía no has enviado solicitudes. Entra a una ficha del catálogo para iniciar una." />
}

function AuditLog({ rows }) {
  return <section className="dashboard-section"><div className="section-title"><div><span className="eyebrow">Trazabilidad local</span><h2>Actividad reciente</h2></div></div><ActivityRows rows={rows.slice(0, 12).map((item) => ({ title: `${item.actor} · ${item.action} · ${item.subject}`, status: 'Demo', date: new Date(item.created_at).toLocaleString('es-CO') }))} empty="Sin actividad todavía." /></section>
}

function ActivityRows({ rows = [], empty = 'Sin registros.' }) {
  return rows.length ? <div className="demo-activity-list">{rows.map((item, index) => <article className="activity-card" key={item.id || `${item.title}-${index}`}><div><strong>{item.title}</strong>{item.date && <small>{item.date}</small>}</div>{item.status && <span className="status-pill">{item.status}</span>}</article>)}</div> : <Empty text={empty} />
}

function SelectPet({ state, petId, onChange, options, label }) {
  const pets = options ?? state.pets
  return <div><label className="form-label" htmlFor={`${label.replaceAll(' ', '-')}-select`}>{label}</label><select id={`${label.replaceAll(' ', '-')}-select`} className="form-select" value={petId} onChange={(event) => onChange(event.target.value)} required disabled={!pets.length}>{pets.length ? pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.nombre}</option>) : <option value="">No hay mascotas autorizadas en tu agenda</option>}</select></div>
}

function Field({ label, name, id = `demo-${name}`, value, onChange, type = 'text', ...props }) {
  return <div><label className="form-label" htmlFor={id}>{label}</label><input id={id} className="form-control" name={name} type={type} value={value} onChange={onChange} {...props} /></div>
}

function Empty({ text }) {
  return <p className="text-secondary mb-0">{text}</p>
}

function petName(state, petId) {
  return state.pets.find((item) => item.id === petId)?.nombre || 'Mascota demo'
}

function petNameStatus(pet) {
  return pet.estado?.nombre || (pet.publicada ? 'Disponible' : 'Borrador')
}

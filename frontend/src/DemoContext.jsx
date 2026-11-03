import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_PETS, DEMO_SPECIES } from './demoPets'
import { DemoContext } from './demoContext'

const STORAGE_KEY = 'petlink_academic_demo_v1'
const ACTIVE_REQUESTS = new Set(['Pendiente', 'En revisión'])

function initialDemoState() {
  return {
    version: 1,
    pets: DEMO_PETS.map((pet, index) => ({
      ...pet,
      publicada: pet.id !== 'demo-max',
      refugio_id: ['demo-shelter', 'demo-shelter', 'demo-shelter', 'demo-shelter', 'demo-shelter', 'demo-shelter'][index],
      estado: pet.id === 'demo-max' ? { id: 3, codigo: 'adoptada', nombre: 'Adoptada' } : pet.estado,
      publicacion: { estado: pet.id === 'demo-max' ? 'cerrada' : 'publicada' },
    })),
    species: DEMO_SPECIES,
    requests: [
      { id: 'demo-request-luna', pet_id: 'demo-luna', adopter_id: 'demo-adopter', adopter_name: 'Adoptante Demo', status: 'En revisión', motivation: 'Tengo espacio y tiempo para acompañar a Luna.', created_at: '2026-11-01' },
      { id: 'demo-request-toby', pet_id: 'demo-toby', adopter_id: 'demo-adopter', adopter_name: 'Adoptante Demo', status: 'Pendiente', motivation: 'Quiero conocer más sobre los cuidados de Toby.', created_at: '2026-11-02' },
    ],
    adoptions: [
      { id: 'demo-adoption-max', pet_id: 'demo-max', adopter_id: 'demo-adopter', adopter_name: 'Adoptante Demo', status: 'Activa', date: '2026-10-25' },
    ],
    homes: [
      { id: 'demo-home-foster', owner_id: 'demo-foster', name: 'Hogar Demo', capacity: 3, municipio: 'Ocaña', instructions: 'Alimentación dos veces al día y paseo corto por la tarde.' },
      { id: 'demo-home-huellitas', owner_id: 'demo-shelter', name: 'Huellitas de Ocaña', capacity: 5, municipio: 'Ocaña', instructions: 'Espacio de recuperación del refugio.' },
    ],
    assignments: [
      { id: 'demo-assignment-toby', pet_id: 'demo-toby', home_id: 'demo-home-foster', home_name: 'Hogar Demo', foster_id: 'demo-foster', foster_name: 'Hogar Demo', status: 'Activa', starts_at: '2026-10-28', ends_at: '2026-11-15', notes: ['Toby se está adaptando bien a la rutina.'] },
    ],
    appointments: [
      { id: 'demo-appointment-max', pet_id: 'demo-max', vet_id: 'demo-vet', vet_name: 'Veterinaria Demo', adopter_id: 'demo-adopter', status: 'Programada', type: 'Control general', scheduled_at: '2026-11-05T10:30', notes: '' },
      { id: 'demo-appointment-max-vaccine', pet_id: 'demo-max', vet_id: 'demo-vet', vet_name: 'Veterinaria Demo', adopter_id: 'demo-adopter', status: 'Solicitada', type: 'Vacunación', scheduled_at: '2026-11-06T09:00', notes: '' },
    ],
    medicalRecords: [
      { id: 'demo-medical-max', pet_id: 'demo-max', vet_id: 'demo-vet', vet_name: 'Veterinaria Demo', title: 'Valoración general', notes: 'Buen estado general. Se recomienda mantener controles preventivos.', date: '2026-10-30' },
    ],
    vaccinations: [
      { id: 'demo-vaccine-max', pet_id: 'demo-max', vet_id: 'demo-vet', vet_name: 'Veterinaria Demo', name: 'Vacuna antirrábica', applied_at: '2026-10-30', next_at: '2027-10-30' },
    ],
    followUps: [
      { id: 'demo-followup-max', adoption_id: 'demo-adoption-max', pet_id: 'demo-max', adopter_id: 'demo-adopter', date: '2026-11-10', status: 'Programado', notes: 'Primer seguimiento de bienestar.' },
    ],
    donations: [
      { id: 'demo-donation-1', adopter_id: 'demo-adopter', adopter_name: 'Adoptante Demo', shelter_name: 'Huellitas de Ocaña', type: 'Alimento', amount: 0, description: 'Dos bolsas de alimento para cachorro', date: '2026-10-29' },
    ],
    notifications: [
      { id: 'demo-notice-admin', user_id: 'demo-admin', title: 'Demo lista para presentar', message: 'Explora los paneles y restablece estos datos desde cualquier rol.', read: false, created_at: '2026-11-01T09:00:00' },
      { id: 'demo-notice-adopter', user_id: 'demo-adopter', title: 'Seguimiento programado', message: 'El primer seguimiento de Max está programado para el 10 de noviembre.', read: false, created_at: '2026-11-01T09:00:00' },
      { id: 'demo-notice-shelter', user_id: 'demo-shelter', title: 'Solicitudes por revisar', message: 'Luna y Toby tienen solicitudes en proceso.', read: false, created_at: '2026-11-01T09:00:00' },
      { id: 'demo-notice-vet', user_id: 'demo-vet', title: 'Agenda veterinaria', message: 'Hay citas de control y vacunación por atender para Max.', read: false, created_at: '2026-11-01T09:00:00' },
      { id: 'demo-notice-foster', user_id: 'demo-foster', title: 'Acogida activa', message: 'Toby está bajo tu cuidado temporal. Registra novedades desde tu panel.', read: false, created_at: '2026-11-01T09:00:00' },
    ],
    audit: [
      { id: 'demo-audit-1', actor: 'Sistema demo', action: 'Datos ficticios inicializados', subject: 'PetLink', created_at: '2026-11-01T09:00:00' },
    ],
    profiles: {},
  }
}

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved?.version === 1 && Array.isArray(saved.pets) && Array.isArray(saved.requests)) {
      const defaults = initialDemoState()
      const needsSampleAdoption = !saved.adoptions?.length
      const savedAppointments = saved.appointments?.length
        ? saved.appointments.map((item) => ['demo-appointment-luna', 'demo-appointment-toby'].includes(item.id) ? { ...item, pet_id: 'demo-max', adopter_id: 'demo-adopter', vet_id: 'demo-vet', vet_name: 'Veterinaria Demo' } : item)
        : defaults.appointments
      const savedMedicalRecords = saved.medicalRecords?.length
        ? saved.medicalRecords.map((item) => item.id === 'demo-medical-luna' ? { ...item, pet_id: 'demo-max' } : item)
        : defaults.medicalRecords
      const savedVaccinations = saved.vaccinations?.length
        ? saved.vaccinations.map((item) => item.id === 'demo-vaccine-luna' ? { ...item, pet_id: 'demo-max' } : item)
        : defaults.vaccinations
      return {
        ...defaults,
        ...saved,
        pets: needsSampleAdoption ? saved.pets.map((pet) => pet.id === 'demo-max' && pet.estado?.codigo === 'disponible' ? defaults.pets.find((sample) => sample.id === 'demo-max') : pet) : saved.pets,
        adoptions: saved.adoptions?.length ? saved.adoptions : defaults.adoptions,
        followUps: saved.followUps?.length ? saved.followUps : defaults.followUps,
        appointments: savedAppointments,
        medicalRecords: savedMedicalRecords,
        vaccinations: savedVaccinations,
        homes: saved.homes || defaults.homes,
        assignments: saved.assignments || defaults.assignments,
        notifications: saved.notifications?.length ? saved.notifications : defaults.notifications,
        audit: saved.audit || defaults.audit,
        profiles: saved.profiles || defaults.profiles,
      }
    }
  } catch { /* Invalid local demo data is replaced with the bundled sample. */ }
  return initialDemoState()
}

function idFor(prefix) {
  return `demo-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function recordAction(state, actor, action, subject) {
  const entry = { id: idFor('audit'), actor: actor?.name || 'Usuario demo', action, subject, created_at: new Date().toISOString() }
  return { ...state, audit: [entry, ...state.audit].slice(0, 100) }
}

function addNotification(state, userId, title, message, subjectId = '') {
  if (!userId) return state
  return {
    ...state,
    notifications: [{ id: idFor('notice'), user_id: userId, title, message, subject_id: subjectId, read: false, created_at: new Date().toISOString() }, ...state.notifications].slice(0, 100),
  }
}

function assertRole(user, allowed) {
  if (!allowed.includes(user?.role?.nombre)) throw new Error('Esta acción no está disponible para este rol en la demo.')
}

export function DemoProvider({ children }) {
  const [state, setState] = useState(readSavedState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* The in-memory demo remains usable if storage is full. */ }
  }, [state])

  useEffect(() => {
    function syncFromAnotherTab(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const next = JSON.parse(event.newValue)
        if (next?.version === 1 && Array.isArray(next.pets)) setState(next)
      } catch { /* Ignore malformed values from another tab. */ }
    }
    window.addEventListener('storage', syncFromAnotherTab)
    return () => window.removeEventListener('storage', syncFromAnotherTab)
  }, [])

  const update = useCallback((updater) => {
    setState((current) => {
      const next = updater(current)
      stateRef.current = next
      return next
    })
  }, [])

  const actions = useMemo(() => ({
    createPet(fields, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const species = stateRef.current.species.find((item) => String(item.id) === String(fields.especie_id)) || stateRef.current.species[0]
      if (!fields.nombre?.trim() || !species) throw new Error('Escribe el nombre y elige una especie.')
      const age = fields.edad_estimada_anios === '' ? null : Number(fields.edad_estimada_anios)
      if (age !== null && (!Number.isFinite(age) || age < 0 || age > 30)) throw new Error('La edad debe estar entre 0 y 30 años.')
      const id = idFor(fields.nombre.trim().toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-'))
      const refugeName = actor.role.nombre === 'Refugio' ? 'Refugio Patitas Bogotá' : 'Huellitas de Ocaña'
      const pet = {
        id, demo: true, nombre: fields.nombre.trim(), emoji: species.nombre === 'Gato' ? '🐈' : species.nombre === 'Conejo' ? '🐰' : '🐕',
        especie: species, raza: { nombre: fields.raza?.trim() || 'Criolla' }, sexo: fields.sexo || 'desconocido', tamano: fields.tamano || 'mediano',
        edad_estimada_anios: age, descripcion: fields.descripcion?.trim() || 'Una nueva historia está por comenzar.',
        estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: id, publicada: fields.publicada !== false && fields.publicada !== 'false',
        publicacion: { estado: fields.publicada !== false && fields.publicada !== 'false' ? 'publicada' : 'borrador' }, refugio_id: actor.id,
        refugio: { nombre: refugeName, municipio: actor.role.nombre === 'Refugio' ? 'Bogotá' : 'Ocaña', departamento: actor.role.nombre === 'Refugio' ? 'Cundinamarca' : 'Norte de Santander' },
      }
      update((current) => recordAction({ ...current, pets: [pet, ...current.pets] }, actor, 'Registró una mascota', pet.nombre))
      return pet
    },
    updatePet(petId, fields, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const pet = stateRef.current.pets.find((item) => item.id === petId)
      if (!pet) throw new Error('No encontramos esa mascota en la demo.')
      if (actor.role.nombre !== 'Administrador' && pet.refugio_id !== actor.id) throw new Error('Solo puedes editar mascotas de tu refugio.')
      update((current) => recordAction({ ...current, pets: current.pets.map((item) => item.id === petId ? { ...item, ...fields, nombre: fields.nombre?.trim() || item.nombre, descripcion: fields.descripcion?.trim() ?? item.descripcion, raza: fields.raza ? { nombre: fields.raza.trim() } : item.raza } : item) }, actor, 'Actualizó una mascota', pet.nombre))
    },
    setPetPublished(petId, published, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const pet = stateRef.current.pets.find((item) => item.id === petId)
      if (!pet || (actor.role.nombre !== 'Administrador' && pet.refugio_id !== actor.id)) throw new Error('No tienes acceso a esa ficha.')
      if (published && pet.estado?.codigo !== 'disponible') throw new Error('Solo puedes publicar mascotas disponibles para adopción.')
      update((current) => recordAction({ ...current, pets: current.pets.map((item) => item.id === petId ? { ...item, publicada: published, publicacion: { estado: published ? 'publicada' : 'borrador' } } : item) }, actor, published ? 'Publicó una mascota' : 'Pausó una publicación', pet.nombre))
    },
    deletePet(petId, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const current = stateRef.current
      const pet = current.pets.find((item) => item.id === petId)
      if (!pet || (actor.role.nombre !== 'Administrador' && pet.refugio_id !== actor.id)) throw new Error('No tienes acceso a esa ficha.')
      if (current.requests.some((item) => item.pet_id === petId) || current.adoptions.some((item) => item.pet_id === petId) || current.assignments.some((item) => item.pet_id === petId) || current.appointments.some((item) => item.pet_id === petId) || current.medicalRecords.some((item) => item.pet_id === petId) || current.vaccinations.some((item) => item.pet_id === petId)) throw new Error('No se puede quitar una mascota que ya tiene solicitudes, adopciones, citas, historial médico o acogidas. Puedes pausar su publicación.')
      update((stateNow) => recordAction({ ...stateNow, pets: stateNow.pets.filter((item) => item.id !== petId) }, actor, 'Quitó una mascota de la demo', pet.nombre))
    },
    submitAdoptionRequest(petId, adopter, motivation) {
      assertRole(adopter, ['Adoptante'])
      const current = stateRef.current
      const pet = current.pets.find((item) => item.id === petId)
      if (!pet || !pet.publicada || pet.estado?.codigo !== 'disponible') throw new Error('Esta mascota ya no está disponible.')
      if (current.adoptions.some((item) => item.pet_id === petId)) throw new Error('Esta mascota ya tiene una adopción registrada.')
      if (current.requests.some((item) => item.pet_id === petId && item.adopter_id === adopter.id && ACTIVE_REQUESTS.has(item.status))) throw new Error('Ya tienes una solicitud pendiente para esta mascota.')
      const request = { id: idFor('request'), pet_id: petId, adopter_id: adopter.id, adopter_name: adopter.name, status: 'En revisión', motivation: motivation?.trim() || 'Quiero conocer más sobre esta mascota.', created_at: new Date().toISOString().slice(0, 10) }
      update((stateNow) => {
        let next = { ...stateNow, requests: [request, ...stateNow.requests] }
        next = addNotification(next, pet.refugio_id, 'Nueva solicitud de adopción', `${adopter.name} quiere conocer a ${pet.nombre}.`, pet.id)
        next = addNotification(next, adopter.id, 'Solicitud enviada', `Tu solicitud para ${pet.nombre} quedó en revisión.`, pet.id)
        return recordAction(next, adopter, 'Envió una solicitud de adopción', pet.nombre)
      })
      return request
    },
    resolveRequest(requestId, decision, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const current = stateRef.current
      const request = current.requests.find((item) => item.id === requestId)
      const pet = current.pets.find((item) => item.id === request?.pet_id)
      if (!['approve', 'reject'].includes(decision)) throw new Error('Elige aprobar o rechazar la solicitud.')
      if (!request || !ACTIVE_REQUESTS.has(request.status)) throw new Error('La solicitud ya fue resuelta.')
      if (!pet || (actor.role.nombre !== 'Administrador' && pet.refugio_id !== actor.id)) throw new Error('No tienes acceso a esta solicitud.')
      if (decision === 'approve' && current.adoptions.some((item) => item.pet_id === pet.id)) throw new Error('La mascota ya fue adoptada.')
      if (decision === 'approve' && (!pet.publicada || pet.estado?.codigo !== 'disponible')) throw new Error('Solo puedes aprobar solicitudes de una mascota disponible y publicada.')
      update((stateNow) => {
        const status = decision === 'approve' ? 'Aprobada' : 'Rechazada'
        let next = { ...stateNow, requests: stateNow.requests.map((item) => item.id === requestId ? { ...item, status } : item) }
        if (decision === 'approve') {
          const adoption = { id: idFor('adoption'), pet_id: pet.id, adopter_id: request.adopter_id, adopter_name: request.adopter_name, status: 'Activa', date: new Date().toISOString().slice(0, 10) }
          const followUp = { id: idFor('followup'), adoption_id: adoption.id, pet_id: pet.id, adopter_id: request.adopter_id, date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'Programado', notes: 'Primer seguimiento de bienestar.' }
          next = { ...next, adoptions: [adoption, ...next.adoptions], followUps: [followUp, ...next.followUps], pets: next.pets.map((item) => item.id === pet.id ? { ...item, publicada: false, publicacion: { estado: 'cerrada' }, estado: { ...item.estado, codigo: 'adoptada', nombre: 'Adoptada' } } : item), requests: next.requests.map((item) => item.pet_id === pet.id && item.id !== requestId && ACTIVE_REQUESTS.has(item.status) ? { ...item, status: 'No disponible' } : item) }
          next = addNotification(next, request.adopter_id, '¡Adopción aprobada!', `La solicitud para ${pet.nombre} fue aprobada.`, pet.id)
          next = addNotification(next, 'demo-foster', 'Nueva adopción registrada', `${pet.nombre} inicia una nueva historia con ${request.adopter_name}.`, pet.id)
        } else next = addNotification(next, request.adopter_id, 'Actualización de solicitud', `La solicitud para ${pet.nombre} fue rechazada.`, pet.id)
        return recordAction(next, actor, decision === 'approve' ? 'Aprobó una solicitud y registró una adopción' : 'Rechazó una solicitud', pet.nombre)
      })
    },
    assignFoster(petId, homeId, endsAt, actor) {
      assertRole(actor, ['Administrador', 'Refugio'])
      const current = stateRef.current
      const pet = current.pets.find((item) => item.id === petId)
      const home = current.homes.find((item) => item.id === homeId)
      if (!pet || !home || (actor.role.nombre !== 'Administrador' && pet.refugio_id !== actor.id)) throw new Error('Selecciona una mascota de tu refugio y un hogar disponible.')
      if (pet.estado?.codigo !== 'disponible') throw new Error('Solo se puede asignar temporalmente una mascota disponible.')
      if (current.assignments.some((item) => item.pet_id === petId && item.status === 'Activa')) throw new Error('Esta mascota ya tiene una acogida activa.')
      if (current.assignments.filter((item) => item.home_id === homeId && item.status === 'Activa').length >= home.capacity) throw new Error('Este hogar alcanzó su capacidad de acogida.')
      const assignment = { id: idFor('assignment'), pet_id: petId, home_id: home.id, home_name: home.name, foster_id: home.owner_id, foster_name: stateRef.current.profiles[home.owner_id]?.name || home.name, status: 'Activa', starts_at: new Date().toISOString().slice(0, 10), ends_at: endsAt || '', notes: [] }
      update((stateNow) => {
        let next = { ...stateNow, assignments: [assignment, ...stateNow.assignments] }
        next = addNotification(next, assignment.foster_id, 'Nueva asignación temporal', `${pet.nombre} fue asignado a ${home.name}.`, pet.id)
        return recordAction(next, actor, 'Asignó un hogar temporal', `${pet.nombre} · ${home.name}`)
      })
      return assignment
    },
    closeAssignment(assignmentId, actor) {
      const assignment = stateRef.current.assignments.find((item) => item.id === assignmentId)
      if (!assignment) throw new Error('No encontramos la asignación.')
      const role = actor?.role?.nombre
      const pet = stateRef.current.pets.find((item) => item.id === assignment.pet_id)
      if (assignment.status !== 'Activa') throw new Error('Esta acogida ya está finalizada.')
      if (role === 'Refugio' && pet?.refugio_id !== actor.id) throw new Error('Solo puedes gestionar acogidas de mascotas de tu refugio.')
      if (!['Administrador', 'Refugio'].includes(role) && !(role === 'Hogar temporal' && assignment.foster_id === actor.id)) throw new Error('No tienes permiso para cerrar esta acogida.')
      update((current) => recordAction({ ...current, assignments: current.assignments.map((item) => item.id === assignmentId ? { ...item, status: 'Finalizada', ends_at: item.ends_at || new Date().toISOString().slice(0, 10) } : item) }, actor, 'Finalizó una acogida', assignment.home_name))
    },
    addCareNote(assignmentId, note, actor) {
      assertRole(actor, ['Hogar temporal'])
      const assignment = stateRef.current.assignments.find((item) => item.id === assignmentId && item.foster_id === actor.id && item.status === 'Activa')
      if (!assignment || !note?.trim()) throw new Error('Escribe una novedad para una asignación activa a tu cargo.')
      update((current) => {
        let next = { ...current, assignments: current.assignments.map((item) => item.id === assignmentId ? { ...item, notes: [note.trim(), ...item.notes] } : item) }
        next = addNotification(next, 'demo-shelter', 'Novedad de hogar temporal', `${assignment.home_name}: ${note.trim()}`, assignment.pet_id)
        return recordAction(next, actor, 'Registró una novedad de cuidado', assignment.home_name)
      })
    },
    createAppointment(petId, scheduledAt, type, adopter) {
      assertRole(adopter, ['Adoptante'])
      const pet = stateRef.current.pets.find((item) => item.id === petId)
      if (!pet || !scheduledAt) throw new Error('Elige una mascota y una fecha para la cita.')
      if (!stateRef.current.adoptions.some((item) => item.pet_id === petId && item.adopter_id === adopter.id && item.status === 'Activa')) throw new Error('Las citas de esta demo se solicitan para una mascota que ya adoptaste.')
      const appointment = { id: idFor('appointment'), pet_id: petId, vet_id: 'demo-vet', vet_name: stateRef.current.profiles['demo-vet']?.name || 'Veterinaria Demo', adopter_id: adopter.id, status: 'Solicitada', type: type?.trim() || 'Consulta general', scheduled_at: scheduledAt, notes: '' }
      update((current) => {
        let next = { ...current, appointments: [appointment, ...current.appointments] }
        next = addNotification(next, appointment.vet_id, 'Nueva cita solicitada', `Cita para ${pet.nombre}: ${appointment.type}.`, pet.id)
        return recordAction(next, adopter, 'Solicitó una cita veterinaria', pet.nombre)
      })
      return appointment
    },
    updateAppointment(appointmentId, status, notes, actor) {
      assertRole(actor, ['Administrador', 'Veterinario'])
      const appointment = stateRef.current.appointments.find((item) => item.id === appointmentId)
      const pet = stateRef.current.pets.find((item) => item.id === appointment?.pet_id)
      if (!appointment || !pet || (actor.role.nombre === 'Veterinario' && appointment.vet_id !== actor.id)) throw new Error('Esta cita no está asignada a tu agenda.')
      const allowedTransitions = { Solicitada: ['Programada', 'Cancelada'], Programada: ['Realizada', 'Cancelada'] }
      if (!allowedTransitions[appointment.status]?.includes(status)) throw new Error('Ese cambio no corresponde al estado actual de la cita.')
      update((current) => {
        let next = { ...current, appointments: current.appointments.map((item) => item.id === appointmentId ? { ...item, status, notes: notes?.trim() || item.notes } : item) }
        if (status === 'Realizada' && notes?.trim()) next = { ...next, medicalRecords: [{ id: idFor('medical'), pet_id: pet.id, vet_id: actor.id, vet_name: actor.name, title: appointment.type, notes: notes.trim(), date: new Date().toISOString().slice(0, 10) }, ...next.medicalRecords] }
        next = addNotification(next, appointment.adopter_id, 'Estado de cita actualizado', `La cita de ${pet.nombre} ahora está ${status.toLowerCase()}.`, pet.id)
        return recordAction(next, actor, `Actualizó una cita: ${status}`, pet.nombre)
      })
    },
    addMedicalRecord(petId, title, notes, actor) {
      assertRole(actor, ['Administrador', 'Veterinario'])
      if (!title?.trim() || !notes?.trim()) throw new Error('Completa el título y las observaciones médicas.')
      if (actor.role.nombre === 'Veterinario' && !stateRef.current.appointments.some((item) => item.pet_id === petId && item.vet_id === actor.id && item.status !== 'Cancelada')) throw new Error('Solo puedes registrar atención para una mascota autorizada en tu agenda.')
      const record = { id: idFor('medical'), pet_id: petId, vet_id: actor.id, vet_name: actor.name, title: title.trim(), notes: notes.trim(), date: new Date().toISOString().slice(0, 10) }
      update((current) => recordAction({ ...current, medicalRecords: [record, ...current.medicalRecords] }, actor, 'Registró una atención médica', title.trim()))
    },
    addVaccination(petId, name, appliedAt, nextAt, actor) {
      assertRole(actor, ['Administrador', 'Veterinario'])
      if (!name?.trim() || !appliedAt) throw new Error('Completa el nombre de la vacuna y la fecha de aplicación.')
      if (actor.role.nombre === 'Veterinario' && !stateRef.current.appointments.some((item) => item.pet_id === petId && item.vet_id === actor.id && item.status !== 'Cancelada')) throw new Error('Solo puedes vacunar mascotas autorizadas en tu agenda.')
      const record = { id: idFor('vaccination'), pet_id: petId, vet_id: actor.id, vet_name: actor.name, name: name.trim(), applied_at: appliedAt, next_at: nextAt || '' }
      update((current) => recordAction({ ...current, vaccinations: [record, ...current.vaccinations] }, actor, 'Registró una vacuna', name.trim()))
    },
    createDonation(type, amount, description, adopter) {
      assertRole(adopter, ['Adoptante'])
      if (!type?.trim() || !description?.trim()) throw new Error('Indica qué donación quieres registrar.')
      const donationAmount = amount === '' ? 0 : Number(amount)
      if (!Number.isFinite(donationAmount) || donationAmount < 0) throw new Error('El valor de la donación debe ser cero o mayor.')
      const donation = { id: idFor('donation'), adopter_id: adopter.id, adopter_name: adopter.name, shelter_name: 'Huellitas de Ocaña', type: type.trim(), amount: donationAmount, description: description.trim(), date: new Date().toISOString().slice(0, 10) }
      update((current) => {
        let next = { ...current, donations: [donation, ...current.donations] }
        next = addNotification(next, 'demo-shelter', 'Nueva donación de muestra', `${adopter.name} ofreció ${donation.description}.`)
        return recordAction(next, adopter, 'Registró una donación de muestra', donation.type)
      })
    },
    updateFollowUp(followUpId, status, notes, actor) {
      const followUp = stateRef.current.followUps.find((item) => item.id === followUpId)
      if (!followUp) throw new Error('No encontramos el seguimiento.')
      if (!['Administrador', 'Adoptante'].includes(actor?.role?.nombre) || (actor.role.nombre === 'Adoptante' && followUp.adopter_id !== actor.id)) throw new Error('No tienes permiso para cambiar este seguimiento.')
      if (followUp.status !== 'Programado' || status !== 'Realizado') throw new Error('Solo se puede confirmar un seguimiento que está programado.')
      update((current) => recordAction({ ...current, followUps: current.followUps.map((item) => item.id === followUpId ? { ...item, status, notes: notes?.trim() || item.notes } : item) }, actor, `Actualizó un seguimiento: ${status}`, followUpId))
    },
    addSpecies(name, actor) {
      assertRole(actor, ['Administrador'])
      const normalized = name?.trim()
      if (!normalized) throw new Error('Escribe el nombre de la especie.')
      if (stateRef.current.species.some((item) => item.nombre.toLowerCase() === normalized.toLowerCase())) throw new Error('Esa especie ya existe en la demo.')
      update((current) => recordAction({ ...current, species: [...current.species, { id: Math.max(0, ...current.species.map((item) => Number(item.id))) + 1, nombre: normalized }] }, actor, 'Agregó una especie al catálogo', normalized))
    },
    markNotificationRead(notificationId, actor) {
      const notification = stateRef.current.notifications.find((item) => item.id === notificationId && item.user_id === actor.id)
      if (!notification) return
      update((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item) }))
    },
    updateProfile(userId, name, phone, actor) {
      if (actor.id !== userId || !name?.trim()) throw new Error('Completa tu nombre para guardar el perfil de demo.')
      update((current) => recordAction({ ...current, profiles: { ...current.profiles, [userId]: { name: name.trim(), phone: phone?.trim() || '' } } }, actor, 'Actualizó su perfil de demo', name.trim()))
    },
    reset() {
      const next = initialDemoState()
      stateRef.current = next
      setState(next)
    },
  }), [update])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export const DEMO_SPECIES = [
  { id: 1, nombre: 'Perro' },
  { id: 2, nombre: 'Gato' },
  { id: 3, nombre: 'Conejo' },
]

export const DEMO_PETS = [
  {
    id: 'demo-luna', demo: true, nombre: 'Luna', emoji: '🐕',
    especie: DEMO_SPECIES[0], raza: { nombre: 'Criolla' }, sexo: 'hembra', tamano: 'mediano', edad_estimada_anios: 2,
    descripcion: 'Luna es cariñosa, juguetona y disfruta los paseos tranquilos. Está lista para conocer a su nueva familia.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-luna',
    refugio: { nombre: 'Huellitas de Ocaña', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
  {
    id: 'demo-toby', demo: true, nombre: 'Toby', emoji: '🐶',
    especie: DEMO_SPECIES[0], raza: { nombre: 'Pinscher criollo' }, sexo: 'macho', tamano: 'pequeno', edad_estimada_anios: 1,
    descripcion: 'Toby es curioso y activo. Le encantan los juegos y aprender cosas nuevas con sus personas favoritas.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-toby',
    refugio: { nombre: 'Huellitas de Ocaña', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
  {
    id: 'demo-mora', demo: true, nombre: 'Mora', emoji: '🐈',
    especie: DEMO_SPECIES[1], raza: { nombre: 'Doméstica de pelo corto' }, sexo: 'hembra', tamano: 'pequeno', edad_estimada_anios: 3,
    descripcion: 'Mora es una gatita serena y dulce. Busca un hogar donde pueda descansar al sol y recibir muchos mimos.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-mora',
    refugio: { nombre: 'Casa Michi', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
  {
    id: 'demo-simon', demo: true, nombre: 'Simón', emoji: '🐈‍⬛',
    especie: DEMO_SPECIES[1], raza: { nombre: 'Criollo' }, sexo: 'macho', tamano: 'mediano', edad_estimada_anios: 4,
    descripcion: 'Simón es sociable y muy observador. Se adapta con facilidad y disfruta la compañía tranquila.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-simon',
    refugio: { nombre: 'Casa Michi', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
  {
    id: 'demo-nube', demo: true, nombre: 'Nube', emoji: '🐰',
    especie: DEMO_SPECIES[2], raza: { nombre: 'Enano' }, sexo: 'hembra', tamano: 'pequeno', edad_estimada_anios: 1,
    descripcion: 'Nube es tranquila y curiosa. Necesita un espacio seguro y una familia comprometida con su cuidado.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-nube',
    refugio: { nombre: 'Hogar Patitas', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
  {
    id: 'demo-max', demo: true, nombre: 'Max', emoji: '🐕‍🦺',
    especie: DEMO_SPECIES[0], raza: { nombre: 'Labrador criollo' }, sexo: 'macho', tamano: 'grande', edad_estimada_anios: 5,
    descripcion: 'Max es noble y leal. Busca una familia con espacio para compartir caminatas y tardes de descanso.',
    estado: { id: 1, codigo: 'disponible', nombre: 'Disponible' }, publicacion_id: 'demo-max',
    refugio: { nombre: 'Huellitas de Ocaña', municipio: 'Ocaña', departamento: 'Norte de Santander' },
  },
]

export function filterDemoPets(pets, filters) {
  const query = filters.q.trim().toLocaleLowerCase('es')
  return pets.filter((pet) => {
    const matchesName = !query || pet.nombre.toLocaleLowerCase('es').includes(query)
    const matchesSpecies = !filters.especie_id || String(pet.especie.id) === String(filters.especie_id)
    const matchesSex = !filters.sexo || pet.sexo === filters.sexo
    const matchesSize = !filters.tamano || pet.tamano === filters.tamano
    return matchesName && matchesSpecies && matchesSex && matchesSize
  })
}

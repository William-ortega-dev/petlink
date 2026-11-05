import { Link } from 'react-router-dom'

export default function PetCard({ pet }) {
  const age = pet.edad_estimada_anios ? `${pet.edad_estimada_anios} ${Number(pet.edad_estimada_anios) === 1 ? 'año' : 'años'}` : null
  const size = ({ pequeno: 'pequeño', mediano: 'mediano', grande: 'grande' })[pet.tamano] || pet.tamano
  return (
    <article className="pet-card card h-100 border-0">
      <Link to={'/mascotas/' + pet.id} className="pet-photo-wrap" aria-label={'Ver a ' + pet.nombre}>
        {pet.fotografia ? <img className="pet-photo" src={pet.fotografia} alt={pet.nombre} /> : <div className="pet-photo pet-photo-fallback">{pet.emoji || (pet.especie?.nombre === 'Gato' ? '🐱' : pet.especie?.nombre === 'Conejo' ? '🐰' : '🐶')}</div>}
        <span className="availability-badge">Disponible</span>
      </Link>
      <div className="card-body p-4">
        <p className="eyebrow mb-2">{pet.especie?.nombre || 'Mascota'}{pet.raza?.nombre ? ' · ' + pet.raza.nombre : ''}</p>
        <h3 className="h4 mb-2">{pet.nombre}</h3>
        <p className="text-secondary mb-3">{[pet.sexo, size, age].filter(Boolean).join(' · ')}</p>
        <Link className="btn btn-outline-success rounded-pill px-4" to={'/mascotas/' + pet.id}>Conocer a {pet.nombre}</Link>
      </div>
    </article>
  )
}


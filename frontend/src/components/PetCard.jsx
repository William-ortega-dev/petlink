import { Link } from 'react-router-dom'

export default function PetCard({ pet }) {
  return (
    <article className="pet-card card h-100 border-0">
      <Link to={'/mascotas/' + pet.id} className="pet-photo-wrap" aria-label={'Ver a ' + pet.nombre}>
        {pet.fotografia ? <img className="pet-photo" src={pet.fotografia} alt={pet.nombre} /> : <div className="pet-photo pet-photo-fallback">{pet.especie?.nombre === 'Gato' ? '🐱' : '🐶'}</div>}
        <span className="availability-badge">Disponible</span>
      </Link>
      <div className="card-body p-4">
        <p className="eyebrow mb-2">{pet.especie?.nombre || 'Mascota'}{pet.raza?.nombre ? ' · ' + pet.raza.nombre : ''}</p>
        <h3 className="h4 mb-2">{pet.nombre}</h3>
        <p className="text-secondary mb-3">{[pet.sexo, pet.tamano, pet.edad_estimada_anios ? pet.edad_estimada_anios + ' años' : null].filter(Boolean).join(' · ')}</p>
        <Link className="btn btn-outline-success rounded-pill px-4" to={'/mascotas/' + pet.id}>Conocer a {pet.nombre}</Link>
      </div>
    </article>
  )
}


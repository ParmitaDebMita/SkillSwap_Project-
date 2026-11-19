import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { categories } from '../data/mockData'
import StudentCard from '../components/StudentCard'
import './Explore.css'

export default function Explore() {
  const { students } = useData()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    return students.filter(student => {
      const matchesCategory = activeCategory === 'All' || student.category === activeCategory
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        student.name?.toLowerCase().includes(searchLower) ||
        student.skillsOffered?.some(s => s.toLowerCase().includes(searchLower)) ||
        student.skillsWanted?.some(s => s.toLowerCase().includes(searchLower)) ||
        student.university?.toLowerCase().includes(searchLower) ||
        student.bio?.toLowerCase().includes(searchLower)
      return matchesCategory && matchesSearch
    })
  }, [students, search, activeCategory])

  return (
    <div className="explore page-container">
      <div className="container">
        <div className="explore-header">
          <div>
            <h1 className="section-title">Explore Skills</h1>
            <p className="section-subtitle">
              Discover talented students and find the perfect skill exchange partner.
            </p>
          </div>
          <div className="explore-count">
            <span className="count-number">{filtered.length}</span>
            <span className="count-label">students found</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="explore-controls">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, skill, or university..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="explore-grid">
            {filtered.map(student => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="explore-empty">
            <span className="empty-icon">🔍</span>
            <h3>No students found</h3>
            <p>Try adjusting your search or category filter.</p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearch('')
                setActiveCategory('All')
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

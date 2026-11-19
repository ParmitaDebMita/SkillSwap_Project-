import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { categories } from '../data/mockData'
import StudentCard from '../components/StudentCard'
import './Explore.css'

export default function Explore() {
  const { students, studentsLoading, studentsError } = useData()
  const [searchParams, setSearchParams] = useSearchParams()

  // Single source of truth: URL query parameters
  const search = searchParams.get('search') || ''
  const activeCategory = searchParams.get('category') || 'All'

  const handleSearchChange = (val) => {
    const nextParams = new URLSearchParams(searchParams)
    if (val) {
      nextParams.set('search', val)
    } else {
      nextParams.delete('search')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleCategorySelect = (cat) => {
    const nextParams = new URLSearchParams(searchParams)
    if (cat !== 'All') {
      nextParams.set('category', cat)
    } else {
      nextParams.delete('category')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleClearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  // Client-side filtering on the loaded dataset
  const filtered = useMemo(() => {
    return students.filter(student => {
      const matchesCategory = activeCategory === 'All' || student.category === activeCategory
      const searchLower = search.toLowerCase().trim()
      const matchesSearch =
        !searchLower ||
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
            <span className="count-number">{studentsLoading ? '…' : filtered.length}</span>
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
              placeholder="Search by name, skill, university, or interest..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              disabled={studentsLoading}
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => handleSearchChange('')}
                aria-label="Clear search query"
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
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {studentsLoading && (
          <div className="explore-empty">
            <span className="empty-icon">⏳</span>
            <h3>Loading students…</h3>
            <p>Fetching student profiles from the server.</p>
          </div>
        )}

        {/* Error State */}
        {!studentsLoading && studentsError && (
          <div className="explore-empty">
            <span className="empty-icon">⚠️</span>
            <h3>Could not load students</h3>
            <p>{studentsError}</p>
          </div>
        )}

        {/* Results */}
        {!studentsLoading && !studentsError && (
          filtered.length > 0 ? (
            <div className="explore-grid">
              {filtered.map(student => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="explore-empty">
              <span className="empty-icon">🔍</span>
              <h3>No students found</h3>
              <p>
                {search
                  ? `No matching students found for "${search}". Try adjusting your keywords or clearing the category filter.`
                  : 'No students found in this category.'}
              </p>
              <button
                className="btn btn-outline"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

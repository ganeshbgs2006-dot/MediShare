import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  PackageSearch,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import EquipmentCard from '../../components/EquipmentCard';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card, { CardBody } from '../../components/common/Card/Card';
import {
  getCategories,
  getSharingTypes,
  getAvailabilityStatuses,
  getConditionOptions,
  getSortOptions,
  filterAndSortEquipment,
  equipmentService
} from '../../services/equipmentService';
import styles from './Marketplace.module.css';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter and Search states initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [selectedSharingType, setSelectedSharingType] = useState(searchParams.get('mode') || searchParams.get('sharingType') || 'all');
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'All Conditions');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'default');

  // Mobile filters collapsible drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync state if URL search parameters change externally
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const mode = searchParams.get('mode') || searchParams.get('sharingType');
    const avail = searchParams.get('availability');
    const cond = searchParams.get('condition');
    const sort = searchParams.get('sort');

    if (q !== null && q !== searchQuery) setSearchQuery(q);
    if (cat !== null) {
      // Handle category slug to canonical category mapping
      const categoryMap = {
        'mobility': 'Mobility Aids & Walkers',
        'mobility aids': 'Mobility Aids & Walkers',
        'walking frames': 'Mobility Aids & Walkers',
        'walking aids': 'Mobility Aids & Walkers',
        'crutches': 'Mobility Aids & Walkers',
        'wheelchairs': 'Wheelchairs',
        'respiratory': 'Respiratory Equipment',
        'respiratory support': 'Respiratory Equipment',
        'beds': 'Hospital Beds',
        'hospital beds': 'Hospital Beds',
        'monitoring': 'Monitoring Devices',
        'monitoring devices': 'Monitoring Devices',
        'vital monitoring': 'Monitoring Devices',
        'assistive': 'Other Assistive Equipment',
        'other assistive equipment': 'Other Assistive Equipment',
        'rehab': 'Mobility Aids & Walkers',
        'pediatric': 'Wheelchairs'
      };
      const normalized = cat.trim().toLowerCase();
      const mapped = categoryMap[normalized];
      if (mapped) {
        setSelectedCategory(mapped);
      } else {
        const found = categories.find((c) => c.toLowerCase() === normalized);
        setSelectedCategory(found || cat);
      }
    }
    if (mode !== null && mode !== selectedSharingType) setSelectedSharingType(mode);
    if (avail !== null && avail !== selectedAvailability) setSelectedAvailability(avail);
    if (cond !== null && cond !== selectedCondition) setSelectedCondition(cond);
    if (sort !== null && sort !== sortOption) setSortOption(sort);
  }, [searchParams]);

  // Options from service
  const categories = useMemo(() => getCategories(), []);
  const sharingTypes = useMemo(() => getSharingTypes(), []);
  const availabilityStatuses = useMemo(() => getAvailabilityStatuses(), []);
  const conditionOptions = useMemo(() => getConditionOptions(), []);
  const sortOptions = useMemo(() => getSortOptions(), []);

  // Database equipment state
  const [catalogItems, setCatalogItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const res = await equipmentService.fetchEquipment();
        if (isMounted && res) {
          if (Array.isArray(res.equipment)) {
            setCatalogItems(res.equipment);
            setIsDemoData(Boolean(res.isFallback));
          }
        }
      } catch (e) {
        console.warn('Failed loading marketplace catalog from API:', e.message);
        if (isMounted) setIsDemoData(true);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Filtered and sorted equipment dataset
  const filteredEquipment = useMemo(() => {
    return filterAndSortEquipment({
      items: catalogItems,
      query: searchQuery,
      category: selectedCategory,
      sharingType: selectedSharingType,
      availability: selectedAvailability,
      condition: selectedCondition,
      sort: sortOption
    });
  }, [catalogItems, searchQuery, selectedCategory, selectedSharingType, selectedAvailability, selectedCondition, sortOption]);

  // Check if any non-default filter is currently active
  const isFiltered = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All Categories' ||
    selectedSharingType !== 'all' ||
    selectedAvailability !== 'all' ||
    selectedCondition !== 'All Conditions' ||
    sortOption !== 'default'
  );

  // Reset all filters to default state
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedSharingType('all');
    setSelectedAvailability('all');
    setSelectedCondition('All Conditions');
    setSortOption('default');
    setSearchParams({});
  };

  const clearSearch = () => {
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    setSearchParams(newParams);
  };

  return (
    <div className={styles.marketplacePage}>
      {/* Marketplace Header Banner */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <span className={styles.headerBadge}>
              <Sparkles size={14} className={styles.headerBadgeIcon} aria-hidden="true" />
              Community Sharing Network
            </span>
            <h1 className={styles.pageTitle}>Equipment Marketplace</h1>
            <p className={styles.pageSubtitle}>
              Browse assistive devices, wheelchairs, hospital beds, and recovery aids shared by verified local owners, clinics, and community members.
            </p>
          </div>
        </div>
      </section>

      {/* Main Marketplace Area */}
      <div className="container section" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Search & Mobile Filter Toggle Bar */}
        <div className={styles.searchBarContainer}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              id="marketplace-search"
              aria-label="Search medical equipment by name, category, or service area"
              placeholder="Search wheelchairs, walkers, crutches, hospital beds, or service area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={clearSearch}
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.sortWrapper}>
            <label htmlFor="marketplace-sort" className={styles.sortLabel}>
              <ArrowUpDown size={14} aria-hidden="true" />
              <span>Sort:</span>
            </label>
            <select
              id="marketplace-sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={styles.sortSelect}
              aria-label="Sort equipment listings"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            type="button"
            className={styles.mobileFilterToggleBtn}
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            aria-expanded={isMobileFiltersOpen}
            aria-controls="marketplace-filters"
          >
            <Filter size={16} />
            <span>Filters {isFiltered ? '(Active)' : ''}</span>
          </button>
        </div>

        {/* Marketplace Layout Grid: Sidebar Filters + Products Grid */}
        <div className={styles.layoutGrid}>
          {/* Filters Sidebar */}
          <aside
            id="marketplace-filters"
            className={`${styles.filterSidebar} ${isMobileFiltersOpen ? styles.mobileFiltersOpen : ''}`}
            aria-label="Equipment Filters"
          >
            <div className={styles.filterSidebarHeader}>
              <div className={styles.filterSidebarTitle}>
                <SlidersHorizontal size={18} aria-hidden="true" />
                <h3>Filter Equipment</h3>
              </div>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.resetBtn}
                  aria-label="Reset all filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* 1. Category Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filter-category" className={styles.filterGroupLabel}>
                Equipment Category
              </label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Sharing Type Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filter-sharing" className={styles.filterGroupLabel}>
                Sharing Arrangement
              </label>
              <select
                id="filter-sharing"
                value={selectedSharingType}
                onChange={(e) => setSelectedSharingType(e.target.value)}
                className={styles.filterSelect}
              >
                {sharingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Availability Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filter-availability" className={styles.filterGroupLabel}>
                Availability Status
              </label>
              <select
                id="filter-availability"
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className={styles.filterSelect}
              >
                {availabilityStatuses.map((avail) => (
                  <option key={avail.value} value={avail.value}>
                    {avail.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Equipment Condition Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filter-condition" className={styles.filterGroupLabel}>
                Recorded Condition
              </label>
              <select
                id="filter-condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className={styles.filterSelect}
              >
                {conditionOptions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
              <small className={styles.filterHelperText}>
                * Recorded physical checks; not biomedical certification.
              </small>
            </div>

            {/* Mobile Close Filter Button */}
            <div className={styles.mobileFilterCloseWrapper}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                Apply Filters ({filteredEquipment.length} items)
              </Button>
            </div>
          </aside>

          {/* Results Grid Area */}
          <main className={styles.resultsMain}>
            {/* Results Count & Active Filter Pills Bar */}
            <div className={styles.resultsHeaderBar}>
              <span className={styles.resultsCount}>
                Showing <strong>{filteredEquipment.length}</strong> {filteredEquipment.length === 1 ? 'item' : 'items'}
              </span>

              {isFiltered && (
                <div className={styles.activePills}>
                  {searchQuery.trim() && (
                    <span className={styles.activePill}>
                      Search: "{searchQuery}"
                      <button type="button" onClick={clearSearch} aria-label="Remove search filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'All Categories' && (
                    <span className={styles.activePill}>
                      Category: {selectedCategory}
                      <button type="button" onClick={() => setSelectedCategory('All Categories')} aria-label="Remove category filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedSharingType !== 'all' && (
                    <span className={styles.activePill}>
                      Sharing: {sharingTypes.find(t => t.value === selectedSharingType)?.label}
                      <button type="button" onClick={() => setSelectedSharingType('all')} aria-label="Remove sharing filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedAvailability !== 'all' && (
                    <span className={styles.activePill}>
                      Status: {availabilityStatuses.find(a => a.value === selectedAvailability)?.label}
                      <button type="button" onClick={() => setSelectedAvailability('all')} aria-label="Remove availability filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedCondition !== 'All Conditions' && (
                    <span className={styles.activePill}>
                      Condition: {selectedCondition}
                      <button type="button" onClick={() => setSelectedCondition('All Conditions')} aria-label="Remove condition filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={styles.clearAllLink}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Conditional Platform Demonstration Notice (teal-and-white, compact) */}
            {isDemoData && (
              <div className={styles.subtleDemoNotice} role="note">
                <Info size={16} className={styles.subtleDemoIcon} aria-hidden="true" />
                <span>
                  <strong>Platform Notice:</strong> Demonstration equipment listings are currently displayed. Real community listings will appear once connected to the live database.
                </span>
              </div>
            )}

            {/* Equipment Grid or Empty State */}
            {!loadingCatalog && catalogItems.length === 0 && !isDemoData ? (
              <div className={styles.emptyStateCard} role="status">
                <div className={styles.emptyIconWrap}>
                  <PackageSearch size={40} className={styles.emptyIcon} aria-hidden="true" />
                </div>
                <h3 className={styles.emptyTitle}>No Equipment Listed Yet</h3>
                <p className={styles.emptyDesc}>
                  There are currently no medical equipment listings published in this network. Be the first partner to share equipment!
                </p>
                <div style={{ marginTop: '1.25rem' }}>
                  <Link to="/owner/add-equipment">
                    <Button variant="primary">Publish Equipment Listing</Button>
                  </Link>
                </div>
              </div>
            ) : filteredEquipment.length > 0 ? (
              <div className={styles.equipmentGrid}>
                {filteredEquipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              /* Clear Empty State */
              <div className={styles.emptyStateCard} role="status">
                <div className={styles.emptyIconWrap}>
                  <PackageSearch size={40} className={styles.emptyIcon} aria-hidden="true" />
                </div>
                <h3 className={styles.emptyTitle}>No matching equipment found</h3>
                <p className={styles.emptyDesc}>
                  We could not find any medical equipment matching your current search criteria:
                </p>
                <div className={styles.emptyCriteriaBox}>
                  {searchQuery && <div>• Keyword: "<strong>{searchQuery}</strong>"</div>}
                  {selectedCategory !== 'All Categories' && <div>• Category: "<strong>{selectedCategory}</strong>"</div>}
                  {selectedSharingType !== 'all' && <div>• Sharing Arrangement: "<strong>{selectedSharingType}</strong>"</div>}
                  {selectedAvailability !== 'all' && <div>• Availability: "<strong>{selectedAvailability}</strong>"</div>}
                  {selectedCondition !== 'All Conditions' && <div>• Condition: "<strong>{selectedCondition}</strong>"</div>}
                </div>
                <p className={styles.emptyHelp}>
                  Try broadening your keyword, choosing "All Categories", or resetting the filters below.
                </p>
                <Button
                  variant="primary"
                  onClick={handleResetFilters}
                  leftIcon={<RotateCcw size={16} />}
                >
                  Reset All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


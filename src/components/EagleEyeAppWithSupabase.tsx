'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar, List, Grid3X3, LayoutGrid, Plus, Search, Clock,
  AlertCircle, CheckCircle, Circle, Star, Zap, ChevronDown, X, Edit2,
  Trash2, BarChart3, Target, Menu, LogOut
} from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useSupabase } from '@/hooks/useSupabase'
import { useAuth } from '@/contexts/AuthContext'
import { MigrationPanel } from '@/components/MigrationPanel'
import type { Assignment, Class, ViewType, SmartFilter } from '@/types'

// Default classes as specified in PRD
const defaultClasses: Class[] = [
  { id: '1', name: 'English', color: '#3B82F6', is_archived: false },
  { id: '2', name: 'History', color: '#10B981', is_archived: false },
  { id: '3', name: 'Calculus', color: '#F59E0B', is_archived: false },
  { id: '4', name: 'TOK', color: '#8B5CF6', is_archived: false },
  { id: '5', name: 'Personal', color: '#6B7280', is_archived: false },
  { id: '6', name: 'Yearbook', color: '#EC4899', is_archived: false },
  { id: '7', name: 'Psychology', color: '#06B6D4', is_archived: false },
  { id: '8', name: 'Biology', color: '#84CC16', is_archived: false },
  { id: '9', name: 'Spanish', color: '#F97316', is_archived: false },
]

// Sample assignments
const defaultAssignments: Assignment[] = [
  {
    id: '1',
    title: 'ch 6 reading',
    class_id: '1',
    due_at: '2025-09-07T23:59:00',
    estimated_duration_min: 120,
    is_important: false,
    is_urgent: false,
    status: 'in_progress',
    notes: 'annotate then complete doc',
    progress_pct: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'HW 8',
    class_id: '3',
    due_at: '2025-09-22T23:59:00',
    estimated_duration_min: 60,
    is_important: false,
    is_urgent: false,
    status: 'in_progress',
    notes: 'Section 2.3 # 2-9, 12-30 even',
    progress_pct: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
]

export function EagleEyeAppWithSupabase() {
  const { user, signOut } = useAuth()
  const supabase = useSupabase()

  // Use localStorage as fallback when no user is authenticated
  const [localClasses, , localClassesLoaded] = useLocalStorage('eagleeye-classes', defaultClasses)
  const [localAssignments, setLocalAssignments, localAssignmentsLoaded] = useLocalStorage('eagleeye-assignments', defaultAssignments)

  // Cloud data
  const [cloudClasses, setCloudClasses] = useState<Class[]>([])
  const [cloudAssignments, setCloudAssignments] = useState<Assignment[]>([])
  const [cloudDataLoaded, setCloudDataLoaded] = useState(false)

  // App state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedSmartFilter, setSelectedSmartFilter] = useState<SmartFilter | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Use cloud data if user is authenticated, otherwise use localStorage
  const isUsingCloud = !!user
  const classes = isUsingCloud ? cloudClasses : localClasses
  const assignments = isUsingCloud ? cloudAssignments : localAssignments
  const dataLoaded = isUsingCloud ? cloudDataLoaded : (localClassesLoaded && localAssignmentsLoaded)

  const loadCloudData = useCallback(async () => {
    if (!user || !supabase) return

    try {
      setSyncError(null)
      const [classesData, assignmentsData] = await Promise.all([
        supabase.fetchClasses(),
        supabase.fetchAssignments()
      ])

      setCloudClasses(classesData)
      setCloudAssignments(assignmentsData)
      setCloudDataLoaded(true)
    } catch (error) {
      setSyncError('Failed to load data from cloud')
      console.error('Error loading cloud data:', error)
    }
  }, [user, supabase])

  // Load cloud data when user is authenticated
  useEffect(() => {
    if (user && supabase) {
      loadCloudData()
    }
  }, [user, supabase, loadCloudData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (user && supabase) {
      const unsubscribe = supabase.subscribeToChanges(() => {
        loadCloudData()
      })
      return unsubscribe || undefined
    }
  }, [user, supabase, loadCloudData])

  // Detect mobile/desktop and handle PWA install
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // PWA install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      ;(window as unknown as { deferredPrompt: Event }).deferredPrompt = e
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Status options
  const statusOptions = ['not_started', 'in_progress', 'almost_done', 'completed', 'overdue']

  // Check for overdue assignments
  useEffect(() => {
    if (!dataLoaded) return

    const checkOverdue = () => {
      const now = new Date()
      const updateAssignments = (assignments: Assignment[]) => assignments.map(assignment => {
        if (assignment.status !== 'completed' && new Date(assignment.due_at) < now) {
          return { ...assignment, status: 'overdue' as const }
        }
        return assignment
      })

      if (isUsingCloud && user && supabase) {
        // Update in cloud
        supabase.markOverdueAssignments().then(() => {
          loadCloudData()
        })
      } else {
        // Update locally
        setLocalAssignments(updateAssignments)
      }
    }

    checkOverdue()
    const interval = setInterval(checkOverdue, 60000)
    return () => clearInterval(interval)
  }, [dataLoaded, isUsingCloud, user, supabase, setLocalAssignments, loadCloudData])

  // Priority score calculation
  const calculatePriorityScore = (assignment: Assignment) => {
    const important = assignment.is_important ? 2 : 0
    const urgent = assignment.is_urgent ? 1 : 0
    const overdueBonus = assignment.status === 'overdue' ? 2 : 0
    return important + urgent + overdueBonus
  }

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    if (!dataLoaded) return []

    let filtered = assignments

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Class filter
    if (selectedClass) {
      filtered = filtered.filter(a => a.class_id === selectedClass)
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(a => a.status === selectedStatus)
    }

    // Smart filter
    if (selectedSmartFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      switch(selectedSmartFilter) {
        case 'today':
          filtered = filtered.filter(a => {
            const due = new Date(a.due_at)
            return due.toDateString() === today.toDateString()
          })
          break
        case 'overdue':
          filtered = filtered.filter(a => a.status === 'overdue')
          break
        case 'important':
          filtered = filtered.filter(a => a.is_important)
          break
        case 'urgent':
          filtered = filtered.filter(a => a.is_urgent)
          break
        case 'doNow':
          filtered = filtered.filter(a =>
            a.is_urgent && a.is_important &&
            new Date(a.due_at) <= tomorrow
          )
          break
        case 'quickWins':
          filtered = filtered.filter(a =>
            a.estimated_duration_min <= 30 && a.status !== 'completed'
          )
          break
      }
    }

    // Sort by priority score and due date
    filtered.sort((a, b) => {
      const scoreA = calculatePriorityScore(a)
      const scoreB = calculatePriorityScore(b)
      if (scoreB !== scoreA) return scoreB - scoreA
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    })

    return filtered
  }, [assignments, dataLoaded, searchQuery, selectedClass, selectedStatus, selectedSmartFilter])

  // Add/Edit assignment
  const handleSaveAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    if (isUsingCloud && user && supabase) {
      // Save to cloud
      try {
        setSyncError(null)
        if (editingAssignment) {
          await supabase.updateAssignment(editingAssignment.id, assignmentData)
        } else {
          await supabase.createAssignment(assignmentData)
        }
        await loadCloudData()
      } catch (error) {
        setSyncError('Failed to save assignment')
        console.error('Error saving assignment:', error)
      }
    } else {
      // Save locally
      if (editingAssignment) {
        setLocalAssignments(prev => prev.map(a =>
          a.id === editingAssignment.id
            ? { ...assignmentData, id: editingAssignment.id, created_at: a.created_at, updated_at: new Date().toISOString() }
            : a
        ))
      } else {
        const newAssignment: Assignment = {
          ...assignmentData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setLocalAssignments(prev => [...prev, newAssignment])
      }
    }
    setShowAddModal(false)
    setEditingAssignment(null)
  }, [isUsingCloud, user, supabase, editingAssignment, setLocalAssignments, loadCloudData])

  // Delete assignment
  const handleDeleteAssignment = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return

    if (isUsingCloud && user && supabase) {
      // Delete from cloud
      try {
        setSyncError(null)
        await supabase.deleteAssignment(id)
        await loadCloudData()
      } catch (error) {
        setSyncError('Failed to delete assignment')
        console.error('Error deleting assignment:', error)
      }
    } else {
      // Delete locally
      setLocalAssignments(prev => prev.filter(a => a.id !== id))
    }
  }, [isUsingCloud, user, supabase, setLocalAssignments, loadCloudData])

  // Update assignment status
  const updateAssignmentStatus = useCallback(async (id: string, newStatus: Assignment['status']) => {
    if (isUsingCloud && user && supabase) {
      // Update in cloud
      try {
        setSyncError(null)
        await supabase.updateAssignment(id, { status: newStatus, progress_pct: newStatus === 'completed' ? 100 : undefined })
        await loadCloudData()
      } catch (error) {
        setSyncError('Failed to update assignment')
        console.error('Error updating assignment:', error)
      }
    } else {
      // Update locally
      setLocalAssignments(prev => prev.map(a =>
        a.id === id ? {
          ...a,
          status: newStatus,
          progress_pct: newStatus === 'completed' ? 100 : a.progress_pct,
          updated_at: new Date().toISOString()
        } : a
      ))
    }
  }, [isUsingCloud, user, supabase, setLocalAssignments, loadCloudData])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === now.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get status color
  const getStatusColor = (status: Assignment['status']) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'almost_done': return 'bg-indigo-100 text-indigo-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state while data loads
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block animate-bounce">🦅</span>
          <p className="text-lg text-gray-600">Loading EagleEye...</p>
          {isUsingCloud && <p className="text-sm text-gray-500 mt-2">Syncing with cloud...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 touch-pan-y">
      {/* Sync Error Banner */}
      {syncError && (
        <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{syncError}</p>
            </div>
            <button
              onClick={() => setSyncError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 md:px-4 py-2.5 md:py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile Menu & Title */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg md:hidden touch-manipulation active:bg-gray-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦅</span>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                <span className="text-blue-600">EagleEye</span>
                <span className="hidden sm:inline text-gray-600 font-normal text-sm md:text-base ml-1">Assignment Tracker</span>
              </h1>
              {isUsingCloud && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Cloud Sync
                </span>
              )}
            </div>
          </div>

          {/* View Switcher - Desktop */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            {[
              { view: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
              { view: 'list' as ViewType, icon: List, label: 'List' },
              { view: 'kanban' as ViewType, icon: LayoutGrid, label: 'Kanban' },
              { view: 'calendar' as ViewType, icon: Calendar, label: 'Calendar' },
              { view: 'matrix' as ViewType, icon: Grid3X3, label: 'Matrix' },
            ].map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
                  currentView === view ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Mobile view switcher dropdown */}
          <div className="md:hidden relative">
            <select
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value as ViewType)}
              className="bg-gray-100 rounded-lg px-2 py-1 text-sm appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dashboard">Dashboard</option>
              <option value="list">List</option>
              <option value="kanban">Kanban</option>
              <option value="calendar">Calendar</option>
              <option value="matrix">Matrix</option>
            </select>
            <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 hover:bg-gray-100 rounded-lg md:hidden touch-manipulation active:bg-gray-200 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            {/* User Actions */}
            {user && (
              <button
                onClick={signOut}
                className="p-1.5 hover:bg-gray-100 rounded-lg touch-manipulation active:bg-gray-200 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Add Assignment Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center gap-1.5 md:gap-2 text-sm md:text-base touch-manipulation shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="mt-2 md:hidden">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              autoFocus
            />
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto flex gap-4 p-3 md:p-4">
        {/* Sidebar with Smart Lists */}
        <aside className="hidden md:block w-64 bg-white rounded-lg p-4 border border-gray-200 h-fit">
          {/* User Info */}
          {user && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {user.email}
              </p>
              <p className="text-xs text-blue-700">
                {isUsingCloud ? 'Cloud Sync Active' : 'Local Storage'}
              </p>
            </div>
          )}

          {/* Classes */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Classes</h2>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedClass(null)
                  setSelectedSmartFilter(null)
                }}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
                  !selectedClass && !selectedSmartFilter ? 'bg-gray-100' : ''
                }`}
              >
                All Classes
              </button>
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls.id)
                    setSelectedSmartFilter(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2 transition-colors ${
                    selectedClass === cls.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cls.color }}
                  />
                  {cls.name}
                  <span className="ml-auto text-sm text-gray-500">
                    {assignments.filter(a => a.class_id === cls.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters / Smart Lists */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Quick Filters</h2>
            <div className="space-y-1">
              {[
                { key: 'today' as SmartFilter, icon: Clock, label: 'Today', color: 'text-blue-500' },
                { key: 'overdue' as SmartFilter, icon: AlertCircle, label: 'Overdue', color: 'text-red-500' },
                { key: 'important' as SmartFilter, icon: Star, label: 'Important', color: 'text-yellow-500' },
                { key: 'urgent' as SmartFilter, icon: Zap, label: 'Urgent', color: 'text-orange-500' },
                { key: 'doNow' as SmartFilter, icon: Target, label: 'Do Now', color: 'text-purple-500' },
                { key: 'quickWins' as SmartFilter, icon: Zap, label: 'Quick Wins', color: 'text-green-500' },
              ].map(({ key, icon: Icon, label, color }) => {
                const count = key === 'today'
                  ? assignments.filter(a => {
                      const due = new Date(a.due_at)
                      const now = new Date()
                      return due.toDateString() === now.toDateString()
                    }).length
                  : key === 'overdue'
                  ? assignments.filter(a => a.status === 'overdue').length
                  : key === 'important'
                  ? assignments.filter(a => a.is_important).length
                  : key === 'urgent'
                  ? assignments.filter(a => a.is_urgent).length
                  : key === 'doNow'
                  ? assignments.filter(a => {
                      const now = new Date()
                      const tomorrow = new Date(now)
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      return a.is_urgent && a.is_important && new Date(a.due_at) <= tomorrow
                    }).length
                  : assignments.filter(a => a.estimated_duration_min <= 30 && a.status !== 'completed').length

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedSmartFilter(selectedSmartFilter === key ? null : key)
                      setSelectedClass(null)
                      setSelectedStatus(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between transition-colors ${
                      selectedSmartFilter === key ? 'bg-blue-100 hover:bg-blue-100' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {label}
                    </span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white rounded-lg p-3 md:p-6 max-w-full overflow-hidden">
          {/* Active Filter Indicator */}
          {(selectedClass || selectedStatus || selectedSmartFilter) && (
            <div className="mb-3 md:mb-4 flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span className="text-gray-500">Filtering by:</span>
              {selectedClass && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {classes.find(c => c.id === selectedClass)?.name}
                </span>
              )}
              {selectedStatus && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  {selectedStatus.replace('_', ' ')}
                </span>
              )}
              {selectedSmartFilter && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {selectedSmartFilter === 'doNow' ? 'Do Now' :
                   selectedSmartFilter === 'quickWins' ? 'Quick Wins' :
                   selectedSmartFilter.charAt(0).toUpperCase() + selectedSmartFilter.slice(1)}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedClass(null)
                  setSelectedStatus(null)
                  setSelectedSmartFilter(null)
                }}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 touch-manipulation"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Views */}
          {currentView === 'dashboard' && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🦅</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard View</h2>
              <p className="text-gray-600">Your assignment overview will appear here</p>
              <p className="text-sm text-gray-500 mt-2">
                {filteredAssignments.length} assignments found
              </p>
              {isUsingCloud && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Synced with cloud
                </p>
              )}
            </div>
          )}

          {currentView === 'list' && (
            <div className="space-y-2">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <span className="text-3xl mb-2 block">🦅</span>
                  <p className="text-base md:text-lg">Ready to soar?</p>
                  <p className="text-xs md:text-sm mt-2">Click the + button to add your first assignment</p>
                </div>
              ) : (
                filteredAssignments.map(assignment => {
                  const classData = classes.find(c => c.id === assignment.class_id)
                  return (
                    <div
                      key={assignment.id}
                      className={`bg-white border rounded-lg p-3 hover:shadow-md transition-all ${
                        assignment.status === 'overdue' ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 flex-1 text-sm md:text-base">{assignment.title}</h3>
                        <div className="flex gap-1">
                          {assignment.is_important && (
                            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
                          )}
                          {assignment.is_urgent && (
                            <Zap className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 md:gap-2 items-center text-xs md:text-sm">
                        {classData && (
                          <span
                            className="px-2 py-1 rounded-full text-white text-xs"
                            style={{ backgroundColor: classData.color }}
                          >
                            {classData.name}
                          </span>
                        )}

                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>

                        <span className={`text-xs ${
                          assignment.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-600'
                        }`}>
                          {formatDate(assignment.due_at)}
                        </span>

                        {assignment.estimated_duration_min && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {assignment.estimated_duration_min}m
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAssignment(assignment)
                            setShowAddModal(true)
                          }}
                          className="p-1.5 md:p-1 text-gray-400 hover:text-gray-600 touch-manipulation active:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateAssignmentStatus(assignment.id,
                            assignment.status === 'completed' ? 'not_started' : 'completed'
                          )}
                          className="p-1.5 md:p-1 text-gray-400 hover:text-green-600 touch-manipulation active:bg-gray-100 rounded transition-colors"
                        >
                          {assignment.status === 'completed' ?
                            <CheckCircle className="w-4 h-4" /> :
                            <Circle className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-1.5 md:p-1 text-gray-400 hover:text-red-600 touch-manipulation active:bg-gray-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {(currentView === 'kanban' || currentView === 'calendar' || currentView === 'matrix') && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🚧</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-600">The {currentView} view is under development</p>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-lg w-full md:max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingAssignment(null)
                }}
                className="p-1 hover:bg-gray-100 rounded-lg touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const assignmentData = {
                title: formData.get('title') as string,
                class_id: formData.get('class_id') as string,
                due_at: formData.get('due_at') as string,
                estimated_duration_min: parseInt(formData.get('estimated_duration_min') as string),
                is_important: formData.get('is_important') === 'on',
                is_urgent: formData.get('is_urgent') === 'on',
                status: (formData.get('status') as Assignment['status']) || 'not_started',
                notes: formData.get('notes') as string || '',
                progress_pct: 0,
              }
              handleSaveAssignment(assignmentData)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  defaultValue={editingAssignment?.title || ''}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Assignment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  name="class_id"
                  defaultValue={editingAssignment?.class_id || classes[0]?.id}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Due Date & Time</label>
                <input
                  name="due_at"
                  type="datetime-local"
                  defaultValue={editingAssignment?.due_at ? new Date(editingAssignment.due_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Duration (minutes)</label>
                <input
                  name="estimated_duration_min"
                  type="number"
                  min="5"
                  max="1440"
                  defaultValue={editingAssignment?.estimated_duration_min || 60}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingAssignment?.status || 'not_started'}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {statusOptions.filter(s => s !== 'overdue').map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center touch-manipulation">
                  <input
                    name="is_important"
                    type="checkbox"
                    defaultChecked={editingAssignment?.is_important || false}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm">Important</span>
                </label>
                <label className="flex items-center touch-manipulation">
                  <input
                    name="is_urgent"
                    type="checkbox"
                    defaultChecked={editingAssignment?.is_urgent || false}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm">Urgent</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingAssignment?.notes || ''}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingAssignment(null)
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 text-base touch-manipulation transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 text-base touch-manipulation transition-colors"
                >
                  {editingAssignment ? 'Save Changes' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Migration Panel */}
      <MigrationPanel />
    </div>
  )
}
'use client'

/* eslint-disable @typescript-eslint/no-extra-non-null-assertion */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Assignment, Class } from '@/types'

// Custom hook for Supabase operations
export function useSupabase() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Return null methods if Supabase is not configured
  if (!supabase) {
    return {
      loading: false,
      error: 'Supabase not configured',
      fetchClasses: async () => [],
      createClass: async () => null,
      updateClass: async () => false,
      deleteClass: async () => false,
      fetchAssignments: async () => [],
      createAssignment: async () => null,
      updateAssignment: async () => false,
      deleteAssignment: async () => false,
      markOverdueAssignments: async () => false,
      subscribeToChanges: () => null
    }
  }

  // Classes operations
  const fetchClasses = async (): Promise<Class[]> => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase!!
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        name: item.name,
        color: item.color,
        is_archived: item.is_archived
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createClass = async (classData: Omit<Class, 'id'>): Promise<Class | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase!
        .from('classes')
        .insert({
          name: classData.name,
          color: classData.color,
          is_archived: classData.is_archived,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        color: data.color,
        is_archived: data.is_archived
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateClass = async (id: string, updates: Partial<Omit<Class, 'id'>>): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from('classes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update class')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteClass = async (id: string): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Assignments operations
  const fetchAssignments = async (): Promise<Assignment[]> => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase!
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true })

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        title: item.title,
        class_id: item.class_id,
        due_at: item.due_at,
        estimated_duration_min: item.estimated_duration_min,
        is_important: item.is_important,
        is_urgent: item.is_urgent,
        status: item.status,
        notes: item.notes || '',
        progress_pct: item.progress_pct,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase!
        .from('assignments')
        .insert({
          title: assignmentData.title,
          class_id: assignmentData.class_id,
          due_at: assignmentData.due_at,
          estimated_duration_min: assignmentData.estimated_duration_min,
          is_important: assignmentData.is_important,
          is_urgent: assignmentData.is_urgent,
          status: assignmentData.status,
          notes: assignmentData.notes,
          progress_pct: assignmentData.progress_pct,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        class_id: data.class_id,
        due_at: data.due_at,
        estimated_duration_min: data.estimated_duration_min,
        is_important: data.is_important,
        is_urgent: data.is_urgent,
        status: data.status,
        notes: data.notes || '',
        progress_pct: data.progress_pct,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = async (id: string, updates: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteAssignment = async (id: string): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from('assignments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Bulk operations
  const markOverdueAssignments = async (): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const now = new Date().toISOString()
      const { error } = await supabase!
        .from('assignments')
        .update({ status: 'overdue' })
        .eq('user_id', user.id)
        .lt('due_at', now)
        .neq('status', 'completed')

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark overdue assignments')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscriptions
  const subscribeToChanges = (callback: () => void) => {
    if (!user) return null

    const assignmentsSubscription = supabase!
      .channel('assignments-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `user_id=eq.${user.id}`
        },
        callback
      )
      .subscribe()

    const classesSubscription = supabase!
      .channel('classes-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `user_id=eq.${user.id}`
        },
        callback
      )
      .subscribe()

    return () => {
      assignmentsSubscription.unsubscribe()
      classesSubscription.unsubscribe()
    }
  }

  return {
    loading,
    error,
    // Classes
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    // Assignments
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    // Utilities
    markOverdueAssignments,
    subscribeToChanges
  }
}
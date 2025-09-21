'use client'

import { supabase } from '@/lib/supabase'
import type { Assignment, Class } from '@/types'

interface MigrationResult {
  success: boolean
  message: string
  classesImported: number
  assignmentsImported: number
  errors: string[]
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    classesImported: 0,
    assignmentsImported: 0,
    errors: []
  }

  try {
    // Check if Supabase is configured and user is authenticated
    if (!supabase) {
      result.errors.push('Supabase not configured')
      result.message = 'Cloud storage not available'
      return result
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      result.errors.push('User not authenticated')
      result.message = 'Please sign in to migrate your data'
      return result
    }

    // Get localStorage data
    const localClasses = localStorage.getItem('eagleeye-classes')
    const localAssignments = localStorage.getItem('eagleeye-assignments')

    if (!localClasses && !localAssignments) {
      result.message = 'No local data found to migrate'
      result.success = true
      return result
    }

    let classes: Class[] = []
    let assignments: Assignment[] = []

    // Parse localStorage data
    try {
      if (localClasses) {
        classes = JSON.parse(localClasses)
      }
      if (localAssignments) {
        assignments = JSON.parse(localAssignments)
      }
    } catch {
      result.errors.push('Failed to parse local storage data')
      result.message = 'Local data appears to be corrupted'
      return result
    }

    // Check if cloud data already exists
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const { data: existingAssignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if ((existingClasses && existingClasses.length > 0) ||
        (existingAssignments && existingAssignments.length > 0)) {
      result.errors.push('Cloud data already exists')
      result.message = 'Migration skipped - you already have data in the cloud. To force migration, please clear your cloud data first.'
      return result
    }

    // Create a mapping from old class IDs to new class IDs
    const classIdMapping: Record<string, string> = {}

    // Migrate classes
    if (classes.length > 0) {
      for (const localClass of classes) {
        try {
          const { data: newClass, error: classError } = await supabase
            .from('classes')
            .insert({
              name: localClass.name,
              color: localClass.color,
              is_archived: localClass.is_archived,
              user_id: user.id
            })
            .select()
            .single()

          if (classError) throw classError

          classIdMapping[localClass.id] = newClass.id
          result.classesImported++
        } catch (error) {
          result.errors.push(`Failed to migrate class "${localClass.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Migrate assignments
    if (assignments.length > 0) {
      for (const localAssignment of assignments) {
        try {
          // Map the class_id to the new cloud class_id
          const newClassId = classIdMapping[localAssignment.class_id]
          if (!newClassId) {
            result.errors.push(`Skipped assignment "${localAssignment.title}" - class not found`)
            continue
          }

          const { error: assignmentError } = await supabase
            .from('assignments')
            .insert({
              title: localAssignment.title,
              class_id: newClassId,
              due_at: localAssignment.due_at,
              estimated_duration_min: localAssignment.estimated_duration_min,
              is_important: localAssignment.is_important,
              is_urgent: localAssignment.is_urgent,
              status: localAssignment.status,
              notes: localAssignment.notes,
              progress_pct: localAssignment.progress_pct,
              user_id: user.id
            })

          if (assignmentError) throw assignmentError

          result.assignmentsImported++
        } catch (error) {
          result.errors.push(`Failed to migrate assignment "${localAssignment.title}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Set success status
    if (result.classesImported > 0 || result.assignmentsImported > 0) {
      result.success = true
      result.message = `Successfully migrated ${result.classesImported} classes and ${result.assignmentsImported} assignments to the cloud`

      // Optionally clear localStorage after successful migration
      // Uncomment these lines if you want to auto-clear localStorage after migration
      // localStorage.removeItem('eagleeye-classes')
      // localStorage.removeItem('eagleeye-assignments')
    } else {
      result.message = 'No data was migrated'
    }

  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.message = 'Migration failed due to an unexpected error'
  }

  return result
}

export async function clearCloudData(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if Supabase is configured and user is authenticated
    if (!supabase) {
      return { success: false, message: 'Supabase not configured' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, message: 'User not authenticated' }
    }

    // Delete all assignments first (due to foreign key constraint)
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .delete()
      .eq('user_id', user.id)

    if (assignmentsError) throw assignmentsError

    // Delete all classes
    const { error: classesError } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', user.id)

    if (classesError) throw classesError

    return { success: true, message: 'Cloud data cleared successfully' }
  } catch (error) {
    return {
      success: false,
      message: `Failed to clear cloud data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function exportLocalStorageData(): Promise<{ success: boolean; data?: string; message: string }> {
  try {
    const localClasses = localStorage.getItem('eagleeye-classes')
    const localAssignments = localStorage.getItem('eagleeye-assignments')

    if (!localClasses && !localAssignments) {
      return { success: false, message: 'No local data found to export' }
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      classes: localClasses ? JSON.parse(localClasses) : [],
      assignments: localAssignments ? JSON.parse(localAssignments) : []
    }

    const dataString = JSON.stringify(exportData, null, 2)
    return {
      success: true,
      data: dataString,
      message: `Exported ${exportData.classes.length} classes and ${exportData.assignments.length} assignments`
    }
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export function downloadDataAsFile(data: string, filename: string = 'eagleeye-data-export.json') {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
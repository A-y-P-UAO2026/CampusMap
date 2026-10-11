export type ProfileRole = 'student' | 'staff' | 'admin'
export type EventStatus = 'draft' | 'published' | 'active' | 'cancelled' | 'finished'
export type RegistrationStatus = 'confirmed' | 'cancelled'
export type WaitlistStatus = 'waiting' | 'assigned' | 'cancelled'

export interface CampusLocation {
  id: string
  name: string
  slug: string
  description: string | null
  x: number
  y: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CampusPath {
  id: string
  from_location_id: string
  to_location_id: string
  weight: number
  is_bidirectional: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CampusEvent {
  id: string
  title: string
  description: string | null
  location_id: string
  created_by: string | null
  starts_at: string
  ends_at: string
  capacity: number
  registration_open: boolean
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: string
  full_name: string | null
  role: ProfileRole
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  student_id: string
  status: RegistrationStatus
  registered_at: string
  cancelled_at: string | null
}

export interface EventWaitlistEntry {
  id: string
  event_id: string
  student_id: string
  status: WaitlistStatus
  joined_at: string
  assigned_at: string | null
  cancelled_at: string | null
}

export interface ShortestPathResult<TNodeId = string> {
  path: TNodeId[]
  distance: number
  visited_nodes: TNodeId[]
  reachable: boolean
}

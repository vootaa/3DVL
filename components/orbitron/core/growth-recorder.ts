import type { GameGrowthEvent, EventType } from '../types'
import type { StorageEngine } from './storage-engine'

import { generateSessionId } from '../utils/generators'
import { Logger } from '../../utils/logger'

export class GrowthRecorder {
  private events: GameGrowthEvent[] = []
  private currentSessionId: string = generateSessionId()
  private readonly maxEvents = 1000 // Offline cache limit

  constructor(private storage: StorageEngine) {
    this.loadFromStorage()
  }

  /**
   * Record a game growth event
   */
  async recordEvent(
    nebulaId: string,
    deviceId: string,
    experiment: string,
    eventType: EventType,
    action: string,
    growthData: Record<string, any> = {}
  ): Promise<GameGrowthEvent> {
    const event: GameGrowthEvent = {
      nebula_id: nebulaId,
      device_id: deviceId,
      event_type: eventType,
      action,
      growth_data: growthData,
      timestamp: Date.now(),
      session_id: this.currentSessionId,
      experiment
    }

    this.events.push(event)
    
    // Maintain cache size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    await this.saveToStorage()
    
    Logger.log('GrowthRecorder', `Growth recorded: ${experiment}/${action} for ${nebulaId}`)
    
    return event
  }

  /**
   * Start a new session
   */
  startNewSession(): string {
    this.currentSessionId = generateSessionId()
    Logger.log('GrowthRecorder', `Started new session: ${this.currentSessionId}`)
    return this.currentSessionId
  }

  /**
   * Get events for a specific identity
   */
  getEventsForIdentity(nebulaId: string): GameGrowthEvent[] {
    return this.events.filter(event => event.nebula_id === nebulaId)
  }

  /**
   * Get events for a specific experiment
   * @future This method is reserved for future implementation.
   */
  getEventsForExperiment(experiment: string): GameGrowthEvent[] {
    return this.events.filter(event => event.experiment === experiment)
  }

  /**
   * Get recent events (last 24 hours)
   * @future This method is reserved for future implementation.
   */
  getRecentEvents(hours: number = 24): GameGrowthEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.events.filter(event => event.timestamp > cutoff)
  }

  /**
   * Get all cached events
   */
  getAllEvents(): GameGrowthEvent[] {
    return [...this.events]
  }

  /**
   * Clear events for a specific identity
   */
  async clearEventsForIdentity(nebulaId: string): Promise<void> {
    this.events = this.events.filter(event => event.nebula_id !== nebulaId)
    await this.saveToStorage()
    Logger.log('GrowthRecorder', `Cleared events for identity: ${nebulaId}`)
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId?: string): {
    session_id: string
    event_count: number
    experiments: string[]
    duration: number
    first_event: number
    last_event: number
  } {
    const targetSession = sessionId || this.currentSessionId
    const sessionEvents = this.events.filter(event => event.session_id === targetSession)
    
    if (sessionEvents.length === 0) {
      return {
        session_id: targetSession,
        event_count: 0,
        experiments: [],
        duration: 0,
        first_event: 0,
        last_event: 0
      }
    }

    const timestamps = sessionEvents.map(e => e.timestamp)
    const firstEvent = Math.min(...timestamps)
    const lastEvent = Math.max(...timestamps)
    const experiments = [...new Set(sessionEvents.map(e => e.experiment))]

    return {
      session_id: targetSession,
      event_count: sessionEvents.length,
      experiments,
      duration: lastEvent - firstEvent,
      first_event: firstEvent,
      last_event: lastEvent
    }
  }

  private async saveToStorage(): Promise<void> {
    await this.storage.set('orbitron_growth_events', {
      events: this.events,
      current_session: this.currentSessionId,
      version: '2.0.0'
    })
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await this.storage.get<any>('orbitron_growth_events')
      if (!data) return

      this.events = data.events || []
      this.currentSessionId = data.current_session || this.currentSessionId
    } catch (error) {
      Logger.warn('GrowthRecorder', 'Failed to load growth events from storage:', error)
      this.events = []
    }
  }
}

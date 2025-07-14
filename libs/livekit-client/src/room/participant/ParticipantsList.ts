import { ParticipantInfo, ParticipantInfo_State } from '@livekit/protocol';
import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import type RTCEngine from '../RTCEngine';
import { EngineEvent, RoomEvent } from '../events';
import RemoteParticipant from './RemoteParticipant';

export type ParticipantsListEventCallbacks = {
  [RoomEvent.ParticipantListChanged]: (participants: ParticipantInfo[]) => void;
};

export interface ParticipantListEntry {
  participant: RemoteParticipant | ParticipantInfo;
  state: ParticipantInfo_State;
}

export class ParticipantsList extends (EventEmitter as new () => TypedEmitter<ParticipantsListEventCallbacks>) {
  public ringingParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public deniedParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public busyParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public leftParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public activeParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public noAnswerParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public notReachableParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
  public all: Map<string, ParticipantListEntry>;

  private engine?: RTCEngine;

  constructor() {
    super();
    this.ringingParticipants = new Map();
    this.deniedParticipants = new Map();
    this.busyParticipants = new Map();
    this.leftParticipants = new Map();
    this.activeParticipants = new Map();
    this.noAnswerParticipants = new Map();
    this.notReachableParticipants = new Map();
    this.all = new Map();
  }

  /**
   * Setup the engine and listen to ParticipantListChanged events
   * @param engine The RTCEngine instance
   */
  setupEngine(engine: RTCEngine): void {
    if (this.engine) {
      this.engine.off(EngineEvent.ParticipantListChanged, this.handleParticipantListChanged);
    }

    this.engine = engine;
    this.engine.on(EngineEvent.ParticipantListChanged, this.handleParticipantListChanged);
  }

  /**
   * Clear all participant lists
   */
  clear(): void {
    this.ringingParticipants.clear();
    this.deniedParticipants.clear();
    this.busyParticipants.clear();
    this.leftParticipants.clear();
    this.activeParticipants.clear();
    this.noAnswerParticipants.clear();
    this.notReachableParticipants.clear();
    this.all.clear();
  }

  /**
   * Handle participant list changes from the server
   * @param updates Array of ParticipantInfo updates
   */
  private handleParticipantListChanged = (updates: ParticipantInfo[]): void => {
    this.clear();

    updates.forEach((update) => {
      // Add to unified all map
      this.all.set(update.identity, {
        participant: update,
        state: update.state,
      });

      // Add to specific state maps
      if (update.state === ParticipantInfo_State.RINGING) {
        this.ringingParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.DENIED) {
        this.deniedParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.BUSY) {
        this.busyParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.DISCONNECTED) {
        this.leftParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.ACTIVE) {
        this.activeParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.NO_ANSWER) {
        this.noAnswerParticipants.set(update.identity, update);
      } else if (update.state === ParticipantInfo_State.NOT_REACHABLE) {
        this.notReachableParticipants.set(update.identity, update);
      }
    });

    // Emit the event
    this.emit(RoomEvent.ParticipantListChanged, updates);
  };

  /**
   * Get all participants with a specific state
   * @param state The participant state to filter by
   * @returns Array of participants with the specified state
   */
  getParticipantsByState(state: ParticipantInfo_State): (RemoteParticipant | ParticipantInfo)[] {
    switch (state) {
      case ParticipantInfo_State.RINGING:
        return Array.from(this.ringingParticipants.values());
      case ParticipantInfo_State.DENIED:
        return Array.from(this.deniedParticipants.values());
      case ParticipantInfo_State.BUSY:
        return Array.from(this.busyParticipants.values());
      case ParticipantInfo_State.DISCONNECTED:
        return Array.from(this.leftParticipants.values());
      case ParticipantInfo_State.ACTIVE:
        return Array.from(this.activeParticipants.values());
      case ParticipantInfo_State.NO_ANSWER:
        return Array.from(this.noAnswerParticipants.values());
      case ParticipantInfo_State.NOT_REACHABLE:
        return Array.from(this.notReachableParticipants.values());
      default:
        return [];
    }
  }
}

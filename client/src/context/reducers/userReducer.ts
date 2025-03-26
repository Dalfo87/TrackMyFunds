// src/context/reducers/userReducer.ts
import { Action } from './index';
import { User } from '../actions';

// Definizione del tipo di stato per l'utente
export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Stato iniziale per l'utente
export const initialUserState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Tipi di azioni per l'utente
export enum USER_ACTIONS {
  LOGIN_REQUEST = 'user/loginRequest',
  LOGIN_SUCCESS = 'user/loginSuccess',
  LOGIN_FAILURE = 'user/loginFailure',
  LOGOUT = 'user/logout',
  UPDATE_PROFILE = 'user/updateProfile'
}

// Reducer per l'utente
export default function userReducer(state: UserState = initialUserState, action: Action): UserState {
  switch (action.type) {
    case USER_ACTIONS.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case USER_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case USER_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case USER_ACTIONS.LOGOUT:
      return {
        ...initialUserState
      };
    case USER_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        currentUser: state.currentUser ? {
          ...state.currentUser,
          ...action.payload
        } : null
      };
    default:
      return state;
  }
}
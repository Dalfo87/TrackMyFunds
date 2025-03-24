// src/context/reducers/userReducer.js
export const initialUserState = {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null
  };
  
  export const USER_ACTIONS = {
    LOGIN_REQUEST: 'user/loginRequest',
    LOGIN_SUCCESS: 'user/loginSuccess',
    LOGIN_FAILURE: 'user/loginFailure',
    LOGOUT: 'user/logout',
    UPDATE_PROFILE: 'user/updateProfile'
  };
  
  export default function userReducer(state = initialUserState, action) {
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
          currentUser: {
            ...state.currentUser,
            ...action.payload
          }
        };
      default:
        return state;
    }
  }
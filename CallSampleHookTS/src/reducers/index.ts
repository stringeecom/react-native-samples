import stringeeReducer from './StringeeReducers';
import {combineReducers} from 'redux';

export default combineReducers({
  stringee: stringeeReducer,
});

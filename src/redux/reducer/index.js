import { combineReducers } from "redux";
import  {signupReducer, loginReducer, userReducer}  from "./authentication";
import {errorReducer} from './errorReducer';

export const rootReducer = combineReducers({
    userReducer,
    signupReducer,
    loginReducer,
    errorReducer,
});


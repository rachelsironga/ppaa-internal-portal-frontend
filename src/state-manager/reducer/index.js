import { combineReducers } from "redux";
import  {signupReducer}  from "./authentication";
import {errorReducer} from './errorReducer';


export const rootReducer = combineReducers({
    signupReducer,
    errorReducer,
});

export  *  from "./authentication";
export * from './errorReducer';

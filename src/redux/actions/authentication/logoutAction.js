import { GET_ERRORS } from "../../types/error";
import axios from "axios";
import { logoutTypes, coreTypes } from "../../types/authentication";
import { API_BASE_URL } from "../../../Costants";
import api from "../../../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../../Costants";


export const logout = () =>  (dispatch) => {
  
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem("persist:root");
  
  dispatch({ type: logoutTypes.LOGOUT });
  dispatch({ type: coreTypes.RESET });
  dispatch({ type: coreTypes.RESET });
  dispatch({ type: coreTypes.RESET });

};

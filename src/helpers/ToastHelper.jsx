import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const showToast = function (message, toastType, title = '') {
  // Configure toast settings
  const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    newestOnTop: true,
    closeButton: true,
    progressBar: true,
    timeOut: 5000,
    extendedTimeOut: 1000,
    preventDuplicates: true,
    showEasing: 'swing',
    hideEasing: 'linear',
    showDuration: 300,
    hideDuration: 1000
  };

  // Add title if provided
  const content = title ? (
    <div>
      <strong>{title}</strong>
      <div>{message}</div>
    </div>
  ) : message;

  // Map the toast types to react-toastify functions
  if (toastType === "warning") toast.warning(content, toastOptions);
  else if (toastType === "error") toast.error(content, toastOptions);
  else if (toastType === "success") toast.success(content, toastOptions);
  else toast.info(content, toastOptions);
};

export default showToast;

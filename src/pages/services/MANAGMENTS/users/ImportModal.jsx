import React, { useContext, useEffect, useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { UsersContext } from "../../../../utils/context";
import { createUpdateData } from "../../../../utils/GlobalQueries";
import { Based64Helper } from "../../../../helpers/Based64Helper";

export const UserImportModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(UsersContext);

  const [errors, setOtherError] = useState({});
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const initialValues = {
    file: "",
    include_departments: true,
  };

  const validationSchema = Yup.object().shape({
    file: Yup.string().required("Excel File is required"),
  });

  const handleUpload = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    if (!fileInputRef.current || !fileInputRef.current.files[0]) {
      Swal.fire(
        "Error!",
        "No file selected. Please choose a file to upload.",
        "error"
      );
      return;
    }

    try {
      handleClose();
      setSubmitting(true);
      const confirmation = await Swal.fire({
        // title: "Save New Profile Photo",
        text: "Your About to Import Users. Do you want to proceed?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#696cff",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Confirm Save",
        customClass: {
          confirmButton: "btn btn-sm btn-outline-primary",
          cancelButton: "btn btn-sm",
          popup: "custom-swal-popup",
        },
      });

      if (confirmation.isConfirmed) {
        setIsLoading(true); //initiate loading for good user experiances

        const file = fileInputRef.current.files[0];

        // Convert file to Base64
        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });

        const base64File = await toBase64(file);
        values.file = base64File;

        const result = await createUpdateData({
          url: "/user/import-user-excel",
          formData: values,
          isFullPath: true,
        });

        if (result.status === 200 || result.status === 8000) {
          if (result.data.failures_csv) {
            const url = Based64Helper.download({
              based64: result.data.failures_csv,
              type: "text/csv",
            });
            setIsLoading(false);

            Swal.fire({
              title: "Import Completed!",
              text: `${result.message}`,
              icon: "success",
              confirmButtonText: "Download Failed Rows",
              showCancelButton: true,
              cancelButtonText: "Close",
              preConfirm: () => {
                // Trigger file download
                const link = document.createElement("a");
                link.href = url;
                link.download = "failed_rows.csv";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },
            });
          } else {
            setIsLoading(false);
            Swal.fire("Process Completed!", `${result.message}`, "success");
          }
          resetForm();
          setTableRefresh((prev) => prev + 1);
          setSubmitting(false);
        } else {
          setIsLoading(false);
          Swal.fire("Process Stoped", `Unable to Upload users`, "error");
        }
      }
    } catch (error) {
      if (isLoading) {
        setIsLoading(false);
      }
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Upload. Please Try Again or Contact Support Team`,
        "error"
      );
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("viewCreateUserImportModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  useEffect(() => {
    if (isLoading) {
      // Show loading modal
      Swal.fire({
        title: "Processing...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      // Close modal if it's open
      // Swal.close();
    }
  }, [isLoading]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="viewCreateUserImportModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleUpload}
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <div className="modal-dialog modal-md" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLabel3">
                    Import Users From Excel Files
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setFieldValue("file", null);
                      handleClose();
                    }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>

                <Form>
                  <div className="modal-body">
                    <div className="mb-3">
                      <h6 className="fw-bold mb-1">Excel Users Import</h6>
                      <p
                        className="text-muted mb-2"
                        style={{ fontSize: "0.98em" }}
                      >
                        Please upload List of Users form Excel file using the
                        provided template format. Download the template below if
                        you do not have it. If you already have a file, you may
                        proceed with the upload.
                      </p>
                      <a
                        href="/assets/templates/system_users.xlsx"
                        download
                        className="btn btn-sm btn-outline-primary mb-3"
                        style={{ fontSize: "0.95em" }}
                      >
                        <i className="bx bx-download"></i> Download Template
                      </a>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="nameLarge" className="text-bold">
                        Select Excel file to Import
                      </label>
                      <div className="input-group">
                        <input
                          type="file"
                          name="file"
                          className="form-control"
                          aria-describedby="inputGroupFileAddon05"
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            if (file) {
                              setFieldValue("file", file);
                            } else {
                              setFieldValue("file", null);
                            }
                          }}
                          ref={fileInputRef}
                          accept=".xlsx,.xls"
                          aria-label="Upload"
                        />
                        <button
                          className="btn btn-outline-danger"
                          type="button"
                          onClick={() => {
                            fileInputRef.current.value = null;
                            setFieldValue("file", null);
                          }}
                        >
                          <strong>X</strong>
                        </button>
                      </div>
                      <ErrorMessage
                        name="file"
                        component="div"
                        className="text-danger"
                      />
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setFieldValue("file", null);
                          handleClose();
                        }}
                        className="btn btn-outline-secondary"
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          )}
        </Formik>
      </div>
    </>
  );
};

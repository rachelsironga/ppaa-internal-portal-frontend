import React, { useContext, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { uploadDirectory } from "./Queries";
import { DirectoryContext } from "../../../../utils/context";

export const DirectoryImportModal = ({ loadOnlyModal = false }) => {
  const { fetchDirectories } = useContext(DirectoryContext);

  const [errors, setOtherError] = useState({});
  const fileInputRef = useRef(null);

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
        text: "Your About to Import Directory and Departments. Do you want to proceed?",
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

        const result = await uploadDirectory(values);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "Successfully Uploaded the .",
            "success"
          );
          resetForm();
          fetchDirectories();
          setSubmitting(false);
        } else {
          console.error("Error deleting Directory:", result);
          Swal.fire("Opps!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Upload. Please Try Again or Contact Support Team`,
        "error"
      );
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById(
      "viewCreateDirectoryImportModal"
    );
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <div
      className="modal modal-slide-in"
      id="viewCreateDirectoryImportModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel3">
              Import Directories And Department Excel
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleUpload}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form>
                <div className="modal-body">
                  {/* Header and Description */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">Excel Directory Import</h6>
                    <p
                      className="text-muted mb-2"
                      style={{ fontSize: "0.98em" }}
                    >
                      Please upload your directory and department Excel file
                      using the provided template format. Download the template
                      below if you do not have it. If you already have a file,
                      you may proceed with the upload.
                    </p>
                    <a
                      href="/assets/templates/directory_department_template.xlsx"
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
                      onClick={handleClose}
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
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

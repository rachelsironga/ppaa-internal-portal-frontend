import React, { useContext, useRef, useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { importClinics } from "./Queries";
import { ClinicContext } from "./ClinicListPage";

export const ClinicImportModal = () => {
    const { setTableRefresh } = useContext(ClinicContext);
    const fileInputRef = useRef(null);
    const [importResult, setImportResult] = useState(null);

    const initialValues = {
        file: "",
    };

    const validationSchema = Yup.object().shape({
        file: Yup.string().required("Excel File is required"),
    });

    const handleUpload = async (values, { setSubmitting, resetForm }) => {
        if (!fileInputRef.current || !fileInputRef.current.files[0]) {
            Swal.fire("Error!", "No file selected. Please choose a file to upload.", "error");
            return;
        }

        try {
            handleClose();
            setSubmitting(true);
            
            const confirmation = await Swal.fire({
                text: "You're about to import clinics from the Excel file. Do you want to proceed?",
                icon: "info",
                showCancelButton: true,
                confirmButtonColor: "#00853f",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Confirm Import",
            });

            if (confirmation.isConfirmed) {
                const file = fileInputRef.current.files[0];

                const toBase64 = (file) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                    });

                const base64File = await toBase64(file);
                values.file = base64File;

                const result = await importClinics(values);
                
                if (result.status === 200 || result.status === 8000) {
                    const { successfully_created, failed_count, failures_csv } = result.data;
                    
                    setImportResult({
                        success: successfully_created,
                        failed: failed_count,
                        failuresCsv: failures_csv
                    });

                    if (failed_count > 0) {
                        Swal.fire({
                            title: "Import Completed with Errors",
                            html: `<p>Successfully imported: <strong>${successfully_created}</strong></p>
                                   <p>Failed: <strong>${failed_count}</strong></p>
                                   <p>Download the error report for details.</p>`,
                            icon: "warning",
                            confirmButtonText: "OK"
                        });
                    } else {
                        Swal.fire(
                            "Import Completed!",
                            `Successfully imported ${successfully_created} clinics.`,
                            "success"
                        );
                    }
                    
                    resetForm();
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Import failed", "error");
                }
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to perform import. Please try again or contact support.",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadFailures = () => {
        if (importResult?.failuresCsv) {
            const byteCharacters = atob(importResult.failuresCsv);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "clinic_import_failures.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("clinicImportModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="clinicImportModal"
            tabIndex="-1"
            aria-labelledby="clinicImportModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-md">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="clinicImportModalLabel">
                            <i className="bx bx-import me-2"></i>
                            Import Clinics from Excel
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
                        {({ isSubmitting, setFieldValue }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-1">Excel Clinic Import</h6>
                                        <p className="text-muted mb-2" style={{ fontSize: "0.95em" }}>
                                            Upload an Excel file with clinic data. The file should have the following columns:
                                        </p>
                                        <ul className="text-muted small mb-3">
                                            <li><strong>name</strong> (required) - Clinic name</li>
                                            <li><strong>code</strong> (required) - Clinic code</li>
                                            <li><strong>block</strong> (optional) - Block name or code</li>
                                            <li><strong>department</strong> (optional) - Department name or code</li>
                                            <li><strong>description</strong> (optional) - Clinic description</li>
                                        </ul>
                                        <div className="alert alert-info py-2 small mb-3">
                                            <i className="bx bx-info-circle me-1"></i>
                                            <strong>Note:</strong> If a block or department doesn't exist, it will be automatically created.
                                        </div>
                                        <a
                                            href="/assets/templates/clinic_import_template.xlsx"
                                            download
                                            className="btn btn-sm btn-outline-primary mb-3"
                                        >
                                            <i className="bx bx-download me-1"></i> Download Template
                                        </a>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Select Excel file to Import
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="file"
                                                name="file"
                                                className="form-control"
                                                onChange={(event) => {
                                                    const file = event.currentTarget.files[0];
                                                    setFieldValue("file", file ? file.name : null);
                                                }}
                                                ref={fileInputRef}
                                                accept=".xlsx,.xls"
                                            />
                                            <button
                                                className="btn btn-outline-danger"
                                                type="button"
                                                onClick={() => {
                                                    fileInputRef.current.value = null;
                                                    setFieldValue("file", null);
                                                }}
                                            >
                                                <i className="bx bx-x"></i>
                                            </button>
                                        </div>
                                        <ErrorMessage
                                            name="file"
                                            component="div"
                                            className="text-danger small mt-1"
                                        />
                                    </div>

                                    {importResult?.failed > 0 && (
                                        <div className="alert alert-warning d-flex align-items-center">
                                            <i className="bx bx-error-circle me-2 fs-5"></i>
                                            <div>
                                                <strong>{importResult.failed}</strong> records failed to import.
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-warning ms-2"
                                                    onClick={handleDownloadFailures}
                                                >
                                                    <i className="bx bx-download me-1"></i> Download Error Report
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-upload me-1"></i> Import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    );
};

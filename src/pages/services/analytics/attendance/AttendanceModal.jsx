import React, { useState, useContext, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { uploadAttendance } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { AttendanceContext } from "./AttendanceListPage";

export const AttendanceModal = () => {
    const { selectedObj, setSelectedObj, setTableRefresh } = useContext(AttendanceContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const initialValues = {
        date: formatDateForInput(selectedObj?.date) || "",
        notes: selectedObj?.notes || "",
        process_now: true,
    };

    const validationSchema = Yup.object().shape({
        date: Yup.date().required("Date is required"),
        notes: Yup.string().nullable(),
    });

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const validateFile = (file) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            '.xlsx',
            '.xls'
        ];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!['xlsx', 'xls'].includes(extension)) {
            showToast("Please upload an Excel file (.xlsx or .xls)", "error", "Invalid File");
            return false;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showToast("File size must be less than 10MB", "error", "File Too Large");
            return false;
        }
        
        return true;
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            if (!selectedFile && !selectedObj?.uid) {
                showToast("Please upload an attendance report file", "error", "File Required");
                setSubmitting(false);
                return;
            }

            setIsSubmitting(true);
            
            const formData = new FormData();
            formData.append('date', values.date);
            formData.append('notes', values.notes || '');
            formData.append('process_now', values.process_now ? 'true' : 'false');
            
            if (selectedFile) {
                formData.append('attendance_report', selectedFile);
            }

            const result = await uploadAttendance(formData);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    result.message || "Attendance uploaded successfully",
                    "success",
                    "Complete"
                );
                handleClose();
                resetForm();
                setSelectedFile(null);
                setTableRefresh((prev) => prev + 1);
            } else if (result.status === 8002) {
                showToast(`${result.message}`, "warning", "Validation Failed");
                setErrors(result.data);
            } else {
                showToast(`${result.message}`, "warning", "Process Failed");
            }
        } catch (error) {
            console.error("Attendance submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        setSelectedFile(null);
        const modalElement = document.getElementById("attendanceModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="attendanceModal"
            tabIndex="-1"
            aria-labelledby="attendanceModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title" id="attendanceModalLabel">
                            <i className="bx bx-upload me-2"></i>
                            Upload Attendance Report
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => {
                                setSelectedObj(null);
                                setSelectedFile(null);
                            }}
                        ></button>
                    </div>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ isSubmitting: formikSubmitting, values, setFieldValue }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="date" className="form-label">
                                                <i className="bx bx-calendar me-1"></i>
                                                Attendance Date <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="date"
                                                className="form-control"
                                            />
                                            <ErrorMessage
                                                name="date"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bx bx-cog me-1"></i>
                                                Processing Option
                                            </label>
                                            <div className="form-check mt-2">
                                                <Field
                                                    type="checkbox"
                                                    name="process_now"
                                                    className="form-check-input"
                                                    id="process_now"
                                                />
                                                <label className="form-check-label" htmlFor="process_now">
                                                    <strong>Process Immediately</strong>
                                                    <small className="d-block text-muted">
                                                        {values.process_now 
                                                            ? "Report will be processed right away" 
                                                            : "Report will be saved for later processing"}
                                                    </small>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label className="form-label">
                                                <i className="bx bx-file me-1"></i>
                                                Attendance Report <span className="text-danger">*</span>
                                            </label>
                                            <div
                                                className={`border rounded p-4 text-center ${
                                                    dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-dashed'
                                                }`}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                                style={{ 
                                                    borderStyle: 'dashed', 
                                                    cursor: 'pointer',
                                                    minHeight: '150px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept=".xlsx,.xls"
                                                    style={{ display: 'none' }}
                                                />
                                                
                                                {selectedFile ? (
                                                    <div className="text-success">
                                                        <i className="bx bx-check-circle fs-1 mb-2"></i>
                                                        <p className="mb-1 fw-bold">{selectedFile.name}</p>
                                                        <small className="text-muted">
                                                            {(selectedFile.size / 1024).toFixed(2)} KB
                                                        </small>
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeFile();
                                                                }}
                                                            >
                                                                <i className="bx bx-trash me-1"></i> Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted">
                                                        <i className="bx bx-cloud-upload fs-1 mb-2"></i>
                                                        <p className="mb-1">
                                                            <strong>Drag & drop</strong> your Excel file here
                                                        </p>
                                                        <p className="small mb-0">
                                                            or <span className="text-primary">click to browse</span>
                                                        </p>
                                                        <small className="text-muted">
                                                            Supported: .xlsx, .xls (Max 10MB)
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label htmlFor="notes" className="form-label">
                                                <i className="bx bx-note me-1"></i>
                                                Notes (Optional)
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="notes"
                                                className="form-control"
                                                rows="2"
                                                placeholder="Add any notes about this attendance record..."
                                            />
                                            <ErrorMessage
                                                name="notes"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <div className={`alert ${values.process_now ? 'alert-info' : 'alert-warning'} mb-0`}>
                                                <div className="d-flex align-items-center">
                                                    <i className={`bx ${values.process_now ? 'bx-info-circle' : 'bx-time'} fs-4 me-2`}></i>
                                                    <div>
                                                        <strong>
                                                            {values.process_now 
                                                                ? "Immediate Processing" 
                                                                : "Delayed Processing"}
                                                        </strong>
                                                        <p className="mb-0 small">
                                                            {values.process_now 
                                                                ? "The Excel file will be parsed and patient attendance records will be created immediately upon upload."
                                                                : "The file will be saved but not processed. You can process it later from the attendance list."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                        onClick={() => {
                                            setSelectedObj(null);
                                            setSelectedFile(null);
                                        }}
                                    >
                                        <i className="bx bx-x me-1"></i> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={formikSubmitting || isSubmitting || !selectedFile}
                                    >
                                        {formikSubmitting || isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                {values.process_now ? "Processing..." : "Uploading..."}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-upload me-1"></i> 
                                                {values.process_now ? "Upload & Process" : "Upload Only"}
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

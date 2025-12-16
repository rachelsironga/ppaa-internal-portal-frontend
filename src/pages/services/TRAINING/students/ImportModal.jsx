import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import { importStudents } from "./Queries";

export const ImportStudentModal = ({ onSuccess }) => {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv"))) {
            setFile(selectedFile);
        } else {
            Swal.fire("Invalid File", "Please select a CSV file", "warning");
        }
    };

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
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
            setFile(droppedFile);
        } else {
            Swal.fire("Invalid File", "Please drop a CSV file", "warning");
        }
    };

    const handleImport = async () => {
        if (!file) {
            Swal.fire("No File", "Please select a CSV file to import", "warning");
            return;
        }

        const confirmation = await Swal.fire({
            title: "Import Students?",
            html: `<p>You are about to import <strong>${file.name}</strong></p><p class="text-muted">This will create or update student records in the system.</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, import!",
        });

        if (confirmation.isConfirmed) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);

                const result = await importStudents(formData);

                Swal.fire(
                    "Success!",
                    `${result.message || "Students imported successfully"}`,
                    "success"
                );

                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Close modal
                const modalElement = document.getElementById("importStudentModal");
                if (modalElement) {
                    const modal = new (window.bootstrap || {}).Modal(modalElement);
                    modal.hide();
                }

                if (onSuccess) onSuccess();
            } catch (error) {
                console.error("Error importing students:", error);
                const errorMessage = error.response?.data?.message || "Failed to import students";
                Swal.fire("Error", errorMessage, "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const downloadTemplate = () => {
        const csvContent = `first_name,middle_name,last_name,email,primary_phone,secondary_phone,sex,student_id,id_type,nationality,are_you_currently_studying
John,M,Doe,john@example.com,+255712345678,+255712345679,M,STU-2024-001,N,Tanzania,true
Jane,,Smith,jane@example.com,+255712345680,,F,STU-2024-002,P,Kenya,false`;

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_template.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="modal fade"
            id="importStudentModal"
            tabIndex="-1"
            aria-labelledby="importStudentModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="importStudentModalLabel">
                            <i className="bx bx-upload me-2"></i>Import Students
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body">
                        <div className="alert alert-info mb-4">
                            <i className="bx bx-info-circle me-2"></i>
                            <strong>CSV Format Required:</strong> Please use the provided template. The file must include
                            columns for first_name, last_name, email, and other required fields.
                        </div>

                        {/* File Drop Zone */}
                        <div
                            className={`border-2 border-dashed p-5 text-center rounded cursor-pointer transition ${dragActive ? "bg-light border-primary" : "bg-light border-secondary"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: "pointer", borderWidth: "2px" }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                style={{ display: "none" }}
                            />

                            <div>
                                <i className="bx bx-upload bx-lg text-primary mb-2" style={{ fontSize: "3rem" }}></i>
                                <h6 className="fw-bold">Drag & Drop CSV File Here</h6>
                                <p className="text-muted mb-0">or click to select a file</p>
                            </div>
                        </div>

                        {/* Selected File Info */}
                        {file && (
                            <div className="mt-3">
                                <div className="alert alert-success">
                                    <i className="bx bx-check-circle me-2"></i>
                                    <strong>Selected:</strong> {file.name}
                                    <small className="d-block text-muted">
                                        Size: {(file.size / 1024).toFixed(2)} KB
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* Template Download */}
                        <div className="mt-4">
                            <h6 className="mb-3">Need a template?</h6>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={downloadTemplate}
                            >
                                <i className="bx bx-download me-2"></i>Download CSV Template
                            </button>
                        </div>

                        {/* Required Fields Info */}
                        <div className="mt-4">
                            <h6 className="mb-2">Required Fields:</h6>
                            <ul className="small">
                                <li><strong>first_name</strong> - Student first name</li>
                                <li><strong>last_name</strong> - Student last name</li>
                                <li><strong>email</strong> - Valid email address</li>
                                <li><strong>primary_phone</strong> - Phone number</li>
                                <li><strong>sex</strong> - M or F</li>
                                <li><strong>student_id</strong> - Unique student identifier</li>
                            </ul>
                            <h6 className="mb-2 mt-3">Optional Fields:</h6>
                            <ul className="small">
                                <li><strong>middle_name</strong> - Student middle name</li>
                                <li><strong>secondary_phone</strong> - Alternative phone</li>
                                <li><strong>id_type</strong> - P, N, V, or O</li>
                                <li><strong>nationality</strong> - Country of origin</li>
                                <li><strong>are_you_currently_studying</strong> - true/false</li>
                            </ul>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={!file || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-upload me-2"></i>Import Students
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

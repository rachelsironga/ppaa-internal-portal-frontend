import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { searchPatientByIdentifier, importPatientReferral } from "./Queries";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";

const IDENTIFIER_TYPES = [
    { value: "MRN", label: "MRN (Medical Record Number)" },
    { value: "NIDA", label: "NIDA (National ID)" },
    { value: "HCRCODE", label: "HCR Code" },
    { value: "INS001", label: "Insurance Number (NHIF)" },
];

const validationSchema = Yup.object().shape({
    identifier_type: Yup.string().required("Please select identifier type"),
    identifier_value: Yup.string()
        .required("Identifier value is required")
        .min(3, "Identifier must be at least 3 characters"),
});

const ReferralModal = ({ referral = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [importing, setImporting] = useState(false);

    const initialValues = {
        identifier_type: "MRN",
        identifier_value: "",
    };

    const handleSearch = async (values, { setSubmitting }) => {
        setLoading(true);
        setSearchResults(null);

        try {
            const result = await searchPatientByIdentifier(
                values.identifier_type,
                values.identifier_value
            );

            if (result.status === 200 || result.status === 8000 || result.results) {
                const results = result.results || result.data?.results || [];
                if (results.length > 0) {
                    setSearchResults(results);
                    showToast(`Found ${results.length} patient(s)`, "success", "Search Complete");
                } else {
                    showToast("No patients found with this identifier", "warning", "Not Found");
                }
            } else {
                showToast(result.message || "Search failed", "error", "Error");
            }
        } catch (error) {
            console.error("Search error:", error);
            showToast("Unable to search. Please try again.", "error", "Error");
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleImportPatient = async (patientData) => {
        setImporting(true);
        try {
            const result = await importPatientReferral(patientData);

            if (result.status === 200 || result.status === 8000) {
                showToast("Patient referral imported successfully", "success", "Imported");
                handleClose();
                if (onSuccess) onSuccess();
            } else {
                showToast(result.message || "Import failed", "error", "Error");
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast("Unable to import patient. Please try again.", "error", "Error");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setSearchResults(null);
        const modalElement = document.getElementById("referralModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    const getGenderBadge = (gender) => {
        if (!gender) return <span className="badge bg-secondary">-</span>;
        const genderLower = gender.toLowerCase();
        if (genderLower === "male") return <span className="badge bg-primary">Male</span>;
        if (genderLower === "female") return <span className="badge bg-danger">Female</span>;
        return <span className="badge bg-secondary">{gender}</span>;
    };

    const renderPatientCard = (patient, index) => {
        const demo = patient.demographicDetails || {};
        const visit = patient.visitDetails || {};
        const diagnoses = patient.diagnosisDetails || [];
        const payment = patient.visitMainPaymentDetails || {};
        const identifiers = demo.identifiers || [];
        const addresses = demo.addresses || [];

        return (
            <div key={index} className="card mb-3 border shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0 fw-bold">
                            <i className="bx bx-user me-2"></i>
                            {demo.firstName || ""} {demo.middleName || ""} {demo.lastName || ""}
                        </h6>
                        <small className="text-muted">ID: {demo.id || patient.mrn || "-"}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {getGenderBadge(demo.gender)}
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleImportPatient(patient)}
                            disabled={importing}
                        >
                            {importing ? (
                                <><i className="bx bx-loader-alt bx-spin me-1"></i>Importing...</>
                            ) : (
                                <><i className="bx bx-import me-1"></i>Import Referral</>
                            )}
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="row">
                        {/* Demographics */}
                        <div className="col-md-4">
                            <h6 className="text-muted mb-2"><i className="bx bx-id-card me-1"></i>Demographics</h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium" style={{ width: "40%" }}>DOB:</td>
                                        <td>{demo.dateOfBirth ? formatDate(demo.dateOfBirth, "DD/MM/YYYY") : "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium">Marital Status:</td>
                                        <td className="text-capitalize">{demo.maritalStatus || "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium">Phone:</td>
                                        <td>{demo.phoneNumbers?.length > 0 ? demo.phoneNumbers[0] : "-"}</td>
                                    </tr>
                                    {addresses.length > 0 && (
                                        <tr>
                                            <td className="fw-medium">Address:</td>
                                            <td>
                                                {addresses[0].village}, {addresses[0].district}, {addresses[0].region}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Identifiers */}
                        <div className="col-md-4">
                            <h6 className="text-muted mb-2"><i className="bx bx-barcode me-1"></i>Identifiers</h6>
                            <div className="d-flex flex-wrap gap-1">
                                {identifiers.slice(0, 4).map((id, idx) => (
                                    <span key={idx} className="badge bg-label-secondary">
                                        {id.type}: {id.id?.substring(0, 15)}{id.id?.length > 15 ? "..." : ""}
                                    </span>
                                ))}
                                {identifiers.length > 4 && (
                                    <span className="badge bg-label-info">+{identifiers.length - 4} more</span>
                                )}
                            </div>
                        </div>

                        {/* Visit & Diagnosis */}
                        <div className="col-md-4">
                            <h6 className="text-muted mb-2"><i className="bx bx-clinic me-1"></i>Visit Info</h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium" style={{ width: "40%" }}>Visit Date:</td>
                                        <td>{visit.visitDate ? formatDate(visit.visitDate, "DD/MM/YYYY") : "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium">Insurance:</td>
                                        <td>
                                            {payment.shortName ? (
                                                <span className="badge bg-label-info">{payment.shortName}</span>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                    {diagnoses.length > 0 && (
                                        <tr>
                                            <td className="fw-medium">Diagnosis:</td>
                                            <td>
                                                <span className="badge bg-label-warning">{diagnoses[0].diagnosisCode}</span>
                                                <small className="d-block">{diagnoses[0].diagnosis}</small>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="modal modal-slide-in"
            id="referralModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-xl" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-search-alt me-2"></i>
                            Search Patient Referral
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body">
                        {/* Search Form */}
                        <div className="card bg-light mb-4">
                            <div className="card-body">
                                <Formik
                                    initialValues={initialValues}
                                    validationSchema={validationSchema}
                                    onSubmit={handleSearch}
                                >
                                    {({ isSubmitting }) => (
                                        <Form>
                                            <div className="row align-items-end">
                                                <div className="col-md-4 mb-3">
                                                    <label htmlFor="identifier_type" className="form-label">
                                                        <i className="bx bx-category me-1"></i>Identifier Type *
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="identifier_type"
                                                        className="form-select"
                                                    >
                                                        {IDENTIFIER_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="identifier_type" component="div" className="text-danger small" />
                                                </div>

                                                <div className="col-md-5 mb-3">
                                                    <label htmlFor="identifier_value" className="form-label">
                                                        <i className="bx bx-hash me-1"></i>Identifier Value *
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="identifier_value"
                                                        className="form-control"
                                                        placeholder="Enter identifier value (e.g., HCR-F-01022-15021988)"
                                                    />
                                                    <ErrorMessage name="identifier_value" component="div" className="text-danger small" />
                                                </div>

                                                <div className="col-md-3 mb-3">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary w-100"
                                                        disabled={isSubmitting || loading}
                                                    >
                                                        {loading ? (
                                                            <><i className="bx bx-loader-alt bx-spin me-1"></i>Searching...</>
                                                        ) : (
                                                            <><i className="bx bx-search me-1"></i>Search Patient</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-5">
                                <ReactLoading type="cylon" color="#696cff" height={50} width={50} className="mx-auto" />
                                <p className="text-muted mt-3">Searching for patient...</p>
                            </div>
                        )}

                        {/* Search Results */}
                        {!loading && searchResults && (
                            <div className="animate__animated animate__fadeIn">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0">
                                        <i className="bx bx-list-ul me-1"></i>
                                        Search Results ({searchResults.length})
                                    </h6>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setSearchResults(null)}
                                    >
                                        <i className="bx bx-x me-1"></i>Clear Results
                                    </button>
                                </div>

                                {searchResults.map((patient, index) => renderPatientCard(patient, index))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !searchResults && (
                            <div className="text-center py-5">
                                <i className="bx bx-search-alt text-muted" style={{ fontSize: "4rem" }}></i>
                                <h6 className="text-muted mt-3">Search for a Patient</h6>
                                <p className="text-muted small">
                                    Enter an identifier (MRN, NIDA, HCR Code, or Insurance Number) to search for patient referrals from Wizara.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleClose}
                            data-bs-dismiss="modal"
                        >
                            <i className="bx bx-x me-1"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { ReferralModal };
export default ReferralModal;

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { formatDate } from "../../../../helpers/DateFormater";
import { getReferrals, searchPatientByIdentifier } from "./Queries";
import ReactLoading from "react-loading";

const IDENTIFIER_TYPES = [
    { value: "MRN", label: "MRN", description: "Medical Record Number" },
    { value: "NIDA", label: "NIDA", description: "National ID" },
    { value: "HCRCODE", label: "HCR", description: "Health Care Registry Code" },
    { value: "INS001", label: "NHIF", description: "Insurance Number" },
];

const validationSchema = Yup.object().shape({
    identifier_type: Yup.string().required("Required"),
    identifier_value: Yup.string()
        .required("Enter identifier value")
        .min(3, "Min 3 characters"),
});

export const ReferralsListPage = () => {
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [searchInfo, setSearchInfo] = useState(null);
    const navigate = useNavigate();

    const initialValues = {
        identifier_type: "MRN",
        identifier_value: "",
    };

    const handleSearch = async (values, { setSubmitting }) => {
        setLoading(true);
        setSearchResults(null);
        setSearchInfo({ type: values.identifier_type, value: values.identifier_value });

        try {
            const result = await getReferrals();

            if (result.status === 200 || result.status === 8000) {
                const data = result.data || result;
                const results = data.results || [];
                if (results.length > 0) {
                    setSearchResults(results);
                    showToast(`Found ${results.length} patient(s)`, "success", "Search Complete");
                } else {
                    setSearchResults([]);
                    showToast("No patients found", "warning", "Not Found");
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

    const handleViewDetails = (patient) => {
        sessionStorage.setItem("referralPatientData", JSON.stringify(patient));
        const patientId = patient.demographicDetails?.id || patient.mrn || "unknown";
        navigate(`/external-referral/referrals/${encodeURIComponent(patientId)}`);
    };

    const getGenderGradient = (gender, age) => {
        const ageNum = parseInt(age) || 0;
        if (!gender) return "linear-gradient(135deg, #6b7280, #9ca3af)";

        if (gender.toLowerCase() === "male") {
            if (ageNum < 18) return "linear-gradient(135deg, #3b82f6, #06b6d4)"; // Young male - blue to cyan
            if (ageNum < 40) return "linear-gradient(135deg, #1976d2, #1565c0)"; // Adult male - blue
            return "linear-gradient(135deg, #1e3a5f, #374151)"; // Senior male - dark blue
        } else {
            if (ageNum < 18) return "linear-gradient(135deg, #ec4899, #f472b6)"; // Young female - pink
            if (ageNum < 40) return "linear-gradient(135deg, #e91e63, #ad1457)"; // Adult female - magenta
            return "linear-gradient(135deg, #9c27b0, #7b1fa2)"; // Senior female - purple
        }
    };

    const getGenderIcon = (gender) => {
        if (!gender) return "bx-user";
        return gender.toLowerCase() === "male" ? "bx-male" : "bx-female";
    };

    const getFacilityInfo = (patient) => {
        const facility = patient.facilityDetails || {};
        return {
            code: facility.code || "1234567",
            name: facility.name || "MUHIMBILI NATIONAL HOSPITAL",
        };
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return "-";
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const renderPatientCard = (patient, index) => {
        const demo = patient.demographicDetails || {};
        const visit = patient.visitDetails || {};
        const diagnoses = patient.diagnosisDetails || [];
        const payment = patient.visitMainPaymentDetails || {};
        const addresses = demo.addresses || [];
        const facility = getFacilityInfo(patient);
        const age = calculateAge(demo.dateOfBirth);

        return (
            <div
                key={index}
                className="bg-white border rounded-3 mb-3 overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
                {/* Facility & Visit Header - Gradient */}
                <div
                    className="px-3 py-2 d-flex justify-content-between align-items-center"
                    style={{
                        background: "linear-gradient(135deg, rgb(25, 118, 210), rgb(229, 57, 53))",
                        borderBottom: "none"
                    }}
                >
                    <div className="d-flex align-items-center">
                        <div
                            className="rounded d-flex align-items-center justify-content-center me-2"
                            style={{ width: "36px", height: "36px", backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                            <i className="bx bx-plus-medical text-white fs-5"></i>
                        </div>
                        <div>
                            <div className="text-white fw-bold" style={{ fontSize: "14px" }}>
                                {facility.name}
                            </div>
                            <div className="text-white" style={{ fontSize: "11px", opacity: 0.8 }}>
                                <i className="bx bx-hash me-1"></i>Facility Code: {facility.code}
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        <div className="text-end">
                            <div className="text-uppercase" style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>
                                Visit Date
                            </div>
                            <div className="text-white fw-bold" style={{ fontSize: "15px" }}>
                                <i className="bx bx-calendar me-1"></i>
                                {visit.visitDate ? formatDate(visit.visitDate, "DD MMM YYYY") : "-"}
                            </div>
                        </div>
                        {visit.id && (
                            <div className="text-end ps-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.3)" }}>
                                <div className="text-uppercase" style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>
                                    Visit ID
                                </div>
                                <div className="text-white" style={{ fontSize: "12px", fontFamily: "monospace" }}>
                                    {visit.id}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Information */}
                <div className="p-3">
                    <div className="row align-items-center g-3">
                        {/* Patient Identity with Icon Avatar */}
                        <div className="col-lg-4 col-md-6">
                            <div className="d-flex align-items-center">
                                {/* Avatar with gradient border */}
                                <div
                                    className="me-3 flex-shrink-0 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "58px",
                                        height: "58px",
                                        borderRadius: "50%",
                                        background: getGenderGradient(demo.gender, age),
                                        padding: "3px"
                                    }}
                                >
                                    <div
                                        className="w-100 h-100 rounded-circle bg-white d-flex align-items-center justify-content-center"
                                    >
                                        <i
                                            className={`bx ${getGenderIcon(demo.gender)}`}
                                            style={{
                                                fontSize: "28px",
                                                background: getGenderGradient(demo.gender, age),
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent"
                                            }}
                                        ></i>
                                    </div>
                                </div>
                                <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: "16px" }}>
                                        {demo.firstName} {demo.middleName} {demo.lastName}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "12px" }}>
                                        <span className="badge" style={{ background: getGenderGradient(demo.gender, age), color: "white" }}>
                                            {age} yrs
                                        </span>
                                        <span className="text-muted">
                                            <i className={`bx ${getGenderIcon(demo.gender)} me-1`}></i>
                                            {demo.gender || "-"}
                                        </span>
                                        <span className="text-muted">
                                            <i className="bx bx-phone me-1"></i>
                                            {demo.phoneNumbers?.[0] || "No phone"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b" }}>
                                        <i className="bx bx-id-card me-1"></i>
                                        {demo.id || patient.mrn || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="col-lg-2 col-md-3">
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: "9px", letterSpacing: "0.5px" }}>
                                <i className="bx bx-map me-1"></i>Address
                            </div>
                            <div style={{ fontSize: "13px" }} className="fw-medium text-dark">
                                {addresses[0]?.district || "-"}
                            </div>
                            <div className="text-muted" style={{ fontSize: "12px" }}>
                                {addresses[0]?.region || "-"}
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="col-lg-3 col-md-3">
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: "9px", letterSpacing: "0.5px" }}>
                                <i className="bx bx-clipboard me-1"></i>Diagnosis
                            </div>
                            {diagnoses.length > 0 ? (
                                <>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span
                                            className="badge"
                                            style={{
                                                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                                color: "white",
                                                fontSize: "11px"
                                            }}
                                        >
                                            {diagnoses[0].diagnosisCode}
                                        </span>
                                        <span
                                            className="badge"
                                            style={{
                                                fontSize: "10px",
                                                backgroundColor: diagnoses[0].certainty === "confirmed" ? "#10b981" : "#6b7280",
                                                color: "white"
                                            }}
                                        >
                                            <i className={`bx ${diagnoses[0].certainty === "confirmed" ? "bx-check-circle" : "bx-help-circle"} me-1`}></i>
                                            {diagnoses[0].certainty}
                                        </span>
                                    </div>
                                    <div className="text-truncate text-dark" style={{ fontSize: "12px", maxWidth: "200px" }}>
                                        {diagnoses[0].diagnosis}
                                    </div>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: "12px" }}>
                                    <i className="bx bx-minus-circle me-1"></i>No diagnosis
                                </span>
                            )}
                        </div>

                        {/* Insurance */}
                        <div className="col-lg-1 col-md-2 col-6">
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: "9px", letterSpacing: "0.5px" }}>
                                <i className="bx bx-shield me-1"></i>Insurance
                            </div>
                            {payment.shortName ? (
                                <span
                                    className="badge"
                                    style={{
                                        background: "linear-gradient(135deg, #10b981, #059669)",
                                        color: "white",
                                        fontSize: "11px"
                                    }}
                                >
                                    <i className="bx bx-check me-1"></i>
                                    {payment.shortName}
                                </span>
                            ) : (
                                <span className="text-muted" style={{ fontSize: "12px" }}>
                                    <i className="bx bx-x-circle me-1"></i>None
                                </span>
                            )}
                        </div>

                        {/* Action */}
                        <div className="col-lg-2 col-md-12 col-6 text-lg-end">
                            <button
                                className="btn btn-sm px-3"
                                onClick={() => handleViewDetails(patient)}
                                style={{
                                    fontSize: "12px",
                                    background: "linear-gradient(135deg, rgb(25, 118, 210), rgb(229, 57, 53))",
                                    color: "white",
                                    border: "none"
                                }}
                            >
                                <i className="bx bx-folder-open me-1"></i>
                                Open Record
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer with additional info */}
                {(diagnoses.length > 1 || visit.closedDate) && (
                    <div
                        className="px-3 py-2 d-flex justify-content-between align-items-center"
                        style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "11px" }}
                    >
                        <div className="text-muted">
                            {diagnoses.length > 1 && (
                                <span>
                                    <i className="bx bx-plus-circle me-1 text-warning"></i>
                                    {diagnoses.length - 1} additional diagnosis
                                </span>
                            )}
                        </div>
                        {visit.closedDate && (
                            <div className="text-success">
                                <i className="bx bx-check-circle me-1"></i>
                                Closed: {formatDate(visit.closedDate, "DD MMM YYYY")}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <BreadCumb pageList={["External Referral", "Patient Search"]} />

            {/* Main Container */}
            <div className="card border-0 shadow-sm">
                {/* Header - Clean White/Gray */}
                <div
                    className="card-header border-bottom py-3"
                    style={{ backgroundColor: "#f9fafb" }}
                >
                    <div className="row align-items-center">
                        <div className="col">
                            <h5 className="mb-1 fw-bold text-dark">
                                <i className="bx bx-search-alt-2 me-2 text-primary"></i>
                                External Referral Search
                            </h5>
                            <p className="text-muted mb-0 small">
                                Query patient records from Wizara Health Information System
                            </p>
                        </div>
                        <div className="col-auto">
                            {/* Live Connected Status with Glow */}
                            <div
                                className="d-flex align-items-center px-3 py-2 rounded-pill border"
                                style={{ backgroundColor: "#ffffff" }}
                            >
                                <span
                                    className="rounded-circle d-inline-block me-2"
                                    style={{
                                        width: "10px",
                                        height: "10px",
                                        backgroundColor: "#22c55e",
                                        boxShadow: "0 0 8px #22c55e, 0 0 16px #22c55e, 0 0 24px #22c55e",
                                        animation: "pulse-glow 2s ease-in-out infinite"
                                    }}
                                ></span>
                                <span className="text-dark small fw-medium">
                                    Connected with MOH
                                </span>
                            </div>
                            <style>
                                {`
                                    @keyframes pulse-glow {
                                        0%, 100% { 
                                            box-shadow: 0 0 4px #22c55e, 0 0 8px #22c55e; 
                                            opacity: 1;
                                        }
                                        50% { 
                                            box-shadow: 0 0 12px #22c55e, 0 0 24px #22c55e, 0 0 36px #22c55e; 
                                            opacity: 0.8;
                                        }
                                    }
                                `}
                            </style>
                        </div>
                    </div>
                </div>

                {/* Search Form */}
                <div className="card-body py-4" style={{ backgroundColor: "#f8fafc" }}>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSearch}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form>
                                <div className="bg-gradient px-4 py-3 rounded-3 shadow-sm" style={{
                                    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                                    border: "1px solid rgba(255, 255, 255, 0.8)"
                                }}>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">

                                        {/* Search Type Selector - Compact & Elegant */}
                                        <div className="d-flex align-items-center" style={{ minWidth: "200px" }}>
                                            <div className="me-3">
                                                <span className="text-dark fw-semibold d-flex align-items-center" style={{ fontSize: "14px" }}>
                                                    <div className="bg-white rounded-circle p-1 me-2 shadow-sm" style={{ width: "28px", height: "28px" }}>
                                                        <i className="bx bx-filter text-primary fs-5 d-flex align-items-center justify-content-center"></i>
                                                    </div>
                                                    Search By:
                                                </span>
                                            </div>

                                            <div className="btn-group btn-group-sm shadow-sm" role="group" style={{ borderRadius: "8px" }}>
                                                {IDENTIFIER_TYPES.map((type) => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setFieldValue("identifier_type", type.value)}
                                                        className={`btn ${values.identifier_type === type.value
                                                            ? 'btn-primary text-white px-3'
                                                            : 'btn-light text-dark px-3'
                                                            }`}
                                                        style={{
                                                            border: values.identifier_type === type.value ? "none" : "1px solid #d1d9e6",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            padding: "0.375rem 0.75rem",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Combined Search Input + Button - Perfectly Aligned */}
                                        <div className="flex-grow-1" style={{ maxWidth: "500px" }}>
                                            <div className="position-relative" style={{ paddingBottom: "10px" }}>
                                                <div className="input-group shadow-lg" style={{
                                                    borderRadius: "10px",
                                                    overflow: "hidden",
                                                    border: "1px solid rgba(255, 255, 255, 0.9)"
                                                }}>
                                                    <div className="input-group-text bg-white border-0 px-3" style={{ borderRight: "none" }}>
                                                        <i className="bx bx-id-card text-primary fs-5"></i>
                                                    </div>

                                                    <Field
                                                        type="text"
                                                        name="identifier_value"
                                                        className="form-control border-0 px-0"
                                                        placeholder={`Enter ${IDENTIFIER_TYPES.find(t => t.value === values.identifier_type)?.description?.toLowerCase() || "patient identifier"}...`}
                                                        autoComplete="off"
                                                        style={{
                                                            fontSize: "14px",
                                                            fontWeight: "500",
                                                            paddingLeft: "0",
                                                            background: "transparent",
                                                            height: "44px"
                                                        }}
                                                    />

                                                    <button
                                                        type="submit"
                                                        className="btn border-0 px-4"
                                                        disabled={isSubmitting || loading}
                                                        style={{
                                                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                                            color: "white",
                                                            fontWeight: "600",
                                                            fontSize: "14px",
                                                            letterSpacing: "0.3px",
                                                            minWidth: "110px",
                                                            height: "44px",
                                                            transition: "all 0.3s ease",
                                                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)";
                                                            e.currentTarget.style.transform = "translateY(-1px)";
                                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.4)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
                                                            e.currentTarget.style.transform = "translateY(0)";
                                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(59, 130, 246, 0.3)";
                                                        }}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                Searching
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bx bx-search me-2"></i>
                                                                Search
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Error Message - Always Below, Never Breaks Alignment */}
                                                <ErrorMessage
                                                    name="identifier_value"
                                                    component="div"
                                                    className="text-danger small position-absolute start-0 mt-1"
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: "500",
                                                        paddingLeft: "3rem",
                                                        width: "100%"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Helper - Only shows on error or mobile */}
                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                                        <small className="text-muted">
                                            <i className="bx bx-info-circle me-1"></i>
                                            Press <kbd className="bg-purple border mx-1 px-2 py-1 rounded">Enter</kbd> to quick search
                                        </small>
                                        <small className="text-primary fw-medium d-flex align-items-center">
                                            <i className="bx bx-shield-quarter me-1"></i>
                                            Encrypted Connection
                                        </small>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>

                {/* Results Section */}
                <div className="card-body p-0">
                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-5">
                            <ReactLoading type="spin" color="#1976d2" height={40} width={40} className="mx-auto" />
                            <p className="text-muted mt-3 mb-0 small">Querying Wizara database...</p>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && searchResults && searchResults.length > 0 && (
                        <>
                            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: "#ffffff" }}>
                                <div className="d-flex align-items-center">
                                    <span
                                        className="badge rounded-pill me-2"
                                        style={{
                                            background: "linear-gradient(135deg, rgb(25, 118, 210), rgb(229, 57, 53))",
                                            fontSize: "12px"
                                        }}
                                    >
                                        {searchResults.length}
                                    </span>
                                    <span className="text-dark small">
                                        Patient record(s) found for
                                        <code className="ms-1 px-2 py-1 rounded" style={{ backgroundColor: "#f1f5f9" }}>
                                            {searchInfo?.type}: {searchInfo?.value}
                                        </code>
                                    </span>
                                </div>
                                <button
                                    className="btn btn-sm btn-link text-muted"
                                    onClick={() => { setSearchResults(null); setSearchInfo(null); }}
                                >
                                    <i className="bx bx-x me-1"></i>Clear results
                                </button>
                            </div>

                            <div className="p-4" style={{ backgroundColor: "#f8fafc" }}>
                                {searchResults.map((patient, index) => renderPatientCard(patient, index))}
                            </div>
                        </>
                    )}

                    {/* No Results */}
                    {!loading && searchResults && searchResults.length === 0 && (
                        <div className="text-center py-5">
                            <div
                                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: "70px",
                                    height: "70px",
                                    background: "linear-gradient(135deg, #fef3c7, #fde68a)"
                                }}
                            >
                                <i className="bx bx-search-alt" style={{ fontSize: "30px", color: "#d97706" }}></i>
                            </div>
                            <h6 className="fw-semibold text-dark">No Records Found</h6>
                            <p className="text-muted small mb-3">
                                No patient matches <code>{searchInfo?.value}</code> in {searchInfo?.type}
                            </p>
                            <button
                                className="btn btn-sm"
                                style={{
                                    background: "linear-gradient(135deg, rgb(25, 118, 210), rgb(229, 57, 53))",
                                    color: "white",
                                    border: "none"
                                }}
                                onClick={() => { setSearchResults(null); setSearchInfo(null); }}
                            >
                                New Search
                            </button>
                        </div>
                    )}

                    {/* Initial State */}
                    {!loading && !searchResults && (
                        <div className="text-center py-5">
                            <div
                                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    background: "linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(229, 57, 53, 0.1))"
                                }}
                            >
                                <i
                                    className="bx bx-user-pin"
                                    style={{
                                        fontSize: "36px",
                                        background: "linear-gradient(135deg, rgb(25, 118, 210), rgb(229, 57, 53))",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent"
                                    }}
                                ></i>
                            </div>
                            <h5 className="fw-semibold text-dark mb-2">Patient Record Search</h5>
                            <p className="text-muted mb-4" style={{ maxWidth: "420px", margin: "0 auto", fontSize: "13px" }}>
                                Enter a patient identifier to retrieve their referral information from the Wizara Health Information System.
                            </p>
                            <div className="d-flex justify-content-center gap-2 flex-wrap">
                                {IDENTIFIER_TYPES.map((type) => (
                                    <span
                                        key={type.value}
                                        className="badge bg-light text-dark border px-3 py-2"
                                        style={{ fontSize: "11px" }}
                                    >
                                        <strong>{type.label}</strong> — {type.description}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

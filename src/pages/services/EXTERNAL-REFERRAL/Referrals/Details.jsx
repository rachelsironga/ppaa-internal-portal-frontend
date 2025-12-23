import React, { useState, useEffect } from "react";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { formatDate } from "../../../../helpers/DateFormater";

export const ReferralDetailsPage = () => {
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const { uid } = useParams();

    useEffect(() => {
        const storedData = sessionStorage.getItem("referralPatientData");
        if (storedData) {
            setReferralData(JSON.parse(storedData));
        }
        setLoading(false);
    }, [uid]);

    const getGenderIcon = (gender) => {
        if (!gender) return "bx-user";
        return gender.toLowerCase() === "male" ? "bx-male" : "bx-female";
    };

    const getGenderColor = (gender) => {
        if (!gender) return "#6c757d";
        return gender.toLowerCase() === "male" ? "#3b82f6" : "#ec4899";
    };

    const getFacilityInfo = (patient) => {
        const facility = patient?.facilityDetails || {};
        return {
            code: facility.code || "1234567",
            name: facility.name || "MUHIMBILI NATIONAL HOSPITAL",
        };
    };

    const getVitalValue = (vital, key) => {
        if (!vital || !vital[key]) return "-";
        if (typeof vital[key] === "object" && vital[key].parsedValue !== undefined) {
            return vital[key].parsedValue;
        }
        return vital[key];
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

    const renderValue = (value, fallback = "-") => {
        if (value === null || value === undefined || value === "") return <span className="text-muted">{fallback}</span>;
        if (typeof value === "boolean") return value ? <span className="text-success">Yes</span> : <span className="text-danger">No</span>;
        return value;
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["External Referral", "Patient Details"]} />
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                    <div className="text-center">
                        <ReactLoading type="spin" color="#0d6efd" height={50} width={50} className="mx-auto" />
                        <p className="text-muted mt-3">Loading patient record...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!referralData) {
        return (
            <>
                <BreadCumb pageList={["External Referral", "Patient Details"]} />
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <i className="bx bx-error-circle text-warning" style={{ fontSize: "4rem" }}></i>
                        <h4 className="mt-3">No Patient Data Available</h4>
                        <p className="text-muted">Please search for a patient first.</p>
                        <button className="btn btn-primary" onClick={() => navigate("/external-referral/referrals")}>
                            <i className="bx bx-search me-2"></i>Go to Search
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const demo = referralData.demographicDetails || {};
    const visit = referralData.visitDetails || {};
    const clinical = referralData.clinicalInformation || {};
    const diagnoses = referralData.diagnosisDetails || [];
    const medications = referralData.medicationDetails || [];
    const payment = referralData.visitMainPaymentDetails || {};
    const identifiers = demo.identifiers || [];
    const addresses = demo.addresses || [];
    const vitalSigns = clinical.vitalSigns || [];
    const visitNotes = clinical.visitNotes || [];
    const facility = getFacilityInfo(referralData);
    const billings = referralData.billingsDetails || [];
    const investigations = referralData.investigationDetails || [];
    const radiology = referralData.radiologyDetails || [];
    const vaccinations = referralData.vaccinationDetails || [];
    const lifestyle = referralData.lifeStyleInformation || {};

    const tabs = [
        { id: "overview", label: "Overview", icon: "bx-home-circle" },
        { id: "demographics", label: "Demographics", icon: "bx-user-circle" },
        { id: "clinical", label: "Clinical Notes", icon: "bx-file-find" },
        { id: "diagnosis", label: "Diagnosis", icon: "bx-clipboard" },
        { id: "medications", label: "Medications", icon: "bx-capsule" },
        { id: "investigations", label: "Lab & Radiology", icon: "bx-test-tube" },
        { id: "billing", label: "Billing", icon: "bx-credit-card" },
    ];

    return (
        <>
            <BreadCumb pageList={["External Referral", "Patient Details"]} />


            {/* Patient Header Card */}
            <div className="card border-0 shadow-sm mb-4">
                {/* Facility Bar */}
                <div className="px-4 py-2 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <i className="bx bx-building-house text-primary me-2"></i>
                            <span className="fw-semibold text-dark">{facility.name}</span>
                            <span className="text-muted ms-2 small">| Code: {facility.code}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3 small">
                            <span><i className="bx bx-calendar text-muted me-1"></i>Visit: <strong>{visit.visitDate ? formatDate(visit.visitDate, "DD MMM YYYY") : "-"}</strong></span>
                            <span><i className="bx bx-hash text-muted me-1"></i>Visit ID: <strong>{visit.id || "-"}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="card-body p-4">
                    <div className="row align-items-center">
                        <div className="col-auto">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    fontSize: "28px",
                                    backgroundColor: getGenderColor(demo.gender)
                                }}
                            >
                                {demo.firstName?.charAt(0)}{demo.lastName?.charAt(0)}
                            </div>
                        </div>
                        <div className="col">
                            <h3 className="mb-1 fw-bold text-dark">
                                {demo.firstName} {demo.middleName} {demo.lastName}
                            </h3>
                            <div className="d-flex flex-wrap gap-3 text-muted">
                                <span><i className={`bx ${getGenderIcon(demo.gender)} me-1`}></i>{demo.gender || "-"}</span>
                                <span><i className="bx bx-calendar me-1"></i>{calculateAge(demo.dateOfBirth)} years</span>
                                <span><i className="bx bx-cake me-1"></i>{demo.dateOfBirth ? formatDate(demo.dateOfBirth, "DD MMM YYYY") : "-"}</span>
                                <span><i className="bx bx-phone me-1"></i>{demo.phoneNumbers?.[0] || "-"}</span>
                                <span><i className="bx bx-map me-1"></i>{addresses[0]?.region || "-"}</span>
                            </div>
                            <div className="mt-2">
                                <code className="bg-light px-2 py-1 rounded text-dark">{demo.id || referralData.mrn || "-"}</code>
                                {payment.shortName && (
                                    <span className="badge bg-success ms-2"><i className="bx bx-check-shield me-1"></i>{payment.shortName}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-auto text-end">
                            {diagnoses.length > 0 && (
                                <div className="text-end">
                                    <small className="text-muted d-block mb-1">Primary Diagnosis</small>
                                    <span className="badge bg-warning text-dark px-3 py-2 fs-6">
                                        {diagnoses[0].diagnosisCode}
                                    </span>
                                    <div className="small text-muted mt-1" style={{ maxWidth: "200px" }}>
                                        {diagnoses[0].diagnosis}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content with Tabs */}
            <div className="card border-0 shadow-sm">
                {/* Tab Navigation */}
                <div className="card-header bg-white border-bottom p-0">
                    <nav className="nav nav-pills nav-fill p-2" style={{ gap: "4px" }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`nav-link rounded-pill px-3 py-2 ${activeTab === tab.id ? "active" : "text-muted"}`}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ fontSize: "0.875rem" }}
                            >
                                <i className={`bx ${tab.icon} me-1`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="card-body p-4">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            {/* Stats Row */}
                            <div className="row g-3 mb-4">
                                {[
                                    { label: "Diagnoses", value: diagnoses.length, icon: "bx-clipboard", color: "#f59e0b" },
                                    { label: "Medications", value: medications.length, icon: "bx-capsule", color: "#10b981" },
                                    { label: "Lab Tests", value: investigations.length, icon: "bx-test-tube", color: "#6366f1" },
                                    { label: "Vital Records", value: vitalSigns.length, icon: "bx-heart", color: "#ef4444" },
                                ].map((stat, idx) => (
                                    <div className="col-6 col-md-3" key={idx}>
                                        <div className="border rounded-3 p-3 text-center h-100">
                                            <i className={`bx ${stat.icon}`} style={{ fontSize: "1.75rem", color: stat.color }}></i>
                                            <h3 className="mb-0 mt-2 fw-bold">{stat.value}</h3>
                                            <small className="text-muted">{stat.label}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Vital Signs */}
                            {vitalSigns.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small">
                                        <i className="bx bx-pulse me-1"></i>Latest Vital Signs
                                        <span className="fw-normal ms-2 text-primary">({vitalSigns[0].dateTime})</span>
                                    </h6>
                                    <div className="row g-2">
                                        {[
                                            { label: "Blood Pressure", value: vitalSigns[0].bloodPressure, unit: "mmHg", icon: "bx-heart", bg: "#fef2f2" },
                                            { label: "Temperature", value: vitalSigns[0].temperature, unit: "°C", icon: "bx-sun", bg: "#fffbeb" },
                                            { label: "Weight", value: getVitalValue(vitalSigns[0], "weight"), unit: "kg", icon: "bx-body", bg: "#eff6ff" },
                                            { label: "Height", value: getVitalValue(vitalSigns[0], "height"), unit: "cm", icon: "bx-ruler", bg: "#f0fdf4" },
                                            { label: "Pulse", value: vitalSigns[0].pulseRate, unit: "bpm", icon: "bx-pulse", bg: "#fdf4ff" },
                                            { label: "Respiration", value: vitalSigns[0].respiration, unit: "/min", icon: "bx-wind", bg: "#f8fafc" },
                                        ].map((v, idx) => (
                                            <div className="col-6 col-md-2" key={idx}>
                                                <div className="rounded-3 p-3 text-center h-100" style={{ backgroundColor: v.bg }}>
                                                    <i className={`bx ${v.icon} text-muted`}></i>
                                                    <div className="fw-bold fs-5 mt-1">{renderValue(v.value)}<small className="fw-normal text-muted ms-1">{v.unit}</small></div>
                                                    <small className="text-muted">{v.label}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chief Complaints & Diagnosis Side by Side */}
                            <div className="row g-4">
                                {visitNotes.length > 0 && visitNotes[0].chiefComplains?.length > 0 && (
                                    <div className="col-md-6">
                                        <h6 className="fw-bold mb-3 text-uppercase text-muted small">
                                            <i className="bx bx-message-error me-1"></i>Chief Complaints
                                        </h6>
                                        <div className="border rounded-3 p-3">
                                            <ul className="list-unstyled mb-0">
                                                {visitNotes[0].chiefComplains.map((c, idx) => (
                                                    <li key={idx} className="mb-2">
                                                        <i className="bx bx-chevron-right text-danger me-1"></i>{c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {diagnoses.length > 0 && (
                                    <div className="col-md-6">
                                        <h6 className="fw-bold mb-3 text-uppercase text-muted small">
                                            <i className="bx bx-clipboard me-1"></i>Diagnoses
                                        </h6>
                                        <div className="border rounded-3 p-3">
                                            {diagnoses.slice(0, 3).map((d, idx) => (
                                                <div key={idx} className={`d-flex align-items-start ${idx > 0 ? "mt-2 pt-2 border-top" : ""}`}>
                                                    <span className="badge bg-warning text-dark me-2">{d.diagnosisCode}</span>
                                                    <div>
                                                        <span>{d.diagnosis}</span>
                                                        <small className="text-muted d-block">{formatDate(d.diagnosisDate, "DD MMM YYYY")}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lifestyle */}
                            <div className="mt-4">
                                <h6 className="fw-bold mb-3 text-uppercase text-muted small">
                                    <i className="bx bx-heart-circle me-1"></i>Lifestyle
                                </h6>
                                <div className="d-flex gap-3">
                                    <span className={`badge ${lifestyle.smoking?.use ? "bg-danger" : "bg-success"} px-3 py-2`}>
                                        <i className="bx bx-cigarette me-1"></i>Smoking: {lifestyle.smoking?.use ? "Yes" : "No"}
                                    </span>
                                    <span className={`badge ${lifestyle.alcoholUse?.use ? "bg-danger" : "bg-success"} px-3 py-2`}>
                                        <i className="bx bx-wine me-1"></i>Alcohol: {lifestyle.alcoholUse?.use ? "Yes" : "No"}
                                    </span>
                                    <span className={`badge ${lifestyle.drugUse?.use ? "bg-danger" : "bg-success"} px-3 py-2`}>
                                        <i className="bx bx-injection me-1"></i>Drug Use: {lifestyle.drugUse?.use ? "Yes" : "No"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Demographics Tab */}
                    {activeTab === "demographics" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-user me-1"></i>Personal Information
                                    </h6>
                                    <table className="table table-sm">
                                        <tbody>
                                            {[
                                                ["Full Name", `${demo.firstName} ${demo.middleName || ""} ${demo.lastName}`],
                                                ["Date of Birth", demo.dateOfBirth ? formatDate(demo.dateOfBirth, "DD MMM YYYY") : "-"],
                                                ["Age", `${calculateAge(demo.dateOfBirth)} years`],
                                                ["Gender", demo.gender || "-"],
                                                ["Marital Status", demo.maritalStatus || "-"],
                                                ["Nationality", demo.nationality || "-"],
                                                ["Occupation", demo.occupation || "-"],
                                            ].map(([label, value], idx) => (
                                                <tr key={idx}>
                                                    <td className="text-muted" style={{ width: "40%" }}>{label}</td>
                                                    <td className="fw-semibold">{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-phone me-1"></i>Contact & Address
                                    </h6>
                                    <table className="table table-sm">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted" style={{ width: "40%" }}>Phone</td>
                                                <td className="fw-semibold">{demo.phoneNumbers?.join(", ") || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Email</td>
                                                <td className="fw-semibold">{demo.emails?.join(", ") || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {addresses.length > 0 && (
                                        <div className="bg-light rounded-3 p-3 mt-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-primary me-2">{addresses[0].category}</span>
                                                <small className="text-muted">Address</small>
                                            </div>
                                            <p className="mb-0">
                                                {addresses[0].village}, {addresses[0].ward}<br />
                                                {addresses[0].district}, {addresses[0].region}<br />
                                                {addresses[0].country}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-id-card me-1"></i>Patient Identifiers
                                    </h6>
                                    <div className="row g-2">
                                        {identifiers.map((id, idx) => (
                                            <div className="col-md-4 col-lg-3" key={idx}>
                                                <div className="border rounded p-2">
                                                    <small className="text-muted d-block">{id.type}</small>
                                                    <code className="small">{id.id}</code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clinical Notes Tab */}
                    {activeTab === "clinical" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            {/* Vital Signs History */}
                            <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                <i className="bx bx-pulse me-1"></i>Vital Signs History
                            </h6>
                            {vitalSigns.length > 0 ? (
                                <div className="table-responsive mb-4">
                                    <table className="table table-hover table-sm align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date/Time</th>
                                                <th>BP</th>
                                                <th>Temp</th>
                                                <th>Weight</th>
                                                <th>Height</th>
                                                <th>Pulse</th>
                                                <th>Resp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vitalSigns.map((vs, idx) => (
                                                <tr key={idx}>
                                                    <td className="small">{vs.dateTime}</td>
                                                    <td><span className="badge bg-light text-dark">{vs.bloodPressure || "-"}</span></td>
                                                    <td>{vs.temperature ? `${vs.temperature}°C` : "-"}</td>
                                                    <td>{getVitalValue(vs, "weight")} kg</td>
                                                    <td>{getVitalValue(vs, "height")} cm</td>
                                                    <td>{vs.pulseRate || "-"}</td>
                                                    <td>{vs.respiration || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted">No vital signs recorded</p>
                            )}

                            {/* Visit Notes */}
                            <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                <i className="bx bx-note me-1"></i>Visit Notes
                            </h6>
                            {visitNotes.length > 0 ? (
                                <div className="row g-3">
                                    {visitNotes.map((note, idx) => (
                                        <div className="col-12" key={idx}>
                                            <div className="border rounded-3 p-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <small className="text-muted"><i className="bx bx-time me-1"></i>{note.date}</small>
                                                    <span className="badge bg-info">{note.providerSpeciality}</span>
                                                </div>
                                                {note.chiefComplains?.length > 0 && (
                                                    <div>
                                                        <strong className="small">Chief Complaints:</strong>
                                                        <ul className="mb-0 mt-1">
                                                            {note.chiefComplains.map((c, i) => <li key={i} className="small">{c}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No visit notes available</p>
                            )}
                        </div>
                    )}

                    {/* Diagnosis Tab */}
                    {activeTab === "diagnosis" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                <i className="bx bx-clipboard me-1"></i>Diagnosis History
                            </h6>
                            {diagnoses.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>ICD Code</th>
                                                <th>Diagnosis</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {diagnoses.map((d, idx) => (
                                                <tr key={idx}>
                                                    <td>{formatDate(d.diagnosisDate, "DD MMM YYYY")}</td>
                                                    <td><span className="badge bg-warning text-dark">{d.diagnosisCode}</span></td>
                                                    <td>
                                                        <strong>{d.diagnosis}</strong>
                                                        {d.diagnosisDescription && d.diagnosisDescription !== d.diagnosis && (
                                                            <small className="text-muted d-block">{d.diagnosisDescription}</small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${d.certainty === "confirmed" ? "success" : "secondary"}`}>
                                                            {d.certainty}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted">No diagnosis records</p>
                            )}
                        </div>
                    )}

                    {/* Medications Tab */}
                    {activeTab === "medications" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                <i className="bx bx-capsule me-1"></i>Prescribed Medications
                            </h6>
                            {medications.length > 0 ? (
                                <div className="row g-3">
                                    {medications.map((m, idx) => (
                                        <div className="col-md-6" key={idx}>
                                            <div className="border rounded-3 p-3 h-100">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="mb-0">{m.name !== "null" ? m.name : "Medication"}</h6>
                                                    <span className="badge bg-secondary">{m.treatmentType}</span>
                                                </div>
                                                <div className="small text-muted">
                                                    <div><i className="bx bx-calendar me-1"></i>Ordered: {formatDate(m.orderDate, "DD MMM YYYY")}</div>
                                                    <div><i className="bx bx-time me-1"></i>Duration: {m.periodOfMedication}</div>
                                                    {m.dosage && (
                                                        <>
                                                            <div><i className="bx bx-droplet me-1"></i>Dose: {m.dosage.dose}</div>
                                                            <div><i className="bx bx-navigation me-1"></i>Route: {m.dosage.route}</div>
                                                            <div><i className="bx bx-repeat me-1"></i>Frequency: {m.dosage.frequency}x daily</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No medications prescribed</p>
                            )}
                        </div>
                    )}

                    {/* Investigations Tab */}
                    {activeTab === "investigations" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row g-4">
                                <div className="col-12">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-test-tube me-1"></i>Laboratory Investigations
                                    </h6>
                                    {investigations.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover table-sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Disease Code</th>
                                                        <th>Classification</th>
                                                        <th>Days Since Symptoms</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {investigations.map((inv, idx) => (
                                                        <tr key={idx}>
                                                            <td>{formatDate(inv.dateOccurred, "DD MMM YYYY")}</td>
                                                            <td><span className="badge bg-info">{inv.diseaseCode}</span></td>
                                                            <td>{inv.caseClassification}</td>
                                                            <td>{inv.daysSinceSymptoms}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted">No laboratory investigations</p>
                                    )}
                                </div>

                                <div className="col-12">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-image me-1"></i>Radiology
                                    </h6>
                                    {radiology.length > 0 ? (
                                        <div className="row g-2">
                                            {radiology.map((r, idx) => (
                                                <div className="col-md-4" key={idx}>
                                                    <div className="border rounded p-3">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="badge bg-primary">{r.testTypeName}</span>
                                                            <small className="text-muted">{formatDate(r.testDate, "DD MMM YYYY")}</small>
                                                        </div>
                                                        {r.url && (
                                                            <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm mt-2 w-100">
                                                                <i className="bx bx-link-external me-1"></i>View Image
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No radiology records</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === "billing" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row g-4">
                                <div className="col-md-5">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-shield me-1"></i>Insurance Details
                                    </h6>
                                    <div className="bg-light rounded-3 p-3">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" style={{ width: "50px", height: "50px" }}>
                                                <i className="bx bx-check-shield fs-4"></i>
                                            </div>
                                            <div>
                                                <h5 className="mb-0">{payment.name || "-"}</h5>
                                                <span className="badge bg-success">{payment.shortName}</span>
                                            </div>
                                        </div>
                                        <table className="table table-sm table-borderless mb-0">
                                            <tbody>
                                                <tr><td className="text-muted">Type</td><td className="fw-semibold">{payment.type || "-"}</td></tr>
                                                <tr><td className="text-muted">Code</td><td><code>{payment.insuranceCode || "-"}</code></td></tr>
                                                <tr><td className="text-muted">Member ID</td><td><code>{payment.insuranceId || "-"}</code></td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="col-md-7">
                                    <h6 className="fw-bold mb-3 text-uppercase text-muted small border-bottom pb-2">
                                        <i className="bx bx-receipt me-1"></i>Billing Summary
                                    </h6>
                                    {billings.length > 0 ? (
                                        <>
                                            <div className="alert alert-success py-2 d-flex justify-content-between align-items-center">
                                                <span><i className="bx bx-money me-1"></i>Total Amount Billed</span>
                                                <strong className="fs-5">TZS {billings.reduce((sum, b) => sum + (b.amountBilled || 0), 0).toLocaleString()}</strong>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Billing Code</th>
                                                            <th>Type</th>
                                                            <th className="text-end">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billings.map((b, idx) => (
                                                            <tr key={idx}>
                                                                <td><code>{b.billingCode}</code></td>
                                                                <td>{b.billType}</td>
                                                                <td className="text-end fw-semibold">TZS {b.amountBilled?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted">No billing records</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

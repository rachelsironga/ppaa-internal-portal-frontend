import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import { formatDate } from "../../../../../helpers/DateFormater";
import { getAssetType } from "./Queries";
import Swal from "sweetalert2";
import { deleteAsset as deleteAssetType } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { AssetTypeModal } from "./AssetTypeModal";

export const ViewAssetType = () => {
    const [selectedObj, setSelectedObj] = useState<any>(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.userReducer?.data);

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean | null>(null);



    useEffect(() => {
        handleFetchAssetType();
    }, [uid]);

    // Listen for modal close events to refresh data after edit
    useEffect(() => {
        const modalElement = document.getElementById("assetTypeModal");
        if (!modalElement) return;

        const handleModalHidden = () => {
            // Refresh data when modal is closed (after edit)
            if (uid) {
                handleFetchAssetType();
            }
        };

        modalElement.addEventListener("hidden.bs.modal", handleModalHidden);

        return () => {
            modalElement.removeEventListener("hidden.bs.modal", handleModalHidden);
        };
    }, [uid]);

    const handleFetchAssetType = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAssetType({
                uid: uid,
            });
            if (result && (result.status === 200 || result.status === 8000)) {
                setSelectedObj(result.data);
            } else {
                setError(true);
                showToast("No Asset Type Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            console.error("Error fetching asset type:", err);
            setError(true);
            showToast("Unable to Fetch Asset Type", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAsset = async (assetToDelete: any = null) => {
        if (!assetToDelete) {
            Swal.fire("Error!", "Unable to select this asset type.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete asset type: ${assetToDelete.name} `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAssetType(assetToDelete.uid);
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Deleted!",
                        "The asset type has been deleted successfully.",
                        "success"
                    );
                     handleFetchAssetType();
                } else {
                    Swal.fire("Error!", result?.message || "Failed to delete asset type", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting asset type:", error);
            Swal.fire(
                "Error!",
                "Unable to delete asset type. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <AssetContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                handleFetchAssetType,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Asset Type", "View"] as any}>
                {null}
            </BreadCumb>

            <div className="card mb-4 animate__animated animate__fadeInDown animate__faster">
                <div className="d-flex justify-content-between align-items-center card-header shadow-sm mb-4">
                    <h5 className="mb-0">Asset Type Details</h5>

                    {loading || error || selectedObj == null ? (
                        <div className="form-group"></div>
                    ) : (
                        <div className="form-group">
                            <button
                                aria-label="Edit Asset Type"
                                type="button"
                                className="btn btn-primary ms-auto btn-sm me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#assetTypeModal"
                            >
                                <i className="bx bx-edit-alt me-1"></i> Edit
                            </button>
                            <button
                                aria-label="Delete Item"
                                className="btn btn-danger ms-auto btn-sm"
                                onClick={async () => {
                                    handleDeleteAsset(selectedObj);
                                }}
                                type="button"
                            >
                                <i className="bx bx-trash me-1"></i> Delete
                            </button>
                        </div>
                    )}
                </div>

                <div className="card-body animate__animated animate__fadeInUp animate__faster">
                    {loading ? (
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="col-md-12 col-lg-12 col-sm-12 p-2">
                                <center>
                                    <ReactLoading
                                        type={"cylon"}
                                        color={"#00853f"}
                                        height={"30px"}
                                        width={"50px"}
                                    />
                                </center>
                                <center className="mt-1">
                                    <h6 className="text-muted">Fetching Asset Type</h6>
                                </center>
                            </div>
                        </div>
                    ) : error || selectedObj === null ? (
                        <div className="alert alert-info" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Asset Type Details Please Contanct System
                                    Administrator{" "}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="col-md-12">
                            <div className="row mb-3 ">
                                <div
                                    className="col-md-1 col-sm-12"
                                    style={{ minWidth: "120px" }}
                                >
                                    <h6 className="text-muted">Name:</h6>
                                </div>
                                <div className="col-md-9 col-sm-12">
                                    <p className="text-justify bg-light">
                                        {selectedObj?.name || ""} 
                                    </p>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div
                                    className="col-md-1 col-sm-12"
                                    style={{ minWidth: "120px" }}
                                >
                                    <h6 className="text-muted">Category:</h6>
                                </div>
                                <div className="col-md-9 col-sm-12">
                                    <p className="text-justify">
                                        {selectedObj?.category.name || ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Asset Specifications Template */}
            <div className="card mb-4 animate__animated animate__fadeInUp animate__faster">
                <div className="card-header shadow-sm mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="bx bx-list-check me-2 text-primary"></i>
                            Asset Specifications Template
                        </h5>
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center py-4">
                            <ReactLoading
                                type={"cylon"}
                                color={"#00853f"}
                                height={"30px"}
                                width={"50px"}
                            />
                        </div>
                    ) : error || selectedObj === null ? (
                        <div className="alert alert-info" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Unable to load specifications. Please try again later.
                                </p>
                            </div>
                        </div>
                    ) : selectedObj?.specifications_template && selectedObj.specifications_template.length > 0 ? (
                        <div className="row g-3">
                            {selectedObj.specifications_template.map((spec, index) => (
                                <div key={index} className="col-md-6 col-lg-4 col-xl-3">
                                    <div className="card border border-primary-subtle h-100 shadow-sm" style={{ overflow: 'hidden' }}>
                                        <div className="card-body p-3" style={{ overflow: 'hidden' }}>
                                            <div className="d-flex align-items-start">
                                                <div className="flex-shrink-0">
                                                    <div 
                                                        className="avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ backgroundColor: 'rgba(13, 110, 253, 0.2)' }}
                                                    >
                                                        <i className="bx bx-chip text-primary fs-5"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-2" style={{ minWidth: 0, overflow: 'hidden' }}>
                                                    <h6 
                                                        className="mb-1 text-primary fw-semibold text-truncate" 
                                                        style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}
                                                        title={spec.key || "No Specification Added"}
                                                    >
                                                        {spec.key || "No Specification Added"}
                                                    </h6>
                                                    <p 
                                                        className="mb-0 text-dark fw-medium" 
                                                        style={{ 
                                                            fontSize: '0.875rem',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word',
                                                            hyphens: 'auto'
                                                        }}
                                                        title={spec.value || "-"}
                                                    >
                                                        {spec.value || "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="bx bx-info-circle text-muted" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h6 className="text-muted mb-2">No Specifications Available</h6>
                            <p className="text-muted small mb-0">
                                This asset type doesn't have any specifications defined yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>

         
            <AssetTypeModal />
        </AssetContext.Provider>
    );
};
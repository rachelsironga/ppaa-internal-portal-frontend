import { useEffect } from "react";
import { useSelector } from "react-redux";

export const DashboardPage = () => {
    const user = useSelector((state) => state.userReducer?.data);

    useEffect(() => {
        dashboardAnalitics();
    }, [])
    return (
        <>
            <div className="row">
                <div className="col-lg-8 mb-4 order-0">
                    <div className="card">
                        <div className="d-flex align-items-end row">
                            <div className="col-sm-7">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">
                                        Welcome, {user?.first_name} {user?.last_name}!
                                    </h5>
                                    <p className="mb-4">
                                        Please note that every action you perform in <span className="fw-medium">E-APPROVAL</span> is crucial to the success of the organization.
                                    </p>
                                    <a aria-label="view badges"
                                        href="#"
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        View My Pending Approvals
                                    </a>
                                </div>
                            </div>
                            <div className="col-sm-5 text-center text-sm-left">
                                <div className="card-body pb-0 px-0 px-md-4">
                                    <img aria-label="dashboard icon image"
                                        src="/assets/img/illustrations/man-with-laptop-light.png"
                                        height="140"
                                        alt="View Badge User"
                                        data-app-dark-img="illustrations/man-with-laptop-dark.png"
                                        data-app-light-img="illustrations/man-with-laptop-light.png"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 col-md-4 order-1">
                    <div className="row">
                        <div className="col-lg-6 col-md-12 col-6 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-title d-flex align-items-start justify-content-between">
                                        <div className="avatar flex-shrink-0">
                                            <img aria-label="dashboard icon image"
                                                src="/assets/img/icons/unicons/chart-success.png"
                                                alt="chart success"
                                                className="rounded"
                                            />
                                        </div>
                                        <div className="dropdown">
                                            <button aria-label="Click me"
                                                className="btn p-0"
                                                type="button"
                                                id="cardOpt3"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                            >
                                                <i className="bx bx-dots-vertical-rounded"></i>
                                            </button>
                                            <div
                                                className="dropdown-menu dropdown-menu-end"
                                                aria-labelledby="cardOpt3"
                                            >
                                                <a aria-label="view more" className="dropdown-item" href="#">
                                                    View More
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="fw-medium d-block mb-1">My Requestes</span>
                                    <h3 className="card-title mb-2">10</h3>
                                    <small className="text-success fw-medium">
                                        <i className="bx bx-count"></i> 2.5%
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 col-6 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-title d-flex align-items-start justify-content-between">
                                        <div className="avatar flex-shrink-0">
                                            <img aria-label='dsahboard icon image'
                                                src="/assets/img/icons/unicons/wallet-info.png"
                                                alt="Credit Card"
                                                className="rounded"
                                            />
                                        </div>
                                        <div className="dropdown">
                                            <button aria-label='Click me'
                                                className="btn p-0"
                                                type="button"
                                                id="cardOpt6"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                            >
                                                <i className="bx bx-dots-vertical-rounded"></i>
                                            </button>
                                            <div
                                                className="dropdown-menu dropdown-menu-end"
                                                aria-labelledby="cardOpt6"
                                            >
                                                <a aria-label="view more" className="dropdown-item" href="#">
                                                    View More
                                                </a>
                                                <a aria-label="delete" className="dropdown-item" href="#">
                                                    View More
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="fw-medium d-block mb-1">On Approving Process</span>
                                    <h3 className="card-title mb-2">30</h3>
                                    <small className="text-success fw-medium">
                                        <i className="bx bx-up-arrow-alt"></i> 27.2%
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-12 col-sm-12 col-md-4 order-0">
                    {/* <!-- Basic Bootstrap Table --> */}
                    <div className="card">
                        <h5 className="card-header">Request Need My Attensions</h5>
                        <div className="table-responsive text-nowrap">
                            <table className="table table-hover table-align-middle mb-0 table-bordered">
                                <thead style={{ backgroundColor: "#f1f1f1" }}>
                                    <tr>
                                        <th>Request For</th>
                                        <th>Created By</th>
                                        <th>Created Date</th>
                                        <th>Approval Chain</th>
                                        <th>Status</th>
                                        <th style={{ width: "60px" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-border-bottom-0">
                                    <tr>
                                        <td>
                                            <i className="bx bxl-angular bx-sm text-danger me-3"></i>
                                            <span className="fw-medium">Internet & Email Access</span>
                                        </td>
                                        <td>Innocent B Mwamvua</td>
                                        <td>17/03/2025</td>

                                        <td>
                                            <ul className="list-unstyled users-list m-0 avatar-group d-flex align-items-center">
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Lilian Fuller">
                                                    <img aria-label='table image' src="../assets/img/avatars/5.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Sophia Wilkerson">
                                                    <img aria-label='table image' src="../assets/img/avatars/6.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Christina Parker">
                                                    <img aria-label='table image' src="../assets/img/avatars/7.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Sophia Wilkerson">
                                                    <img aria-label='table image' src="../assets/img/avatars/6.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Christina Parker">
                                                    <img aria-label='table image' src="../assets/img/avatars/7.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                            </ul>
                                        </td>
                                        <td><span className="badge bg-label-danger me-1">REJECTED</span></td>
                                        <td>
                                            <div className="dropdown">
                                                <button aria-label='Click me' type="button" className="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                    <i className="bx bx-dots-vertical-rounded"></i>
                                                </button>
                                                <div className="dropdown-menu">
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-edit-alt me-1"></i> Edit</a
                                                    >
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-trash me-1"></i> Delete</a
                                                    >
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="bx bxl-react bx-sm text-info me-3"></i>
                                            <span className="fw-medium">Jeeva Access</span>
                                        </td>
                                        <td>Patrick P Nachenga</td>
                                        <td>15/03/2025</td>
                                        <td>
                                            <ul className="list-unstyled users-list m-0 avatar-group d-flex align-items-center">
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Lilian Fuller">
                                                    <img aria-label='table image' src="../assets/img/avatars/5.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Sophia Wilkerson">
                                                    <img aria-label='table image' src="../assets/img/avatars/6.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Christina Parker">
                                                    <img aria-label='table image' src="../assets/img/avatars/7.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                            </ul>
                                        </td>
                                        <td><span className="badge bg-label-success me-1">Approved</span></td>
                                        <td>
                                            <div className="dropdown">
                                                <button aria-label='Click me' type="button" className="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                    <i className="bx bx-dots-vertical-rounded"></i>
                                                </button>
                                                <div className="dropdown-menu">
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-edit-alt me-2"></i> Edit</a
                                                    >
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-trash me-2"></i> Delete</a
                                                    >
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="bx bxl-vuejs bx-sm text-success me-3"></i>
                                            <span className="fw-medium">EDMS Access</span>
                                        </td>
                                        <td>Trevor Baker</td>
                                        <td>13/03/2025</td>

                                        <td>
                                            <ul className="list-unstyled users-list m-0 avatar-group d-flex align-items-center">
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Lilian Fuller">
                                                    <img aria-label='table image' src="../assets/img/avatars/5.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Sophia Wilkerson">
                                                    <img aria-label='table image' src="../assets/img/avatars/6.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Christina Parker">
                                                    <img aria-label='table image' src="../assets/img/avatars/7.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Christina Parker">
                                                    <img aria-label='table image' src="../assets/img/avatars/7.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                            </ul>
                                        </td>
                                        <td><span className="badge bg-label-warning me-1">PENDING</span></td>
                                        <td>
                                            <div className="dropdown">
                                                <button aria-label='Click me' type="button" className="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                    <i className="bx bx-dots-vertical-rounded"></i>
                                                </button>
                                                <div className="dropdown-menu">
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-edit-alt me-2"></i> Edit</a
                                                    >
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-trash me-2"></i> Delete</a
                                                    >
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="bx bxl-bootstrap bx-sm text-primary me-3"></i>
                                            <span className="fw-medium">Biometric REgistration</span>
                                        </td>
                                        <td>Jerry Milton</td>
                                        <td>10/03/2025</td>
                                        <td>
                                            <ul className="list-unstyled users-list m-0 avatar-group d-flex align-items-center">
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Lilian Fuller">
                                                    <img aria-label='table image' src="../assets/img/avatars/5.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                                <li
                                                    data-bs-toggle="tooltip"
                                                    data-popup="tooltip-custom"
                                                    data-bs-placement="top"
                                                    className="avatar avatar-xs pull-up"
                                                    title="Sophia Wilkerson">
                                                    <img aria-label='table image' src="../assets/img/avatars/6.png" alt="Avatar" className="rounded-circle" />
                                                </li>
                                            </ul>
                                        </td>
                                        <td><span className="badge bg-label-warning me-1">Pending</span></td>
                                        <td>
                                            <div className="dropdown">
                                                <button aria-label='Click me' type="button" className="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                                    <i className="bx bx-dots-vertical-rounded"></i>
                                                </button>
                                                <div className="dropdown-menu">
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-edit-alt me-2"></i> Edit</a
                                                    >
                                                    <a aria-label="dropdown action option" className="dropdown-item" href="#"
                                                    ><i className="bx bx-trash me-2"></i> Delete</a
                                                    >
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* <!--/ Basic Bootstrap Table --> */}
                </div>
            </div>

        </>
    );
};
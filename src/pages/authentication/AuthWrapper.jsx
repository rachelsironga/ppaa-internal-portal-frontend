import React from 'react'
import { Link } from 'react-router-dom'
import './page-auth.css'
export const AuthWrapper = ({ children, maxWidth }) => {
    maxWidth = maxWidth || "400px";
    return (
        <div className="container-xxl">
            <div className="authentication-wrapper authentication-basic container-p-y">
                <div className="authentication-inner" style={{ maxWidth: maxWidth }}>
                    <div className="card">
                        <div className="card-body">
                            <div className="app-brand justify-content-center">
                                <Link aria-label='Go to Home Page' to="/" className="app-brand-link gap-2">
                                    <span className="app-brand-logo demo">
                                        <img src="/assets/img/nembo.jpg" alt="sneat-logo" width={"70px"} height={"70px"} />
                                    </span>
                                    <span className="app-brand-text demo text-body fw-bold">E-APPROVAL</span>
                                    <span className="app-brand-logo demo">
                                        <img src="/assets/img/mnhlogo.png" alt="sneat-logo" width={"70px"} height={"70px"} />
                                    </span>
                                </Link>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import React from "react";
import ContentLoader from "react-content-loader";

const StatCardShimmer = ({ delay = 0 }) => (
    <div 
        className="card h-100 animate__animated animate__fadeInUp"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="card-body">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={100}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
                style={{ width: "100%" }}
            >
                <rect x="0" y="10" rx="4" ry="4" width="60%" height="16" />
                <rect x="0" y="40" rx="4" ry="4" width="40%" height="28" />
                <rect x="0" y="80" rx="3" ry="3" width="50%" height="12" />
                <circle cx="90%" cy="40" r="24" />
            </ContentLoader>
        </div>
    </div>
);

const ChartShimmer = ({ height = 300, delay = 0 }) => (
    <div 
        className="card animate__animated animate__fadeInUp"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="card-header">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={30}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
            >
                <circle cx="15" cy="15" r="12" />
                <rect x="35" y="5" rx="4" ry="4" width="200" height="20" />
            </ContentLoader>
        </div>
        <div className="card-body">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={height}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
                style={{ width: "100%" }}
            >
                {/* Y-axis labels */}
                <rect x="0" y="10" rx="2" ry="2" width="30" height="10" />
                <rect x="0" y="60" rx="2" ry="2" width="25" height="10" />
                <rect x="0" y="110" rx="2" ry="2" width="28" height="10" />
                <rect x="0" y="160" rx="2" ry="2" width="22" height="10" />
                <rect x="0" y="210" rx="2" ry="2" width="30" height="10" />
                
                {/* Chart bars/lines simulation */}
                <rect x="50" y="180" rx="4" ry="4" width="8%" height="80" />
                <rect x="15%" y="140" rx="4" ry="4" width="8%" height="120" />
                <rect x="28%" y="100" rx="4" ry="4" width="8%" height="160" />
                <rect x="41%" y="60" rx="4" ry="4" width="8%" height="200" />
                <rect x="54%" y="120" rx="4" ry="4" width="8%" height="140" />
                <rect x="67%" y="80" rx="4" ry="4" width="8%" height="180" />
                <rect x="80%" y="150" rx="4" ry="4" width="8%" height="110" />
            </ContentLoader>
        </div>
    </div>
);

const PieChartShimmer = ({ delay = 0 }) => (
    <div 
        className="card h-100 animate__animated animate__fadeInUp"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="card-header d-flex justify-content-between align-items-center">
            <ContentLoader
                speed={1.5}
                width={250}
                height={25}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
            >
                <circle cx="12" cy="12" r="10" />
                <rect x="30" y="2" rx="4" ry="4" width="180" height="18" />
            </ContentLoader>
            <ContentLoader
                speed={1.5}
                width={80}
                height={30}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
            >
                <rect x="0" y="5" rx="4" ry="4" width="35" height="22" />
                <rect x="40" y="5" rx="4" ry="4" width="35" height="22" />
            </ContentLoader>
        </div>
        <div className="card-body d-flex justify-content-center align-items-center">
            <ContentLoader
                speed={1.5}
                width={250}
                height={250}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
            >
                <circle cx="125" cy="125" r="100" />
                <circle cx="125" cy="125" r="60" fill="#fff" />
                {/* Legend */}
                <rect x="10" y="235" rx="3" ry="3" width="15" height="15" />
                <rect x="30" y="237" rx="2" ry="2" width="80" height="10" />
                <rect x="130" y="235" rx="3" ry="3" width="15" height="15" />
                <rect x="150" y="237" rx="2" ry="2" width="80" height="10" />
            </ContentLoader>
        </div>
    </div>
);

const TableShimmer = ({ rows = 5, delay = 0 }) => (
    <div 
        className="card animate__animated animate__fadeInUp"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="card-header">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={25}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
            >
                <circle cx="12" cy="12" r="10" />
                <rect x="30" y="2" rx="4" ry="4" width="250" height="18" />
            </ContentLoader>
        </div>
        <div className="card-body">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={50 + rows * 45}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
                style={{ width: "100%" }}
            >
                {/* Table Header */}
                <rect x="0" y="0" rx="4" ry="4" width="5%" height="35" />
                <rect x="8%" y="0" rx="4" ry="4" width="25%" height="35" />
                <rect x="36%" y="0" rx="4" ry="4" width="15%" height="35" />
                <rect x="54%" y="0" rx="4" ry="4" width="15%" height="35" />
                <rect x="72%" y="0" rx="4" ry="4" width="12%" height="35" />
                <rect x="87%" y="0" rx="4" ry="4" width="12%" height="35" />
                
                {/* Table Rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <React.Fragment key={i}>
                        <rect x="0" y={50 + i * 45} rx="3" ry="3" width="4%" height="30" />
                        <rect x="8%" y={50 + i * 45} rx="3" ry="3" width="22%" height="30" />
                        <rect x="36%" y={50 + i * 45} rx="3" ry="3" width="12%" height="30" />
                        <rect x="54%" y={50 + i * 45} rx="3" ry="3" width="12%" height="30" />
                        <rect x="72%" y={50 + i * 45} rx="3" ry="3" width="10%" height="30" />
                        <rect x="87%" y={50 + i * 45} rx="3" ry="3" width="10%" height="30" />
                    </React.Fragment>
                ))}
            </ContentLoader>
        </div>
    </div>
);

const FilterBarShimmer = ({ delay = 0 }) => (
    <div 
        className="card mb-4 animate__animated animate__fadeInDown"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="card-body">
            <ContentLoader
                speed={1.5}
                width="100%"
                height={60}
                backgroundColor="#f3f3f3"
                foregroundColor="#e8e8e8"
                style={{ width: "100%" }}
            >
                <rect x="0" y="5" rx="3" ry="3" width="80" height="12" />
                <rect x="0" y="25" rx="6" ry="6" width="22%" height="35" />
                
                <rect x="25%" y="5" rx="3" ry="3" width="80" height="12" />
                <rect x="25%" y="25" rx="6" ry="6" width="22%" height="35" />
                
                <rect x="50%" y="5" rx="3" ry="3" width="60" height="12" />
                <rect x="50%" y="25" rx="6" ry="6" width="22%" height="35" />
                
                <rect x="75%" y="25" rx="6" ry="6" width="10%" height="35" />
                <rect x="87%" y="25" rx="6" ry="6" width="8%" height="35" />
            </ContentLoader>
        </div>
    </div>
);

const PatientTrendsDashboardShimmer = () => {
    return (
        <div className="container-fluid py-3">
            {/* Header */}
            <div className="row mb-4 animate__animated animate__fadeIn">
                <div className="col">
                    <ContentLoader
                        speed={1.5}
                        width={400}
                        height={50}
                        backgroundColor="#f3f3f3"
                        foregroundColor="#e8e8e8"
                    >
                        <rect x="0" y="5" rx="4" ry="4" width="350" height="24" />
                        <rect x="0" y="35" rx="3" ry="3" width="450" height="14" />
                    </ContentLoader>
                </div>
            </div>

            {/* Filter Bar */}
            <FilterBarShimmer delay={100} />

            {/* Stats Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <StatCardShimmer delay={200} />
                </div>
                <div className="col-md-3">
                    <StatCardShimmer delay={300} />
                </div>
                <div className="col-md-3">
                    <StatCardShimmer delay={400} />
                </div>
                <div className="col-md-3">
                    <StatCardShimmer delay={500} />
                </div>
            </div>

            {/* Main Chart */}
            <div className="mb-4">
                <ChartShimmer height={280} delay={600} />
            </div>

            {/* Pie Charts Row */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <PieChartShimmer delay={700} />
                </div>
                <div className="col-md-6">
                    <PieChartShimmer delay={800} />
                </div>
            </div>

            {/* Table */}
            <div className="mb-4">
                <TableShimmer rows={5} delay={900} />
            </div>
        </div>
    );
};

export default PatientTrendsDashboardShimmer;

export const getBadgeClass = (status) => {
    switch (status) {
        case "NEW":
            return "bg-label-primary";
        case "PENDING":
            return "bg-label-warning";
        case "REJECTED":
        case "CANCELLED":
        case "EXPIRED":
            return "bg-label-danger";
        case "APPROVED":
            return "bg-label-success";
        default:
            return "bg-label-info";
    }
}
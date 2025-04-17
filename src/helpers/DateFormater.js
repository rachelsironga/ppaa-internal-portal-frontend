export const formatDateForSubmit = date => {
  const dateOfBirth = new Date(date)
  const day = String(dateOfBirth.getDate()).padStart(2, "0") // Add leading zero if necessary
  const month = String(dateOfBirth.getMonth() + 1).padStart(2, "0") // Add leading zero if necessary
  const year = dateOfBirth.getFullYear() // Get the full 4-digit year

  return `${year}-${month}-${day}` // Format as YYYY-MM-DD
}

export const formatDate = dateStr => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export const Based64Helper = {
  // Hash (encode)
  download({ based64, type = "text/pdf" }) {
    // Convert Base64 to Blob for download
    const byteCharacters = atob(based64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: type });
    const url = URL.createObjectURL(blob);

    return url;
  },
};
